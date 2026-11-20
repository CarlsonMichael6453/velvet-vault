import { getBackground, type BackgroundDef } from '@/src/theme/backgrounds';
import { getStyle, type GameStyle } from '@/src/theme/styles';
import { getTheme, type Theme } from '@/src/theme/themes';
import { useGame } from '@/src/store/gameStore';

export function useTheme(): Theme {
  const id = useGame((state) => state.save.activeTheme);
  return getTheme(id);
}

export function useStyle(): GameStyle {
  const id = useGame((state) => state.save.activeStyle);
  return getStyle(id);
}

export function useBackground(): BackgroundDef {
  const id = useGame((state) => state.save.activeBackground);
  return getBackground(id);
}
