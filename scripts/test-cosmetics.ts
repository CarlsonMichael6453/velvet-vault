import { getProduct } from '../src/data/products';
import { levelFromXp } from '../src/data/economy';
import { getBackground } from '../src/theme/backgrounds';
import { getStyle } from '../src/theme/styles';
import {
  applyBackground,
  applyStyle,
  buyBackgroundWithCoins,
  buyStyleWithCoins,
  freshSave,
  grantProduct,
  hydrateSave,
} from '../src/store/logic';
import type { SaveState } from '../src/store/types';

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const blossom = getBackground('blossom');
const aurora = getBackground('aurora');
const palace = getBackground('palace');
const pixel = getStyle('pixel');
const royal = getStyle('royal');
const space = getStyle('space');

let save: SaveState = { ...freshSave(), coins: 8_000, ageConfirmed: true, welcomed: true };
assert(save.ownedBackgrounds.includes('cabin') && save.ownedStyles.includes('bubbly'), 'free looks start owned');
assert(save.activeBackground === 'hall' && save.activeStyle === 'classic', 'defaults are the house look');

const short = buyBackgroundWithCoins({ ...save, coins: 7_999 }, blossom);
assert(!short.ok && short.save.coins === 7_999 && short.save.activeBackground === 'hall', 'a short balance does not buy a backdrop');

const bought = buyBackgroundWithCoins(save, blossom);
assert(bought.ok, bought.error ?? 'blossom should buy');
assert(bought.save.coins === 0, `blossom should cost 8000 exactly, left ${bought.save.coins}`);
assert(bought.save.activeBackground === 'blossom' && bought.save.ownedBackgrounds.includes('blossom'), 'buying equips the backdrop');

const again = buyBackgroundWithCoins(bought.save, blossom);
assert(!again.ok && again.save.coins === 0, 'a second buy does not charge again');

const lockedAurora = applyBackground(save, aurora);
assert(!lockedAurora.ok && lockedAurora.save.coins === 8_000 && lockedAurora.save.activeBackground === 'hall', 'aurora stays locked at level 1');

const high = { ...save, xp: 1_000 };
assert(levelFromXp(high.xp).level >= 4, 'test xp should clear level 4');
const opened = applyBackground(high, aurora);
assert(opened.ok && opened.save.coins === 8_000 && opened.save.activeBackground === 'aurora', 'a level backdrop equips without spending coins');

const storeOnly = buyBackgroundWithCoins(save, palace);
assert(!storeOnly.ok && storeOnly.save.coins === 8_000, 'the palace is not a coin purchase');

const styleShort = buyStyleWithCoins({ ...save, coins: 5_999 }, pixel);
assert(!styleShort.ok && styleShort.save.coins === 5_999 && styleShort.save.activeStyle === 'classic', 'a short balance does not buy a style');

const styleBuy = buyStyleWithCoins({ ...save, coins: 6_000 }, pixel);
assert(styleBuy.ok && styleBuy.save.coins === 0 && styleBuy.save.activeStyle === 'pixel', 'pixel style costs 6000 exactly');

const bubbly = applyStyle(styleBuy.save, getStyle('bubbly'));
assert(bubbly.ok && bubbly.save.coins === 0 && bubbly.save.activeStyle === 'bubbly', 'equipping a free style does not move coins');

const royalProduct = getProduct('style.royal');
assert(royalProduct?.styleId === 'royal', 'royal product is mapped');
const granted = grantProduct({ ...save, coins: 1_200 }, royalProduct!);
assert(granted.ok && granted.save.coins === 1_200 && granted.save.activeStyle === 'royal', 'mock style unlock does not add or remove coins');
assert(granted.save.ownedStyles.includes(royal.id), 'royal is owned after the mock purchase');

const spaceLocked = applyStyle(save, space);
assert(!spaceLocked.ok && spaceLocked.save.activeStyle === 'classic', 'space style waits for level 8');

const old = hydrateSave({ coins: 42 } as Partial<SaveState>);
assert(old.coins === 42, 'old saves keep their balance');
assert(old.activeBackground === 'hall' && old.ownedStyles.includes('winter'), 'old saves gain the free backdrop and styles');

console.log('Cosmetic unlock checks passed.');
