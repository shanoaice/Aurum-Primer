fn main() -> Result<(), Box<dyn std::error::Error>> {
    tauri_build::build();
    tonic_build::configure()
        .build_server(false)
        .field_attribute("in", "#[serde(rename = \"in\"]")
        .type_attribute(
            ".daemon.Log.event",
            "#[derive(serde::Serialize)] #[serde(rename_all = \"camelCase\", tag = \"type\", content = \"data\")]",
        )
        .type_attribute(
            ".daemon.Log.LogMessage",
            "#[derive(serde::Serialize)] #[serde(rename_all = \"camelCase\")]",
        )
        .type_attribute(
            ".daemon.Log.ResetMessage",
            "#[derive(serde::Serialize)] #[serde(rename_all = \"camelCase\")]",
        )
        .type_attribute(
            ".daemon.Status",
            "#[derive(serde::Serialize)] #[serde(rename_all = \"camelCase\")]",
        )
        .compile(&["proto/sing-box-daemon.proto"], &["proto"])?;
    Ok(())
}
