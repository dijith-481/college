pub trait Uniform {
    fn uniform(&mut self) -> f64;
}

#[derive(Clone)]
pub struct Lcg(u64);

impl Lcg {
    pub fn new(seed: u32) -> Self {
        Self(u64::from(seed))
    }
    pub fn from_state(state: u64) -> Self {
        Self(state)
    }
    pub fn state(&self) -> u64 {
        self.0
    }
}

impl Uniform for Lcg {
    fn uniform(&mut self) -> f64 {
        // m = 2^64; odd c and a ≡ 1 (mod 4) give a full-period LCG.
        self.0 = self
            .0
            .wrapping_mul(6_364_136_223_846_793_005)
            .wrapping_add(1_442_695_040_888_963_407);
        ((self.0 >> 12) as f64 + 0.5) / 4_503_599_627_370_496.0
    }
}

pub fn exponential(uniform: f64, rate: f64) -> f64 {
    -(-uniform).ln_1p() / rate
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn known_recurrence_and_open_interval() {
        let mut rng = Lcg::new(0);
        assert_eq!(
            rng.uniform(),
            ((1_442_695_040_888_963_407_u64 >> 12) as f64 + 0.5) / 4_503_599_627_370_496.0
        );
        for _ in 0..100_000 {
            assert!((0.0..1.0).contains(&rng.uniform()));
        }
    }

    #[test]
    fn exponential_sample_mean_and_uniform_moments() {
        let mut rng = Lcg::new(42);
        let n = 100_000.0;
        let mut sum = 0.0;
        let mut squares = 0.0;
        for _ in 0..n as usize {
            let u = rng.uniform();
            sum += u;
            squares += u * u;
        }
        assert!((sum / n - 0.5).abs() < 0.005);
        assert!((squares / n - 1.0 / 3.0).abs() < 0.005);
        let mean = (0..n as usize)
            .map(|_| exponential(rng.uniform(), 1.0 / 6.0))
            .sum::<f64>()
            / n;
        assert!((mean - 6.0).abs() < 0.08);
    }
}
