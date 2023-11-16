// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![feature(ip_bits)]

use singbox_daemon_client::{singbox_daemon_client_main, WebpageEvents};
use tauri::Manager;

mod compio_unix_stream_wrapper;
mod random_cidr_generator;
mod singbox_daemon_client;
mod singbox_daemon_client_uds;
mod singbox_manager;

fn main() {
    let initial_singbox_process = singbox_manager::SingBox::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(initial_singbox_process)
        .setup(|app| {
            let app_handle = app.handle();
            let (sender, receiver) = kanal::bounded_async::<WebpageEvents>(0);

            tokio::spawn(singbox_daemon_client_main(
                receiver.clone(),
                app_handle.clone(),
                9090,
            ));

						app.listen_global("webpage_command", move |event| {
							let command = event.payload().unwrap();
							sender.as_sync().send(serde_json::from_str(command).unwrap()).unwrap();
						});

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            singbox_manager::start_singbox_process_with,
            singbox_manager::start_singbox_process,
            singbox_manager::set_singbox_parameters,
            singbox_manager::reload_singbox_process,
            singbox_manager::stop_singbox_process,
            random_cidr_generator::generate_random_ipv4_local_30,
            random_cidr_generator::generate_random_ipv6_local_126
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
