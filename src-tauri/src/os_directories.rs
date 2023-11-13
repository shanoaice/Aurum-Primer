use directories::ProjectDirs;

#[tauri::command]
pub fn get_data_dir() -> String {
    match ProjectDirs::from("com", "shanoaice", "Tellurium") {
        None => "".into(),
        Some(proj_dir) => proj_dir.data_dir().to_str().unwrap_or("").into(),
    }
}

#[tauri::command]
pub fn get_config_dir() -> String {
    match ProjectDirs::from("com", "shanoaice", "Tellurium") {
        None => "".into(),
        Some(proj_dir) => proj_dir.config_dir().to_str().unwrap_or("").into(),
    }
}
