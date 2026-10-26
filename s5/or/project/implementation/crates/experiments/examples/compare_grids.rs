use experiments::{Request, statistics};
use random::Lcg;
use serde_json::{Value, json};
use simulation::{scenario, simulate};
use std::{env, fs};

fn greens(path: &str) -> Result<[f64; 4], Box<dyn std::error::Error>> {
    let result: Value = serde_json::from_slice(&fs::read(path)?)?;
    let values = result["selected"]
        .as_array()
        .ok_or("missing selected greens")?;
    let green = values
        .iter()
        .map(|value| value.as_f64().ok_or("invalid green"))
        .collect::<Result<Vec<_>, _>>()?;
    Ok(green.try_into().map_err(|_| "expected four greens")?)
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = env::args().collect();
    if args.len() != 5 {
        return Err(
            "usage: compare_grids <request.json> <coarse.json> <fine.json> <output.json>".into(),
        );
    }
    let request: Request = serde_json::from_slice(&fs::read(&args[1])?)?;
    let coarse_green = greens(&args[2])?;
    let fine_green = greens(&args[3])?;
    let mut rng = Lcg::new(request.seed);
    for _ in 0..request.training_replications {
        scenario(&request.config, &mut rng);
    }
    let mut coarse = Vec::with_capacity(request.replications);
    let mut fine = Vec::with_capacity(request.replications);
    let mut savings = Vec::with_capacity(request.replications);
    for _ in 0..request.replications {
        let arrivals = scenario(&request.config, &mut rng);
        let mut config = request.config.clone();
        config.green = coarse_green;
        let old = simulate(&config, &arrivals, false).delay;
        config.green = fine_green;
        let new = simulate(&config, &arrivals, false).delay;
        coarse.push(old);
        fine.push(new);
        savings.push(old - new);
    }
    let output = json!({
        "seed": request.seed,
        "training_scenarios_skipped": request.training_replications,
        "matched_fresh_scenarios": request.replications,
        "coarse_green": coarse_green,
        "fine_green": fine_green,
        "coarse": statistics(&coarse),
        "fine": statistics(&fine),
        "paired_saving_coarse_minus_fine": statistics(&savings),
        "paired_savings": savings,
    });
    fs::write(&args[4], serde_json::to_vec(&output)?)?;
    Ok(())
}
