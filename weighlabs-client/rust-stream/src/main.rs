// switched from Go -> Rust for faster bind.
// rust-stream is used as a executable program ran by the electron
// app to read data-stream from NAWI at speeds analogous to C++ (better than Go)
//
// It hosts a gRPC server (default 127.0.0.1:50051) exposing a
// server-streaming NAWI verification session (OIML R 76 dummy data).
// The Electron app connects as a client and subscribes to StreamTest.

use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;

use rust_stream::nawi::{
    InfoRequest, InstrumentInfo, SessionControlRequest, SessionControlResponse, StreamRequest,
    WeighingFrame,
    nawi_test_service_server::{NawiTestService, NawiTestServiceServer},
};
use rust_stream::sequence::{TestSession, default_config, normalize_config};
use tokio::sync::{Mutex, mpsc, watch};
use tokio_stream::wrappers::ReceiverStream;
use tonic::{Request, Response, Status, transport::Server};

#[derive(Clone, Copy, PartialEq, Eq)]
enum SessionState {
    Running,
    Paused,
}

struct SessionEntry {
    control_tx: watch::Sender<SessionState>,
}

#[derive(Default)]
struct NawiServiceImpl {
    sessions: Arc<Mutex<HashMap<String, Arc<SessionEntry>>>>,
}

impl NawiServiceImpl {
    async fn set_session_state(
        &self,
        request: Request<SessionControlRequest>,
        state: SessionState,
    ) -> Result<Response<SessionControlResponse>, Status> {
        let session_id = request.into_inner().session_id;
        if session_id.is_empty() {
            return Err(Status::invalid_argument("session_id is required"));
        }

        let mut sessions = self.sessions.lock().await;
        let Some(session) = sessions.get(&session_id) else {
            return Err(Status::not_found("NAWI test session not found"));
        };
        if session.control_tx.receiver_count() == 0 {
            sessions.remove(&session_id);
            return Err(Status::not_found("NAWI test session is no longer active"));
        }

        session.control_tx.send_replace(state);
        Ok(Response::new(SessionControlResponse {}))
    }
}

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

    async fn pause_test(
        &self,
        request: Request<SessionControlRequest>,
    ) -> Result<Response<SessionControlResponse>, Status> {
        self.set_session_state(request, SessionState::Paused).await
    }

    async fn resume_test(
        &self,
        request: Request<SessionControlRequest>,
    ) -> Result<Response<SessionControlResponse>, Status> {
        self.set_session_state(request, SessionState::Running).await
    }

    type StreamTestStream =
        std::pin::Pin<Box<dyn tokio_stream::Stream<Item = Result<WeighingFrame, Status>> + Send>>;

    async fn stream_test(
        &self,
        request: Request<StreamRequest>,
    ) -> Result<Response<Self::StreamTestStream>, Status> {
        let req = request.into_inner();
        let session_id = req.session_id;
        if session_id.is_empty() {
            return Err(Status::invalid_argument("session_id is required"));
        }

        let cfg = normalize_config(req.config.unwrap_or_else(default_config));
        let tick_ms = if req.tick_ms == 0 {
            100
        } else {
            req.tick_ms.clamp(16, 5000) as u64
        };

        tracing::info!(
            session = %session_id,
            serial = %cfg.serial_number,
            max = cfg.max_capacity,
            e = cfg.verification_interval,
            tick_ms,
            "new StreamTest subscription"
        );

        let mut session = TestSession::new(cfg, req.loop_session);
        let (tx, rx) = mpsc::channel::<Result<WeighingFrame, Status>>(8);
        let (control_tx, mut control_rx) = watch::channel(SessionState::Running);
        let session_entry = Arc::new(SessionEntry { control_tx });
        let sessions = Arc::clone(&self.sessions);
        let mut registered_sessions = sessions.lock().await;
        if registered_sessions.contains_key(&session_id) {
            return Err(Status::already_exists("test session is already active"));
        }
        registered_sessions.insert(session_id.clone(), Arc::clone(&session_entry));
        drop(registered_sessions);

        tokio::spawn(async move {
            let tick = std::time::Duration::from_millis(tick_ms);
            loop {
                let paused = *control_rx.borrow_and_update() == SessionState::Paused;
                if paused {
                    tokio::select! {
                        _ = tx.closed() => {
                            tracing::debug!("subscriber disconnected");
                            break;
                        }
                        changed = control_rx.changed() => {
                            if changed.is_err() {
                                break;
                            }
                        }
                    }
                    continue;
                }

                let Some(frame) = session.next_frame() else {
                    break;
                };
                if tx.send(Ok(frame)).await.is_err() {
                    tracing::debug!("subscriber disconnected");
                    break;
                }

                tokio::select! {
                    _ = tx.closed() => {
                        tracing::debug!("subscriber disconnected");
                        break;
                    }
                    _ = tokio::time::sleep(tick) => {}
                    changed = control_rx.changed() => {
                        if changed.is_err() {
                            break;
                        }
                    }
                }
            }

            let mut sessions = sessions.lock().await;
            if sessions
                .get(&session_id)
                .is_some_and(|current| Arc::ptr_eq(current, &session_entry))
            {
                sessions.remove(&session_id);
            }
        });

        Ok(Response::new(Box::pin(ReceiverStream::new(rx))))
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt().with_target(false).init();

    let addr: SocketAddr = std::env::var("WEIGHLABS_GRPC_ADDR")
        .unwrap_or_else(|_| "127.0.0.1:50051".into())
        .parse()?;

    tracing::info!("rust-stream NAWI gRPC server listening on {addr}");

    Server::builder()
        .add_service(NawiTestServiceServer::new(NawiServiceImpl::default()))
        .serve(addr)
        .await?;

    Ok(())
}
