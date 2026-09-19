/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Accent palette for the journey dashboard: indigo for the trail, gold for the destination. */
export const JourneyColors = {
  light: {
    accent: '#5B5BD6',
    accentSoft: 'rgba(91, 91, 214, 0.16)',
    accentGlow: 'rgba(91, 91, 214, 0.08)',
    gold: '#E8A020',
    goldSoft: 'rgba(232, 160, 32, 0.18)',
    goldGlow: 'rgba(232, 160, 32, 0.09)',
    onAccent: '#ffffff',
    track: '#E0E1E6',
  },
  dark: {
    accent: '#8E8CFF',
    accentSoft: 'rgba(142, 140, 255, 0.22)',
    accentGlow: 'rgba(142, 140, 255, 0.10)',
    gold: '#F5C05C',
    goldSoft: 'rgba(245, 192, 92, 0.22)',
    goldGlow: 'rgba(245, 192, 92, 0.10)',
    onAccent: '#0B0B14',
    track: '#2E3135',
  },
} as const;

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
export const DesktopBreakpoint = 768;
export const WebTabBarHeight = 56;
