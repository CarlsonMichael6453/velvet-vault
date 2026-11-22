export type Product = {
  id: string;
  type: 'consumable' | 'non_consumable';
  title: string;
  description: string;
  priceString: string;
  coins?: number;
  themeId?: string;
  backgroundId?: string;
  styleId?: string;
  badge?: 'Popular' | 'Best value';
  /** Can be granted only once per vault. */
  oneTime?: boolean;
  /** Marks the premium season track as owned. */
  seasonPass?: boolean;
};

export const COIN_PRODUCTS: Product[] = [
  {
    id: 'coins.chip',
    type: 'consumable',
    title: 'Single Chip',
    description: '2,000 Velvet Coins. A smaller pack, with fewer coins per dollar.',
    priceString: '$0.99',
    coins: 2_000,
  },
  {
    id: 'coins.pocket',
    type: 'consumable',
    title: 'Pocket Change',
    description: '5,000 Velvet Coins to keep the reels turning.',
    priceString: '$1.99',
    coins: 5_000,
  },
  {
    id: 'coins.stack',
    type: 'consumable',
    title: 'Coin Stack',
    description: '15,000 Velvet Coins.',
    priceString: '$4.99',
    coins: 15_000,
  },
  {
    id: 'coins.chest',
    type: 'consumable',
    title: 'Vault Chest',
    description: '40,000 Velvet Coins.',
    priceString: '$9.99',
    coins: 40_000,
    badge: 'Popular',
  },
  {
    id: 'coins.royale',
    type: 'consumable',
    title: 'Royale Trove',
    description: '100,000 Velvet Coins.',
    priceString: '$19.99',
    coins: 100_000,
  },
  {
    id: 'coins.emperor',
    type: 'consumable',
    title: "Emperor's Fortune",
    description: '300,000 Velvet Coins. The most coins per dollar.',
    priceString: '$49.99',
    coins: 300_000,
    badge: 'Best value',
  },
];

export const THEME_PRODUCTS: Product[] = [
  {
    id: 'theme.neon',
    type: 'non_consumable',
    title: 'Neon Vegas',
    description: 'Unlock the Neon Vegas theme.',
    priceString: '$2.99',
    themeId: 'neon',
  },
  {
    id: 'theme.pharaoh',
    type: 'non_consumable',
    title: "Pharaoh's Gold",
    description: "Unlock the Pharaoh's Gold theme.",
    priceString: '$4.99',
    themeId: 'pharaoh',
  },
  {
    id: 'theme.dragon',
    type: 'non_consumable',
    title: 'Dragon Emperor',
    description: 'Unlock the Dragon Emperor theme.',
    priceString: '$5.99',
    themeId: 'dragon',
  },
  {
    id: 'theme.ocean',
    type: 'non_consumable',
    title: 'Deep Sea Treasure',
    description: 'Unlock the Deep Sea Treasure theme.',
    priceString: '$3.99',
    themeId: 'ocean',
  },
  {
    id: 'theme.cosmos',
    type: 'non_consumable',
    title: 'Cosmic Galaxy',
    description: 'Unlock the Cosmic Galaxy theme.',
    priceString: '$7.99',
    themeId: 'cosmos',
  },
  {
    id: 'theme.diamond',
    type: 'non_consumable',
    title: 'Diamond Royale',
    description: 'Unlock the Diamond Royale theme.',
    priceString: '$9.99',
    themeId: 'diamond',
  },
];

export const BACKDROP_PRODUCTS: Product[] = [
  {
    id: 'bg.candy',
    type: 'non_consumable',
    title: 'Candy Land',
    description: 'Unlock the Candy Land backdrop.',
    priceString: '$2.99',
    backgroundId: 'candy',
  },
  {
    id: 'bg.palace',
    type: 'non_consumable',
    title: 'Golden Palace',
    description: 'Unlock the Golden Palace backdrop.',
    priceString: '$4.99',
    backgroundId: 'palace',
  },
];

export const STYLE_PRODUCTS: Product[] = [
  {
    id: 'style.neon',
    type: 'non_consumable',
    title: 'Neon Cyber',
    description: 'Unlock the Neon Cyber game style.',
    priceString: '$1.99',
    styleId: 'neon',
  },
  {
    id: 'style.royal',
    type: 'non_consumable',
    title: 'Royal Gold',
    description: 'Unlock the Royal Gold game style.',
    priceString: '$3.99',
    styleId: 'royal',
  },
];

export const OFFER_PRODUCTS: Product[] = [
  {
    id: 'offer.starter',
    type: 'non_consumable',
    title: 'First Night',
    description: '20,000 Velvet Coins and the Neon Vegas room. Once per vault. Fewer coins per dollar than Emperor’s Fortune.',
    priceString: '$4.99',
    coins: 20_000,
    themeId: 'neon',
    oneTime: true,
  },
  {
    id: 'season.velvet',
    type: 'non_consumable',
    title: 'Velvet Season',
    description: 'The premium track for this 30-day season, and the Gilded Season style.',
    priceString: '$4.99',
    styleId: 'gilded',
    oneTime: true,
    seasonPass: true,
  },
  {
    id: 'holiday.hearth',
    type: 'non_consumable',
    title: 'Hearth & Holly',
    description: '25,000 Velvet Coins and the Hearth & Holly room. A winter pack. Fewer coins per dollar than Emperor’s Fortune.',
    priceString: '$6.99',
    coins: 25_000,
    themeId: 'hearth',
    oneTime: true,
  },
];

export const PRODUCTS: Product[] = [...COIN_PRODUCTS, ...THEME_PRODUCTS, ...BACKDROP_PRODUCTS, ...STYLE_PRODUCTS, ...OFFER_PRODUCTS];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}

/** Dollar amounts live only on products. Screens should read this, not a second copy. */
export function usdPrice(priceString: string): number {
  return Number(priceString.replace(/[^0-9.]/g, ''));
}

export function coinsPerDollar(coins: number, priceString: string): number {
  return coins / usdPrice(priceString);
}

/** Extra coins per dollar versus the smallest coin pack. Null on that pack. */
export function coinPackPremium(product: Product): number | null {
  const base = COIN_PRODUCTS[0];
  if (!product.coins || !base.coins || product.id === base.id) return null;
  return coinsPerDollar(product.coins, product.priceString) / coinsPerDollar(base.coins, base.priceString) - 1;
}

/** 0 is the quietest pack. 5 is Emperor’s Fortune. */
export function celebrationTier(priceString: string): 0 | 1 | 2 | 3 | 4 | 5 {
  const usd = usdPrice(priceString);
  if (usd < 1.5) return 0;
  if (usd < 3) return 1;
  if (usd < 7) return 2;
  if (usd < 15) return 3;
  if (usd < 30) return 4;
  return 5;
}
