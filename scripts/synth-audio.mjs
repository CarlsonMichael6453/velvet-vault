import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 22050;
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');
mkdirSync(root, { recursive: true });

function encodeWav(samples) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SR, 24);
  buffer.writeUInt32LE(SR * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE((sample * 32767) | 0, 44 + i * 2);
  }
  return buffer;
}

function envAt(t, attack, decay) {
  const a = Math.min(1, t / attack);
  return a * Math.exp(-t / decay);
}

function tone({ freq, dur, gain = 0.3, wave = 'sine', attack = 0.01, decay = 0.15, slide = 0 }) {
  const n = Math.max(1, Math.floor(SR * dur));
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = freq + slide * t;
    const phase = 2 * Math.PI * f * t;
    let s = Math.sin(phase);
    if (wave === 'square') s = Math.sign(Math.sin(phase));
    if (wave === 'tri') s = 2 * Math.abs(((f * t) % 1) * 2 - 1) - 1;
    if (wave === 'noise') s = Math.random() * 2 - 1;
    out[i] = s * envAt(t, attack, decay) * gain;
  }
  return out;
}

function mix(parts) {
  const length = parts.reduce((max, part) => Math.max(max, part.offset + part.samples.length), 0);
  const out = new Float32Array(length);
  for (const part of parts) {
    for (let i = 0; i < part.samples.length; i++) out[part.offset + i] += part.samples[i];
  }
  let peak = 0;
  for (const sample of out) peak = Math.max(peak, Math.abs(sample));
  if (peak > 0.95) {
    const gain = 0.95 / peak;
    for (let i = 0; i < out.length; i++) out[i] *= gain;
  }
  return out;
}

function at(offsetSec, samples) {
  return { offset: Math.floor(offsetSec * SR), samples };
}

function save(name, samples) {
  writeFileSync(join(root, name), encodeWav(samples));
}

function loopPad(seconds, voices) {
  const n = Math.floor(SR * seconds);
  const out = new Float32Array(n);
  for (const voice of voices) {
    const cycles = Math.max(1, Math.round(voice.freq * seconds));
    const freq = cycles / seconds;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const lfo = 0.78 + 0.22 * Math.sin((2 * Math.PI * 2 * t) / seconds);
      const phase = 2 * Math.PI * freq * t;
      const sine = Math.sin(phase);
      const soft = voice.wave === 'bell' ? sine * (0.7 + 0.3 * Math.sin(phase * 2)) : sine;
      out[i] += soft * voice.gain * lfo;
    }
  }
  let peak = 0;
  for (const sample of out) peak = Math.max(peak, Math.abs(sample));
  const gain = peak > 0 ? 0.42 / peak : 1;
  for (let i = 0; i < n; i++) out[i] *= gain;
  return out;
}

save('tap.wav', tone({ freq: 880, dur: 0.06, gain: 0.25, decay: 0.04 }));
save('tick.wav', tone({ freq: 1480, dur: 0.04, gain: 0.18, decay: 0.025 }));
save('stop.wav', mix([at(0, tone({ freq: 180, dur: 0.09, gain: 0.4, decay: 0.04, wave: 'tri' })), at(0.02, tone({ freq: 90, dur: 0.08, gain: 0.25, decay: 0.05 }))]));
save(
  'spin.wav',
  mix([
    at(0, tone({ freq: 220, dur: 0.45, gain: 0.2, slide: 700, decay: 0.4, attack: 0.02, wave: 'tri' })),
    at(0, tone({ freq: 440, dur: 0.35, gain: 0.08, slide: 400, decay: 0.3, wave: 'noise' })),
  ]),
);
save(
  'win.wav',
  mix([
    at(0, tone({ freq: 523, dur: 0.18, gain: 0.28, decay: 0.12 })),
    at(0.1, tone({ freq: 659, dur: 0.18, gain: 0.28, decay: 0.12 })),
    at(0.2, tone({ freq: 784, dur: 0.28, gain: 0.3, decay: 0.18 })),
  ]),
);
save(
  'bigwin.wav',
  mix([
    at(0, tone({ freq: 392, dur: 0.3, gain: 0.25, decay: 0.2 })),
    at(0.12, tone({ freq: 523, dur: 0.3, gain: 0.28, decay: 0.2 })),
    at(0.24, tone({ freq: 659, dur: 0.3, gain: 0.28, decay: 0.2 })),
    at(0.38, tone({ freq: 784, dur: 0.45, gain: 0.32, decay: 0.28 })),
    at(0.38, tone({ freq: 1046, dur: 0.45, gain: 0.16, decay: 0.28 })),
  ]),
);
save(
  'megawin.wav',
  mix([
    at(0, tone({ freq: 311, dur: 0.4, gain: 0.24, decay: 0.25 })),
    at(0.16, tone({ freq: 392, dur: 0.4, gain: 0.24, decay: 0.25 })),
    at(0.32, tone({ freq: 523, dur: 0.4, gain: 0.26, decay: 0.25 })),
    at(0.5, tone({ freq: 659, dur: 0.55, gain: 0.28, decay: 0.35 })),
    at(0.68, tone({ freq: 880, dur: 0.6, gain: 0.24, decay: 0.35 })),
  ]),
);
save(
  'fanfare.wav',
  mix([
    at(0, tone({ freq: 523, dur: 0.25, gain: 0.28, decay: 0.16 })),
    at(0.18, tone({ freq: 659, dur: 0.25, gain: 0.28, decay: 0.16 })),
    at(0.36, tone({ freq: 784, dur: 0.25, gain: 0.28, decay: 0.16 })),
    at(0.54, tone({ freq: 1046, dur: 0.7, gain: 0.32, decay: 0.4 })),
    at(0.54, tone({ freq: 784, dur: 0.7, gain: 0.16, decay: 0.4 })),
  ]),
);
save('coin.wav', mix([at(0, tone({ freq: 1318, dur: 0.12, gain: 0.22, decay: 0.08 })), at(0.06, tone({ freq: 1760, dur: 0.16, gain: 0.18, decay: 0.1 }))]));
save('scratch.wav', tone({ freq: 800, dur: 0.07, gain: 0.16, decay: 0.04, wave: 'noise' }));
save('ball.wav', tone({ freq: 420, dur: 0.12, gain: 0.3, decay: 0.06, wave: 'sine' }));
save(
  'unlock.wav',
  mix([
    at(0, tone({ freq: 660, dur: 0.16, gain: 0.24, decay: 0.1 })),
    at(0.1, tone({ freq: 880, dur: 0.16, gain: 0.24, decay: 0.1 })),
    at(0.2, tone({ freq: 1174, dur: 0.28, gain: 0.26, decay: 0.16 })),
  ]),
);
save('whoosh.wav', tone({ freq: 300, dur: 0.28, gain: 0.18, slide: -200, decay: 0.18, wave: 'noise' }));

const beds = {
  'velvet.wav': [
    { freq: 146.83, gain: 0.5 },
    { freq: 174.61, gain: 0.28 },
    { freq: 220, gain: 0.34 },
    { freq: 293.66, gain: 0.12 },
  ],
  'midnight.wav': [
    { freq: 130.81, gain: 0.5 },
    { freq: 155.56, gain: 0.28 },
    { freq: 196, gain: 0.22 },
    { freq: 261.63, gain: 0.1 },
  ],
  'sunset.wav': [
    { freq: 164.81, gain: 0.46 },
    { freq: 196, gain: 0.3 },
    { freq: 246.94, gain: 0.28 },
    { freq: 329.63, gain: 0.1 },
  ],
  'neon.wav': [
    { freq: 164.81, gain: 0.34 },
    { freq: 207.65, gain: 0.24 },
    { freq: 246.94, gain: 0.22 },
    { freq: 659.25, gain: 0.08, wave: 'bell' },
  ],
  'pharaoh.wav': [
    { freq: 130.81, gain: 0.5 },
    { freq: 196, gain: 0.32 },
    { freq: 261.63, gain: 0.18 },
    { freq: 392, gain: 0.08 },
  ],
  'dragon.wav': [
    { freq: 73.42, gain: 0.55 },
    { freq: 110, gain: 0.32 },
    { freq: 146.83, gain: 0.22 },
    { freq: 220, gain: 0.1 },
  ],
  'ocean.wav': [
    { freq: 98, gain: 0.46 },
    { freq: 146.83, gain: 0.3 },
    { freq: 196, gain: 0.18 },
    { freq: 293.66, gain: 0.1 },
  ],
  'cosmos.wav': [
    { freq: 123.47, gain: 0.3 },
    { freq: 246.94, gain: 0.24 },
    { freq: 329.63, gain: 0.16 },
    { freq: 493.88, gain: 0.1, wave: 'bell' },
  ],
  'diamond.wav': [
    { freq: 293.66, gain: 0.28, wave: 'bell' },
    { freq: 369.99, gain: 0.2, wave: 'bell' },
    { freq: 440, gain: 0.18, wave: 'bell' },
    { freq: 587.33, gain: 0.08, wave: 'bell' },
  ],
};

for (const [name, voices] of Object.entries(beds)) {
  save(name, loopPad(8, voices));
}

console.log(`Wrote sounds to ${root}`);
