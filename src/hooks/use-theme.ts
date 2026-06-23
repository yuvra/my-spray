import { useMemo } from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeStore } from '@/stores/useThemeStore';

export function useTheme() {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);

  const scheme = useMemo(() => {
    if (mode === 'system') {
      return systemScheme === 'unspecified' ? 'light' : systemScheme;
    }
    return mode;
  }, [mode, systemScheme]);

  return Colors[scheme];
}

export function useResolvedColorScheme(): 'light' | 'dark' {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  if (mode === 'system') {
    return systemScheme === 'unspecified' ? 'light' : systemScheme;
  }
  return mode;
}
