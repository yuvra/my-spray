/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#2A1215',
    background: '#FFF6F4',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#FCE4E0',
    textSecondary: '#6B4A4F',
    primary: '#9B1B30',
    primaryLight: '#C41E3A',
    accent: '#C9A227',
    danger: '#B91C1C',
    warning: '#D97706',
    success: '#3D6B35',
    card: '#FFFFFF',
    border: '#F0D4D0',
    chart1: '#9B1B30',
    chart2: '#C41E3A',
    chart3: '#C9A227',
    chart4: '#3D6B35',
  },
  dark: {
    text: '#FFF5F3',
    background: '#1A0A0D',
    backgroundElement: '#2A1418',
    backgroundSelected: '#3D1A22',
    textSecondary: '#C9A8AD',
    primary: '#E8486A',
    primaryLight: '#FF6B85',
    accent: '#E9C46A',
    danger: '#F87171',
    warning: '#FBBF24',
    success: '#6B9B62',
    card: '#2A1418',
    border: '#4A2830',
    chart1: '#E8486A',
    chart2: '#FF6B85',
    chart3: '#E9C46A',
    chart4: '#6B9B62',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
