import { createContext, ReactNode, useMemo } from 'react';
import { RJ_LIGHT, RJ_DARK, RJ_FONTS, RJ_DENSITY, RJColors, RJDensity, DensityKey } from './tokens';

export type RJThemeFonts = Record<keyof typeof RJ_FONTS, string>;

export type RJThemeValue = {
  c: RJColors;
  f: RJThemeFonts;
  d: RJDensity;
  dark: boolean;
  density: DensityKey;
};

export const RJThemeContext = createContext<RJThemeValue>({
  c: RJ_LIGHT,
  f: RJ_FONTS,
  d: RJ_DENSITY.comfortable,
  dark: false,
  density: 'comfortable',
});

export function ThemeProvider({
  dark,
  density,
  fonts = RJ_FONTS,
  children,
}: {
  dark: boolean;
  density: DensityKey;
  fonts?: RJThemeFonts;
  children: ReactNode;
}) {
  const value = useMemo<RJThemeValue>(
    () => ({
      c: dark ? RJ_DARK : RJ_LIGHT,
      f: fonts,
      d: RJ_DENSITY[density],
      dark,
      density,
    }),
    [dark, density, fonts]
  );
  return <RJThemeContext.Provider value={value}>{children}</RJThemeContext.Provider>;
}
