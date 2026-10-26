use experiments::{Request, execute};
use simulation::Config;
fn main() {
    let request = Request {
        config: Config {
            horizon: 120.0,
            cycle: 48.0,
            clearance: 8.0,
            headway: 2.0,
            rates: [600.0, 300.0, 450.0, 200.0],
            turns: [0.2, 0.6, 0.2],
            green: [12.0, 8.0, 12.0, 8.0],
        },
        replications: 4,
        training_replications: 4,
        grid_step: 4,
        min_green: 4,
        max_green: 28,
        seed: 2026,
        optimize: true,
        sensitivity: true,
    };
    let output = execute(request).unwrap();
    println!(
        "{} {} {} {} {}",
        output.delay.mean,
        output.run.arrivals,
        output.run.departures,
        output.candidates.len(),
        output.sensitivity[2].delay.mean
    );
}
