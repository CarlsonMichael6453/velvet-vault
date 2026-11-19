import { getTheme, type Theme } from '@/src/theme/themes';
import { useGame } from '@/src/store/gameStore';

export function useTheme(): Theme {
  const id = useGame((state) => state.save.activeTheme);
  return getTheme(id);
}
