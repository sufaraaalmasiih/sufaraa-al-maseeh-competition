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
    }
    return audioContext;
  } catch {
    return null;
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
  if (context && context.state === "suspended") {
    void context.resume().catch(() => {});
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

interface Tone {
  freq: number;
  start: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
}

function schedule(tones: Tone[]): void {
  const context = getAudioContext();
  if (!context || context.state !== "running") {
    return;
  }
  const now = context.currentTime;
  for (const tone of tones) {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = tone.type ?? "sine";
    oscillator.frequency.value = tone.freq;

    const peak = tone.gain ?? 0.15;
    const startAt = now + tone.start;
    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(peak, startAt + 0.012);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + tone.dur);

    oscillator.connect(gainNode).connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + tone.dur + 0.03);
  }
}

export type SoundCue = "tick" | "timeup" | "correct" | "wrong" | "celebrate";

export function playCue(cue: SoundCue): void {
  if (isSoundMuted()) {
    return;
  }
  const context = getAudioContext();
  if (!context) {
    return;
  }
  if (context.state === "suspended") {
    void context.resume().catch(() => {});
  }

  switch (cue) {
    case "tick":
      schedule([{ freq: 880, start: 0, dur: 0.08, type: "sine", gain: 0.12 }]);
      break;
    case "timeup":
      schedule([
        { freq: 660, start: 0, dur: 0.18, type: "triangle", gain: 0.2 },
        { freq: 440, start: 0.16, dur: 0.34, type: "triangle", gain: 0.2 },
      ]);
      break;
    case "correct":
      schedule([
        { freq: 523, start: 0, dur: 0.12, type: "triangle", gain: 0.18 },
        { freq: 784, start: 0.1, dur: 0.24, type: "triangle", gain: 0.18 },
      ]);
      break;
    case "wrong":
      schedule([{ freq: 160, start: 0, dur: 0.32, type: "square", gain: 0.13 }]);
      break;
    case "celebrate":
      schedule([
        { freq: 523, start: 0, dur: 0.14, type: "triangle", gain: 0.2 },
        { freq: 659, start: 0.12, dur: 0.14, type: "triangle", gain: 0.2 },
        { freq: 784, start: 0.24, dur: 0.14, type: "triangle", gain: 0.2 },
        { freq: 1047, start: 0.36, dur: 0.32, type: "triangle", gain: 0.22 },
      ]);
      break;
  }
}
