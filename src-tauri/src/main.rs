// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![feature(ip_bits)]

mod random_cidr_generator;
mod singbox_manager;

fn main() {
    let initial_singbox_process = singbox_manager::SingBox::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(initial_singbox_process)
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
