use std::mem::ManuallyDrop;
use std::process::{Child, Command};
use std::sync::Mutex;

use windows::Win32::Foundation::HANDLE;

pub union SingBoxProcess {
    windows: HANDLE,
    unix: ManuallyDrop<Child>,
}

// Passing structs between async func needs to be thread safe
// Mutex is the simplest way to do it
// This is not a hot code path, so no performance concern
pub struct SingBox {
    process: Mutex<Option<SingBoxProcess>>,
    listen_port: Mutex<Option<u16>>,
    daemon_path: Mutex<Option<String>>,
}

impl SingBox {
    pub fn new() -> Self {
        SingBox {
            process: Mutex::new(None),
            listen_port: Mutex::new(None),
            daemon_path: Mutex::new(None),
        }
    }

    #[cfg(target_os = "windows")]
    pub fn kill_process(&self) -> Result<(), String> {
        use windows::Win32::System::Threading::TerminateProcess;

        let mut singbox_process = self.process.lock().map_err(|op| op.to_string())?;
        match &mut *singbox_process {
            None => Ok(()),
            Some(process) => unsafe {
                // This is almost certainly safe, since this code path should not be ran on Unix
                let singbox_handle = process.windows;

                // if this handle is invalid, the process is likely already dead
                // thus we only terminate it when the handle is valid
                if !singbox_handle.is_invalid() {
                    TerminateProcess(singbox_handle, 0).map_err(|e| e.to_string())?;
                };

                // if handle is invalid it is also useless whatsoever
                // thus we always set it to None regardlessly
                *singbox_process = None;

                Ok(())
            },
        }
    }

    // on Windows we need to start sing-box-daemon as Admin, thus we must use ShellExecuteExW to bring up a UAC Window
    // see https://docs.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shellexecuteexw
    #[cfg(target_os = "windows")]
    pub fn start_process(&self) -> Result<(), String> {
        use windows::core::{w, HSTRING, PCWSTR};
        use windows::Win32::UI::{
            Shell::{
                ShellExecuteExW, SEE_MASK_NOCLOSEPROCESS, SEE_MASK_NO_CONSOLE, SHELLEXECUTEINFOW,
            },
            WindowsAndMessaging::SW_SHOWDEFAULT,
        };

        let Some(listen_port) = *self.listen_port.lock().map_err(|op| op.to_string())? else {
            return Err("Listen port not set".to_string());
        };
        let Some(daemon_path_ruststr) = &*self.daemon_path.lock().map_err(|op| op.to_string())?
        else {
            return Err("Daemon path not set".to_string());
        };

        self.kill_process()?;

        let daemon_path_hstring = HSTRING::from(daemon_path_ruststr);
        let daemon_path = PCWSTR::from_raw(daemon_path_hstring.as_ptr());

        let daemon_parameter_ruststr = format!("http://127.0.0.1:{}", listen_port);
        let daemon_parameter_hstring = HSTRING::from(daemon_parameter_ruststr);
        let daemon_parameter = PCWSTR::from_raw(daemon_parameter_hstring.as_ptr());

        let mut shell_execute_info = SHELLEXECUTEINFOW::default();
        // "runas" = run as Admin, triggers UAC
        shell_execute_info.lpVerb = w!("runas");
        shell_execute_info.lpFile = daemon_path;
        shell_execute_info.lpParameters = daemon_parameter;
        shell_execute_info.nShow = SW_SHOWDEFAULT.0;
        // NOCLOSEPROCESS tells ShellExecuteExW to return the process Handle
        // NO_CONSOLE hides the console window
        shell_execute_info.fMask = SEE_MASK_NOCLOSEPROCESS | SEE_MASK_NO_CONSOLE;
        shell_execute_info.cbSize = std::mem::size_of::<SHELLEXECUTEINFOW>() as u32;

        unsafe {
            ShellExecuteExW(&mut shell_execute_info).map_err(|e| e.to_string())?;
        }

        // store the process handle
        *self.process.lock().map_err(|op| op.to_string())? = Some(SingBoxProcess {
            windows: shell_execute_info.hProcess,
        });

        Ok(())
    }

    // on Linux, this is not needed (neither sudo)
    // we just need to tell the user to add CAP_NETADMIN
    // to the sing-box-daemon executable
    // on macOS, we don't have capabilities(7)
    // thus we need to use sudo to launch sing-box-daemon
    // I have no idea how launchd works
    // neither do I have a macOS device to test it out
    // if somebody has relevant knowledge, contribution is welcomed
    // TODO: Unix impl of start_process
    #[cfg(target_os = "linux")]
    pub fn start_process(&self) -> Result<(), String> {
        Ok(())
    }

    #[cfg(target_os = "macos")]
    pub fn start_process(&self) -> Result<(), String> {
        Ok(())
    }

    pub fn set_parameters(&self, listen_port: u16, daemon_path: String) {
        *self.listen_port.lock().unwrap() = Some(listen_port);
        *self.daemon_path.lock().unwrap() = Some(daemon_path);
    }
}

#[tauri::command]
pub fn start_singbox_daemon(state: tauri::State<SingBox>) -> Result<(), String> {
    state.start_process()
}

#[tauri::command]
pub fn stop_singbox_daemon(state: tauri::State<SingBox>) -> Result<(), String> {
    state.kill_process()
}

#[tauri::command]
pub fn set_singbox_daemon_params(
    listen_port: u16,
    daemon_path: String,
    state: tauri::State<SingBox>,
) {
    state.set_parameters(listen_port, daemon_path);
}
