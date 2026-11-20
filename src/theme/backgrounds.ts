export type BackgroundId =
  | 'hall'
  | 'cabin'
  | 'beach'
  | 'aurora'
  | 'blossom'
  | 'reef'
  | 'candy'
  | 'station'
  | 'manor'
  | 'palace'
  | 'arcade';

export type BackgroundDef = {
  id: BackgroundId;
  name: string;
  tagline: string;
  coinPrice: number;
  levelRequired: number;
  iapProductId?: string;
  iapPrice?: string;
  colors: readonly [string, string, string];
};

export const BACKGROUNDS: BackgroundDef[] = [
  {
    id: 'hall',
    name: 'Velvet Hall',
    tagline: 'The house gradient. Your room theme still colors the cards.',
    coinPrice: 0,
    levelRequired: 0,
    colors: ['#12060c', '#2a0d1c', '#4a1630'],
  },
  {
    id: 'cabin',
    name: 'Snowy Cabin',
    tagline: 'A warm window, a low roof, and snow that keeps falling.',
    coinPrice: 0,
    levelRequired: 0,
    colors: ['#071525', '#1b3c5a', '#d5e4ef'],
  },
  {
    id: 'beach',
    name: 'Tropical Beach',
    tagline: 'Sun, a slow wave, and a palm at the edge of the sand.',
    coinPrice: 0,
    levelRequired: 0,
    colors: ['#7ec8ff', '#ffe1a8', '#f2c57c'],
  },
  {
    id: 'aurora',
    name: 'Aurora Night',
    tagline: 'Green and violet bands drifting over a dark sky.',
    coinPrice: 0,
    levelRequired: 4,
    colors: ['#050814', '#10203f', '#071018'],
  },
  {
    id: 'blossom',
    name: 'Cherry Blossom',
    tagline: 'A pink tree and petals on the wind.',
    coinPrice: 8_000,
    levelRequired: 0,
    colors: ['#ffd6e7', '#f7a8c4', '#6e3b4e'],
  },
  {
    id: 'reef',
    name: 'Underwater Reef',
    tagline: 'Coral, sand, and bubbles climbing the glass.',
    coinPrice: 12_000,
    levelRequired: 0,
    colors: ['#06324a', '#0a6e86', '#0d3b4c'],
  },
  {
    id: 'candy',
    name: 'Candy Land',
    tagline: 'Gumdrops and a sky the color of frosting.',
    coinPrice: 15_000,
    levelRequired: 0,
    iapProductId: 'bg.candy',
    iapPrice: '$2.99',
    colors: ['#ff8fb8', '#ffe27a', '#8fd3ff'],
  },
  {
    id: 'station',
    name: 'Space Station',
    tagline: 'A ring, a porthole, and stars that blink.',
    coinPrice: 0,
    levelRequired: 8,
    colors: ['#070b16', '#12182b', '#1b2438'],
  },
  {
    id: 'manor',
    name: 'Haunted Manor',
    tagline: 'A moon, a crooked house, and one window that flickers.',
    coinPrice: 18_000,
    levelRequired: 0,
    colors: ['#1a1020', '#3a2148', '#140c16'],
  },
  {
    id: 'palace',
    name: 'Golden Palace',
    tagline: 'Columns and a dome, lit like late afternoon.',
    coinPrice: 0,
    levelRequired: 0,
    iapProductId: 'bg.palace',
    iapPrice: '$4.99',
    colors: ['#3a2a10', '#c6a15a', '#6b4a16'],
  },
  {
    id: 'arcade',
    name: 'Retro Arcade',
    tagline: 'A scanline, a pixel grid, and a neon frame.',
    coinPrice: 10_000,
    levelRequired: 0,
    colors: ['#120018', '#2a0044', '#070010'],
  },
];

export function getBackground(id: string): BackgroundDef {
  return BACKGROUNDS.find((item) => item.id === id) ?? BACKGROUNDS[0];
}
