use experiments::{Request, Session, TrainingChunk, TrainingShard, execute};
use wasm_bindgen::prelude::*;
fn error(e: impl ToString) -> JsValue {
    JsValue::from_str(&e.to_string())
}
#[wasm_bindgen]
pub fn experiment(input: &str) -> Result<String, JsValue> {
    let request: Request = serde_json::from_str(input).map_err(error)?;
    serde_json::to_string(&execute(request).map_err(error)?).map_err(error)
}
#[wasm_bindgen]
pub struct ExperimentSession {
    session: Session,
}
#[wasm_bindgen]
impl ExperimentSession {
    #[wasm_bindgen(constructor)]
    pub fn new(input: &str) -> Result<ExperimentSession, JsValue> {
        let request: Request = serde_json::from_str(input).map_err(error)?;
        Ok(Self {
            session: Session::new(request).map_err(error)?,
        })
    }
    pub fn advance(&mut self, work: usize) -> bool {
        self.session.advance(work);
        self.session.is_done()
    }
    pub fn progress(&self) -> Result<String, JsValue> {
        serde_json::to_string(&self.session.progress()).map_err(error)
    }
    pub fn replay(&self) -> Result<String, JsValue> {
        serde_json::to_string(&self.session.replay()).map_err(error)
    }
    pub fn result(&self) -> Result<String, JsValue> {
        serde_json::to_string(&self.session.output().map_err(error)?).map_err(error)
    }
}

#[wasm_bindgen]
pub fn preview(input: &str) -> Result<String, JsValue> {
    let request: Request = serde_json::from_str(input).map_err(error)?;
    request.config.validate().map_err(error)?;
    let mut rng = random::Lcg::new(request.seed);
    let scenario = simulation::scenario(&request.config, &mut rng);
    serde_json::to_string(&simulation::simulate(&request.config, &scenario, true)).map_err(error)
}

#[wasm_bindgen]
pub fn replay_choice(input: &str, state: &str, green: &str) -> Result<String, JsValue> {
    let mut request: Request = serde_json::from_str(input).map_err(error)?;
    request.config.green = serde_json::from_str(green).map_err(error)?;
    request.config.validate().map_err(error)?;
    let state = u64::from_str_radix(state, 16).map_err(error)?;
    let traffic = simulation::scenario(&request.config, &mut random::Lcg::from_state(state));
    serde_json::to_string(&simulation::simulate(&request.config, &traffic, true)).map_err(error)
}

#[wasm_bindgen]
pub struct ParallelTrainingShard {
    shard: TrainingShard,
}
#[wasm_bindgen]
impl ParallelTrainingShard {
    #[wasm_bindgen(constructor)]
    pub fn new(input: &str, start: usize, end: usize) -> Result<ParallelTrainingShard, JsValue> {
        let request: Request = serde_json::from_str(input).map_err(error)?;
        Ok(Self {
            shard: TrainingShard::new(request, start, end).map_err(error)?,
        })
    }
    pub fn advance(&mut self, work: usize) -> bool {
        self.shard.advance(work)
    }
    pub fn completed(&self) -> usize {
        self.shard.completed()
    }
    pub fn total(&self) -> usize {
        self.shard.total()
    }
    pub fn result(&self) -> Result<String, JsValue> {
        serde_json::to_string(&self.shard.result().map_err(error)?).map_err(error)
    }
}
#[wasm_bindgen]
impl ExperimentSession {
    pub fn adopt_training(&mut self, chunks: &str) -> Result<(), JsValue> {
        let chunks: Vec<TrainingChunk> = serde_json::from_str(chunks).map_err(error)?;
        self.session.adopt_training(chunks).map_err(error)
    }
}
