import { wedding } from '@/content/wedding';

/**
 * Background music. It starts when the guest opens the envelope (a tap, which browsers require
 * before playing sound), fades in, loops, and pauses while the page is hidden. The guest can mute
 * it from the cover or the dock; the choice is remembered. If the file is missing, `available`
 * turns false and the buttons hide.
 */
const MUTE_KEY = 'music-muted';
const VOLUME = 0.6;
const FADE_MS = 1200;

type State = { available: boolean; muted: boolean; playing: boolean };
const listeners = new Set<(s: State) => void>();
let audio: HTMLAudioElement | null = null;
let started = false;
let fade = 0;
const state: State = { available: Boolean(wedding.settings.music), muted: false, playing: false };

const emit = () => listeners.forEach((fn) => fn({ ...state }));

function load(): HTMLAudioElement | null {
  if (audio || !state.available || typeof window === 'undefined') return audio;
  try { state.muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { /* storage blocked */ }
  audio = new Audio(wedding.settings.music);
  audio.loop = true;
  audio.preload = 'metadata';
  audio.volume = 0;
  audio.addEventListener('error', () => { state.available = false; state.playing = false; emit(); });
  audio.addEventListener('playing', () => { state.playing = true; emit(); });
  audio.addEventListener('pause', () => { state.playing = false; emit(); });
  document.addEventListener('visibilitychange', () => {
    if (!audio || !started || state.muted) return;
    if (document.hidden) audio.pause();
    else void play();
  });
  return audio;
}

/** Eases the volume to `to`, then calls `done`. */
function ramp(to: number, done?: () => void) {
  if (!audio) return;
  cancelAnimationFrame(fade);
  const from = audio.volume;
  const t0 = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / FADE_MS);
    audio!.volume = from + (to - from) * t;
    if (t < 1) fade = requestAnimationFrame(step);
    else done?.();
  };
  fade = requestAnimationFrame(step);
}

async function play() {
  if (!audio) return;
  try {
    await audio.play();
    ramp(VOLUME);
  } catch { /* blocked or missing; the error handler hides the buttons if it's missing */ }
}

export const music = {
  /** Current state, and every change after. Returns an unsubscribe function. */
  subscribe(fn: (s: State) => void): () => void {
    load();
    listeners.add(fn);
    fn({ ...state });
    return () => listeners.delete(fn);
  },
  /** Call from the tap that opens the invitation. */
  start(): void {
    if (!load()) return;
    started = true;
    if (!state.muted) void play();
  },
  toggle(): void {
    if (!load()) return;
    state.muted = !state.muted;
    try { localStorage.setItem(MUTE_KEY, state.muted ? '1' : '0'); } catch { /* storage blocked */ }
    if (state.muted) ramp(0, () => audio?.pause());
    else if (started) void play();
    emit();
  },
};
