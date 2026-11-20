import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SymbolTile, Card, CoinPill, Display, GhostButton, GoldButton, LegalLine, Muted, Screen } from '@/src/components/ui';
import { BigWin } from '@/src/components/fx';
import { getScratchTicket, presentTicket, SCRATCH_TICKETS, type ScratchPresentation } from '@/src/games/scratch/tickets';
import { celebrationFor } from '@/src/games/slots/engine';
import { formatCoins } from '@/src/lib/format';
import { playScratch, playSfx } from '@/src/services/audio';
import { considerStoreReview } from '@/src/services/reviewPrompt';
import { levelFromXp } from '@/src/data/economy';
import { buzz } from '@/src/services/haptics';
import { useGame } from '@/src/store/gameStore';
import type { GameStyle } from '@/src/theme/styles';
import { useStyle, useTheme } from '@/src/theme/useTheme';

const COLS = 10;
const ROWS = 14;
/** One foil cell. The previous brush covered a 3×3 block, about three times this wide. */
const BRUSH_RADIUS = 0;
/** Share of the foil a thin stroke must clear before the ticket finishes itself. */
const REVEAL_AT = 0.34;

export function ScratchCatalog() {
  const router = useRouter();
  const theme = useTheme();
  const coins = useGame((state) => state.save.coins);
  const pending = useGame((state) => state.save.pendingScratch);
  return (
    <Screen scroll bottomInset back>
      <View style={styles.header}>
        <Display size={26}>Scratch foils</Display>
        <CoinPill amount={coins} onPress={() => router.push('/shop')} />
      </View>
      <Muted>The prize is sealed when you buy the ticket. Scratching only reveals it. Coins in, coins out, never cash.</Muted>
      {pending ? (
        <Card>
          <Text style={[styles.cardTitle, { color: theme.colors.gold }]}>You have an open ticket</Text>
          <GoldButton label="Finish it" onPress={() => router.push({ pathname: '/scratch/[id]', params: { id: pending.ticketId } })} />
        </Card>
      ) : null}
      <View style={{ gap: 12, marginTop: 12 }}>
        {SCRATCH_TICKETS.map((ticket) => (
          <PressCard key={ticket.id} onPress={() => router.push({ pathname: '/scratch/[id]', params: { id: ticket.id } })}>
            <View style={[styles.swatch, { backgroundColor: ticket.accent }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{ticket.name}</Text>
              <Text style={[styles.body, { color: theme.colors.muted }]}>{ticket.blurb}</Text>
              <Text style={[styles.price, { color: theme.colors.gold }]}>{formatCoins(ticket.price)} coins</Text>
            </View>
          </PressCard>
        ))}
      </View>
      <LegalLine />
    </Screen>
  );
}

function PressCard({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <View style={{ flex: 1, flexDirection: 'row', gap: 12 }}>{children}</View>
      <GhostButton label="Open" onPress={onPress} />
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: theme.colors.gold, borderTopLeftRadius: 18, borderBottomLeftRadius: 18 }} />
    </Card>
  );
}

export function ScratchPlay() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const ticket = getScratchTicket(String(id));
  const router = useRouter();
  const theme = useTheme();
  const look = useStyle();
  const coins = useGame((state) => state.save.coins);
  const pending = useGame((state) => state.save.pendingScratch);
  const [mask, setMask] = useState<boolean[]>(() => Array(COLS * ROWS).fill(false));
  const [board, setBoard] = useState<{ width: number; height: number }>({ width: 1, height: 1 });
  const [settled, setSettled] = useState(false);
  const [celebration, setCelebration] = useState<{ tier: 'big' | 'mega' | 'ultra' | 'jackpot'; amount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [held, setHeld] = useState<ScratchPresentation | null>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const levelBeforeBuy = useRef(1);

  const owned = pending && ticket && pending.ticketId === ticket.id ? pending : null;
  useEffect(() => {
    if (!held && owned && ticket) setHeld(presentTicket(ticket, owned.seed));
  }, [held, owned, ticket]);

  function revealAt(x: number, y: number) {
    if (!held || settled) return;
    const cellW = board.width / COLS;
    const cellH = board.height / ROWS;
    const col = Math.floor(x / cellW);
    const row = Math.floor(y / cellH);
    setMask((current) => {
      const next = current.slice();
      let changed = false;
      for (let dy = -BRUSH_RADIUS; dy <= BRUSH_RADIUS; dy++) {
        for (let dx = -BRUSH_RADIUS; dx <= BRUSH_RADIUS; dx++) {
          const c = col + dx;
          const r = row + dy;
          if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue;
          const index = r * COLS + c;
          if (!next[index]) {
            next[index] = true;
            changed = true;
          }
        }
      }
      if (!changed) return current;
      const revealed = next.filter(Boolean).length / next.length;
      if (revealed >= REVEAL_AT) return next.map(() => true);
      return next;
    });
    playScratch();
    buzz('scratch');
  }

  function buy() {
    if (!ticket) return;
    if (pending && pending.ticketId !== ticket.id) {
      setError('Finish the ticket already in your hand.');
      return;
    }
    if (owned) return;
    levelBeforeBuy.current = levelFromXp(useGame.getState().save.xp).level;
    const seed = Math.floor(Math.random() * 1_000_000_000);
    const face = presentTicket(ticket, seed);
    const result = useGame.getState().buyScratch(ticket.id, ticket.price, seed, face.prize);
    if (!result.ok) {
      setError(result.error ?? 'Could not buy that ticket.');
      return;
    }
    setHeld(face);
    setMask(Array(COLS * ROWS).fill(false));
    setSettled(false);
    setError(null);
    void playSfx('coin');
  }

  function settle(full: boolean) {
    if (!ticket || !owned || settled || !full) return;
    setSettled(true);
    const result = useGame.getState().settleScratch();
    if (result.amount && result.amount > 0) {
      void playSfx(result.amount / ticket.price >= 10 ? 'bigwin' : 'win');
      buzz('win');
      const tier = celebrationFor(result.amount, ticket.price);
      if (tier) setCelebration({ tier, amount: result.amount });
      else if (levelFromXp(useGame.getState().save.xp).level > levelBeforeBuy.current) void considerStoreReview();
    } else if (levelFromXp(useGame.getState().save.xp).level > levelBeforeBuy.current) {
      void considerStoreReview();
    }
  }

  const revealedRatio = mask.filter(Boolean).length / mask.length;
  useEffect(() => {
    if (!owned || settled || revealedRatio < 0.99) return;
    settle(true);
  }, [revealedRatio, settled, owned]);

  if (!ticket) {
    return (
      <Screen back>
        <Display>Ticket missing</Display>
      </Screen>
    );
  }

  return (
    <Screen padded={false} bottomInset back>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} style={[styles.cardTitle, { color: theme.colors.text, fontFamily: look.displayFont, fontSize: 22 * Math.max(look.displayScale, 0.62) }]}>{ticket.name}</Text>
          <Text style={[styles.body, { color: theme.colors.muted }]}>{formatCoins(ticket.price)} coins</Text>
        </View>
        <CoinPill amount={coins} onPress={() => router.push('/shop')} />
      </View>
      <Text style={[styles.body, { color: theme.colors.muted, paddingHorizontal: 16 }]}>{ticket.blurb} Drag a finger across the foil.</Text>
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}

      <View
        style={[styles.ticket, { borderColor: look.id === 'classic' ? theme.colors.gold : look.accent, backgroundColor: theme.colors.card, borderRadius: Math.max(8, look.frameRadius) }]}
        onLayout={(event) => setBoard({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
        onStartShouldSetResponder={() => !!held && !settled}
        onMoveShouldSetResponder={() => !!held && !settled}
        onResponderGrant={(event) => {
          const point = { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY };
          lastPoint.current = point;
          revealAt(point.x, point.y);
        }}
        onResponderMove={(event) => {
          const point = { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY };
          const prev = lastPoint.current;
          if (prev) {
            const steps = 4;
            for (let i = 1; i <= steps; i++) {
              revealAt(prev.x + ((point.x - prev.x) * i) / steps, prev.y + ((point.y - prev.y) * i) / steps);
            }
          } else revealAt(point.x, point.y);
          lastPoint.current = point;
        }}
      >
        {held ? <TicketFace presentation={held} revealed={revealedRatio >= REVEAL_AT || settled} /> : (
          <View style={styles.unbought}>
            <Text style={[styles.cardTitle, { color: theme.colors.gold }]}>Sealed</Text>
            <Muted center>Buy the ticket and the result is fixed before you scratch.</Muted>
          </View>
        )}
        {held && !settled && revealedRatio < 0.99
          ? mask.map((open, index) =>
              open ? null : (
                <View
                  key={index}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: (index % COLS) * (board.width / COLS),
                    top: Math.floor(index / COLS) * (board.height / ROWS),
                    width: board.width / COLS + 1,
                    height: board.height / ROWS + 1,
                    backgroundColor:
                      look.id === 'classic'
                        ? (Math.floor(index / COLS) + (index % COLS)) % 2 === 0
                          ? theme.colors.foil1
                          : theme.colors.foil2
                        : (Math.floor(index / COLS) + (index % COLS)) % 2 === 0
                          ? look.foil[0]
                          : look.foil[1],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FoilMark mark={look.foilMark} index={index} />
                </View>
              ),
            )
          : null}
      </View>

      <View style={{ padding: 16, gap: 8 }}>
        {held && !settled ? (
          <GhostButton label="Reveal the rest" onPress={() => setMask(Array(COLS * ROWS).fill(true))} />
        ) : (
          <GoldButton label={`${settled ? 'Buy another' : 'Buy'} for ${formatCoins(ticket.price)}`} onPress={buy} />
        )}
        {settled && held ? (
          <Text style={[styles.result, { color: held.prize > 0 ? theme.colors.gold : theme.colors.muted }]}>
            {held.prize > 0 ? `${held.headline} · +${formatCoins(held.prize)}` : held.headline}
          </Text>
        ) : null}
        <LegalLine />
      </View>
      {celebration ? <BigWin tier={celebration.tier} amount={celebration.amount} theme={theme} onDone={() => { setCelebration(null); void considerStoreReview(); }} /> : null}
    </Screen>
  );
}

function FoilMark({ mark, index }: { mark: GameStyle['foilMark']; index: number }) {
  if (mark === 'none') return null;
  if (mark === 'bubble' && index % 3 !== 0) return null;
  if (mark === 'flake' && index % 4 !== 0) return null;
  if (mark === 'star' && index % 5 !== 0) return null;
  const round = mark === 'bubble' || mark === 'flake' || mark === 'star';
  return (
    <View
      style={{
        width: mark === 'pixel' ? 4 : 7,
        height: mark === 'stripe' ? 2 : mark === 'pixel' ? 4 : 7,
        borderRadius: round ? 8 : 0,
        backgroundColor: 'rgba(255,255,255,0.7)',
        transform: mark === 'stripe' ? [{ rotate: '40deg' }] : undefined,
      }}
    />
  );
}

function TicketFace({ presentation, revealed }: { presentation: ScratchPresentation; revealed: boolean }) {
  const theme = useTheme();
  if (presentation.style === 'rows' && presentation.rows) {
    return (
      <View style={{ padding: 12, gap: 8 }}>
        {presentation.rows.map((row, index) => (
          <View key={index} style={styles.rowLine}>
            {row.icons.map((icon, iconIndex) => (
              <SymbolTile key={iconIndex} icon={icon} size={54} hot={revealed && row.matched} />
            ))}
            <Text style={[styles.price, { color: theme.colors.gold }]}>{row.prize > 0 ? formatCoins(row.prize) : '—'}</Text>
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={styles.grid}>
      {presentation.cells?.map((cell, index) => (
        <View key={index} style={styles.cell}>
          <SymbolTile icon={cell.icon} size={58} hot={revealed && !!cell.matched} />
          {cell.value > 0 ? <Text style={[styles.cellValue, { color: theme.colors.gold }]}>{formatCoins(cell.value)}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
  cardTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 18 },
  body: { fontFamily: 'Outfit_400Regular', fontSize: 13, lineHeight: 18 },
  price: { fontFamily: 'SpaceMono', fontSize: 13, marginTop: 4 },
  swatch: { width: 14, height: 48, borderRadius: 8 },
  ticket: { marginLeft: 28, marginRight: 16, minHeight: 280, borderWidth: 2, borderRadius: 18, overflow: 'hidden' },
  unbought: { padding: 24, gap: 8, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 8 },
  cell: { alignItems: 'center' },
  cellValue: { fontFamily: 'SpaceMono', fontSize: 11, marginTop: -4 },
  rowLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  error: { textAlign: 'center', fontFamily: 'Outfit_500Medium', paddingHorizontal: 16 },
  result: { textAlign: 'center', fontFamily: 'Outfit_700Bold', fontSize: 16 },
});
