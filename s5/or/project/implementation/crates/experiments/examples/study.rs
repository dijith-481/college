use experiments::{Request, execute};
use std::{env, fs, time::Instant};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = env::args().collect();
    if args.len() != 3 {
        return Err("usage: study <request.json> <result.json>".into());
    }
    let request: Request = serde_json::from_slice(&fs::read(&args[1])?)?;
    let started = Instant::now();
    let output = execute(request).map_err(std::io::Error::other)?;
    fs::write(&args[2], serde_json::to_vec(&output)?)?;
    eprintln!(
        "{}: {} candidates, selected {:?}, {} fresh runs, {:.2}s",
        args[1],
        output.candidates.len(),
        output.selected,
        output.delay.n,
        started.elapsed().as_secs_f64()
    );
    Ok(())
}
