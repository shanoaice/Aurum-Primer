// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![feature(ip_bits)]

use singbox_daemon_client::{singbox_daemon_client_main, WebpageEvents};
use singbox_daemon_manager::SingBox;
use tauri::{AppHandle, Manager};

mod random_cidr_generator;
mod singbox_daemon_client;
mod singbox_daemon_manager;

async fn async_error_handler(
    app_handle: AppHandle,
    error_event: &str,
    tokio_join_handle: tokio::task::JoinHandle<
        Result<(), Box<dyn std::error::Error + Send + Sync>>,
    >,
) -> Result<(), tauri::Error> {
    let join_handle_self = tokio_join_handle.await;

    match join_handle_self {
        Err(e) => {
            if e.is_cancelled() {
                Ok(())
            } else {
                app_handle.emit_all(error_event, format!("{}", e))
            }
        }
        Ok(Err(e)) => app_handle.emit_all(error_event, format!("{}", e)),
        _ => Ok(()),
    }
}

async fn joinset_error_handler(
    app_handle: AppHandle,
    error_event: &str,
    joinset_recv: kanal::AsyncReceiver<
        tokio::task::JoinSet<Result<(), Box<dyn std::error::Error + Send + Sync>>>,
    >,
) -> Result<(), tauri::Error> {
    let mut main_joinset = joinset_recv.recv().await.unwrap();
    while let Some(result) = main_joinset.join_next().await {
        match result {
            Err(e) => {
                if e.is_cancelled() {
                    continue;
                } else {
                    app_handle.emit_all(error_event, format!("{}", e))?;
                }
            }
            Ok(Err(e)) => {
                app_handle.emit_all(error_event, format!("{}", e))?;
            }
            _ => {
                continue;
            }
        }
    }

    Ok(())
}

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(SingBox::new())
        .setup(|app| {
            let app_handle = app.handle();
            let app_handle_for_main = app_handle.clone();
            let (sender, receiver) = kanal::bounded_async::<WebpageEvents>(0);

            let sender_clone = sender.clone();
            let sync_sender = sender_clone.as_sync().clone();

            let (main_abort_handle_sender, main_abort_handle_reciever) =
                kanal::bounded::<tokio::task::AbortHandle>(1);
            let (main_joinset_sender, main_joinset_reciever) = kanal::bounded_async::<
                tokio::task::JoinSet<Result<(), Box<dyn std::error::Error + Send + Sync>>>,
            >(1);
            let (task_abort_handle_sender, task_abort_handle_reciever) =
                kanal::bounded::<Vec<tokio::task::AbortHandle>>(1);

            app.listen_global("daemon_start", move |event| {
                let abort_handle_sender_clone = main_abort_handle_sender.clone();
                let main_join_handle = tokio::spawn(singbox_daemon_client_main(
                    receiver.clone(),
                    app_handle_for_main.clone(),
                    main_joinset_sender.clone(),
                    task_abort_handle_sender.clone().to_async(),
                    serde_json::from_str::<u16>(event.payload().unwrap()).unwrap(),
                ));
                abort_handle_sender_clone
                    .send(main_join_handle.abort_handle())
                    .unwrap();
                tokio::spawn(async_error_handler(
                    app_handle_for_main.clone(),
                    "daemon_client_main_error",
                    main_join_handle,
                ));
            });

            tokio::spawn(joinset_error_handler(
                app.handle(),
                "daemon_client_stream_error",
                main_joinset_reciever,
            ));

            app.listen_global("daemon_stop", move |_| {
                main_abort_handle_reciever.recv().unwrap().abort();
                let task_handles = task_abort_handle_reciever.recv().unwrap();
                for handle in task_handles {
                    handle.abort();
                }
            });

            app.listen_global("webpage_command", move |event| {
                let command = event.payload().unwrap();
                sync_sender
                    .send(serde_json::from_str(command).unwrap())
                    .unwrap();
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            random_cidr_generator::generate_random_ipv4_local_30,
            random_cidr_generator::generate_random_ipv6_local_126,
            singbox_daemon_manager::start_singbox_daemon,
            singbox_daemon_manager::stop_singbox_daemon,
            singbox_daemon_manager::set_singbox_daemon_params
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
