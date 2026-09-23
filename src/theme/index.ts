import {useColorScheme} from 'react-native';

export interface Theme {
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
  };
  spacing: (n: number) => number;
  radius: {sm: number; md: number; lg: number};
}

const base = {
  spacing: (n: number) => n * 4,
  radius: {sm: 6, md: 10, lg: 14},
};

export const lightTheme: Theme = {
  ...base,
  dark: false,
  colors: {
    background: '#ffffff',
    surface: '#fafafa',
    surfaceElevated: '#ffffff',
    border: '#eaeaea',
    textPrimary: '#111111',
    textSecondary: '#444444',
    textMuted: '#888888',
    accent: '#0070f3',
    success: '#17c964',
    warning: '#f5a623',
    danger: '#e5484d',
    info: '#51a2ff',
  },
};

export const darkTheme: Theme = {
  ...base,
  dark: true,
  colors: {
    background: '#000000',
    surface: '#111111',
    surfaceElevated: '#1a1a1a',
    border: '#2a2a2a',
    textPrimary: '#ededed',
    textSecondary: '#b0b0b0',
    textMuted: '#666666',
    accent: '#0070f3',
    success: '#17c964',
    warning: '#f5a623',
    danger: '#e5484d',
    info: '#51a2ff',
  },
};

/** Resolve a theme from a stored mode + system scheme. */
export function resolveTheme(mode: 'light' | 'dark' | 'system', systemDark: boolean | null): Theme {
  const dark = mode === 'dark' || (mode === 'system' && systemDark === true);
  return dark ? darkTheme : lightTheme;
}
