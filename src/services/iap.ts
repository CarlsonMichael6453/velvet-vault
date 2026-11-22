import AsyncStorage from '@react-native-async-storage/async-storage';

import { PRODUCTS, type Product } from '@/src/data/products';

const RECEIPTS = 'velvet-vault-mock-receipts';

export type PurchaseResult = {
  ok: boolean;
  productId: string;
  transactionId?: string;
  cancelled?: boolean;
  error?: string;
};

/**
 * StoreKit / Play Billing boundary.
 * The dev build ships MockIAPService. Swap in RevenueCatIAPService when
 * EXPO_PUBLIC_IAP_PROVIDER=revenuecat and a real SDK key is configured.
 */
export interface IAPService {
  readonly provider: 'mock' | 'revenuecat';
  getProducts(): Promise<Product[]>;
  purchase(productId: string): Promise<PurchaseResult>;
  /**
   * Non-consumable product ids the store account already owns.
   * Callers unlock rooms, themes, styles, and the season pass.
   * They must not grant coin packs again.
   */
  restore(): Promise<{ productIds: string[] }>;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockIAPService implements IAPService {
  readonly provider = 'mock' as const;

  async getProducts(): Promise<Product[]> {
    return PRODUCTS;
  }

  async purchase(productId: string): Promise<PurchaseResult> {
    const product = PRODUCTS.find((item) => item.id === productId);
    if (!product) return { ok: false, productId, error: 'Unknown product.' };
    await wait(700);
    if (product.type === 'non_consumable') await rememberReceipt(productId);
    return { ok: true, productId, transactionId: `mock_${productId}_${Date.now()}` };
  }

  async restore(): Promise<{ productIds: string[] }> {
    await wait(400);
    return { productIds: await readReceipts() };
  }
}

async function readReceipts(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECEIPTS);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

async function rememberReceipt(productId: string): Promise<void> {
  const current = await readReceipts();
  if (current.includes(productId)) return;
  await AsyncStorage.setItem(RECEIPTS, JSON.stringify([...current, productId]));
}

export class RevenueCatIAPService implements IAPService {
  readonly provider = 'revenuecat' as const;

  async getProducts(): Promise<Product[]> {
    throw new Error('RevenueCat is not configured. Add react-native-purchases and EXPO_PUBLIC_REVENUECAT_API_KEY.');
  }

  async purchase(productId: string): Promise<PurchaseResult> {
    return { ok: false, productId, error: 'RevenueCat is not configured in this build.' };
  }

  async restore(): Promise<{ productIds: string[] }> {
    // Return the non-consumable product ids this store account owns.
    // The app then calls restoreOwned, which unlocks rooms, themes, styles,
    // and the season pass without paying coin packs out a second time.
    throw new Error('RevenueCat is not configured in this build.');
  }
}

export function createIAPService(): IAPService {
  if (process.env.EXPO_PUBLIC_IAP_PROVIDER === 'revenuecat') return new RevenueCatIAPService();
  return new MockIAPService();
}

export const iap = createIAPService();
