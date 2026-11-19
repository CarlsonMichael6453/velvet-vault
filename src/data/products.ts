export type Product = {
  id: string;
  type: 'consumable' | 'non_consumable';
  title: string;
  description: string;
  priceString: string;
  coins?: number;
  themeId?: string;
  badge?: 'Popular' | 'Best value';
};

export const COIN_PRODUCTS: Product[] = [
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
    priceString: '$3.99',
    themeId: 'pharaoh',
  },
  {
    id: 'theme.dragon',
    type: 'non_consumable',
    title: 'Dragon Emperor',
    description: 'Unlock the Dragon Emperor theme.',
    priceString: '$4.99',
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
    priceString: '$4.99',
    themeId: 'cosmos',
  },
  {
    id: 'theme.diamond',
    type: 'non_consumable',
    title: 'Diamond Royale',
    description: 'Unlock the Diamond Royale theme.',
    priceString: '$6.99',
    themeId: 'diamond',
  },
];

export const PRODUCTS: Product[] = [...COIN_PRODUCTS, ...THEME_PRODUCTS];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}
