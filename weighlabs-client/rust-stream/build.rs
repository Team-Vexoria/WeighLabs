fn main() -> Result<(), Box<dyn std::error::Error>> {
    let protoc = protoc_bin_vendored::protoc_bin_path()?;
    // SAFETY: build script has single-threaded access to process env here.
    unsafe { std::env::set_var("PROTOC", &protoc) };

    tonic_prost_build::configure().compile_protos(
        &["proto/nawi.proto"],
        &["proto"],
    )?;

    println!("cargo:rerun-if-changed=proto/nawi.proto");
    Ok(())
}
