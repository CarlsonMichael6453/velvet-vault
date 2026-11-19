import { ReactNode } from 'react';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import type { Theme } from '@/src/theme/themes';

type GlyphProps = { size: number; color: string; accent: string };

function Frame({ size, children }: { size: number; children: ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {children}
    </Svg>
  );
}

export function SymbolGlyph({ name, size, color, accent }: { name: string } & GlyphProps) {
  switch (name) {
    case 'cherry':
      return (
        <Frame size={size}>
          <Path d="M34 30 C34 16 48 14 50 6" stroke={accent} strokeWidth={3} fill="none" strokeLinecap="round" />
          <Ellipse cx={46} cy={14} rx={8} ry={4} fill={accent} />
          <Circle cx={24} cy={40} r={12} fill={color} />
          <Circle cx={40} cy={38} r={11} fill={accent} />
          <Circle cx={20} cy={36} r={3} fill="#fff" opacity={0.35} />
        </Frame>
      );
    case 'lemon':
      return (
        <Frame size={size}>
          <Ellipse cx={32} cy={36} rx={18} ry={14} fill={color} />
          <Ellipse cx={32} cy={36} rx={10} ry={7} fill={accent} opacity={0.9} />
          <Path d="M32 22 C36 12 44 12 46 8" stroke={accent} strokeWidth={3} fill="none" strokeLinecap="round" />
        </Frame>
      );
    case 'plum':
      return (
        <Frame size={size}>
          <Circle cx={32} cy={36} r={16} fill={color} />
          <Path d="M32 20 C34 10 44 12 46 6" stroke={accent} strokeWidth={3} fill="none" strokeLinecap="round" />
          <Ellipse cx={42} cy={16} rx={7} ry={3.5} fill={accent} />
          <Circle cx={26} cy={30} r={3} fill="#fff" opacity={0.3} />
        </Frame>
      );
    case 'bell':
      return (
        <Frame size={size}>
          <Path d="M32 8 v6 M18 40 h28 l-4 6 H22 z M20 40 C18 28 22 18 32 16 C42 18 46 28 44 40" fill={color} />
          <Circle cx={32} cy={50} r={4} fill={accent} />
          <Rect x={28} y={8} width={8} height={5} rx={2} fill={accent} />
        </Frame>
      );
    case 'bar':
      return (
        <Frame size={size}>
          <Rect x={8} y={22} width={48} height={20} rx={4} fill={color} />
          <SvgText x={32} y={37} fill={accent} fontSize={16} fontWeight="700" textAnchor="middle">
            BAR
          </SvgText>
        </Frame>
      );
    case 'star':
      return (
        <Frame size={size}>
          <Polygon points="32,6 39,24 58,24 42,36 48,54 32,43 16,54 22,36 6,24 25,24" fill={color} />
        </Frame>
      );
    case 'seven':
      return (
        <Frame size={size}>
          <SvgText x={32} y={48} fill={color} fontSize={42} fontWeight="700" textAnchor="middle">
            7
          </SvgText>
          <Path d="M16 16 h32" stroke={accent} strokeWidth={4} strokeLinecap="round" />
        </Frame>
      );
    case 'crown':
      return (
        <Frame size={size}>
          <Path d="M8 44 L14 22 L26 34 L32 14 L38 34 L50 22 L56 44 Z" fill={color} />
          <Rect x={10} y={44} width={44} height={8} rx={2} fill={accent} />
          <Circle cx={32} cy={14} r={3} fill={accent} />
        </Frame>
      );
    case 'wild':
      return (
        <Frame size={size}>
          <Polygon points="32,4 36,22 56,16 42,30 58,40 38,40 44,58 32,44 20,58 26,40 6,40 22,30 8,16 28,22" fill={color} />
          <SvgText x={32} y={40} fill={accent} fontSize={14} fontWeight="700" textAnchor="middle">
            W
          </SvgText>
        </Frame>
      );
    case 'vault':
      return (
        <Frame size={size}>
          <Rect x={14} y={18} width={36} height={32} rx={4} fill={color} />
          <Circle cx={32} cy={34} r={8} fill="none" stroke={accent} strokeWidth={3} />
          <Circle cx={32} cy={34} r={2.5} fill={accent} />
          <Path d="M32 10 v8" stroke={accent} strokeWidth={3} strokeLinecap="round" />
        </Frame>
      );
    case 'rose':
      return (
        <Frame size={size}>
          <Circle cx={32} cy={30} r={8} fill={accent} />
          <Circle cx={22} cy={34} r={8} fill={color} />
          <Circle cx={42} cy={34} r={8} fill={color} />
          <Circle cx={27} cy={22} r={7} fill={color} />
          <Circle cx={38} cy={22} r={7} fill={color} />
          <Path d="M32 40 v16" stroke={accent} strokeWidth={3} />
        </Frame>
      );
    case 'glass':
      return (
        <Frame size={size}>
          <Path d="M16 12 h32 l-8 22 h-16 z" fill={color} />
          <Path d="M32 34 v16 M22 52 h20" stroke={accent} strokeWidth={3} strokeLinecap="round" />
          <Circle cx={40} cy={18} r={3} fill={accent} />
        </Frame>
      );
    case 'dice':
      return (
        <Frame size={size}>
          <Rect x={14} y={14} width={36} height={36} rx={8} fill={color} />
          <Circle cx={26} cy={26} r={3} fill={accent} />
          <Circle cx={38} cy={26} r={3} fill={accent} />
          <Circle cx={32} cy={32} r={3} fill={accent} />
          <Circle cx={26} cy={38} r={3} fill={accent} />
          <Circle cx={38} cy={38} r={3} fill={accent} />
        </Frame>
      );
    case 'bolt':
      return (
        <Frame size={size}>
          <Polygon points="36,4 16,36 30,36 26,60 50,26 34,26" fill={color} />
        </Frame>
      );
    case 'scarab':
      return (
        <Frame size={size}>
          <Ellipse cx={32} cy={36} rx={16} ry={18} fill={color} />
          <Ellipse cx={32} cy={20} rx={8} ry={6} fill={accent} />
          <Path d="M32 24 v28" stroke={accent} strokeWidth={2} />
        </Frame>
      );
    case 'eye':
      return (
        <Frame size={size}>
          <Path d="M6 32 Q32 10 58 32 Q32 54 6 32 Z" fill={color} />
          <Circle cx={32} cy={32} r={8} fill={accent} />
          <Circle cx={32} cy={32} r={3} fill="#1a1208" />
        </Frame>
      );
    case 'ankh':
      return (
        <Frame size={size}>
          <Circle cx={32} cy={16} r={9} fill="none" stroke={color} strokeWidth={4} />
          <Path d="M32 24 v32 M18 36 h28" stroke={color} strokeWidth={4} strokeLinecap="round" />
        </Frame>
      );
    case 'cat':
      return (
        <Frame size={size}>
          <Circle cx={32} cy={36} r={14} fill={color} />
          <Polygon points="18,28 14,12 28,24" fill={color} />
          <Polygon points="46,28 50,12 36,24" fill={color} />
          <Circle cx={26} cy={36} r={2} fill={accent} />
          <Circle cx={38} cy={36} r={2} fill={accent} />
        </Frame>
      );
    case 'vase':
      return (
        <Frame size={size}>
          <Path d="M24 16 h16 l4 8 c8 4 10 16 4 28 H20 c-6-12-4-24 4-28 z" fill={color} />
          <Path d="M26 16 h12" stroke={accent} strokeWidth={3} />
        </Frame>
      );
    case 'pharaoh':
      return (
        <Frame size={size}>
          <Path d="M32 8 L50 20 V52 H14 V20 Z" fill={color} />
          <Rect x={24} y={28} width={16} height={12} rx={4} fill={accent} />
          <Path d="M18 20 h28" stroke={accent} strokeWidth={3} />
        </Frame>
      );
    case 'coin':
      return (
        <Frame size={size}>
          <Circle cx={32} cy={32} r={20} fill={color} />
          <Circle cx={32} cy={32} r={13} fill="none" stroke={accent} strokeWidth={3} />
          <SvgText x={32} y={38} fill={accent} fontSize={16} fontWeight="700" textAnchor="middle">
            V
          </SvgText>
        </Frame>
      );
    case 'fan':
      return (
        <Frame size={size}>
          <Path d="M32 58 L12 28 Q32 8 52 28 Z" fill={color} />
          <Path d="M32 58 L32 24" stroke={accent} strokeWidth={2} />
          <Path d="M32 30 L18 34 M32 30 L46 34" stroke={accent} strokeWidth={2} />
        </Frame>
      );
    case 'lantern':
      return (
        <Frame size={size}>
          <Rect x={22} y={16} width={20} height={32} rx={6} fill={color} />
          <Path d="M28 12 h8 M24 48 h16" stroke={accent} strokeWidth={3} strokeLinecap="round" />
          <Circle cx={32} cy={30} r={4} fill={accent} />
        </Frame>
      );
    case 'koi':
      return (
        <Frame size={size}>
          <Ellipse cx={34} cy={32} rx={16} ry={9} fill={color} />
          <Polygon points="14,32 4,22 8,32 4,42" fill={accent} />
          <Circle cx={42} cy={30} r={2} fill="#1a1208" />
        </Frame>
      );
    case 'drum':
      return (
        <Frame size={size}>
          <Ellipse cx={32} cy={24} rx={18} ry={8} fill={accent} />
          <Path d="M14 24 v18 c0 8 36 8 36 0 V24" fill={color} />
          <Ellipse cx={32} cy={42} rx={18} ry={7} fill={color} />
        </Frame>
      );
    case 'dragon':
      return (
        <Frame size={size}>
          <Path d="M8 40 C18 18 30 16 36 28 C42 14 58 18 52 36 C60 40 54 54 40 48 C36 58 20 56 22 44 C10 50 6 46 8 40 Z" fill={color} />
          <Circle cx={46} cy={30} r={2} fill={accent} />
        </Frame>
      );
    case 'comet':
      return (
        <Frame size={size}>
          <Polygon points="58,32 18,18 28,32 18,46" fill={accent} opacity={0.85} />
          <Circle cx={22} cy={32} r={10} fill={color} />
        </Frame>
      );
    case 'moon':
      return (
        <Frame size={size}>
          <Circle cx={28} cy={32} r={16} fill={color} />
          <Circle cx={38} cy={28} r={13} fill={accent} />
        </Frame>
      );
    case 'planet':
      return (
        <Frame size={size}>
          <Ellipse cx={32} cy={34} rx={20} ry={7} fill="none" stroke={accent} strokeWidth={3} />
          <Circle cx={32} cy={32} r={12} fill={color} />
        </Frame>
      );
    case 'asteroid':
      return (
        <Frame size={size}>
          <Polygon points="32,8 50,20 54,40 40,56 18,50 10,28 20,14" fill={color} />
          <Circle cx={28} cy={30} r={4} fill={accent} />
        </Frame>
      );
    case 'gem':
      return (
        <Frame size={size}>
          <Polygon points="32,6 54,24 32,58 10,24" fill={color} />
          <Polygon points="32,6 22,24 32,24 42,24" fill={accent} opacity={0.8} />
        </Frame>
      );
    case 'heart':
      return (
        <Frame size={size}>
          <Path d="M32 54 C8 36 8 18 20 14 C28 12 32 18 32 18 C32 18 36 12 44 14 C56 18 56 36 32 54 Z" fill={color} />
        </Frame>
      );
    case 'spade':
      return (
        <Frame size={size}>
          <Path d="M32 8 C18 24 10 30 14 42 C18 50 26 48 32 40 C38 48 46 50 50 42 C54 30 46 24 32 8 Z" fill={color} />
          <Path d="M32 40 v14 M24 54 h16" stroke={accent} strokeWidth={3} strokeLinecap="round" />
        </Frame>
      );
    case 'club':
      return (
        <Frame size={size}>
          <Circle cx={32} cy={22} r={9} fill={color} />
          <Circle cx={20} cy={36} r={9} fill={color} />
          <Circle cx={44} cy={36} r={9} fill={color} />
          <Path d="M32 36 v16 M24 54 h16" stroke={accent} strokeWidth={3} strokeLinecap="round" />
        </Frame>
      );
    default:
      return (
        <Frame size={size}>
          <Circle cx={32} cy={32} r={18} fill={color} />
          <SvgText x={32} y={40} fill={accent} fontSize={20} fontWeight="700" textAnchor="middle">
            {name.slice(0, 1).toUpperCase()}
          </SvgText>
        </Frame>
      );
  }
}

export function tilePalette(icon: string, theme: Theme): { from: string; to: string; ink: string; edge: string } {
  const gold = { from: '#4a3414', to: '#c4963a', ink: '#fff6d8', edge: theme.colors.gold };
  const mid = { from: '#12352e', to: '#1f8f78', ink: '#e9fff8', edge: theme.colors.accent2 };
  const low = { from: '#3a1522', to: '#8a3148', ink: '#ffe4ec', edge: 'rgba(255,255,255,0.2)' };
  const wild = { from: '#40145c', to: '#d6a23a', ink: '#fff8e8', edge: '#ffe7a0' };
  const scatter = { from: '#10283f', to: theme.colors.accent, ink: '#ffffff', edge: theme.colors.gold };
  if (icon === 'wild') return wild;
  if (icon === 'vault') return scatter;
  if (['crown', 'seven', 'pharaoh', 'dragon', 'gem', 'heart'].includes(icon)) return gold;
  if (['bell', 'star', 'dice', 'cat', 'koi', 'planet', 'drum', 'bolt'].includes(icon)) return mid;
  return low;
}

export function VaultMark({ size = 36, color = '#f0d78c' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect x={6} y={10} width={52} height={44} rx={8} fill="none" stroke={color} strokeWidth={3} />
      <Circle cx={32} cy={32} r={10} fill="none" stroke={color} strokeWidth={3} />
      <Path d="M32 26 v12 M28 34 l4 4 6-8" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Path d="M18 10 v-0 M16 18 h4 M44 18 h4" stroke={color} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

export function CoinIcon({ size = 18, color = '#f0d78c' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx={16} cy={16} r={14} fill={color} />
      <Circle cx={16} cy={16} r={10} fill="none" stroke="#6a4a16" strokeWidth={1.6} />
      <SvgText x={16} y={21} fill="#6a4a16" fontSize={12} fontWeight="700" textAnchor="middle">
        V
      </SvgText>
    </Svg>
  );
}
