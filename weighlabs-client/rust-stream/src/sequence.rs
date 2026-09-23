use crate::nawi::{AccuracyClass, LoadCorner, MassUnit, ScaleConfig, TestPhase, WeighingFrame};

pub fn default_config() -> ScaleConfig {
    ScaleConfig {
        serial_number: "NAWI-DUMMY-001".into(),
        model: "WEIGHLABS-SIM-3000".into(),
        accuracy_class: AccuracyClass::ClassIii as i32,
        unit: MassUnit::UnitKg as i32,
        max_capacity: 150.0,
        min_capacity: 1.0,
        verification_interval: 0.05, // e
        actual_interval: 0.01,       // d
        number_of_intervals: 3000,   // n = Max / e
    }
}

pub fn normalize_config(mut cfg: ScaleConfig) -> ScaleConfig {
    let d = default_config();
    if cfg.max_capacity <= 0.0 || cfg.verification_interval <= 0.0 {
        return d;
    }
    if cfg.actual_interval <= 0.0 || cfg.actual_interval > cfg.verification_interval {
        cfg.actual_interval = cfg.verification_interval / 5.0;
    }
    if cfg.min_capacity <= 0.0 {
        cfg.min_capacity = d.min_capacity;
    }
    if cfg.number_of_intervals <= 0 {
        cfg.number_of_intervals = (cfg.max_capacity / cfg.verification_interval).round() as i32;
    }
    if cfg.accuracy_class == AccuracyClass::Unspecified as i32 {
        cfg.accuracy_class = AccuracyClass::ClassIii as i32;
    }
    if cfg.unit == MassUnit::Unspecified as i32 {
        cfg.unit = MassUnit::UnitKg as i32;
    }
    if cfg.serial_number.is_empty() {
        cfg.serial_number = d.serial_number;
    }
    if cfg.model.is_empty() {
        cfg.model = d.model;
    }
    cfg
}

/// OIML R 76 Table 1 — maximum permissible error (mpe) at a load, in e.
pub fn mpe_e(accuracy_class: i32, load_in_e: f64) -> f64 {
    match accuracy_class {
        c if c == AccuracyClass::ClassI as i32 => {
            if load_in_e <= 50.0 {
                0.5
            } else {
                1.0
            }
        }
        _ => {
            // Classes II, III, IIII
            if load_in_e <= 50.0 {
                0.5
            } else if load_in_e <= 200.0 {
                1.0
            } else {
                1.5
            }
        }
    }
}

struct Rng(u64);

impl Rng {
    fn next_f64(&mut self) -> f64 {
        let mut x = self.0;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.0 = x;
        (x >> 11) as f64 / (1u64 << 53) as f64
    }

    fn centered(&mut self) -> f64 {
        self.next_f64() * 2.0 - 1.0
    }
}

struct Step {
    phase: TestPhase,
    label: String,
    reference_load: f64,
    corner: LoadCorner,
    voltage_v: f64, // 0.0 = instrument default (230 V)
    tare: f64,
    ticks: u32,
    settle_ticks: u32,
    error_e: f64, // injected indication error, in e
    point_index: i32,
    note: String,
}

fn quantize(v: f64, d: f64) -> f64 {
    (v / d).round() * d
}

/// Reference points for the accuracy tests: 50e, 100e, 200e and the
/// quarter/half/three-quarter/maximum points of the scale (OIML R 76 §5.4).
fn accuracy_points_in_e(cfg: &ScaleConfig) -> Vec<f64> {
    let n = cfg.number_of_intervals as f64;
    let mut pts: Vec<f64> = [50.0, 100.0, 200.0, n / 4.0, n / 2.0, 3.0 * n / 4.0, n]
        .iter()
        .copied()
        .filter(|p| *p > 0.0 && *p <= n)
        .collect();
    pts.sort_by(|a, b| a.partial_cmp(b).unwrap());
    pts.dedup_by(|a, b| (*a - *b).abs() < 1e-9);
    pts
}

fn build_script(cfg: &ScaleConfig) -> Vec<Step> {
    let e = cfg.verification_interval;
    let n = cfg.number_of_intervals as f64;
    let max = cfg.max_capacity;
    let r = (cfg.actual_interval / e).clamp(0.0, 1.0);
    // Stay clear of the mpe boundary after noise + quantisation.
    let frac = (0.45 - 0.7 * r).max(0.05);

    let mut steps: Vec<Step> = Vec::new();
    let mut push = |phase: TestPhase,
                    label: &str,
                    load: f64,
                    corner: LoadCorner,
                    voltage_v: f64,
                    tare: f64,
                    ticks: u32,
                    settle_ticks: u32,
                    error_e: f64,
                    point_index: i32,
                    note: &str| {
        steps.push(Step {
            phase,
            label: label.into(),
            reference_load: load,
            corner,
            voltage_v,
            tare,
            ticks,
            settle_ticks,
            error_e,
            point_index,
            note: note.into(),
        });
    };

    let mpe = |load_e: f64| mpe_e(cfg.accuracy_class, load_e);

    push(
        TestPhase::WarmUp,
        "Warm-up",
        0.0,
        LoadCorner::CornerCenter,
        0.0,
        0.0,
        10,
        6,
        0.0,
        0,
        "Instrument stabilising before zero entry",
    );
    push(
        TestPhase::ZeroSetting,
        "Zero entry",
        0.0,
        LoadCorner::CornerCenter,
        0.0,
        0.0,
        14,
        8,
        0.3 * frac * mpe(0.0),
        0,
        "Zero setting verified within 0.5e (R 76 §5.1)",
    );
    push(
        TestPhase::MinLoad,
        "Min load (Min)",
        cfg.min_capacity,
        LoadCorner::CornerCenter,
        0.0,
        0.0,
        14,
        8,
        0.4 * frac * mpe(cfg.min_capacity / e),
        0,
        "Minimum load indication within mpe (R 76 §5.2)",
    );
    push(
        TestPhase::MaxLoad,
        "Max load (Max)",
        max,
        LoadCorner::CornerCenter,
        0.0,
        0.0,
        14,
        8,
        -0.7 * frac * mpe(n),
        0,
        "Maximum load indication within mpe (R 76 §5.3)",
    );

    // Eccentricity: test load at Max/3 on each corner (R 76 §5.5).
    let ecc_load = max / 3.0;
    let ecc_mpe = mpe(ecc_load / e);
    for (i, corner) in [
        LoadCorner::CornerFront,
        LoadCorner::CornerRear,
        LoadCorner::CornerLeft,
        LoadCorner::CornerRight,
    ]
    .into_iter()
    .enumerate()
    {
        let sign = if i.is_multiple_of(2) { 1.0 } else { -1.0 };
        push(
            TestPhase::Eccentricity,
            &format!("Eccentricity {:?}", corner),
            ecc_load,
            corner,
            0.0,
            0.0,
            12,
            7,
            sign * (0.2 + 0.15 * i as f64) * frac * ecc_mpe,
            i as i32,
            "Off-centre deviation within mpe (R 76 §5.5)",
        );
    }

    // Accuracy at ascending and descending reference loads (R 76 §5.4).
    let points = accuracy_points_in_e(cfg);
    let acc_err = |i: usize| -> f64 {
        let sign = if i.is_multiple_of(2) { 1.0 } else { -1.0 };
        sign * (0.35 + 0.1 * (i % 3) as f64)
    };
    for (i, p) in points.iter().enumerate() {
        let load = p * e;
        push(
            TestPhase::AccuracyAscending,
            &format!("Ascending {} e", p),
            load,
            LoadCorner::CornerCenter,
            0.0,
            0.0,
            10,
            6,
            acc_err(i) * frac * mpe(*p),
            i as i32,
            "Ascending accuracy point within mpe (R 76 §5.4)",
        );
    }
    for (i, p) in points.iter().enumerate().skip(1).rev() {
        let load = p * e;
        let idx = points.len() as i32 - 1 - i as i32;
        push(
            TestPhase::AccuracyDescending,
            &format!("Descending {} e", p),
            load,
            LoadCorner::CornerCenter,
            0.0,
            0.0,
            10,
            6,
            -acc_err(i) * frac * mpe(*p),
            idx,
            "Descending accuracy point within mpe (R 76 §5.4)",
        );
    }

    // Repeatability: three consecutive loads at Max/2 (R 76 §5.6).
    for i in 0..3 {
        push(
            TestPhase::Repeatability,
            &format!("Repeatability run {}", i + 1),
            max / 2.0,
            LoadCorner::CornerCenter,
            0.0,
            0.0,
            12,
            7,
            [0.25, -0.3, 0.1][i] * frac * mpe(n / 2.0),
            i as i32,
            if i < 2 {
                "Collecting repeatability sample"
            } else {
                ""
            },
        );
    }

    // Tare accuracy: apply tare load, net must read zero (R 76 §5.7).
    let tare_load = max * 0.1;
    push(
        TestPhase::TareAccuracy,
        "Tare accuracy",
        tare_load,
        LoadCorner::CornerCenter,
        0.0,
        tare_load,
        14,
        8,
        0.0,
        0,
        "Tare applied; net indication within 0.5e of zero (R 76 §5.7)",
    );

    // Mains voltage variation Un -15% / Un / Un +10% (R 76 §6.2 / IEC 60654-2).
    for (i, (v, label)) in [
        (198.0, "Un -15%"),
        (230.0, "Un"),
        (253.0, "Un +10%"),
    ]
    .into_iter()
    .enumerate()
    {
        push(
            TestPhase::VoltageVariation,
            &format!("Voltage variation {label}"),
            max / 2.0,
            LoadCorner::CornerCenter,
            v,
            0.0,
            10,
            6,
            [0.2, 0.0, -0.2][i] * frac * mpe(n / 2.0),
            i as i32,
            "Indication stable under mains variation (R 76 §6.2)",
        );
    }

    push(
        TestPhase::Completed,
        "Test completed",
        0.0,
        LoadCorner::CornerCenter,
        0.0,
        0.0,
        10,
        8,
        0.0,
        0,
        "All OIML R 76 test phases completed — PASS",
    );

    steps
}

pub struct TestSession {
    cfg: ScaleConfig,
    script: Vec<Step>,
    step_idx: usize,
    tick: u32,
    seq: i64,
    started_ms: i64,
    rng: Rng,
    loop_session: bool,
    repeat_samples: Vec<f64>,
}

impl TestSession {
    pub fn new(cfg: ScaleConfig, loop_session: bool) -> Self {
        let cfg = normalize_config(cfg);
        let script = build_script(&cfg);
        let started_ms = now_ms();
        Self {
            cfg,
            script,
            step_idx: 0,
            tick: 0,
            seq: 0,
            started_ms,
            rng: Rng(0x2545_F491_4F6C_DD1D ^ started_ms as u64),
            loop_session,
            repeat_samples: Vec::new(),
        }
    }

    fn reset(&mut self) {
        self.step_idx = 0;
        self.tick = 0;
        self.started_ms = now_ms();
        self.repeat_samples.clear();
    }

    /// Advance the scripted OIML R 76 session by one tick and produce a frame.
    pub fn next_frame(&mut self) -> Option<WeighingFrame> {
        if self.step_idx >= self.script.len() {
            if self.loop_session {
                self.reset();
            } else {
                return None;
            }
        }

        let e = self.cfg.verification_interval;
        let d = self.cfg.actual_interval;
        let step = &self.script[self.step_idx];
        let phase = step.phase;
        let reference = step.reference_load;
        let corner = step.corner;
        let voltage = step.voltage_v;
        let tare = step.tare;
        let label = step.label.clone();
        let point_index = step.point_index;
        let ticks = step.ticks;
        let settle_ticks = step.settle_ticks;
        let injected_error_e = step.error_e;
        let base_note = step.note.clone();

        self.tick += 1;
        let stable = self.tick > settle_ticks;
        let noise_amp = if stable { 0.15 * d } else { 2.0 * d };
        let noise = self.rng.centered() * noise_amp;

        // Quantise to the actual scale interval d, as a real NAWI would.
        let indicated = quantize(reference + injected_error_e * e + noise, d);
        let error_e = (indicated - reference) / e;
        let load_in_e = (reference / e).max(0.0);
        let mpe = mpe_e(self.cfg.accuracy_class, load_in_e);
        let compliant = error_e.abs() <= mpe + 1e-9;

        let mut note = base_note;
        if phase == TestPhase::Repeatability
            && point_index >= 2
            && self.repeat_samples.len() >= 2
        {
            let mut all = self.repeat_samples.clone();
            all.push(indicated);
            let min = all.iter().cloned().fold(f64::INFINITY, f64::min);
            let max = all.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
            let dev = (max - min) / e;
            note = format!("Repeatability deviation {dev:.3}e within 0.5e (R 76 §5.6)");
        }

        let frame = WeighingFrame {
            sequence: self.seq,
            timestamp_ms: now_ms(),
            phase: phase as i32,
            load_point: Some(crate::nawi::LoadPoint {
                label,
                reference_load: reference,
                load_in_e: reference / e,
                point_index,
            }),
            corner: corner as i32,
            gross: indicated,
            tare,
            net: quantize(indicated - tare, d),
            stable,
            zero_offset: self.rng.centered() * 0.2 * d,
            temperature_c: 23.0 + self.rng.centered() * 0.4,
            humidity_rh: 50.0 + self.rng.centered() * 3.0,
            supply_voltage_v: if voltage > 0.0 {
                voltage + self.rng.centered() * 1.5
            } else {
                230.0 + self.rng.centered() * 2.0
            },
            indicated_error_e: error_e,
            max_permissible_error_e: mpe,
            e_compliant: compliant,
            config: Some(self.cfg.clone()),
            note,
        };

        self.seq += 1;

        if self.tick >= ticks {
            if phase == TestPhase::Repeatability && stable {
                self.repeat_samples.push(indicated);
            }
            self.step_idx += 1;
            self.tick = 0;
        }

        Some(frame)
    }
}

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}
