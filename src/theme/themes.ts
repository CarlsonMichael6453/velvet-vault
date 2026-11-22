export type ThemeId = 'velvet' | 'midnight' | 'sunset' | 'neon' | 'pharaoh' | 'dragon' | 'ocean' | 'cosmos' | 'diamond' | 'hearth';

export type ParticleKind = 'dust' | 'neon' | 'sand' | 'ember' | 'bubble' | 'star' | 'sparkle' | 'warm' | 'snow' | 'petal' | 'bat';

export type WinStyle = 'classic' | 'neon' | 'gold' | 'dragon' | 'ocean' | 'cosmos' | 'diamond';

export type MusicId = 'velvet' | 'midnight' | 'sunset' | 'neon' | 'pharaoh' | 'dragon' | 'ocean' | 'cosmos' | 'diamond';

export type ThemeColors = {
  bg0: string;
  bg1: string;
  bg2: string;
  orb1: string;
  orb2: string;
  orb3: string;
  card: string;
  cardBorder: string;
  gold: string;
  goldDeep: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  danger: string;
  success: string;
  foil1: string;
  foil2: string;
  reel: string;
  ink: string;
};

export type Theme = {
  id: ThemeId;
  name: string;
  tagline: string;
  premium: boolean;
  coinPrice: number;
  iapProductId?: string;
  music: MusicId;
  particle: ParticleKind;
  winStyle: WinStyle;
  lavish: boolean;
  colors: ThemeColors;
};

const velvetColors: ThemeColors = {
  bg0: '#12060c',
  bg1: '#2a0d1c',
  bg2: '#4a1630',
  orb1: 'rgba(226, 59, 106, 0.45)',
  orb2: 'rgba(240, 215, 140, 0.28)',
  orb3: 'rgba(90, 16, 40, 0.5)',
  card: 'rgba(28, 10, 18, 0.9)',
  cardBorder: 'rgba(240, 215, 140, 0.32)',
  gold: '#f0d78c',
  goldDeep: '#b8892e',
  text: '#fbf6ea',
  muted: '#cbb8be',
  accent: '#e23b6a',
  accent2: '#ffb3c7',
  danger: '#ff6b6b',
  success: '#8ee0b0',
  foil1: '#efe6d4',
  foil2: '#8d7b68',
  reel: '#16080e',
  ink: '#2a1608',
};

export const THEMES: Theme[] = [
  {
    id: 'velvet',
    name: 'Velvet Classic',
    tagline: 'Burgundy, brass, and a quiet room.',
    premium: false,
    coinPrice: 0,
    music: 'velvet',
    particle: 'dust',
    winStyle: 'classic',
    lavish: false,
    colors: velvetColors,
  },
  {
    id: 'midnight',
    name: 'Midnight Lounge',
    tagline: 'Black lacquer and champagne gold.',
    premium: false,
    coinPrice: 0,
    music: 'midnight',
    particle: 'dust',
    winStyle: 'classic',
    lavish: false,
    colors: {
      ...velvetColors,
      bg0: '#07080d',
      bg1: '#12141c',
      bg2: '#222636',
      orb1: 'rgba(201, 163, 106, 0.28)',
      orb2: 'rgba(80, 90, 120, 0.35)',
      orb3: 'rgba(20, 22, 32, 0.2)',
      card: 'rgba(12, 14, 20, 0.9)',
      cardBorder: 'rgba(232, 214, 180, 0.28)',
      gold: '#f3e2b8',
      goldDeep: '#a78455',
      accent: '#e7c98a',
      accent2: '#f7efe0',
      foil1: '#e7e2d8',
      foil2: '#6e727c',
      reel: '#0c0e14',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset Strip',
    tagline: 'Coral neon and a warm sidewalk.',
    premium: false,
    coinPrice: 0,
    music: 'sunset',
    particle: 'warm',
    winStyle: 'gold',
    lavish: false,
    colors: {
      ...velvetColors,
      bg0: '#1c0c10',
      bg1: '#4a1c22',
      bg2: '#c2543a',
      orb1: 'rgba(255, 138, 91, 0.45)',
      orb2: 'rgba(255, 196, 120, 0.35)',
      orb3: 'rgba(120, 30, 40, 0.4)',
      card: 'rgba(40, 14, 16, 0.88)',
      gold: '#ffd7a1',
      goldDeep: '#d4843c',
      accent: '#ff8a5b',
      accent2: '#ffd0b0',
      foil1: '#ffe7cf',
      foil2: '#a36a48',
      reel: '#2a1010',
    },
  },
  {
    id: 'neon',
    name: 'Neon Vegas',
    tagline: 'Magenta, cyan, and a sign that hums.',
    premium: true,
    coinPrice: 15_000,
    iapProductId: 'theme.neon',
    music: 'neon',
    particle: 'neon',
    winStyle: 'neon',
    lavish: true,
    colors: {
      ...velvetColors,
      bg0: '#070014',
      bg1: '#16002e',
      bg2: '#2c0a52',
      orb1: 'rgba(255, 43, 214, 0.55)',
      orb2: 'rgba(41, 243, 255, 0.4)',
      orb3: 'rgba(255, 229, 106, 0.25)',
      card: 'rgba(10, 0, 24, 0.86)',
      cardBorder: 'rgba(41, 243, 255, 0.45)',
      gold: '#7af7ff',
      goldDeep: '#d16bff',
      text: '#f4fbff',
      muted: '#c9b6e6',
      accent: '#ff2bd6',
      accent2: '#29f3ff',
      foil1: '#f4e9ff',
      foil2: '#6a4d86',
      reel: '#0a0018',
      ink: '#140018',
    },
  },
  {
    id: 'pharaoh',
    name: "Pharaoh's Gold",
    tagline: 'Lapis, sand, and a heavier kind of gold.',
    premium: true,
    coinPrice: 27_000,
    iapProductId: 'theme.pharaoh',
    music: 'pharaoh',
    particle: 'sand',
    winStyle: 'gold',
    lavish: true,
    colors: {
      ...velvetColors,
      bg0: '#1a1006',
      bg1: '#3a250c',
      bg2: '#6a4a16',
      orb1: 'rgba(255, 196, 90, 0.4)',
      orb2: 'rgba(62, 198, 198, 0.28)',
      orb3: 'rgba(120, 70, 20, 0.4)',
      card: 'rgba(32, 20, 8, 0.9)',
      cardBorder: 'rgba(255, 213, 106, 0.4)',
      gold: '#ffd56a',
      goldDeep: '#c4842a',
      accent: '#3ec6c6',
      accent2: '#ffe7a8',
      foil1: '#ffe7b0',
      foil2: '#8a6230',
      reel: '#1c1208',
    },
  },
  {
    id: 'dragon',
    name: 'Dragon Emperor',
    tagline: 'Crimson lacquer, jade sparks, falling embers.',
    premium: true,
    coinPrice: 33_000,
    iapProductId: 'theme.dragon',
    music: 'dragon',
    particle: 'ember',
    winStyle: 'dragon',
    lavish: true,
    colors: {
      ...velvetColors,
      bg0: '#140404',
      bg1: '#3a0a0c',
      bg2: '#5c1410',
      orb1: 'rgba(255, 90, 40, 0.45)',
      orb2: 'rgba(124, 255, 107, 0.22)',
      orb3: 'rgba(255, 180, 60, 0.3)',
      card: 'rgba(28, 6, 6, 0.9)',
      cardBorder: 'rgba(255, 177, 90, 0.4)',
      gold: '#ffb15a',
      goldDeep: '#c44820',
      accent: '#7cff6b',
      accent2: '#ffd2a8',
      foil1: '#ffd8b0',
      foil2: '#7a3028',
      reel: '#1a0808',
    },
  },
  {
    id: 'ocean',
    name: 'Deep Sea Treasure',
    tagline: 'Abyss blue, rising bubbles, a pale glow.',
    premium: true,
    coinPrice: 21_000,
    iapProductId: 'theme.ocean',
    music: 'ocean',
    particle: 'bubble',
    winStyle: 'ocean',
    lavish: true,
    colors: {
      ...velvetColors,
      bg0: '#03141c',
      bg1: '#062838',
      bg2: '#0c4a64',
      orb1: 'rgba(62, 224, 197, 0.35)',
      orb2: 'rgba(80, 160, 255, 0.28)',
      orb3: 'rgba(180, 255, 240, 0.18)',
      card: 'rgba(4, 24, 34, 0.88)',
      cardBorder: 'rgba(183, 255, 242, 0.35)',
      gold: '#b7fff2',
      goldDeep: '#2a9d8f',
      text: '#f3fffc',
      muted: '#b7d4d4',
      accent: '#3ee0c5',
      accent2: '#9ad7ff',
      foil1: '#e5fff8',
      foil2: '#3d6d78',
      reel: '#041820',
      ink: '#042028',
    },
  },
  {
    id: 'cosmos',
    name: 'Cosmic Galaxy',
    tagline: 'Violet nebula and a slow field of stars.',
    premium: true,
    coinPrice: 45_000,
    iapProductId: 'theme.cosmos',
    music: 'cosmos',
    particle: 'star',
    winStyle: 'cosmos',
    lavish: true,
    colors: {
      ...velvetColors,
      bg0: '#070616',
      bg1: '#141033',
      bg2: '#2a1860',
      orb1: 'rgba(141, 123, 255, 0.45)',
      orb2: 'rgba(255, 120, 200, 0.28)',
      orb3: 'rgba(180, 220, 255, 0.2)',
      card: 'rgba(10, 8, 28, 0.88)',
      cardBorder: 'rgba(200, 186, 255, 0.4)',
      gold: '#e6d6ff',
      goldDeep: '#7d6bdc',
      text: '#f7f4ff',
      muted: '#c8bee6',
      accent: '#8d7bff',
      accent2: '#ffb3e6',
      foil1: '#f4eaff',
      foil2: '#5c5088',
      reel: '#0a0818',
      ink: '#140c28',
    },
  },
  {
    id: 'diamond',
    name: 'Diamond Royale',
    tagline: 'The brightest room. Prism light on every edge.',
    premium: true,
    coinPrice: 57_000,
    iapProductId: 'theme.diamond',
    music: 'diamond',
    particle: 'sparkle',
    winStyle: 'diamond',
    lavish: true,
    colors: {
      ...velvetColors,
      bg0: '#0c1016',
      bg1: '#1a2432',
      bg2: '#31445c',
      orb1: 'rgba(220, 244, 255, 0.35)',
      orb2: 'rgba(154, 215, 255, 0.35)',
      orb3: 'rgba(255, 244, 220, 0.22)',
      card: 'rgba(16, 22, 32, 0.82)',
      cardBorder: 'rgba(244, 251, 255, 0.45)',
      gold: '#f4fbff',
      goldDeep: '#8eb4d4',
      text: '#f8fcff',
      muted: '#c5d4e2',
      accent: '#9ad7ff',
      accent2: '#ffffff',
      foil1: '#ffffff',
      foil2: '#8aa0b8',
      reel: '#101820',
      ink: '#102033',
    },
  },
  {
    id: 'hearth',
    name: 'Hearth & Holly',
    tagline: 'A winter room. Snow at the glass, holly on the felt, and a low fire.',
    premium: true,
    coinPrice: 0,
    iapProductId: 'holiday.hearth',
    music: 'midnight',
    particle: 'snow',
    winStyle: 'gold',
    lavish: true,
    colors: {
      ...velvetColors,
      bg0: '#0c1612',
      bg1: '#163028',
      bg2: '#3a1818',
      orb1: 'rgba(196, 40, 54, 0.4)',
      orb2: 'rgba(240, 215, 140, 0.35)',
      orb3: 'rgba(220, 236, 244, 0.22)',
      card: 'rgba(12, 24, 20, 0.9)',
      cardBorder: 'rgba(240, 215, 140, 0.45)',
      gold: '#f3e2b8',
      goldDeep: '#8f2d32',
      accent: '#e23b4a',
      accent2: '#f7efe0',
      foil1: '#f4fbff',
      foil2: '#6e8a84',
      reel: '#0c1612',
      ink: '#1a100c',
    },
  },
];

export function getTheme(id: string | undefined): Theme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}
