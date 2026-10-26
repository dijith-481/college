use random::Lcg;
use serde::{Deserialize, Serialize};
use simulation::{
    Config, Run, Sample, Scenario, TrainingResult, scenario, simulate, simulate_with_profile,
    training_batch,
};

const QUEUE_BINS: usize = 120;

#[derive(Clone, Serialize, Deserialize)]
pub struct Request {
    pub config: Config,
    pub replications: usize,
    #[serde(default = "default_training")]
    pub training_replications: usize,
    pub grid_step: u32,
    pub min_green: u32,
    pub max_green: u32,
    pub seed: u32,
    pub optimize: bool,
    #[serde(default)]
    pub sensitivity: bool,
}
fn default_training() -> usize {
    256
}
#[derive(Clone, Default, Serialize)]
pub struct Statistics {
    pub n: usize,
    pub mean: f64,
    pub sd: f64,
    pub se: f64,
    pub low: f64,
    pub high: f64,
}
#[derive(Clone, Default, Serialize, Deserialize)]
struct Moments {
    n: usize,
    mean: f64,
    m2: f64,
}
impl Moments {
    fn push(&mut self, value: f64) {
        // Welford: M2 += (x - old_mean)(x - new_mean).
        self.n += 1;
        let delta = value - self.mean;
        self.mean += delta / self.n as f64;
        self.m2 += delta * (value - self.mean);
    }
    fn summary(&self) -> Statistics {
        if self.n == 0 {
            return Statistics::default();
        }
        let n = self.n;
        let mean = self.mean;
        let sd = if n > 1 {
            (self.m2 / (n - 1) as f64).max(0.0).sqrt()
        } else {
            0.0
        };
        let se = sd / (n as f64).sqrt();
        let critical = [
            0.0, 12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201,
            2.179, 2.160, 2.145, 2.131, 2.120, 2.110, 2.101, 2.093, 2.086, 2.080, 2.074, 2.069,
            2.064, 2.060, 2.056, 2.052, 2.048, 2.045, 2.042,
        ];
        let df = n.saturating_sub(1);
        let t = if df <= 30 {
            critical[df]
        } else {
            1.959964 + 2.372 / (df as f64) + 2.822 / (df as f64).powi(2)
        };
        Statistics {
            n,
            mean,
            sd,
            se,
            low: mean - t * se,
            high: mean + t * se,
        }
    }
}
pub fn statistics(values: &[f64]) -> Statistics {
    let mut m = Moments::default();
    for &v in values {
        m.push(v);
    }
    m.summary()
}
#[derive(Clone, Serialize)]
pub struct Candidate {
    pub green: [f64; 4],
    pub delay: Statistics,
}
#[derive(Clone, Serialize)]
pub struct Comparison {
    pub label: String,
    pub green: [f64; 4],
    pub delay: Statistics,
    pub paired_saving: Statistics,
}
#[derive(Clone, Serialize)]
pub struct DemandPoint {
    pub scale: f64,
    pub rate: f64,
    pub delay: Statistics,
    pub backlog: Statistics,
}
#[derive(Clone, Serialize, Deserialize)]
pub struct Distribution {
    pub columns: usize,
    pub rows: usize,
    pub counts: Vec<u64>,
    pub max_wait: f64,
    pub max_backlog: f64,
    pub total: u64,
}
impl Default for Distribution {
    fn default() -> Self {
        Self {
            columns: 64,
            rows: 40,
            counts: vec![0; 64 * 40],
            max_wait: 32.0,
            max_backlog: 16.0,
            total: 0,
        }
    }
}
impl Distribution {
    fn merge(&mut self, other: &Self) {
        while self.max_wait < other.max_wait || self.max_backlog < other.max_backlog {
            let grow_x = self.max_wait < other.max_wait;
            let grow_y = self.max_backlog < other.max_backlog;
            let mut counts = vec![0; self.counts.len()];
            for y in 0..self.rows {
                for x in 0..self.columns {
                    counts[(if grow_y { y / 2 } else { y }) * self.columns
                        + if grow_x { x / 2 } else { x }] += self.counts[y * self.columns + x];
                }
            }
            if grow_x {
                self.max_wait *= 2.0;
            }
            if grow_y {
                self.max_backlog *= 2.0;
            }
            self.counts = counts;
        }
        for y in 0..other.rows {
            for x in 0..other.columns {
                let nx = (((x as f64 + 0.5) * other.max_wait / self.max_wait) as usize)
                    .min(self.columns - 1);
                let ny = (((y as f64 + 0.5) * other.max_backlog / self.max_backlog) as usize)
                    .min(self.rows - 1);
                self.counts[ny * self.columns + nx] += other.counts[y * other.columns + x];
            }
        }
        self.total += other.total;
    }
    fn push(&mut self, wait: f64, backlog: f64) {
        while wait >= self.max_wait || backlog >= self.max_backlog {
            let grow_x = wait >= self.max_wait;
            let grow_y = backlog >= self.max_backlog;
            let mut counts = vec![0; self.counts.len()];
            for y in 0..self.rows {
                for x in 0..self.columns {
                    let nx = if grow_x { x / 2 } else { x };
                    let ny = if grow_y { y / 2 } else { y };
                    counts[ny * self.columns + nx] += self.counts[y * self.columns + x];
                }
            }
            if grow_x {
                self.max_wait *= 2.0;
            }
            if grow_y {
                self.max_backlog *= 2.0;
            }
            self.counts = counts;
        }
        let x = (wait / self.max_wait * self.columns as f64) as usize;
        let y = (backlog / self.max_backlog * self.rows as f64) as usize;
        self.counts[y.min(self.rows - 1) * self.columns + x.min(self.columns - 1)] += 1;
        self.total += 1;
    }
}
#[derive(Clone, Serialize, Deserialize)]
pub struct ReplayChoice {
    pub label: String,
    pub state: String,
    pub green: [f64; 4],
    pub delay: f64,
    pub remaining: usize,
}
#[derive(Clone, Serialize)]
pub struct QueuePoint {
    pub time: f64,
    pub queues: [f64; 4],
}

#[derive(Clone, Serialize)]
pub struct Output {
    pub engine_version: &'static str,
    pub request: Request,
    pub selected: [f64; 4],
    pub candidates: Vec<Candidate>,
    pub comparisons: Vec<Comparison>,
    pub delay: Statistics,
    pub queue: Statistics,
    pub queue_profile: Vec<QueuePoint>,
    pub throughput: Statistics,
    pub backlog: Statistics,
    pub waiting_per_arrival: Statistics,
    pub convergence: Vec<Statistics>,
    pub run: Run,
    pub replay_choices: Vec<ReplayChoice>,
    pub samples: Vec<Sample>,
    pub replicate_delays: Vec<f64>,
    pub sensitivity: Vec<DemandPoint>,
    pub distribution: Distribution,
    pub search_distribution: Distribution,
}
#[derive(Clone, Copy, PartialEq)]
enum Stage {
    Training,
    Evaluation,
    Sensitivity,
    Done,
}
#[derive(Serialize)]
pub struct Progress {
    pub stage: &'static str,
    pub completed: u64,
    pub total: u64,
    pub done: bool,
    pub replications_done: usize,
    pub replications: usize,
    pub candidates: usize,
    pub estimate: Statistics,
    pub distribution_kind: &'static str,
    pub distribution: Distribution,
    pub search_distribution: Distribution,
}

pub fn feasible(request: &Request) -> Result<Vec<[f64; 4]>, String> {
    let total = (request.config.cycle - request.config.clearance).round() as u32;
    if (request.config.cycle - request.config.clearance - total as f64).abs() > 1e-9 {
        return Err("Available green time must be an integer number of seconds.".into());
    }
    let min = request.min_green;
    let max = request.max_green;
    let step = request.grid_step;
    if step == 0
        || step > 60
        || min == 0
        || min > max
        || max > 600
        || (min as f64) < request.config.headway
    {
        return Err("Invalid grid step or green bounds.".into());
    }
    if total < 4 * min || total > 4 * max || !(total - 4 * min).is_multiple_of(step) {
        return Err("No feasible timings with this cycle, bounds, and spacing.".into());
    }
    let grid_step = step as usize;
    let plans = (min..=max)
        .step_by(grid_step)
        .flat_map(|a| {
            (min..=max).step_by(grid_step).flat_map(move |b| {
                (min..=max).step_by(grid_step).filter_map(move |c| {
                    let partial = a + b + c;
                    if partial > total {
                        return None;
                    }
                    let d = total - partial;
                    (d >= min && d <= max && (d - min).is_multiple_of(step))
                        .then_some([a as f64, b as f64, c as f64, d as f64])
                })
            })
        })
        .take(100_001)
        .collect::<Vec<_>>();
    if plans.len() > 100_000 {
        return Err("More than 100,000 feasible plans: increase the grid step.".into());
    }
    if plans.is_empty() {
        return Err(
            "No feasible timings on this grid. Adjust the cycle, bounds, or grid step.".into(),
        );
    }
    Ok(plans)
}
fn baseline(target: [f64; 4], plans: &[[f64; 4]]) -> [f64; 4] {
    *plans
        .iter()
        .min_by(|a, b| {
            let distance = |g: &&[f64; 4]| {
                g.iter()
                    .zip(target)
                    .map(|(x, y)| (x - y).powi(2))
                    .sum::<f64>()
            };
            distance(a).total_cmp(&distance(b))
        })
        .unwrap()
}

#[derive(Serialize, Deserialize)]
pub struct TrainingChunk {
    start: usize,
    moments: Vec<Moments>,
    distribution: Distribution,
    end_state: String,
    lowest: Option<ReplayChoice>,
    highest: Option<ReplayChoice>,
}

pub struct TrainingShard {
    request: Request,
    plans: Vec<[f64; 4]>,
    start: usize,
    training: Vec<Moments>,
    distribution: Distribution,
    rng: Lcg,
    current: Option<Scenario>,
    current_training: Option<Vec<TrainingResult>>,
    current_state: u64,
    replication: usize,
    index: usize,
    lowest: Option<ReplayChoice>,
    highest: Option<ReplayChoice>,
}
impl TrainingShard {
    pub fn new(request: Request, start: usize, end: usize) -> Result<Self, String> {
        request.config.validate()?;
        let plans = feasible(&request)?;
        if !request.optimize
            || start >= end
            || end > plans.len()
            || !(2..=1_000_000).contains(&request.training_replications)
        {
            return Err("Invalid parallel training range or replication count.".into());
        }
        Ok(Self {
            rng: Lcg::new(request.seed),
            request,
            plans: plans[start..end].to_vec(),
            start,
            training: vec![Moments::default(); end - start],
            distribution: Distribution::default(),
            current: None,
            current_training: None,
            current_state: 0,
            replication: 0,
            index: 0,
            lowest: None,
            highest: None,
        })
    }
    pub fn completed(&self) -> usize {
        self.replication * self.plans.len() + self.index
    }
    pub fn total(&self) -> usize {
        self.request.training_replications * self.plans.len()
    }
    pub fn advance(&mut self, work: usize) -> bool {
        for _ in 0..work.min(4096) {
            if self.replication >= self.request.training_replications {
                break;
            }
            let config = self.request.config.clone();
            if self.current.is_none() {
                self.current_state = self.rng.state();
                let current = scenario(&config, &mut self.rng);
                self.current_training = Some(training_batch(&config, &current, &self.plans));
                self.current = Some(current);
            }
            let plan = self.plans[self.index];
            let run = self.current_training.as_ref().unwrap()[self.index];
            self.training[self.index].push(run.delay);
            self.distribution.push(
                if run.arrivals > 0 {
                    run.delay / run.arrivals as f64
                } else {
                    0.0
                },
                run.remaining as f64,
            );
            if self.lowest.as_ref().is_none_or(|c| run.delay < c.delay) {
                self.lowest = Some(ReplayChoice {
                    label: "Search outcome".into(),
                    state: format!("{:016x}", self.current_state),
                    green: plan,
                    delay: run.delay,
                    remaining: run.remaining,
                });
            }
            if self.highest.as_ref().is_none_or(|c| run.delay > c.delay) {
                self.highest = Some(ReplayChoice {
                    label: "Search outcome".into(),
                    state: format!("{:016x}", self.current_state),
                    green: plan,
                    delay: run.delay,
                    remaining: run.remaining,
                });
            }
            self.index += 1;
            if self.index == self.plans.len() {
                self.index = 0;
                self.current = None;
                self.current_training = None;
                self.replication += 1;
            }
        }
        self.replication >= self.request.training_replications
    }
    pub fn result(&self) -> Result<TrainingChunk, String> {
        if self.replication < self.request.training_replications {
            return Err("Training shard is still running.".into());
        }
        Ok(TrainingChunk {
            start: self.start,
            moments: self.training.clone(),
            distribution: self.distribution.clone(),
            end_state: format!("{:016x}", self.rng.state()),
            lowest: self.lowest.clone(),
            highest: self.highest.clone(),
        })
    }
}

pub struct Session {
    request: Request,
    plans: Vec<[f64; 4]>,
    training: Vec<Moments>,
    rng: Lcg,
    stage: Stage,
    replication: usize,
    index: usize,
    completed: u64,
    total: u64,
    current: Option<Scenario>,
    current_training: Option<Vec<TrainingResult>>,
    current_state: u64,
    first_evaluation_state: Option<u64>,
    lowest: Option<ReplayChoice>,
    highest: Option<ReplayChoice>,
    search_lowest: Option<ReplayChoice>,
    search_highest: Option<ReplayChoice>,
    selected: [f64; 4],
    baselines: Vec<(String, [f64; 4])>,
    baseline_stats: Vec<Moments>,
    savings: Vec<Moments>,
    selected_delay: f64,
    delay: Moments,
    queue: Moments,
    queue_profile_area: Vec<[f64; 4]>,
    throughput: Moments,
    backlog: Moments,
    wait: Moments,
    run: Option<Run>,
    samples: Vec<Sample>,
    convergence: Vec<Statistics>,
    replicate_delays: Vec<f64>,
    scales: Vec<f64>,
    sensitivity: Vec<DemandPoint>,
    sweep_delay: Moments,
    sweep_backlog: Moments,
    distribution: Distribution,
    search_distribution: Distribution,
}
impl Session {
    pub fn new(request: Request) -> Result<Self, String> {
        request.config.validate()?;
        if !(2..=1_000_000).contains(&request.replications)
            || !(2..=1_000_000).contains(&request.training_replications)
        {
            return Err("Use 2 to 1,000,000 replications.".into());
        }
        if request.config.horizon * request.config.rates.iter().sum::<f64>() / 3600.0 > 1_000_000.0
        {
            return Err(
                "One scenario exceeds a million expected vehicles. Reduce horizon or demand."
                    .into(),
            );
        }
        let plans = feasible(&request)?;
        if request.config.green.iter().any(|g| {
            g.fract() != 0.0 || *g < request.min_green as f64 || *g > request.max_green as f64
        }) {
            return Err("Green durations must be integer seconds within the bounds.".into());
        }
        let training = vec![Moments::default(); plans.len()];
        let scales: Vec<f64> = if request.sensitivity {
            [0.5, 0.75, 1.0, 1.25, 1.5]
                .into_iter()
                .filter(|s| request.config.rates.iter().all(|r| r * s <= 20000.0))
                .collect()
        } else {
            Vec::new()
        };
        let total = if request.optimize {
            plans.len() as u64 * request.training_replications as u64
        } else {
            0
        } + (4 + scales.len() as u64) * request.replications as u64;
        let available = request.config.cycle - request.config.clearance;
        let demand = request.config.rates.iter().sum::<f64>();
        let proportional = if demand > 0.0 {
            request.config.rates.map(|r| available * r / demand)
        } else {
            [available / 4.0; 4]
        };
        let baselines = vec![
            ("Input timing".into(), request.config.green),
            ("Equal green".into(), baseline([available / 4.0; 4], &plans)),
            ("Demand proportional".into(), baseline(proportional, &plans)),
        ];
        Ok(Self {
            selected: request.config.green,
            rng: Lcg::new(request.seed),
            stage: if request.optimize {
                Stage::Training
            } else {
                Stage::Evaluation
            },
            request,
            plans,
            training,
            replication: 0,
            index: 0,
            completed: 0,
            total,
            current: None,
            current_training: None,
            current_state: 0,
            first_evaluation_state: None,
            lowest: None,
            highest: None,
            search_lowest: None,
            search_highest: None,
            baselines,
            baseline_stats: vec![Moments::default(); 3],
            savings: vec![Moments::default(); 3],
            selected_delay: 0.0,
            delay: Moments::default(),
            queue: Moments::default(),
            queue_profile_area: vec![[0.0; 4]; QUEUE_BINS],
            throughput: Moments::default(),
            backlog: Moments::default(),
            wait: Moments::default(),
            run: None,
            samples: Vec::new(),
            convergence: Vec::new(),
            replicate_delays: Vec::new(),
            scales,
            sensitivity: Vec::new(),
            sweep_delay: Moments::default(),
            sweep_backlog: Moments::default(),
            distribution: Distribution::default(),
            search_distribution: Distribution::default(),
        })
    }
    pub fn advance(&mut self, work: usize) {
        for _ in 0..work.min(4096) {
            if self.stage == Stage::Done {
                break;
            }
            let mut config = self.request.config.clone();
            match self.stage {
                Stage::Training => {
                    if self.current.is_none() {
                        self.current_state = self.rng.state();
                        let current = scenario(&config, &mut self.rng);
                        self.current_training =
                            Some(training_batch(&config, &current, &self.plans));
                        self.current = Some(current);
                    }
                    let plan = self.plans[self.index];
                    let run = self.current_training.as_ref().unwrap()[self.index];
                    self.training[self.index].push(run.delay);
                    if self
                        .search_lowest
                        .as_ref()
                        .is_none_or(|c| run.delay < c.delay)
                    {
                        self.search_lowest = Some(ReplayChoice {
                            label: "Search outcome".into(),
                            state: format!("{:016x}", self.current_state),
                            green: plan,
                            delay: run.delay,
                            remaining: run.remaining,
                        });
                    }
                    if self
                        .search_highest
                        .as_ref()
                        .is_none_or(|c| run.delay > c.delay)
                    {
                        self.search_highest = Some(ReplayChoice {
                            label: "Search outcome".into(),
                            state: format!("{:016x}", self.current_state),
                            green: plan,
                            delay: run.delay,
                            remaining: run.remaining,
                        });
                    }
                    self.search_distribution.push(
                        if run.arrivals > 0 {
                            run.delay / run.arrivals as f64
                        } else {
                            0.0
                        },
                        run.remaining as f64,
                    );
                    self.index += 1;
                    if self.index == self.plans.len() {
                        self.index = 0;
                        self.current = None;
                        self.current_training = None;
                        self.replication += 1;
                    }
                    if self.replication == self.request.training_replications {
                        let best = self
                            .training
                            .iter()
                            .enumerate()
                            .min_by(|a, b| a.1.mean.total_cmp(&b.1.mean))
                            .unwrap()
                            .0;
                        self.selected = self.plans[best];
                        self.replication = 0;
                        self.stage = Stage::Evaluation;
                    }
                }
                Stage::Evaluation => {
                    if self.current.is_none() {
                        self.current_state = self.rng.state();
                        self.current = Some(scenario(&config, &mut self.rng));
                    }
                    config.green = if self.index == 0 {
                        self.selected
                    } else {
                        self.baselines[self.index - 1].1
                    };
                    let run = if self.index == 0 {
                        simulate_with_profile(
                            &config,
                            self.current.as_ref().unwrap(),
                            self.replication == 0,
                            &mut self.queue_profile_area,
                        )
                    } else {
                        simulate(&config, self.current.as_ref().unwrap(), false)
                    };
                    if self.index == 0 {
                        if self.replication == 0 {
                            self.first_evaluation_state = Some(self.current_state);
                        }
                        let choice = ReplayChoice {
                            label: "Fresh selected timing".into(),
                            state: format!("{:016x}", self.current_state),
                            green: config.green,
                            delay: run.delay,
                            remaining: run.remaining,
                        };
                        if self.lowest.as_ref().is_none_or(|c| choice.delay < c.delay) {
                            self.lowest = Some(choice.clone());
                        }
                        if self.highest.as_ref().is_none_or(|c| choice.delay > c.delay) {
                            self.highest = Some(choice);
                        }
                        self.selected_delay = run.delay;
                        self.delay.push(run.delay);
                        self.queue.push(run.mean_queue);
                        self.throughput.push(run.throughput);
                        self.backlog.push(run.remaining as f64);
                        let wait = if run.arrivals > 0 {
                            run.delay / run.arrivals as f64
                        } else {
                            0.0
                        };
                        self.wait.push(wait);
                        self.distribution.push(wait, run.remaining as f64);
                        if self.replicate_delays.len() < 2048 {
                            self.replicate_delays.push(run.delay);
                        }
                        let n = self.delay.n;
                        let checkpoint = self.request.replications.div_ceil(160);
                        if n >= 2
                            && (n <= 16
                                || n.is_multiple_of(checkpoint)
                                || n == self.request.replications)
                        {
                            self.convergence.push(self.delay.summary());
                        }
                        if self.replication == 0 {
                            self.samples = self.current.as_ref().unwrap().samples.clone();
                            self.run = Some(run);
                        }
                    } else {
                        self.baseline_stats[self.index - 1].push(run.delay);
                        self.savings[self.index - 1].push(run.delay - self.selected_delay);
                    }
                    self.index += 1;
                    if self.index == 4 {
                        self.index = 0;
                        self.current = None;
                        self.replication += 1;
                    }
                    if self.replication == self.request.replications {
                        self.replication = 0;
                        self.stage = if self.scales.is_empty() {
                            Stage::Done
                        } else {
                            Stage::Sensitivity
                        };
                    }
                }
                Stage::Sensitivity => {
                    let scale = self.scales[self.index];
                    config.rates = config.rates.map(|r| r * scale);
                    config.green = self.selected;
                    let run = simulate(&config, &scenario(&config, &mut self.rng), false);
                    self.sweep_delay.push(run.delay);
                    self.sweep_backlog.push(run.remaining as f64);
                    self.replication += 1;
                    if self.replication == self.request.replications {
                        self.sensitivity.push(DemandPoint {
                            scale,
                            rate: config.rates.iter().sum(),
                            delay: self.sweep_delay.summary(),
                            backlog: self.sweep_backlog.summary(),
                        });
                        self.sweep_delay = Moments::default();
                        self.sweep_backlog = Moments::default();
                        self.replication = 0;
                        self.index += 1;
                        if self.index == self.scales.len() {
                            self.stage = Stage::Done;
                        }
                    }
                }
                Stage::Done => {}
            }
            self.completed += 1;
        }
    }
    pub fn adopt_training(&mut self, chunks: Vec<TrainingChunk>) -> Result<(), String> {
        if self.stage != Stage::Training {
            return Err("Training has already finished.".into());
        }
        let mut seen = vec![false; self.plans.len()];
        let mut end_state = None;
        for chunk in chunks {
            if chunk.start + chunk.moments.len() > self.plans.len() {
                return Err("Training range exceeds plan count.".into());
            }
            let state = u64::from_str_radix(&chunk.end_state, 16).map_err(|e| e.to_string())?;
            if end_state.is_some_and(|s| s != state) {
                return Err("Training shards used different arrival scenarios.".into());
            }
            end_state = Some(state);
            for (offset, moments) in chunk.moments.into_iter().enumerate() {
                let i = chunk.start + offset;
                if seen[i] || moments.n != self.request.training_replications {
                    return Err("Incomplete or duplicated training plan.".into());
                }
                seen[i] = true;
                self.training[i] = moments;
            }
            self.search_distribution.merge(&chunk.distribution);
            if let Some(choice) = chunk.lowest
                && self
                    .search_lowest
                    .as_ref()
                    .is_none_or(|c| choice.delay < c.delay)
            {
                self.search_lowest = Some(choice);
            }
            if let Some(choice) = chunk.highest
                && self
                    .search_highest
                    .as_ref()
                    .is_none_or(|c| choice.delay > c.delay)
            {
                self.search_highest = Some(choice);
            }
        }
        if seen.iter().any(|v| !v)
            || self.search_distribution.total
                != self.plans.len() as u64 * self.request.training_replications as u64
        {
            return Err("Parallel training missed simulation outcomes.".into());
        }
        self.rng = Lcg::from_state(end_state.ok_or("No training shards received.")?);
        let best = self
            .training
            .iter()
            .enumerate()
            .min_by(|a, b| a.1.mean.total_cmp(&b.1.mean))
            .unwrap()
            .0;
        self.selected = self.plans[best];
        self.completed = self.search_distribution.total;
        self.replication = 0;
        self.index = 0;
        self.stage = Stage::Evaluation;
        Ok(())
    }
    pub fn replay(&self) -> Option<(&Run, [f64; 4])> {
        self.run.as_ref().map(|r| (r, self.selected))
    }
    pub fn is_done(&self) -> bool {
        self.stage == Stage::Done
    }
    pub fn progress(&self) -> Progress {
        Progress {
            stage: match self.stage {
                Stage::Training => "Finding green times",
                Stage::Evaluation => "Testing on fresh arrivals",
                Stage::Sensitivity => "Testing demand changes",
                Stage::Done => "Complete",
            },
            completed: self.completed,
            total: self.total,
            done: self.stage == Stage::Done,
            replications_done: self.delay.n,
            replications: self.request.replications,
            candidates: if self.request.optimize {
                self.plans.len()
            } else {
                0
            },
            estimate: self.delay.summary(),
            distribution_kind: if self.stage == Stage::Training {
                "Search outcomes"
            } else {
                "Fresh evaluation outcomes"
            },
            distribution: if self.stage == Stage::Training {
                self.search_distribution.clone()
            } else {
                self.distribution.clone()
            },
            search_distribution: self.search_distribution.clone(),
        }
    }
    fn replay_choices(&self) -> Vec<ReplayChoice> {
        let mut choices = Vec::new();
        if let (Some(state), Some(run)) = (self.first_evaluation_state, &self.run) {
            choices.push(ReplayChoice {
                label: "First fresh run · selected timing".into(),
                state: format!("{state:016x}"),
                green: self.selected,
                delay: run.delay,
                remaining: run.remaining,
            });
            let mut config = self.request.config.clone();
            let traffic = scenario(&config, &mut Lcg::from_state(state));
            for (label, green) in &self.baselines {
                config.green = *green;
                let run = simulate(&config, &traffic, false);
                choices.push(ReplayChoice {
                    label: format!("Same arrivals · {label}"),
                    state: format!("{state:016x}"),
                    green: *green,
                    delay: run.delay,
                    remaining: run.remaining,
                });
            }
        }
        for (label, choice) in [
            ("Shortest fresh wait", &self.lowest),
            ("Longest fresh wait", &self.highest),
            ("Shortest search wait", &self.search_lowest),
            ("Longest search wait", &self.search_highest),
        ] {
            if let Some(choice) = choice {
                if choices
                    .iter()
                    .any(|c| c.state == choice.state && c.green == choice.green)
                {
                    continue;
                }
                choices.push(ReplayChoice {
                    label: label.into(),
                    ..choice.clone()
                });
            }
        }
        choices
    }
    pub fn output(&self) -> Result<Output, String> {
        if self.stage != Stage::Done {
            return Err("Experiment is still running.".into());
        }
        Ok(Output {
            engine_version: "2-lcg64-batched",
            request: self.request.clone(),
            selected: self.selected,
            candidates: if self.request.optimize {
                self.plans
                    .iter()
                    .zip(&self.training)
                    .map(|(g, m)| Candidate {
                        green: *g,
                        delay: m.summary(),
                    })
                    .collect()
            } else {
                Vec::new()
            },
            comparisons: self
                .baselines
                .iter()
                .enumerate()
                .map(|(i, (label, g))| Comparison {
                    label: label.clone(),
                    green: *g,
                    delay: self.baseline_stats[i].summary(),
                    paired_saving: self.savings[i].summary(),
                })
                .collect(),
            delay: self.delay.summary(),
            queue: self.queue.summary(),
            queue_profile: {
                let width = self.request.config.horizon / QUEUE_BINS as f64;
                let scale = 1.0 / (self.request.replications as f64 * width);
                self.queue_profile_area
                    .iter()
                    .enumerate()
                    .map(|(bin, area)| QueuePoint {
                        time: bin as f64 * width,
                        queues: area.map(|value| value * scale),
                    })
                    .chain(self.queue_profile_area.last().map(|area| QueuePoint {
                        time: self.request.config.horizon,
                        queues: area.map(|value| value * scale),
                    }))
                    .collect()
            },
            throughput: self.throughput.summary(),
            backlog: self.backlog.summary(),
            waiting_per_arrival: self.wait.summary(),
            convergence: self.convergence.clone(),
            run: self.run.clone().unwrap(),
            replay_choices: self.replay_choices(),
            samples: self.samples.clone(),
            replicate_delays: self.replicate_delays.clone(),
            sensitivity: self.sensitivity.clone(),
            distribution: self.distribution.clone(),
            search_distribution: self.search_distribution.clone(),
        })
    }
}
pub fn execute(request: Request) -> Result<Output, String> {
    let mut session = Session::new(request)?;
    while session.stage != Stage::Done {
        session.advance(4096);
    }
    session.output()
}

#[cfg(test)]
mod tests {
    use super::*;
    fn request() -> Request {
        Request {
            config: Config {
                horizon: 60.0,
                cycle: 48.0,
                clearance: 8.0,
                headway: 2.0,
                rates: [300.0; 4],
                turns: [0.2, 0.6, 0.2],
                green: [10.0; 4],
            },
            replications: 4,
            training_replications: 4,
            grid_step: 4,
            min_green: 4,
            max_green: 28,
            seed: 1,
            optimize: true,
            sensitivity: true,
        }
    }
    #[test]
    fn grid_and_paired_statistics() {
        let r = request();
        let p = feasible(&r).unwrap();
        assert_eq!(p.len(), 84);
        let o = execute(r).unwrap();
        assert_eq!(o.candidates.len(), 84);
        assert_eq!(o.sensitivity.len(), 5);
        assert_eq!(o.queue_profile.len(), QUEUE_BINS + 1);
        let width = 60.0 / QUEUE_BINS as f64;
        let profile_delay: f64 = o.queue_profile[..QUEUE_BINS]
            .iter()
            .flat_map(|point| point.queues)
            .sum::<f64>()
            * width;
        assert!((profile_delay - o.delay.mean).abs() < 1e-8);
        for c in o.comparisons {
            assert!((c.paired_saving.mean - (c.delay.mean - o.delay.mean)).abs() < 1e-8);
        }
    }
    #[test]
    fn batches_reproduce_and_progress_counts_every_run() {
        let r = request();
        let expected = execute(r.clone()).unwrap();
        let mut s = Session::new(r).unwrap();
        let mut previous = 0;
        while !s.progress().done {
            s.advance(3);
            let p = s.progress();
            assert!(p.completed >= previous && p.completed <= p.total);
            previous = p.completed;
        }
        let p = s.progress();
        assert_eq!(p.completed, p.total);
        assert_eq!(s.output().unwrap().delay.mean, expected.delay.mean);
    }
    #[test]
    fn large_replications_use_bounded_summaries() {
        let mut r = request();
        r.replications = 2500;
        r.optimize = false;
        r.sensitivity = false;
        r.config.rates = [0.0; 4];
        let o = execute(r).unwrap();
        assert_eq!(o.delay.n, 2500);
        assert_eq!(o.distribution.counts.iter().sum::<u64>(), 2500);
        assert!(o.convergence.len() < 200);
        assert_eq!(o.replicate_delays.len(), 2048);
        assert_eq!(o.delay.mean, 0.0);
        assert!(o.queue_profile.iter().all(|point| point.queues == [0.0; 4]));
    }
    #[test]
    fn moments_and_density_conserve_samples() {
        let s = statistics(&[1.0, 2.0, 3.0, 4.0]);
        assert_eq!(s.mean, 2.5);
        assert!((s.se - 0.645497).abs() < 1e-5);
        let mut d = Distribution::default();
        for i in 0..1000 {
            d.push(i as f64, i as f64);
        }
        assert_eq!(d.counts.iter().sum::<u64>(), 1000);
        let mut r = request();
        r.grid_step = 0;
        assert!(Session::new(r).is_err());
    }
    #[test]
    fn parallel_training_matches_serial_and_replays_reproduce_waiting() {
        let r = request();
        let serial = execute(r.clone()).unwrap();
        let len = feasible(&r).unwrap().len();
        let mut chunks = Vec::new();
        for (start, end) in [(0, len / 3), (len / 3, 2 * len / 3), (2 * len / 3, len)] {
            let mut shard = TrainingShard::new(r.clone(), start, end).unwrap();
            while !shard.advance(7) {}
            chunks.push(shard.result().unwrap());
        }
        let mut session = Session::new(r.clone()).unwrap();
        session.adopt_training(chunks).unwrap();
        while !session.is_done() {
            session.advance(9);
        }
        let parallel = session.output().unwrap();
        assert_eq!(parallel.selected, serial.selected);
        assert_eq!(parallel.delay.mean, serial.delay.mean);
        assert_eq!(
            parallel.search_distribution.total,
            serial.search_distribution.total
        );
        assert_eq!(parallel.candidates.len(), serial.candidates.len());
        for (a, b) in parallel.candidates.iter().zip(serial.candidates.iter()) {
            assert_eq!(a.delay.mean, b.delay.mean);
        }
        for choice in &parallel.replay_choices {
            let state = u64::from_str_radix(&choice.state, 16).unwrap();
            let mut config = r.config.clone();
            config.green = choice.green;
            let traffic = scenario(&config, &mut Lcg::from_state(state));
            let run = simulate(&config, &traffic, true);
            assert_eq!(run.delay, choice.delay);
            assert_eq!(run.remaining, choice.remaining);
        }
    }
}
