"use client";

/**
 * مؤثّرات صوتية للمسابقة — Web Audio API بدون ملفات خارجية.
 * نغمات موسيقية ناعمة (جِرس، أرپيجيو، باد) بعيداً عن الموجات الحادة والضوضاء.
 */

const MUTE_STORAGE_KEY = "sufaraa:sound-muted";

/** تردّدات موسيقية (Hz) — سلم دو الكبير */
const N = {
  G2: 98,
  A2: 110,
  C3: 130.81,
  E3: 164.81,
  G3: 196,
  A3: 220,
  C4: 261.63,
  E4: 329.63,
  F4: 349.23,
  G4: 392,
  A4: 440,
  B4: 493.88,
  D5: 587.33,
  C5: 523.25,
  E5: 659.25,
  G5: 783.99,
  A5: 880,
  B5: 987.77,
  C6: 1046.5,
  D6: 1174.66,
  E6: 1318.51,
  G6: 1567.98,
} as const;

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let masterFilter: BiquadFilterNode | null = null;
let compressor: DynamicsCompressorNode | null = null;
let unlockBound = false;

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
      masterGain.gain.value = 0.72;

      masterFilter = audioContext.createBiquadFilter();
      masterFilter.type = "lowpass";
      masterFilter.frequency.value = 11_500;
      masterFilter.Q.value = 0.6;

      compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -22;
      compressor.knee.value = 18;
      compressor.ratio.value = 2.5;
      compressor.attack.value = 0.008;
      compressor.release.value = 0.18;

      masterGain.connect(masterFilter).connect(compressor).connect(audioContext.destination);
    }
    return audioContext;
  } catch {
    return null;
  }
}

function getMasterGain(context: AudioContext): GainNode {
  if (!masterGain) {
    masterGain = context.createGain();
    masterGain.gain.value = 0.72;
    if (masterFilter && compressor) {
      masterGain.connect(masterFilter).connect(compressor).connect(context.destination);
    } else {
      masterGain.connect(context.destination);
    }
  }
  return masterGain;
}

async function ensureContextReady(): Promise<AudioContext | null> {
  const context = getAudioContext();
  if (!context) {
    return null;
  }
  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      // جدولة النغمات تعمل حتى لو بقي معلّقاً مؤقتاً.
    }
  }
  return context;
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
    // تجاهل
  }
  if (!muted) {
    void unlockAudio();
  }
}

export async function unlockAudio(): Promise<void> {
  await ensureContextReady();
}

export function bindAudioUnlock(): void {
  if (unlockBound || typeof window === "undefined") {
    return;
  }
  unlockBound = true;
  const handler = () => {
    void unlockAudio();
  };
  window.addEventListener("pointerdown", handler, { passive: true });
  window.addEventListener("keydown", handler, { passive: true });
}

/** مؤثر نقرة — معطّل افتراضياً (كان يُشعِر بكل ضغطة زر). */
export function bindUiClickSounds(): void {
  // عُطّل عمداً: مؤثرات المسابقة فقط (مؤقت، إعلان، نتائج).
}

interface NoteSpec {
  freq: number;
  at?: number;
  attack?: number;
  hold?: number;
  decay?: number;
  gain?: number;
  pan?: number;
  type?: OscillatorType;
  filterHz?: number;
  freqEnd?: number;
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

function playNote(context: AudioContext, spec: NoteSpec): void {
  const at = spec.at ?? 0;
  const attack = spec.attack ?? 0.006;
  const hold = spec.hold ?? 0.05;
  const decay = spec.decay ?? 0.28;
  const peak = spec.gain ?? 0.11;
  const now = context.currentTime;
  const start = now + at;
  const end = start + attack + hold + decay;

  const oscillator = context.createOscillator();
  oscillator.type = spec.type ?? "sine";
  oscillator.frequency.setValueAtTime(spec.freq, start);
  if (spec.freqEnd) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, spec.freqEnd), end);
  }

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = spec.filterHz ?? Math.min(9_000, spec.freq * 6);
  filter.Q.value = 0.5;

  const gainNode = context.createGain();
  gainNode.gain.setValueAtTime(0, start);
  gainNode.gain.linearRampToValueAtTime(peak, start + attack);
  gainNode.gain.setValueAtTime(peak * 0.82, start + attack + hold);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(filter).connect(gainNode);
  connectWithPan(context, gainNode, getMasterGain(context), spec.pan ?? 0);
  oscillator.start(start);
  oscillator.stop(end + 0.04);
}

function playGong(
  context: AudioContext,
  freq: number,
  at: number,
  decay: number,
  gain = 0.14,
  pan = 0,
): void {
  const partials = [
    { ratio: 1, weight: 1, decayMul: 1 },
    { ratio: 2.0, weight: 0.45, decayMul: 0.85 },
    { ratio: 3.0, weight: 0.22, decayMul: 0.7 },
    { ratio: 4.2, weight: 0.1, decayMul: 0.55 },
  ];

  for (const partial of partials) {
    playNote(context, {
      freq: freq * partial.ratio,
      at,
      attack: 0.003,
      hold: 0.02,
      decay: decay * partial.decayMul,
      gain: gain * partial.weight,
      pan,
      filterHz: freq * 4,
    });
  }

  playNote(context, {
    freq: freq * 0.5,
    at,
    attack: 0.004,
    hold: 0.03,
    decay: decay * 1.1,
    gain: gain * 0.28,
    pan,
    filterHz: 320,
  });
}

function playArpeggio(
  context: AudioContext,
  freqs: number[],
  startAt: number,
  step = 0.1,
  noteDecay = 0.35,
  gain = 0.1,
): void {
  freqs.forEach((freq, index) => {
    playNote(context, {
      freq,
      at: startAt + index * step,
      attack: 0.005,
      hold: 0.04,
      decay: noteDecay,
      gain: gain + index * 0.008,
      pan: index % 2 === 0 ? -0.12 : 0.12,
    });
  });
}

function playPad(
  context: AudioContext,
  freqs: number[],
  at: number,
  dur: number,
  gain = 0.05,
): void {
  for (const freq of freqs) {
    playNote(context, {
      freq,
      at,
      attack: 0.35,
      hold: dur * 0.5,
      decay: dur * 0.5,
      gain,
      type: "sine",
      filterHz: 1_800,
    });
  }
}

function playSweep(context: AudioContext, at: number, dur: number, gain = 0.045): void {
  playNote(context, {
    freq: 2_200,
    freqEnd: 280,
    at,
    attack: 0.01,
    hold: dur * 0.15,
    decay: dur * 0.85,
    gain,
    type: "sine",
    filterHz: 5_000,
    pan: -0.35,
  });
  playNote(context, {
    freq: 1_900,
    freqEnd: 320,
    at: at + 0.04,
    attack: 0.01,
    hold: dur * 0.12,
    decay: dur * 0.8,
    gain: gain * 0.75,
    type: "sine",
    filterHz: 4_500,
    pan: 0.35,
  });
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

async function playCueInternal(cue: SoundCue): Promise<void> {
  const context = await ensureContextReady();
  if (!context) {
    return;
  }

  switch (cue) {
    case "click":
      playNote(context, { freq: N.E5, at: 0, attack: 0.002, hold: 0.01, decay: 0.04, gain: 0.035 });
      break;

    case "tick":
      playNote(context, {
        freq: N.A5,
        at: 0,
        attack: 0.002,
        hold: 0.015,
        decay: 0.06,
        gain: 0.055,
        pan: -0.08,
      });
      break;

    case "tick_urgent":
      playNote(context, {
        freq: N.C6,
        at: 0,
        attack: 0.002,
        hold: 0.012,
        decay: 0.05,
        gain: 0.06,
        pan: -0.1,
      });
      playNote(context, {
        freq: N.A5,
        at: 0.09,
        attack: 0.002,
        hold: 0.012,
        decay: 0.05,
        gain: 0.055,
        pan: 0.1,
      });
      break;

    case "timeup":
      playNote(context, {
        freq: N.G5,
        at: 0,
        attack: 0.003,
        hold: 0.06,
        decay: 0.18,
        gain: 0.1,
        pan: -0.15,
      });
      playNote(context, {
        freq: N.G5,
        at: 0.2,
        attack: 0.003,
        hold: 0.06,
        decay: 0.18,
        gain: 0.1,
        pan: 0.15,
      });
      playGong(context, N.C4, 0.42, 1.2, 0.16);
      break;

    case "correct":
      playArpeggio(context, [N.C5, N.E5, N.G5, N.C6], 0, 0.09, 0.4, 0.09);
      playNote(context, {
        freq: N.E6,
        at: 0.38,
        attack: 0.008,
        hold: 0.08,
        decay: 0.45,
        gain: 0.08,
        pan: 0.2,
      });
      break;

    case "wrong":
      playArpeggio(context, [N.A4, N.F4, N.D5], 0, 0.14, 0.5, 0.08);
      playNote(context, {
        freq: N.A2,
        at: 0.1,
        attack: 0.01,
        hold: 0.1,
        decay: 0.55,
        gain: 0.07,
        filterHz: 400,
      });
      break;

    case "reveal":
      playArpeggio(context, [N.G4, N.B4, N.D5, N.G5], 0, 0.12, 0.42, 0.085);
      playGong(context, N.G4, 0.5, 0.65, 0.09, 0.1);
      break;

    case "drumroll":
      for (let hit = 0; hit < 10; hit += 1) {
        playNote(context, {
          freq: N.G2 + hit * 6,
          at: hit * 0.075,
          attack: 0.002,
          hold: 0.02,
          decay: 0.05,
          gain: 0.05 + hit * 0.003,
          pan: hit % 2 === 0 ? -0.25 : 0.25,
          filterHz: 500,
        });
      }
      playGong(context, N.C4, 0.78, 0.5, 0.12);
      break;

    case "suspense":
      playPad(context, [N.A3, N.E4], 0, 0.9, 0.045);
      playNote(context, {
        freq: N.A3,
        at: 0.2,
        attack: 0.4,
        hold: 0.2,
        decay: 0.35,
        gain: 0.04,
        filterHz: 900,
      });
      break;

    case "stage_intro":
      playArpeggio(context, [N.C4, N.E4, N.G4, N.C5, N.E5], 0, 0.11, 0.32, 0.085);
      break;

    case "swoosh":
      playSweep(context, 0, 0.32, 0.04);
      break;

    case "objection":
      playNote(context, { freq: N.G5, at: 0, attack: 0.004, hold: 0.05, decay: 0.2, gain: 0.09 });
      playNote(context, {
        freq: N.B5,
        at: 0.14,
        attack: 0.004,
        hold: 0.06,
        decay: 0.28,
        gain: 0.1,
        pan: 0.12,
      });
      break;

    case "fanfare":
      playArpeggio(context, [N.C4, N.E4, N.G4, N.C5, N.E5, N.G5], 0, 0.1, 0.28, 0.09);
      playGong(context, N.C5, 0.65, 0.55, 0.11);
      break;

    case "celebrate":
      playArpeggio(context, [N.G4, N.B4, N.D5, N.G5, N.B5, N.D6], 0, 0.08, 0.3, 0.09);
      playArpeggio(context, [N.C5, N.E5, N.G5, N.C6], 0.55, 0.07, 0.35, 0.085);
      break;

    case "podium":
      playArpeggio(context, [N.C4, N.E4, N.G4, N.C5, N.E5, N.G5, N.C6], 0, 0.13, 0.38, 0.09);
      playGong(context, N.C4, 0.95, 1.4, 0.14);
      playGong(context, N.G4, 1.15, 1.0, 0.1, -0.2);
      break;
  }
}

export function playCue(cue: SoundCue): void {
  if (isSoundMuted()) {
    return;
  }
  void playCueInternal(cue);
}
