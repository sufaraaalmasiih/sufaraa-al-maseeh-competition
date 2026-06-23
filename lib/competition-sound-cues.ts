"use client";

/**
 * مؤثّرات صوتية للمسابقة — مولّدة برمجياً عبر Web Audio API (بلا ملفات صوت ولا
 * استضافة ولا كلفة Firestore، وتعمل أوفلاين). تُستخدم على شاشتي الجمهور والمتسابق.
 *
 * سياسة المتصفّح تمنع تشغيل الصوت قبل تفاعل المستخدم — لذا نفكّ القفل عند أول
 * نقرة/ضغطة مفتاح عبر bindAudioUnlock، وزر الصوت نفسه يكفي كتفاعل.
 */

const MUTE_STORAGE_KEY = "sufaraa:sound-muted";

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;
let unlockBound = false;
let uiClickBound = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    if (!audioContext) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) {
        return null;
      }
      audioContext = new Ctor();
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0.88;

      compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 12;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.006;
      compressor.release.value = 0.14;

      masterGain.connect(compressor).connect(audioContext.destination);
    }
    return audioContext;
  } catch {
    return null;
  }
}

function getMasterGain(context: AudioContext): GainNode {
  if (!masterGain) {
    masterGain = context.createGain();
    masterGain.gain.value = 0.88;
    if (compressor) {
      masterGain.connect(compressor);
    } else {
      masterGain.connect(context.destination);
    }
  }
  return masterGain;
}

function ensureRunning(context: AudioContext): void {
  if (context.state === "suspended") {
    void context.resume().catch(() => {});
  }
}

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, muted ? "1" : "0");
  } catch {
    // تجاهل — وضع التصفّح الخاص قد يمنع التخزين.
  }
  if (!muted) {
    unlockAudio();
  }
}

export function unlockAudio(): void {
  const context = getAudioContext();
  if (context) {
    ensureRunning(context);
  }
}

/** يفكّ قفل الصوت عند أول تفاعل للمستخدم (مرّة واحدة لكل صفحة). */
export function bindAudioUnlock(): void {
  if (unlockBound || typeof window === "undefined") {
    return;
  }
  unlockBound = true;
  const handler = () => unlockAudio();
  window.addEventListener("pointerdown", handler, { passive: true });
  window.addEventListener("keydown", handler, { passive: true });
}

/** مؤثر نقرة خفيف عند ضغط الأزرار والعناصر التفاعلية. */
export function bindUiClickSounds(): void {
  if (uiClickBound || typeof window === "undefined") {
    return;
  }
  uiClickBound = true;

  window.addEventListener(
    "pointerdown",
    (event) => {
      if (isSoundMuted()) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const interactive = target.closest(
        [
          "button:not(:disabled)",
          "[role='button']:not([aria-disabled='true'])",
          "a[href]",
          ".facilitator-btn:not(:disabled)",
          ".facilitator-dock__item",
          "[data-ui-click-sound]",
        ].join(", "),
      );
      if (!interactive) {
        return;
      }
      if (interactive.closest("[data-sound='off']")) {
        return;
      }
      unlockAudio();
      playCue("click");
    },
    { capture: true, passive: true },
  );
}

interface Tone {
  freq: number;
  start: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  freqEnd?: number;
  pan?: number;
  filterFreq?: number;
  filterEnd?: number;
}

function connectWithPan(
  context: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  pan = 0,
): void {
  if (Math.abs(pan) < 0.01) {
    source.connect(destination);
    return;
  }
  const panner = context.createStereoPanner();
  panner.pan.value = Math.max(-1, Math.min(1, pan));
  source.connect(panner).connect(destination);
}

function scheduleNoiseBurst(
  start: number,
  dur: number,
  gain = 0.06,
  filter: BiquadFilterType = "highpass",
  filterFreq = 2_400,
): void {
  const context = getAudioContext();
  if (!context || context.state !== "running") {
    return;
  }
  const bufferSize = Math.max(1, Math.floor(context.sampleRate * dur));
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < bufferSize; index += 1) {
    const decay = 1 - index / bufferSize;
    data[index] = (Math.random() * 2 - 1) * decay * decay;
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filterNode = context.createBiquadFilter();
  filterNode.type = filter;
  filterNode.frequency.value = filterFreq;
  const gainNode = context.createGain();
  const startAt = context.currentTime + start;
  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(gain, startAt + 0.004);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
  source.connect(filterNode).connect(gainNode).connect(getMasterGain(context));
  source.start(startAt);
  source.stop(startAt + dur + 0.02);
}

function scheduleBell(
  freq: number,
  start: number,
  dur: number,
  gain = 0.18,
  pan = 0,
): void {
  const partials = [
    { ratio: 1, weight: 1 },
    { ratio: 2.38, weight: 0.52 },
    { ratio: 3.92, weight: 0.28 },
    { ratio: 5.18, weight: 0.14 },
  ];

  for (const partial of partials) {
    schedule([
      {
        freq: freq * partial.ratio,
        start,
        dur,
        type: "sine",
        gain: gain * partial.weight,
        pan,
        filterFreq: freq * 5.5,
        filterEnd: Math.max(120, freq * 0.9),
      },
    ]);
  }

  schedule([
    {
      freq: Math.max(60, freq * 0.5),
      start,
      dur: dur * 1.15,
      type: "sine",
      gain: gain * 0.35,
      pan,
      filterFreq: 280,
      filterEnd: 90,
    },
  ]);
}

function scheduleWoodBlock(start: number, freq: number, gain = 0.09, pan = 0): void {
  schedule([
    { freq, start, dur: 0.028, type: "sine", gain, pan },
    { freq: freq * 1.6, start: start + 0.004, dur: 0.02, type: "triangle", gain: gain * 0.45, pan },
  ]);
  scheduleNoiseBurst(start, 0.014, gain * 0.22, "bandpass", freq * 2.8);
}

function scheduleReverbTap(start: number, freq: number, dur: number, gain = 0.08, pan = 0): void {
  schedule([
    {
      freq,
      start,
      dur,
      type: "sine",
      gain,
      pan,
      filterFreq: 900,
      filterEnd: 400,
    },
  ]);
}

function schedule(tones: Tone[]): void {
  const context = getAudioContext();
  if (!context || context.state !== "running") {
    return;
  }
  const now = context.currentTime;
  const destination = getMasterGain(context);

  for (const tone of tones) {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = tone.type ?? "sine";
    oscillator.frequency.setValueAtTime(tone.freq, now + tone.start);
    if (tone.freqEnd) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(40, tone.freqEnd),
        now + tone.start + tone.dur,
      );
    }

    const peak = tone.gain ?? 0.15;
    const startAt = now + tone.start;
    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(peak, startAt + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + tone.dur);

    let output: AudioNode = gainNode;
    if (tone.filterFreq) {
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(tone.filterFreq, startAt);
      if (tone.filterEnd) {
        filter.frequency.exponentialRampToValueAtTime(
          Math.max(80, tone.filterEnd),
          startAt + tone.dur,
        );
      }
      oscillator.connect(filter).connect(gainNode);
      output = gainNode;
    } else {
      oscillator.connect(gainNode);
    }

    connectWithPan(context, output, destination, tone.pan ?? 0);
    oscillator.start(startAt);
    oscillator.stop(startAt + tone.dur + 0.05);
  }
}

export type SoundCue =
  | "click"
  | "tick"
  | "tick_urgent"
  | "timeup"
  | "correct"
  | "wrong"
  | "reveal"
  | "drumroll"
  | "suspense"
  | "stage_intro"
  | "swoosh"
  | "objection"
  | "fanfare"
  | "celebrate"
  | "podium";

export function playCue(cue: SoundCue): void {
  if (isSoundMuted()) {
    return;
  }
  const context = getAudioContext();
  if (!context) {
    return;
  }
  ensureRunning(context);

  switch (cue) {
    case "click":
      schedule([
        { freq: 1_180, start: 0, dur: 0.022, type: "sine", gain: 0.055, pan: 0.06 },
        { freq: 820, start: 0.008, dur: 0.03, type: "triangle", gain: 0.04, pan: -0.05 },
      ]);
      scheduleNoiseBurst(0, 0.012, 0.01, "highpass", 5_200);
      break;
    case "tick":
      scheduleWoodBlock(0, 1_160, 0.075, -0.08);
      break;

    case "tick_urgent":
      scheduleWoodBlock(0, 1_320, 0.085, -0.12);
      scheduleWoodBlock(0.09, 1_180, 0.08, 0.1);
      break;

    case "timeup":
      scheduleBell(988, 0, 0.42, 0.2, -0.18);
      scheduleBell(784, 0.18, 0.48, 0.22, 0.12);
      scheduleBell(523, 0.42, 1.05, 0.24, 0);
      schedule([
        {
          freq: 196,
          start: 0.42,
          dur: 1.15,
          type: "sine",
          gain: 0.1,
          filterFreq: 420,
          filterEnd: 110,
        },
      ]);
      scheduleNoiseBurst(0.42, 0.12, 0.018, "lowpass", 520);
      break;

    case "correct":
      schedule([
        { freq: 392, start: 0, dur: 0.09, type: "triangle", gain: 0.14, pan: -0.15 },
        { freq: 494, start: 0.07, dur: 0.1, type: "triangle", gain: 0.15 },
        { freq: 587, start: 0.14, dur: 0.12, type: "triangle", gain: 0.16, pan: 0.1 },
        { freq: 784, start: 0.22, dur: 0.28, type: "sine", gain: 0.19 },
        { freq: 988, start: 0.3, dur: 0.24, type: "sine", gain: 0.13, pan: 0.2 },
        { freq: 1_175, start: 0.38, dur: 0.32, type: "triangle", gain: 0.1 },
      ]);
      scheduleReverbTap(0.24, 1_566, 0.35, 0.06, 0.3);
      scheduleNoiseBurst(0.22, 0.05, 0.028, "highpass", 4_000);
      break;

    case "wrong":
      schedule([
        { freq: 233, start: 0, dur: 0.16, type: "sawtooth", gain: 0.11, freqEnd: 155, pan: -0.2 },
        { freq: 185, start: 0.12, dur: 0.22, type: "square", gain: 0.1 },
        { freq: 117, start: 0.24, dur: 0.38, type: "triangle", gain: 0.15 },
        { freq: 87, start: 0.34, dur: 0.45, type: "sine", gain: 0.12, pan: 0.15 },
      ]);
      scheduleNoiseBurst(0, 0.16, 0.075, "lowpass", 1_200);
      break;

    case "reveal":
      schedule([
        { freq: 220, start: 0, dur: 0.35, type: "sine", gain: 0.08, freqEnd: 440, pan: -0.35 },
        { freq: 330, start: 0.2, dur: 0.3, type: "triangle", gain: 0.1, freqEnd: 660 },
        { freq: 523, start: 0.38, dur: 0.22, type: "sine", gain: 0.14, pan: 0.25 },
        { freq: 784, start: 0.52, dur: 0.35, type: "triangle", gain: 0.16 },
      ]);
      scheduleNoiseBurst(0.5, 0.08, 0.035, "bandpass", 2_600);
      scheduleReverbTap(0.52, 988, 0.4, 0.07, 0.4);
      break;

    case "drumroll":
      for (let hit = 0; hit < 12; hit += 1) {
        const t = hit * 0.07;
        schedule([
          {
            freq: 90 + hit * 4,
            start: t,
            dur: 0.06,
            type: "triangle",
            gain: 0.08 + hit * 0.004,
            pan: hit % 2 === 0 ? -0.3 : 0.3,
          },
        ]);
        scheduleNoiseBurst(t, 0.04, 0.025 + hit * 0.002, "lowpass", 600 + hit * 40);
      }
      schedule([
        { freq: 196, start: 0.84, dur: 0.35, type: "sine", gain: 0.2 },
        { freq: 392, start: 0.88, dur: 0.4, type: "triangle", gain: 0.16 },
      ]);
      break;

    case "suspense":
      schedule([
        { freq: 130, start: 0, dur: 0.8, type: "sine", gain: 0.09, pan: -0.4 },
        { freq: 138, start: 0, dur: 0.8, type: "sine", gain: 0.09, pan: 0.4 },
        { freq: 174, start: 0.15, dur: 0.7, type: "triangle", gain: 0.07 },
        { freq: 207, start: 0.3, dur: 0.65, type: "sine", gain: 0.06, freqEnd: 260 },
      ]);
      scheduleNoiseBurst(0.2, 0.5, 0.02, "bandpass", 500);
      break;

    case "stage_intro":
      schedule([
        { freq: 262, start: 0, dur: 0.14, type: "triangle", gain: 0.12, pan: -0.2 },
        { freq: 330, start: 0.1, dur: 0.14, type: "triangle", gain: 0.13 },
        { freq: 392, start: 0.2, dur: 0.14, type: "triangle", gain: 0.14, pan: 0.15 },
        { freq: 523, start: 0.3, dur: 0.22, type: "sine", gain: 0.16 },
        { freq: 659, start: 0.42, dur: 0.35, type: "sine", gain: 0.14, pan: 0.25 },
      ]);
      scheduleNoiseBurst(0.42, 0.06, 0.03, "highpass", 3_500);
      break;

    case "swoosh":
      schedule([
        {
          freq: 1_800,
          start: 0,
          dur: 0.28,
          type: "sine",
          gain: 0.07,
          freqEnd: 280,
          filterFreq: 4_000,
          filterEnd: 400,
          pan: -0.5,
        },
        {
          freq: 1_600,
          start: 0.05,
          dur: 0.3,
          type: "triangle",
          gain: 0.06,
          freqEnd: 320,
          filterFreq: 3_500,
          filterEnd: 500,
          pan: 0.5,
        },
      ]);
      scheduleNoiseBurst(0, 0.22, 0.05, "bandpass", 2_000);
      break;

    case "objection":
      schedule([
        { freq: 740, start: 0, dur: 0.12, type: "triangle", gain: 0.12 },
        { freq: 880, start: 0.1, dur: 0.14, type: "sine", gain: 0.13, pan: 0.2 },
        { freq: 988, start: 0.22, dur: 0.18, type: "triangle", gain: 0.14 },
        { freq: 1_175, start: 0.34, dur: 0.28, type: "sine", gain: 0.12, pan: -0.15 },
      ]);
      scheduleNoiseBurst(0.34, 0.05, 0.025, "highpass", 3_800);
      break;

    case "fanfare":
      schedule([
        { freq: 392, start: 0, dur: 0.16, type: "triangle", gain: 0.15, pan: -0.3 },
        { freq: 494, start: 0.12, dur: 0.16, type: "triangle", gain: 0.16 },
        { freq: 587, start: 0.24, dur: 0.18, type: "sine", gain: 0.17, pan: 0.25 },
        { freq: 784, start: 0.36, dur: 0.22, type: "triangle", gain: 0.18 },
        { freq: 988, start: 0.48, dur: 0.28, type: "sine", gain: 0.2 },
        { freq: 1_175, start: 0.58, dur: 0.32, type: "triangle", gain: 0.18, pan: 0.35 },
        { freq: 1_566, start: 0.72, dur: 0.45, type: "sine", gain: 0.2 },
      ]);
      scheduleNoiseBurst(0.72, 0.1, 0.04, "bandpass", 2_800);
      scheduleReverbTap(0.48, 1_318, 0.5, 0.08, 0.4);
      break;

    case "celebrate":
      schedule([
        { freq: 523, start: 0, dur: 0.11, type: "triangle", gain: 0.16, pan: -0.25 },
        { freq: 659, start: 0.09, dur: 0.11, type: "triangle", gain: 0.17 },
        { freq: 784, start: 0.18, dur: 0.13, type: "triangle", gain: 0.18, pan: 0.2 },
        { freq: 988, start: 0.28, dur: 0.15, type: "sine", gain: 0.2 },
        { freq: 1_175, start: 0.4, dur: 0.17, type: "sine", gain: 0.2, pan: 0.3 },
        { freq: 1_566, start: 0.54, dur: 0.4, type: "triangle", gain: 0.22 },
        { freq: 1_975, start: 0.68, dur: 0.38, type: "sine", gain: 0.15, pan: -0.2 },
        { freq: 2_349, start: 0.8, dur: 0.35, type: "triangle", gain: 0.12 },
      ]);
      scheduleNoiseBurst(0.54, 0.12, 0.045, "highpass", 3_200);
      scheduleNoiseBurst(0.8, 0.1, 0.035, "bandpass", 4_500);
      scheduleReverbTap(0.68, 2_640, 0.45, 0.07, 0.5);
      break;

    case "podium":
      schedule([
        { freq: 262, start: 0, dur: 0.2, type: "triangle", gain: 0.14 },
        { freq: 330, start: 0.15, dur: 0.2, type: "triangle", gain: 0.15, pan: -0.2 },
        { freq: 392, start: 0.28, dur: 0.22, type: "sine", gain: 0.16 },
        { freq: 523, start: 0.4, dur: 0.25, type: "triangle", gain: 0.18, pan: 0.2 },
        { freq: 659, start: 0.52, dur: 0.3, type: "sine", gain: 0.2 },
        { freq: 784, start: 0.64, dur: 0.35, type: "triangle", gain: 0.2, pan: 0.3 },
        { freq: 988, start: 0.76, dur: 0.4, type: "sine", gain: 0.22 },
        { freq: 1_175, start: 0.9, dur: 0.5, type: "triangle", gain: 0.2 },
        { freq: 1_566, start: 1.05, dur: 0.55, type: "sine", gain: 0.24 },
      ]);
      for (let burst = 0; burst < 4; burst += 1) {
        scheduleNoiseBurst(0.5 + burst * 0.18, 0.08, 0.035, "bandpass", 2_400 + burst * 400);
      }
      scheduleReverbTap(1.05, 2_094, 0.6, 0.1, 0);
      break;
  }
}
