use random::Uniform;
use serde::{Deserialize, Serialize};
use std::{
    cmp::Ordering,
    collections::{BinaryHeap, VecDeque},
};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Config {
    pub horizon: f64,
    pub cycle: f64,
    pub clearance: f64,
    pub headway: f64,
    pub rates: [f64; 4],
    pub turns: [f64; 3],
    pub green: [f64; 4],
}
impl Config {
    pub fn validate(&self) -> Result<(), String> {
        if !self.horizon.is_finite()
            || !(30.0..=86400.0).contains(&self.horizon)
            || !self.cycle.is_finite()
            || !(24.0..=600.0).contains(&self.cycle)
            || !self.clearance.is_finite()
            || !(0.0..self.cycle).contains(&self.clearance)
            || !self.headway.is_finite()
            || !(0.25..=30.0).contains(&self.headway)
            || self
                .rates
                .iter()
                .any(|r| !r.is_finite() || !(0.0..=20000.0).contains(r))
            || self
                .turns
                .iter()
                .any(|p| !p.is_finite() || !(0.0..=1.0).contains(p))
            || (self.turns.iter().sum::<f64>() - 1.0).abs() > 1e-9
            || self
                .green
                .iter()
                .any(|g| !g.is_finite() || *g < self.headway)
            || (self.green.iter().sum::<f64>() + self.clearance - self.cycle).abs() > 1e-8
        {
            return Err(
                "Invalid demand, probabilities, headway, horizon, or cycle allocation.".into(),
            );
        }
        Ok(())
    }
}
#[derive(Clone, Debug, Serialize)]
pub struct Arrival {
    pub time: f64,
    pub lane: usize,
}
#[derive(Clone, Debug, Serialize)]
pub struct Sample {
    pub approach: usize,
    pub uniform: f64,
    pub gap: f64,
    pub time: f64,
    pub movement: usize,
}
#[derive(Clone, Serialize)]
pub struct Scenario {
    pub arrivals: Vec<Arrival>,
    pub samples: Vec<Sample>,
}
pub fn scenario(config: &Config, rng: &mut impl Uniform) -> Scenario {
    let mut arrivals = Vec::new();
    let mut samples = Vec::new();
    for approach in 0..4 {
        let rate = config.rates[approach] / 3600.0;
        if rate == 0.0 {
            continue;
        }
        let mut time = 0.0;
        let mut sampled = 0;
        loop {
            let uniform = rng.uniform();
            let gap = random::exponential(uniform, rate);
            time += gap;
            if time > config.horizon {
                break;
            }
            let u = rng.uniform();
            let movement = if u < config.turns[0] {
                0
            } else if u < config.turns[0] + config.turns[1] {
                1
            } else {
                2
            };
            arrivals.push(Arrival {
                time,
                lane: approach * 3 + movement,
            });
            if sampled < 8 {
                samples.push(Sample {
                    approach,
                    uniform,
                    gap,
                    time,
                    movement,
                });
                sampled += 1;
            }
        }
    }
    arrivals.sort_by(|a, b| a.time.total_cmp(&b.time).then(a.lane.cmp(&b.lane)));
    samples.sort_by(|a, b| a.time.total_cmp(&b.time));
    samples.truncate(16);
    Scenario { arrivals, samples }
}
#[derive(Clone, Debug)]
pub enum Kind {
    Departure(usize),
    PhaseEnd,
    PhaseStart(usize, f64),
    Arrival(usize, usize),
}
#[derive(Clone, Debug)]
pub struct Event {
    pub time: f64,
    pub order: usize,
    pub kind: Kind,
}
impl Event {
    fn priority(&self) -> u8 {
        match self.kind {
            Kind::Departure(_) => 0,
            Kind::PhaseEnd => 1,
            Kind::PhaseStart(..) => 2,
            Kind::Arrival(..) => 3,
        }
    }
}
impl PartialEq for Event {
    fn eq(&self, other: &Self) -> bool {
        self.cmp(other) == Ordering::Equal
    }
}
impl Eq for Event {}
impl PartialOrd for Event {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}
impl Ord for Event {
    fn cmp(&self, other: &Self) -> Ordering {
        other
            .time
            .total_cmp(&self.time)
            .then(other.priority().cmp(&self.priority()))
            .then(other.order.cmp(&self.order))
    }
}
#[derive(Clone, Default)]
pub struct Lane {
    pub waiting: VecDeque<(usize, f64)>,
    pub service_end: Option<f64>,
    pub arrived: u32,
    pub departed: u32,
    pub area: f64,
    pub started_wait: f64,
    pub busy_time: f64,
    pub max_queue: usize,
}
pub struct State {
    pub time: f64,
    pub phase: Option<usize>,
    pub green_end: f64,
    pub lanes: [Lane; 12],
    pub events: BinaryHeap<Event>,
    pub sequence: usize,
    pub vehicles: Vec<VehicleTrace>,
}
pub fn transition(mut state: State, event: Event, config: &Config) -> State {
    // D_T = ∫ Q(t) dt; Q is constant between events and excludes service.
    let dt = event.time - state.time;
    for lane in &mut state.lanes {
        lane.area += lane.waiting.len() as f64 * dt;
        if lane.service_end.is_some() {
            lane.busy_time += dt;
        }
    }
    state.time = event.time;
    match event.kind {
        Kind::Arrival(m, id) => {
            state.lanes[m].arrived += 1;
            state.lanes[m].waiting.push_back((id, event.time));
        }
        Kind::Departure(m) => {
            state.lanes[m].service_end = None;
            state.lanes[m].departed += 1;
        }
        Kind::PhaseEnd => state.phase = None,
        Kind::PhaseStart(p, end) => {
            state.phase = Some(p);
            state.green_end = end;
        }
    }
    for m in 0..12 {
        let lane = &mut state.lanes[m];
        if state.phase == Some(m / 3)
            && lane.service_end.is_none()
            && state.time + config.headway <= state.green_end
            && let Some((id, arrived)) = lane.waiting.pop_front()
        {
            lane.started_wait += state.time - arrived;
            if let Some(v) = state.vehicles.get_mut(id) {
                v.started = Some(state.time);
                v.departed = Some(state.time + config.headway);
            }
            let end = state.time + config.headway;
            lane.service_end = Some(end);
            state.sequence += 1;
            state.events.push(Event {
                time: end,
                order: state.sequence,
                kind: Kind::Departure(m),
            });
        }
        lane.max_queue = lane.max_queue.max(lane.waiting.len());
    }
    state
}
#[derive(Clone, Serialize)]
pub struct Frame {
    pub time: f64,
    pub phase: Option<usize>,
    pub queues: [usize; 12],
    pub busy: [bool; 12],
    pub departed: u32,
    pub delay: f64,
}
#[derive(Clone, Serialize)]
pub struct LaneResult {
    pub arrived: u32,
    pub departed: u32,
    pub remaining: usize,
    pub in_service: bool,
    pub delay: f64,
    pub mean_queue: f64,
    pub max_queue: usize,
    pub utilization: f64,
}
#[derive(Clone, Serialize)]
pub struct VehicleTrace {
    pub id: usize,
    pub lane: usize,
    pub arrived: f64,
    pub started: Option<f64>,
    pub departed: Option<f64>,
}
#[derive(Clone, Serialize)]
pub struct Run {
    pub delay: f64,
    pub mean_queue: f64,
    pub max_queue: usize,
    pub arrivals: u32,
    pub departures: u32,
    pub remaining: usize,
    pub in_service: usize,
    pub throughput: f64,
    pub accounting_error: f64,
    pub lanes: [LaneResult; 12],
    pub frames: Vec<Frame>,
    pub vehicles: Vec<VehicleTrace>,
}
fn frame(state: &State) -> Frame {
    Frame {
        time: state.time,
        phase: state.phase,
        queues: std::array::from_fn(|m| state.lanes[m].waiting.len()),
        busy: std::array::from_fn(|m| state.lanes[m].service_end.is_some()),
        departed: state.lanes.iter().map(|l| l.departed).sum(),
        delay: state.lanes.iter().map(|l| l.area).sum(),
    }
}
pub fn simulate(config: &Config, scenario: &Scenario, trace: bool) -> Run {
    simulate_core(config, scenario, trace, None)
}
pub fn simulate_with_profile(
    config: &Config,
    scenario: &Scenario,
    trace: bool,
    profile: &mut [[f64; 4]],
) -> Run {
    simulate_core(config, scenario, trace, Some(profile))
}
fn add_queue_area(state: &State, end: f64, horizon: f64, profile: &mut [[f64; 4]]) {
    if profile.is_empty() || end <= state.time {
        return;
    }
    let width = horizon / profile.len() as f64;
    let first = ((state.time / width).floor() as usize).min(profile.len() - 1);
    let last = ((end / width).floor() as usize).min(profile.len() - 1);
    let queues: [f64; 4] = std::array::from_fn(|a| {
        state.lanes[a * 3..a * 3 + 3]
            .iter()
            .map(|lane| lane.waiting.len() as f64)
            .sum()
    });
    for bin in first..=last {
        let dt = (end.min((bin + 1) as f64 * width) - state.time.max(bin as f64 * width)).max(0.0);
        for a in 0..4 {
            profile[bin][a] += queues[a] * dt;
        }
    }
}
fn simulate_core(
    config: &Config,
    scenario: &Scenario,
    trace: bool,
    mut profile: Option<&mut [[f64; 4]]>,
) -> Run {
    let mut events = BinaryHeap::new();
    let mut sequence = 0;
    for (id, a) in scenario.arrivals.iter().enumerate() {
        sequence += 1;
        events.push(Event {
            time: a.time,
            order: sequence,
            kind: Kind::Arrival(a.lane, id),
        });
    }
    let mut cycle_start = 0.0;
    while cycle_start < config.horizon {
        let mut start = cycle_start;
        for p in 0..4 {
            let end = start + config.green[p];
            sequence += 1;
            events.push(Event {
                time: start,
                order: sequence,
                kind: Kind::PhaseStart(p, end),
            });
            sequence += 1;
            events.push(Event {
                time: end,
                order: sequence,
                kind: Kind::PhaseEnd,
            });
            start = end + config.clearance / 4.0;
        }
        cycle_start += config.cycle;
    }
    let mut state = State {
        time: 0.0,
        phase: None,
        green_end: 0.0,
        lanes: std::array::from_fn(|_| Lane::default()),
        events,
        sequence,
        vehicles: if trace {
            scenario
                .arrivals
                .iter()
                .enumerate()
                .map(|(id, a)| VehicleTrace {
                    id,
                    lane: a.lane,
                    arrived: a.time,
                    started: None,
                    departed: None,
                })
                .collect()
        } else {
            Vec::new()
        },
    };
    let mut frames = Vec::new();
    while let Some(event) = state.events.pop() {
        if event.time > config.horizon {
            break;
        }
        if let Some(profile) = profile.as_deref_mut() {
            add_queue_area(&state, event.time, config.horizon, profile);
        }
        state = transition(state, event, config);
        if trace {
            frames.push(frame(&state));
        }
    }
    if let Some(profile) = profile.as_deref_mut() {
        add_queue_area(&state, config.horizon, config.horizon, profile);
    }
    let dt = config.horizon - state.time;
    for l in &mut state.lanes {
        l.area += l.waiting.len() as f64 * dt;
        if l.service_end.is_some() {
            l.busy_time += dt;
        }
    }
    state.time = config.horizon;
    if trace {
        frames.push(frame(&state));
    }
    let lanes: [LaneResult; 12] = std::array::from_fn(|m| {
        let l = &state.lanes[m];
        LaneResult {
            arrived: l.arrived,
            departed: l.departed,
            remaining: l.waiting.len(),
            in_service: l.service_end.is_some(),
            delay: l.area,
            mean_queue: l.area / config.horizon,
            max_queue: l.max_queue,
            utilization: l.busy_time / config.horizon,
        }
    });
    let accounting_error = state
        .lanes
        .iter()
        .map(|l| {
            (l.area
                - l.started_wait
                - l.waiting
                    .iter()
                    .map(|(_, t)| config.horizon - t)
                    .sum::<f64>())
            .abs()
        })
        .sum();
    Run {
        delay: lanes.iter().map(|l| l.delay).sum(),
        mean_queue: lanes.iter().map(|l| l.mean_queue).sum(),
        max_queue: lanes.iter().map(|l| l.max_queue).max().unwrap_or(0),
        arrivals: lanes.iter().map(|l| l.arrived).sum(),
        departures: lanes.iter().map(|l| l.departed).sum(),
        remaining: lanes.iter().map(|l| l.remaining).sum(),
        in_service: lanes.iter().filter(|l| l.in_service).count(),
        throughput: lanes.iter().map(|l| l.departed as f64).sum::<f64>() * 3600.0 / config.horizon,
        accounting_error,
        lanes,
        frames,
        vehicles: state.vehicles,
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    use random::Lcg;
    fn config() -> Config {
        Config {
            horizon: 96.0,
            cycle: 96.0,
            clearance: 16.0,
            headway: 2.0,
            rates: [600.0; 4],
            turns: [0.2, 0.6, 0.2],
            green: [20.0; 4],
        }
    }
    #[test]
    fn manual_waiting_and_green_boundary() {
        let c = config();
        let s = Scenario {
            samples: vec![],
            arrivals: vec![
                Arrival { time: 1.0, lane: 0 },
                Arrival { time: 2.0, lane: 0 },
                Arrival {
                    time: 19.0,
                    lane: 0,
                },
            ],
        };
        let r = simulate(&c, &s, true);
        assert_eq!(r.departures, 2);
        assert_eq!(r.remaining, 1);
        assert_eq!(r.delay, 78.0);
        assert_eq!(r.accounting_error, 0.0);
        assert_eq!(r.lanes[0].utilization, 4.0 / 96.0);
    }
    #[test]
    fn completion_at_boundary_and_conservation() {
        let mut c = config();
        c.horizon = 193.0;
        let s = Scenario {
            samples: vec![],
            arrivals: vec![
                Arrival {
                    time: 18.0,
                    lane: 0,
                },
                Arrival {
                    time: 20.0,
                    lane: 0,
                },
            ],
        };
        let r = simulate(&c, &s, true);
        assert_eq!(r.departures, 2);
        assert_eq!(r.delay, 76.0);
        assert_eq!(
            r.arrivals as usize,
            r.departures as usize + r.remaining + r.in_service
        );
    }
    #[test]
    fn reproduce_and_account_at_horizon() {
        let c = config();
        let s = scenario(&c, &mut Lcg::new(31));
        let r = simulate(&c, &s, false);
        assert_eq!(
            r.delay,
            simulate(&c, &scenario(&c, &mut Lcg::new(31)), false).delay
        );
        assert!(r.accounting_error < 1e-8);
        for l in r.lanes {
            assert_eq!(
                l.arrived as usize,
                l.departed as usize + l.remaining + usize::from(l.in_service)
            );
        }
    }
    #[test]
    fn queue_profile_area_matches_waiting_time() {
        let c = config();
        let s = scenario(&c, &mut Lcg::new(31));
        let mut profile = [[0.0; 4]; 12];
        let run = simulate_with_profile(&c, &s, false, &mut profile);
        for approach in 0..4 {
            let area: f64 = profile.iter().map(|bin| bin[approach]).sum();
            let lane_area: f64 = run.lanes[approach * 3..approach * 3 + 3]
                .iter()
                .map(|lane| lane.delay)
                .sum();
            assert!((area - lane_area).abs() < 1e-8);
        }
    }
    #[test]
    fn empty_demand_and_invalid_inputs() {
        let mut c = config();
        c.rates = [0.0; 4];
        let r = simulate(&c, &scenario(&c, &mut Lcg::new(1)), false);
        assert_eq!(r.delay, 0.0);
        assert_eq!(r.arrivals, 0);
        c.turns = [0.3; 3];
        assert!(c.validate().is_err());
    }
    #[test]
    fn service_at_horizon_is_not_waiting_or_a_departure() {
        let mut c = config();
        c.horizon = 30.0;
        let s = Scenario {
            samples: vec![],
            arrivals: vec![Arrival {
                time: 29.0,
                lane: 3,
            }],
        };
        let r = simulate(&c, &s, true);
        assert_eq!(r.arrivals, 1);
        assert_eq!(r.departures, 0);
        assert_eq!(r.remaining, 0);
        assert_eq!(r.in_service, 1);
        assert_eq!(r.delay, 0.0);
    }
    #[test]
    fn all_services_respect_phase_permissions_under_heavy_demand() {
        let mut c = config();
        c.rates = [2400.0; 4];
        c.horizon = 600.0;
        let r = simulate(&c, &scenario(&c, &mut Lcg::new(0)), true);
        for f in &r.frames {
            for (m, busy) in f.busy.iter().enumerate() {
                if *busy {
                    assert_eq!(f.phase, Some(m / 3));
                }
            }
        }
        assert!(r.accounting_error < 1e-6);
        assert_eq!(
            r.arrivals as usize,
            r.departures as usize + r.remaining + r.in_service
        );
    }
}
