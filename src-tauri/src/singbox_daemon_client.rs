pub mod singbox_daemon {
    tonic::include_proto!("daemon");
}

use std::str::FromStr;
use std::sync::Mutex;

use hyper::{Client, Uri};
use kanal::{AsyncReceiver, Sender};
use serde::{Deserialize, Serialize};
use singbox_daemon::daemon_client::DaemonClient;
use tauri::Manager;
use tonic::{Request, Streaming};

use self::h2c::H2cChannel;
use self::singbox_daemon::{Log, Status};

#[derive(Serialize, Deserialize, Clone)]
#[serde(tag = "tag", content = "data")]
pub enum WebpageEvents {
    // configContent
    Start(String),
    Stop(),
    // selectorTag, outboundTag
    SelectOutbound(String, String),
    // clashMode
    SetClashMode(String),
    SetSystemProxyEnabled(bool),
    // outboundTag
    UrlTest(String),
}

pub struct WebpageEventSenderState {
    sender: Mutex<Sender<WebpageEvents>>,
}

pub async fn subscribe_log(
    mut stream: Streaming<Log>,
    tauri_app_handle: tauri::AppHandle,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    loop {
        let Some(log) = stream.message().await? else {
            continue;
        };
        let Some(event) = log.event else {
            continue;
        };
        tauri_app_handle.emit_all("log", event)?;
    }
}

pub async fn subscribe_status(
    mut stream: Streaming<Status>,
    tauri_app_handle: tauri::AppHandle,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    loop {
        let Some(status) = stream.message().await? else {
            continue;
        };
        tauri_app_handle.emit_all("status", status)?;
    }
}

pub async fn webpage_msg_handler(
    webpage_msg_reciever: AsyncReceiver<WebpageEvents>,
    mut grpc_client: DaemonClient<H2cChannel>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    loop {
        let webpage_msg = webpage_msg_reciever.recv().await?;
        match webpage_msg {
            WebpageEvents::Start(config_content) => {
                grpc_client
                    .start_service(Request::new(singbox_daemon::String {
                        value: config_content,
                    }))
                    .await?;
            }
            WebpageEvents::Stop() => {
                grpc_client.stop_service(Request::new(())).await?;
            }
            WebpageEvents::SelectOutbound(selector_tag, outbound_tag) => {
                grpc_client
                    .select_outbound(Request::new(singbox_daemon::SelectOutboundOptions {
                        group_tag: selector_tag,
                        outbound_tag,
                    }))
                    .await?;
            }
            WebpageEvents::SetClashMode(clash_mode) => {
                grpc_client
                    .set_clash_mode(Request::new(singbox_daemon::String { value: clash_mode }))
                    .await?;
            }
            WebpageEvents::SetSystemProxyEnabled(enabled) => {
                grpc_client
                    .set_system_proxy_enabled(Request::new(singbox_daemon::Bool { value: enabled }))
                    .await?;
            }
            WebpageEvents::UrlTest(outbound_tag) => {
                grpc_client
                    .url_test(Request::new(singbox_daemon::String {
                        value: outbound_tag,
                    }))
                    .await?;
            }
        }
    }
}

pub async fn singbox_daemon_client_main(
    webpage_msg_reciever: AsyncReceiver<WebpageEvents>,
    tauri_app_handle: tauri::AppHandle,
    daemon_port: u16,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let origin_path = format!("http://[::1]:{}", daemon_port);
    let origin = Uri::from_str(&origin_path).unwrap();

    let h2c_client = h2c::H2cChannel {
        client: Client::new(),
    };

    let mut client = DaemonClient::with_origin(h2c_client, origin);

    let log_stream = client.subscribe_log(Request::new(())).await?.into_inner();
    let status_stream = client
        .subscribe_status(Request::new(()))
        .await?
        .into_inner();

    tokio::spawn(subscribe_log(log_stream, tauri_app_handle.clone()));
    tokio::spawn(subscribe_status(status_stream, tauri_app_handle.clone()));
    tokio::spawn(webpage_msg_handler(
        webpage_msg_reciever.clone(),
        client.clone(),
    ));

    Ok(())
}

// this is copied from tonic/example/h2c
// TODO: polish h2c impl
mod h2c {
    use std::{
        pin::Pin,
        task::{Context, Poll},
    };

    use hyper::{client::HttpConnector, Client};
    use tonic::body::BoxBody;
    use tower::Service;

    #[derive(Clone)]
    pub struct H2cChannel {
        pub client: Client<HttpConnector>,
    }

    impl Service<http::Request<BoxBody>> for H2cChannel {
        type Response = http::Response<hyper::Body>;
        type Error = hyper::Error;
        type Future =
            Pin<Box<dyn std::future::Future<Output = Result<Self::Response, Self::Error>> + Send>>;

        fn poll_ready(&mut self, _: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
            Poll::Ready(Ok(()))
        }

        fn call(&mut self, request: http::Request<BoxBody>) -> Self::Future {
            let client = self.client.clone();

            Box::pin(async move {
                let origin = request.uri();

                let h2c_req = hyper::Request::builder()
                    .uri(origin)
                    .header(http::header::UPGRADE, "h2c")
                    .body(hyper::Body::empty())
                    .unwrap();

                let res = client.request(h2c_req).await.unwrap();

                if res.status() != http::StatusCode::SWITCHING_PROTOCOLS {
                    panic!("Our server didn't upgrade: {}", res.status());
                }

                let upgraded_io = hyper::upgrade::on(res).await.unwrap();

                // In an ideal world you would somehow cache this connection
                let (mut h2_client, conn) = hyper::client::conn::Builder::new()
                    .http2_only(true)
                    .handshake(upgraded_io)
                    .await
                    .unwrap();
                tokio::spawn(conn);

                h2_client.send_request(request).await
            })
        }
    }
}
