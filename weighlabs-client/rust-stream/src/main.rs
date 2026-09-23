// switched from Go -> Rust for faster bind.
// rust-stream is used as a executable program ran by the electron
// app to read data-stream from NAWI at speeds analogous to C++ (better than Go)
//
// It hosts a gRPC server (default 127.0.0.1:50051) exposing a
// server-streaming NAWI verification session (OIML R 76 dummy data).
// The Electron app connects as a client and subscribes to StreamTest.

use std::net::SocketAddr;

use rust_stream::nawi::{
    nawi_test_service_server::{NawiTestService, NawiTestServiceServer},
    InfoRequest, InstrumentInfo, StreamRequest, WeighingFrame,
};
use rust_stream::sequence::{default_config, normalize_config, TestSession};
use tokio::sync::mpsc;
use tokio_stream::wrappers::ReceiverStream;
use tonic::{transport::Server, Request, Response, Status};

struct NawiServiceImpl;

#[tonic::async_trait]
impl NawiTestService for NawiServiceImpl {
    async fn get_instrument_info(
        &self,
        _request: Request<InfoRequest>,
    ) -> Result<Response<InstrumentInfo>, Status> {
        Ok(Response::new(InstrumentInfo {
            config: Some(default_config()),
            source: "dummy-nawi-simulator".into(),
            oiml_standard: "OIML R 76".into(),
            stream_format: "weighlabs.nawi.WeighingFrame".into(),
        }))
    }

    type StreamTestStream =
        std::pin::Pin<Box<dyn tokio_stream::Stream<Item = Result<WeighingFrame, Status>> + Send>>;

    async fn stream_test(
        &self,
        request: Request<StreamRequest>,
    ) -> Result<Response<Self::StreamTestStream>, Status> {
        let req = request.into_inner();
        let cfg = normalize_config(req.config.unwrap_or_else(default_config));
        let tick_ms = if req.tick_ms == 0 {
            100
        } else {
            req.tick_ms.clamp(16, 5000) as u64
        };

        tracing::info!(
            serial = %cfg.serial_number,
            max = cfg.max_capacity,
            e = cfg.verification_interval,
            tick_ms,
            "new StreamTest subscription"
        );

        let mut session = TestSession::new(cfg, req.loop_session);
        let (tx, rx) = mpsc::channel::<Result<WeighingFrame, Status>>(8);

        tokio::spawn(async move {
            let tick = std::time::Duration::from_millis(tick_ms);
            while let Some(frame) = session.next_frame() {
                if tx.send(Ok(frame)).await.is_err() {
                    tracing::debug!("subscriber disconnected");
                    break;
                }
                tokio::time::sleep(tick).await;
            }
        });

        Ok(Response::new(Box::pin(ReceiverStream::new(rx))))
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_target(false)
        .init();

    let addr: SocketAddr = std::env::var("WEIGHLABS_GRPC_ADDR")
        .unwrap_or_else(|_| "127.0.0.1:50051".into())
        .parse()?;

    tracing::info!("rust-stream NAWI gRPC server listening on {addr}");

    Server::builder()
        .add_service(NawiTestServiceServer::new(NawiServiceImpl))
        .serve(addr)
        .await?;

    Ok(())
}
