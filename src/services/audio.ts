import { createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync, type AudioPlayer } from 'expo-audio';
import { AppState, type AppStateStatus, Platform } from 'react-native';

import type { MusicId } from '@/src/theme/themes';
import { getStyle } from '@/src/theme/styles';
import { useGame } from '@/src/store/gameStore';

const sfxFiles = {
  tap: require('../../assets/sounds/tap.wav'),
  tick: require('../../assets/sounds/tick.wav'),
  stop: require('../../assets/sounds/stop.wav'),
  spin: require('../../assets/sounds/spin.wav'),
  win: require('../../assets/sounds/win.wav'),
  bigwin: require('../../assets/sounds/bigwin.wav'),
  megawin: require('../../assets/sounds/megawin.wav'),
  fanfare: require('../../assets/sounds/fanfare.wav'),
  coin: require('../../assets/sounds/coin.wav'),
  scratch: require('../../assets/sounds/scratch.wav'),
  ball: require('../../assets/sounds/ball.wav'),
  unlock: require('../../assets/sounds/unlock.wav'),
  whoosh: require('../../assets/sounds/whoosh.wav'),
} as const;

const musicFiles: Record<MusicId, number> = {
  velvet: require('../../assets/sounds/velvet.wav'),
  midnight: require('../../assets/sounds/midnight.wav'),
  sunset: require('../../assets/sounds/sunset.wav'),
  neon: require('../../assets/sounds/neon.wav'),
  pharaoh: require('../../assets/sounds/pharaoh.wav'),
  dragon: require('../../assets/sounds/dragon.wav'),
  ocean: require('../../assets/sounds/ocean.wav'),
  cosmos: require('../../assets/sounds/cosmos.wav'),
  diamond: require('../../assets/sounds/diamond.wav'),
};

export type SfxName = keyof typeof sfxFiles;

const sfxPlayers = new Map<SfxName, AudioPlayer>();
const celebrationTimers = new Set<ReturnType<typeof setTimeout>>();
const webContexts = new Set<AudioContext>();
const suspendedContexts = new Set<AudioContext>();

let musicPlayer: AudioPlayer | null = null;
let musicTrack: MusicId | null = null;
let desiredMusicEnabled = false;
let audioReady = false;
let scratchAt = 0;
let hidden = false;
let resumeMusic = false;
let stopLifecycle: (() => void) | null = null;
let webAudioTracked = false;
let wantAudioActive = true;
let audioActiveSeq = 0;

installWebAudioTracking();

async function ensureAudio(): Promise<void> {
  if (audioReady) return;
  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'mixWithOthers',
    shouldPlayInBackground: false,
  });
  audioReady = true;
}

function flavored(name: SfxName): SfxName {
  const style = getStyle(useGame.getState().save.activeStyle);
  if (name === 'win' || name === 'bigwin' || name === 'megawin') return style.winCue;
  if (name === 'spin') return style.spinCue;
  return name;
}

const CELEBRATION: SfxName[][] = [
  ['coin'],
  ['coin', 'win'],
  ['win', 'coin'],
  ['fanfare', 'coin'],
  ['fanfare', 'bigwin'],
  ['megawin', 'fanfare', 'coin'],
];

export function playCelebration(tier: number): void {
  if (hidden) return;
  const cues = CELEBRATION[Math.max(0, Math.min(CELEBRATION.length - 1, tier))] ?? CELEBRATION[0];
  cues.forEach((cue, index) => {
    const timer = setTimeout(() => {
      celebrationTimers.delete(timer);
      void playSfx(cue);
    }, index * 160);
    celebrationTimers.add(timer);
  });
}

export async function playSfx(name: SfxName): Promise<void> {
  if (hidden || !useGame.getState().save.settings.sound) return;
  const cue = flavored(name);
  try {
    await ensureAudio();
    if (hidden || !useGame.getState().save.settings.sound) return;
    let player = sfxPlayers.get(cue);
    if (!player) {
      player = createAudioPlayer(sfxFiles[cue]);
      if (Platform.OS !== 'web') player.volume = cue === 'scratch' ? 0.35 : 0.8;
      sfxPlayers.set(cue, player);
    }
    if (hidden) return;
    await player.seekTo(0);
    if (hidden) return;
    player.play();
  } catch {
    // Audio is decorative. A failed cue should never block a spin.
  }
}

export function playScratch(): void {
  const now = Date.now();
  if (now - scratchAt < 90) return;
  scratchAt = now;
  void playSfx('scratch');
}

export async function syncMusic(track: MusicId, enabled: boolean): Promise<void> {
  desiredMusicEnabled = enabled;
  if (!enabled) resumeMusic = false;
  try {
    await ensureAudio();
    if (!enabled) {
      musicPlayer?.pause();
      return;
    }
    if (!musicPlayer || musicTrack !== track) {
      musicPlayer?.remove();
      musicPlayer = createAudioPlayer(musicFiles[track]);
      musicPlayer.loop = true;
      if (Platform.OS !== 'web') musicPlayer.volume = 0.28;
      musicTrack = track;
    }
    if (hidden) {
      resumeMusic = true;
      musicPlayer.pause();
      return;
    }
    if (!musicPlayer.playing) musicPlayer.play();
  } catch {
    // Music is optional.
  }
}

export function startAudioLifecycle(): () => void {
  if (stopLifecycle) return stopLifecycle;

  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden' || document.hidden) {
        pauseForBackground();
      } else {
        resumeFromBackground();
      }
    };
    const onHide = () => pauseForBackground();
    const onShow = () => resumeFromBackground();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('pageshow', onShow);
    window.addEventListener('blur', onHide);
    window.addEventListener('focus', onShow);
    if (document.visibilityState === 'hidden' || document.hidden) {
      pauseForBackground();
    }
    stopLifecycle = () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('pageshow', onShow);
      window.removeEventListener('blur', onHide);
      window.removeEventListener('focus', onShow);
      stopLifecycle = null;
    };
  } else {
    const onChange = (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') pauseForBackground();
      else if (next === 'active') resumeFromBackground();
    };
    const subscription = AppState.addEventListener('change', onChange);
    if (AppState.currentState === 'background' || AppState.currentState === 'inactive') {
      pauseForBackground();
    }
    stopLifecycle = () => {
      subscription.remove();
      stopLifecycle = null;
    };
  }

  return stopLifecycle;
}

function pauseForBackground(): void {
  if (hidden) return;
  hidden = true;
  resumeMusic = Boolean(desiredMusicEnabled && (musicPlayer?.playing || resumeMusic));
  musicPlayer?.pause();
  for (const timer of celebrationTimers) clearTimeout(timer);
  celebrationTimers.clear();
  for (const player of sfxPlayers.values()) {
    try {
      player.pause();
    } catch {
      try {
        player.muted = true;
      } catch {
        // Best-effort silence if a cue cannot be paused.
      }
    }
  }
  suspendWebAudio();
  void setAudioActive(false);
}

function resumeFromBackground(): void {
  if (!hidden) return;
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    if (document.visibilityState === 'hidden' || document.hidden) return;
  } else if (AppState.currentState === 'background' || AppState.currentState === 'inactive') {
    return;
  }
  hidden = false;
  void (async () => {
    await setAudioActive(true);
    if (hidden) return;
    for (const player of sfxPlayers.values()) {
      try {
        player.pause();
        player.muted = false;
      } catch {
        // Leave a stuck cue alone rather than let it blurt out on return.
      }
    }
    resumeWebAudio();
    const settings = useGame.getState().save.settings;
    if (resumeMusic && settings.music && musicTrack) {
      void syncMusic(musicTrack, true);
    }
  })();
}

async function setAudioActive(active: boolean): Promise<void> {
  wantAudioActive = active;
  const seq = ++audioActiveSeq;
  try {
    await setIsAudioActiveAsync(active);
    if (seq !== audioActiveSeq) {
      await setIsAudioActiveAsync(wantAudioActive);
    }
  } catch {
    // Playback can still be paused or resumed through the players themselves.
  }
}

function installWebAudioTracking(): void {
  if (webAudioTracked || Platform.OS !== 'web' || typeof window === 'undefined') return;
  webAudioTracked = true;
  const root = window as unknown as Record<string, unknown>;
  for (const name of ['AudioContext', 'webkitAudioContext']) {
    const Original = root[name] as (new (...args: unknown[]) => AudioContext) | undefined;
    if (!Original || (Original as unknown as { __velvetTracked?: boolean }).__velvetTracked) continue;
    const Patched = function (this: unknown, ...args: unknown[]) {
      const ctx = new Original(...args);
      webContexts.add(ctx);
      return ctx;
    };
    Patched.prototype = Original.prototype;
    Object.setPrototypeOf(Patched, Original);
    (Patched as unknown as { __velvetTracked: boolean }).__velvetTracked = true;
    root[name] = Patched;
  }
}

function suspendWebAudio(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  document.querySelectorAll('audio').forEach((element) => {
    const audio = element as HTMLAudioElement;
    if (!audio.paused) audio.pause();
  });
  for (const ctx of webContexts) {
    if (ctx.state === 'running') {
      suspendedContexts.add(ctx);
      void ctx.suspend().catch(() => undefined);
    }
  }
}

function resumeWebAudio(): void {
  for (const ctx of suspendedContexts) {
    if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
  }
  suspendedContexts.clear();
}
