use std::mem::ManuallyDrop;
use std::process::{Child, Command};
use std::sync::Mutex;

use windows::core::{w, HSTRING, PCWSTR};
use windows::Win32::Foundation::HANDLE;

pub union SingBoxProcess {
    windows: HANDLE,
    unix: ManuallyDrop<Child>,
}

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
                let singbox_handle = process.windows;
                if singbox_handle.is_invalid() {
                    return Ok(());
                };

                TerminateProcess(singbox_handle, 0).map_err(|e| e.to_string())?;

                *singbox_process = None;

                Ok(())
            },
        }
    }

    // on Windows we need to start sing-box-daemon as Admin, thus we must use ShellExecuteExW to bring up a UAC Window
    // see https://docs.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shellexecuteexw
    #[cfg(target_os = "windows")]
    pub fn start_process(&self) -> Result<(), String> {
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

        let daemon_path_hstring = HSTRING::from(daemon_path_ruststr);
        let daemon_path = PCWSTR::from_raw(daemon_path_hstring.as_ptr());

        let daemon_parameter_ruststr = format!("http://127.0.0.1:{}", listen_port);
        let daemon_parameter_hstring = HSTRING::from(daemon_parameter_ruststr);
        let daemon_parameter = PCWSTR::from_raw(daemon_parameter_hstring.as_ptr());

        self.kill_process()?;

        let mut shell_execute_info = SHELLEXECUTEINFOW::default();
        shell_execute_info.lpVerb = w!("runas");
        shell_execute_info.lpFile = daemon_path;
        shell_execute_info.lpParameters = daemon_parameter;
        shell_execute_info.nShow = SW_SHOWDEFAULT.0;
        shell_execute_info.fMask = SEE_MASK_NOCLOSEPROCESS | SEE_MASK_NO_CONSOLE;
        shell_execute_info.cbSize = std::mem::size_of::<SHELLEXECUTEINFOW>() as u32;

        unsafe {
            ShellExecuteExW(&mut shell_execute_info).map_err(|e| e.to_string())?;
        }

        *self.process.lock().map_err(|op| op.to_string())? = Some(SingBoxProcess {
            windows: shell_execute_info.hProcess,
        });

        Ok(())
    }

    // on Linux, this is not needed (neither sudo)
    // we just need to tell the user to add CAP_NETADMIN
    // to the sing-box-daemon executable
    #[cfg(target_os = "linux")]
    pub fn start_process(&self) -> Result<(), String> {
        Ok(())
    }

    pub fn set_parameters(&self, listen_port: u16, daemon_path: String) {
        *self.listen_port.lock().unwrap() = Some(listen_port);
        *self.daemon_path.lock().unwrap() = Some(daemon_path);
    }
}
