import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

import type { MusicId } from '@/src/theme/themes';
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
let musicPlayer: AudioPlayer | null = null;
let musicTrack: MusicId | null = null;
let audioReady = false;
let scratchAt = 0;

async function ensureAudio(): Promise<void> {
  if (audioReady) return;
  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'mixWithOthers',
    shouldPlayInBackground: false,
  });
  audioReady = true;
}

export async function playSfx(name: SfxName): Promise<void> {
  if (!useGame.getState().save.settings.sound) return;
  try {
    await ensureAudio();
    let player = sfxPlayers.get(name);
    if (!player) {
      player = createAudioPlayer(sfxFiles[name]);
      if (Platform.OS !== 'web') player.volume = name === 'scratch' ? 0.35 : 0.8;
      sfxPlayers.set(name, player);
    }
    await player.seekTo(0);
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
    if (!musicPlayer.playing) musicPlayer.play();
  } catch {
    // Music is optional.
  }
}
