import assert from 'node:assert/strict';

import { levelFromXp, maxBetForLevel } from '../src/data/economy';
import { COIN_PRODUCTS, PRODUCTS, coinPackPremium, usdPrice } from '../src/data/products';
import { SCRATCH_TICKETS, presentTicket, ticketRtp } from '../src/games/scratch/tickets';
import { BACKGROUNDS } from '../src/theme/backgrounds';
import { STYLES } from '../src/theme/styles';
import { THEMES } from '../src/theme/themes';
import { drawResult, quickPick, scoreTicket, scoreTickets } from '../src/games/lottery/draw';
import { evaluateLine, evaluateSpin, spinGrid } from '../src/games/slots/engine';
import { MACHINES } from '../src/games/slots/machines';
import { mulberry32 } from '../src/lib/random';
import {
  buyScratch,
  buyThemeWithCoins,
  claimDaily,
  confirmAge,
  creditSlotWin,
  freshSave,
  purchaseDraw,
  settleScratch,
  wagerSpin,
} from '../src/store/logic';

function testLines() {
  const machine = MACHINES[0];
  const wildOnly = evaluateLine(['wild', 'wild', 'wild'], machine);
  assert.equal(wildOnly?.symbol, 'wild');
  assert.equal(wildOnly?.count, 3);

  const sub = evaluateLine(['wild', 'high2', 'high2'], machine);
  assert.equal(sub?.symbol, 'high2');
  assert.equal(sub?.count, 3);

  const broken = evaluateLine(['scatter', 'high2', 'high2'], machine);
  assert.equal(broken, null);

  const rightSide = evaluateLine(['low1', 'high1', 'high1'], machine);
  assert.equal(rightSide, null);

  const five = MACHINES[1];
  const oak = evaluateLine(['low1', 'wild', 'low1', 'low1', 'low2'], five);
  assert.equal(oak?.symbol, 'low1');
  assert.equal(oak?.count, 4);
}

function testWallet() {
  const clock = { today: '2026-04-01', now: 1_700_000_000_000 };
  let save = confirmAge(freshSave()).save;
  assert.equal(save.coins, 8000);
  assert.equal(confirmAge(save).save.coins, 8000);

  const poor = wagerSpin({ ...save, coins: 5 }, 10, 1, clock);
  assert.equal(poor.ok, false);
  assert.equal(poor.save.coins, 5);

  const locked = wagerSpin(save, 40, 8, clock);
  assert.equal(locked.ok, false);

  const first = wagerSpin(save, 50, 1, clock);
  assert.equal(first.ok, true);
  assert.equal(first.save.stats.spins, 1);
  assert.ok(first.save.achievements['first-spin']);
  assert.equal(first.save.coins, 8000 - 50 + 200);

  save = { ...first.save, achievements: { ...first.save.achievements, 'big-win': 1, 'wager-10k': 1 } };
  const bet = wagerSpin(save, 50, 1, clock);
  assert.equal(bet.ok, true);
  assert.equal(bet.save.coins, save.coins - 50);
  save = bet.save;

  const win = creditSlotWin(save, 500, 50, clock);
  assert.equal(win.save.coins, save.coins + 500);
  assert.ok(win.save.stats.biggestMultiple >= 10);

  const again = claimDaily(win.save, clock);
  assert.equal(again.ok, true);
  const twice = claimDaily(again.save, clock);
  assert.equal(twice.ok, false);

  const nextDay = claimDaily(again.save, { today: '2026-04-02', now: clock.now });
  assert.equal(nextDay.ok, true);
  assert.equal(nextDay.save.streak, 2);

  const skipped = claimDaily(nextDay.save, { today: '2026-04-04', now: clock.now });
  assert.equal(skipped.save.streak, 1);

  const theme = buyThemeWithCoins(skipped.save, { id: 'neon', name: 'Neon Vegas', coinPrice: 15_000, premium: true });
  assert.equal(theme.ok, false);
  const rich = { ...skipped.save, coins: 20_000, achievements: { ...skipped.save.achievements, theme: 1 } };
  const bought = buyThemeWithCoins(rich, { id: 'neon', name: 'Neon Vegas', coinPrice: 15_000, premium: true });
  assert.equal(bought.ok, true);
  assert.equal(bought.save.coins, 5_000);
  assert.ok(bought.save.ownedThemes.includes('neon'));
  assert.equal(bought.save.activeTheme, 'neon');
  const againTheme = buyThemeWithCoins(bought.save, { id: 'neon', name: 'Neon Vegas', coinPrice: 15_000, premium: true });
  assert.equal(againTheme.ok, false);
}

function testScratchDeterministic() {
  const def = SCRATCH_TICKETS[0];
  const a = presentTicket(def, 42);
  const b = presentTicket(def, 42);
  assert.deepEqual(a, b);
  const cells = a.cells ?? [];
  const counts = new Map<string, number>();
  cells.forEach((cell) => counts.set(cell.icon, (counts.get(cell.icon) ?? 0) + 1));
  const hasTriple = [...counts.values()].some((count) => count >= 3);
  assert.equal(hasTriple, a.prize > 0);

  let save = confirmAge(freshSave()).save;
  save = { ...save, achievements: { 'scratch-jackpot': 1, 'scratch-10': 1, 'wager-10k': 1 } };
  const bought = buyScratch(save, def.id, 42, a.prize, { today: '2026-04-01', now: 10 });
  assert.equal(bought.ok, true);
  assert.equal(bought.save.coins, 8000 - def.price + 200);
  const settled = settleScratch(bought.save, { today: '2026-04-01', now: 10 });
  assert.equal(settled.save.pendingScratch, null);
  assert.equal(settled.save.coins, bought.save.coins + a.prize);
  const settledAgain = settleScratch(settled.save, { today: '2026-04-01', now: 10 });
  assert.equal(settledAgain.ok, false);
}

function testDrawJackpot() {
  const ticket = { main: [1, 2, 3, 4, 5], star: 1 };
  const draw = { main: [1, 2, 3, 4, 5], star: 1 };
  const score = scoreTicket(ticket, draw, 250_000);
  assert.equal(score.jackpotWon, true);
  assert.equal(score.amount, 250_000);

  const almost = scoreTicket(ticket, { main: [1, 2, 3, 4, 5], star: 2 }, 250_000);
  assert.equal(almost.jackpotWon, false);
  assert.equal(almost.amount, 100_000);

  const two = scoreTicket({ main: [1, 2, 9, 10, 11], star: 3 }, { main: [1, 2, 3, 4, 5], star: 4 }, 250_000);
  assert.equal(two.amount, 150);

  let save = confirmAge(freshSave()).save;
  const bought = purchaseDraw(save, [ticket], draw, { today: '2026-04-01', now: 10 });
  assert.equal(bought.ok, true);
  assert.equal(bought.save.jackpot, 250_000);
  assert.equal(bought.save.pendingDraw?.jackpotWon, true);
  assert.ok((bought.save.pendingDraw?.prize ?? 0) > 250_000);

  const quick = quickPick(mulberry32(7));
  assert.equal(quick.main.length, 5);
  assert.equal(new Set(quick.main).size, 5);
  const rolled = drawResult(mulberry32(9));
  assert.equal(rolled.main.length, 5);
  const many = scoreTickets([quick, quick], rolled, 250_000);
  assert.equal(many.scores.length, 2);
}

function simulateSlots() {
  const spins = 40_000;
  const results: { name: string; rtp: number }[] = [];
  console.log('\nSlot RTP (base game, free spins included)');
  for (const machine of MACHINES) {
    const rng = mulberry32(9000 + machine.reels * 100 + machine.levelRequired);
    const bet = machine.paylines.length * 10;
    let wagered = 0;
    let won = 0;
    let hits = 0;
    let big = 0;
    let features = 0;
    let freeLeft = 0;
    let freeMult = 1;
    let freeBet = bet;
    for (let i = 0; i < spins; i++) {
      const isFree = freeLeft > 0;
      const spinBet = isFree ? freeBet : bet;
      if (!isFree) wagered += bet;
      else freeLeft -= 1;
      const grid = spinGrid(machine, rng);
      const result = evaluateSpin(machine, grid, spinBet, isFree ? freeMult : 1);
      if (result.totalWin > 0) {
        hits += 1;
        won += result.totalWin;
        if (result.totalWin / spinBet >= 10) big += 1;
      }
      if (result.freeSpinsAwarded > 0) {
        features += 1;
        freeLeft = Math.min(18, freeLeft + result.freeSpinsAwarded);
        freeMult = Math.max(freeMult, result.awardedMultiplier);
        freeBet = spinBet;
      }
      if (freeLeft <= 0) freeMult = 1;
    }
    const rtp = won / wagered;
    const hitRate = hits / spins;
    const bigRate = big / spins;
    const featureRate = features / spins;
    console.log(
      `${machine.name.padEnd(20)} RTP ${(rtp * 100).toFixed(1)}%  hit ${(hitRate * 100).toFixed(1)}%  big ${(bigRate * 100).toFixed(2)}%  feature ${(featureRate * 100).toFixed(2)}%`,
    );
    results.push({ name: machine.name, rtp });
  }
  for (const result of results) {
    assert.ok(result.rtp > 0.88 && result.rtp < 1.08, `${result.name} RTP ${result.rtp} out of band`);
  }
}

function testCatalog() {
  const tier = /^\$[0-9]+\.99$/;
  for (const product of PRODUCTS) {
    assert.match(product.priceString, tier, `${product.id} price ${product.priceString}`);
    assert.ok(usdPrice(product.priceString) > 0, product.id);
  }

  let previousRate = 0;
  for (const product of COIN_PRODUCTS) {
    assert.ok(product.coins && product.coins > 0, product.id);
    assert.ok(
      product.description.includes(product.coins!.toLocaleString('en-US')),
      `${product.id} description should name ${product.coins} coins`,
    );
    const rate = product.coins! / usdPrice(product.priceString);
    assert.ok(rate > previousRate, `${product.id} should return more coins per dollar than the smaller pack`);
    previousRate = rate;
    const premium = coinPackPremium(product);
    if (product.id === COIN_PRODUCTS[0].id) assert.equal(premium, null);
    else assert.ok(premium != null && premium > 0, product.id);
  }

  const rooms = THEMES.filter((theme) => theme.premium && theme.coinPrice > 0)
    .map((theme) => {
      const product = PRODUCTS.find((item) => item.themeId === theme.id);
      assert.ok(product, `${theme.id} needs a store product`);
      assert.equal(product!.id, theme.iapProductId);
      return { id: theme.id, coins: theme.coinPrice, usd: usdPrice(product!.priceString) };
    })
    .sort((a, b) => a.usd - b.usd);

  let lastCoins = 0;
  let lastUsd = 0;
  let lastRate = 0;
  for (const room of rooms) {
    const rate = room.coins / room.usd;
    assert.ok(room.coins > lastCoins, `${room.id} coin price should rise with the cash price`);
    assert.ok(room.usd > lastUsd, `${room.id} cash price should be unique and higher`);
    assert.ok(rate > lastRate, `${room.id} should be a better coins-per-dollar deal than the cheaper room`);
    lastCoins = room.coins;
    lastUsd = room.usd;
    lastRate = rate;
  }

  const freeLooks = new Set(['velvet', 'midnight', 'sunset', 'hall', 'cabin', 'beach', 'classic', 'bubbly', 'winter']);
  for (const item of [...THEMES, ...BACKGROUNDS, ...STYLES]) {
    const levelRequired = 'levelRequired' in item ? item.levelRequired : 0;
    if (!item.iapProductId) {
      if (item.coinPrice === 0 && levelRequired === 0) {
        assert.ok(freeLooks.has(item.id), `${item.id} has no price and no level gate`);
      }
      continue;
    }
    const product = PRODUCTS.find((entry) => entry.id === item.iapProductId);
    assert.ok(product, `${item.id} store id ${item.iapProductId} is missing`);
    if (item.coinPrice > 0) {
      const rate = item.coinPrice / usdPrice(product!.priceString);
      assert.ok(rate >= 4_500, `${item.id} cash price is a worse deal than the coin cost`);
    }
  }

  let lastTicketPrice = 0;
  let lastTicketRtp = 0;
  for (const ticket of SCRATCH_TICKETS) {
    const rtp = ticketRtp(ticket);
    if (ticket.price > lastTicketPrice) {
      assert.ok(rtp + 1e-9 >= lastTicketRtp, `${ticket.name} pays back less than a cheaper ticket`);
    }
    lastTicketPrice = ticket.price;
    lastTicketRtp = rtp;
  }
}

function reportScratch() {
  console.log('\nScratch RTP');
  for (const ticket of SCRATCH_TICKETS) {
    const rtp = ticketRtp(ticket);
    console.log(`${ticket.name.padEnd(18)} ${(rtp * 100).toFixed(1)}%`);
    assert.ok(rtp > 0.9 && rtp < 1.05, ticket.name);
  }
}

function reportLevels() {
  let xp = 0;
  const marks = [2, 5, 10, 15, 20];
  console.log('\nLevel curve');
  for (let level = 1; level <= 20; level++) {
    if (marks.includes(level)) {
      console.log(`level ${level} at ${xp} xp, max bet ${maxBetForLevel(level)}`);
    }
    xp += levelFromXp(xp).next;
  }
}

testLines();
testWallet();
testScratchDeterministic();
testDrawJackpot();
testCatalog();
reportScratch();
simulateSlots();
reportLevels();
console.log('\nAll economy checks passed.');
