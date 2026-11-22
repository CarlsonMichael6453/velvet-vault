import assert from 'node:assert/strict';

import { activeHoliday, seasonDayIndex, seasonReward } from '../src/data/live';
import { COIN_PRODUCTS, OFFER_PRODUCTS, coinsPerDollar, getProduct } from '../src/data/products';
import { adsLeft, claimAd, claimSeasonDay, freshSave, grantProduct, hydrateSave, restoreOwned } from '../src/store/logic';

const clock = { today: '2026-11-22', now: 1_700_000_000_000 };

const chip = COIN_PRODUCTS[0];
const pocket = COIN_PRODUCTS[1];
const emperor = COIN_PRODUCTS[COIN_PRODUCTS.length - 1];
assert.equal(chip.id, 'coins.chip');
assert.ok(coinsPerDollar(chip.coins!, chip.priceString) < coinsPerDollar(pocket.coins!, pocket.priceString));
assert.equal(emperor.id, 'coins.emperor');

const starter = getProduct('offer.starter');
const holiday = getProduct('holiday.hearth');
const season = getProduct('season.velvet');
assert.ok(starter?.oneTime && starter.themeId === 'neon' && starter.coins);
assert.ok(holiday?.themeId === 'hearth' && holiday.coins);
assert.ok(season?.seasonPass && season.styleId === 'gilded');
assert.ok(coinsPerDollar(starter!.coins!, starter!.priceString) < coinsPerDollar(emperor.coins!, emperor.priceString));
assert.ok(coinsPerDollar(holiday!.coins!, holiday!.priceString) < coinsPerDollar(emperor.coins!, emperor.priceString));
assert.equal(OFFER_PRODUCTS.length, 3);

assert.equal(activeHoliday('2026-11-22')?.id, 'yule-2026');
assert.equal(activeHoliday('2026-07-01'), null);
assert.equal(activeHoliday('2027-01-06')?.themeId, 'hearth');
assert.equal(seasonDayIndex('2026-11-22'), 22);
assert.equal(seasonDayIndex('2026-10-31'), null);

let save = { ...freshSave(), coins: 1_000, ageConfirmed: true, welcomed: true };
for (let i = 0; i < 3; i += 1) {
  const claimed = claimAd(save, clock);
  assert.equal(claimed.ok, true);
  save = claimed.save;
}
assert.equal(save.coins, 1_600);
assert.equal(adsLeft(save, clock.today), 0);
assert.equal(claimAd(save, clock).ok, false);
const tomorrow = claimAd(save, { today: '2026-11-23', now: clock.now });
assert.equal(tomorrow.ok, true);
assert.equal(tomorrow.save.adClaims, 1);

const free = claimSeasonDay(save, 22, 'free', clock);
assert.equal(free.ok, true);
assert.equal(free.save.coins, save.coins + seasonReward(22, 'free'));
assert.equal(claimSeasonDay(free.save, 22, 'free', clock).ok, false);
assert.equal(claimSeasonDay(free.save, 23, 'free', clock).ok, false);
assert.equal(claimSeasonDay(free.save, 22, 'premium', clock).ok, false);
const pass = grantProduct(free.save, season!);
assert.equal(pass.ok, true);
assert.equal(pass.save.seasonPremium, true);
assert.ok(pass.save.ownedStyles.includes('gilded'));
const premium = claimSeasonDay(pass.save, 22, 'premium', clock);
assert.equal(premium.ok, true);

const ownedNeon = { ...freshSave(), coins: 100, ownedThemes: [...freshSave().ownedThemes, 'neon'], achievements: { pack: 1 } };
const bundle = grantProduct(ownedNeon, starter!);
assert.equal(bundle.ok, true);
assert.equal(bundle.save.coins, 20_100);
assert.equal(bundle.save.ownedThemes.filter((id) => id === 'neon').length, 1);
assert.equal(grantProduct(bundle.save, starter!).ok, false);

const beforeRestore = freshSave();
const restored = restoreOwned(beforeRestore, season!);
assert.equal(restored.changed, true);
assert.equal(restored.save.seasonPremium, true);
assert.ok(restored.save.ownedStyles.includes('gilded'));
assert.equal(restored.save.coins, beforeRestore.coins);
const again = restoreOwned(restored.save, season!);
assert.equal(again.changed, false);
assert.equal(again.save.coins, beforeRestore.coins);
const chipRestore = restoreOwned(beforeRestore, chip);
assert.equal(chipRestore.changed, false);

const old = hydrateSave({ coins: 7 } as Partial<ReturnType<typeof freshSave>>);
assert.equal(old.settings.skipAnimations, false);
assert.equal(freshSave().settings.skipAnimations, false);
assert.equal(old.coins, 7);
assert.deepEqual(old.ownedOffers, []);
assert.equal(old.seasonPremium, false);

console.log('Offer, ad, season, and holiday checks passed.');
