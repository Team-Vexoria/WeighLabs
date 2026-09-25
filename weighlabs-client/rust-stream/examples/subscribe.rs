// Example gRPC subscriber used to verify the dummy NAWI stream.
// Run the server first (`cargo run`), then `cargo run --example subscribe`.

use rust_stream::nawi::{
    nawi_test_service_client::NawiTestServiceClient, InfoRequest, StreamRequest, TestPhase,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut client = NawiTestServiceClient::connect("http://127.0.0.1:50051").await?;

    let info = client.get_instrument_info(InfoRequest {}).await?.into_inner();
    println!(
        "source={} standard={} serial={} max={} e={}",
        info.source,
        info.oiml_standard,
        info.config.as_ref().map(|c| c.serial_number.as_str()).unwrap_or("?"),
        info.config.as_ref().map(|c| c.max_capacity).unwrap_or(0.0),
        info.config.as_ref().map(|c| c.verification_interval).unwrap_or(0.0),
    );

    let mut stream = client
        .stream_test(StreamRequest {
            config: None,
            tick_ms: 50,
            loop_session: false,
            session_id: "example".to_string(),
        })
        .await?
        .into_inner();

    let mut last_phase = i32::MAX;
    let mut frames = 0u32;
    let mut non_compliant_stable = 0u32;

    while let Some(frame) = stream.message().await? {
        frames += 1;
        if frame.phase != last_phase {
            last_phase = frame.phase;
            println!("--- phase {:?}", TestPhase::try_from(frame.phase).unwrap_or_default());
        }
        if frames.is_multiple_of(20) {
            let pt = frame.load_point.clone().unwrap_or_default();
            println!(
                "seq={} load={:.3} kg ({} e) gross={:.3} net={:.3} stable={} err={:+.3}e mpe={:.1}e ok={} V={:.1} C={:.2}",
                frame.sequence,
                pt.reference_load,
                pt.load_in_e,
                frame.gross,
                frame.net,
                frame.stable,
                frame.indicated_error_e,
                frame.max_permissible_error_e,
                frame.e_compliant,
                frame.supply_voltage_v,
                frame.temperature_c,
            );
        }
        if frame.stable && !frame.e_compliant {
            non_compliant_stable += 1;
        }
    }

    println!(
        "\nstream ended: {frames} frames, stable non-compliant frames: {non_compliant_stable}"
    );
    Ok(())
}
