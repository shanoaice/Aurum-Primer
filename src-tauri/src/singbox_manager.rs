use std::process::{Child, Command};
use std::sync::Mutex;

pub struct SingBox {
    process: Mutex<Option<Child>>,
    parameters: Mutex<Option<SingBoxParameters>>,
}

pub struct SingBoxParameters {
    pub singbox_path: String,
    pub config_path: String,
    pub data_path: String,
}

impl SingBoxParameters {
    pub fn new(singbox_path: String, config_path: String, data_path: String) -> Self {
        SingBoxParameters {
            singbox_path,
            config_path,
            data_path,
        }
    }
    pub fn run(&self) -> Result<Child, std::io::Error> {
        Command::new(self.singbox_path.as_str())
            .args([
                "run",
                "-c",
                self.config_path.as_str(),
                "-D",
                self.data_path.as_str(),
            ])
            .spawn()
    }
}

impl SingBox {
    pub fn new() -> Self {
        SingBox {
            process: Mutex::new(None),
            parameters: Mutex::new(None),
        }
    }
    pub fn set_parameters(&self, singbox_path: &str, config_path: &str, data_path: &str) {
        let parameters = SingBoxParameters::new(
            singbox_path.to_string(),
            config_path.to_string(),
            data_path.to_string(),
        );
        *self.parameters.lock().unwrap() = Some(parameters);
    }
    // this method does not check whether a running child is present.
    // meant for simplifying set_process api. do not use otherwise.
    fn set_process_unguarded(&self, process: Child) -> Result<(), String> {
        *self.process.lock().unwrap() = Some(process);
        Ok(())
    }
    pub fn set_process(&self, process: Child) -> Result<(), String> {
        match &mut *self.process.lock().unwrap() {
            None => self.set_process_unguarded(process),
            Some(cur_process) => cur_process
                .kill()
                .map_err(|op| op.to_string())
                .and_then(|_| self.set_process_unguarded(process)),
        }
    }
    pub fn kill_process(&self) -> Result<(), String> {
        match &mut *self.process.lock().unwrap() {
            None => Err("sing-box is not running".to_string()),
            Some(process) => process.kill().map_err(|op| op.to_string()),
        }
    }
    /// Start the sing-box process according to the SingBoxParameters.
    /// Can also be used to force re-start the process, since set_process automatically kills the previous process.
    pub fn start_process(&self) -> Result<(), String> {
        let process_parameters = self.parameters.lock().unwrap();

        if process_parameters.is_none() {
            return Err("parameters are not initialized".to_string());
        }

        let new_process = self.kill_process().and_then(|_| {
            process_parameters
                .as_ref()
                .unwrap()
                .run()
                .map_err(|op| op.to_string())
        });

        match new_process {
            Err(op) => Err(op),
            Ok(process) => self.set_process(process),
        }
    }
    #[cfg(target_os = "windows")]
    pub fn reload_process(&self) -> Result<(), String> {
        self.start_process()
    }
    #[cfg(not(target_os = "windows"))]
    pub fn reload_process(&self) -> Result<(), String> {
        let singbox_process = *self.process.lock().unwrap();
        let singbox_pid = rustix::process::Pid::from_child(&singbox_process);
        rustix::process::kill_process(sinbox_pid, rustix::process::Signal::Hup)
    }
}

/// Starts a new sing-box process with given parameters.
/// Can also be used to re-start a sing-box process with new parameters.
#[tauri::command]
pub fn start_singbox_process_with(
    singbox_process_state: tauri::State<SingBox>,
    singbox_path: &str,
    config_path: &str,
    data_path: &str,
) -> Result<(), String> {
    singbox_process_state.set_parameters(singbox_path, config_path, data_path);
    singbox_process_state.start_process()
}


/// Restart a currently running sing-box process, 
/// or start a new sing-box process with predefined parameters.
/// Requires the parameters to be already set, otherwise it will fail.
#[tauri::command]
pub fn start_singbox_process(singbox_process_state: tauri::State<SingBox>) -> Result<(), String> {
    singbox_process_state.start_process()
}

#[tauri::command]
pub fn set_singbox_parameters(
    singbox_process_state: tauri::State<SingBox>,
    singbox_path: &str,
    config_path: &str,
    data_path: &str,
) {
    singbox_process_state.set_parameters(singbox_path, config_path, data_path);
}

#[tauri::command]
pub fn stop_singbox_process(singbox_process_state: tauri::State<SingBox>) -> Result<(), String> {
    singbox_process_state.kill_process()
}

#[tauri::command]
pub fn reload_singbox_process(singbox_process_state: tauri::State<SingBox>) -> Result<(), String> {
    singbox_process_state.reload_process()
}

