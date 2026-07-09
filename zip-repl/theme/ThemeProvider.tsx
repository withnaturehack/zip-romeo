import { createContext, ReactNode, useMemo } from 'react';
import { RJ_LIGHT, RJ_DARK, RJ_FONTS, RJ_DENSITY, RJColors, RJDensity, DensityKey } from './tokens';

export type RJThemeValue = {
  c: RJColors;
  f: typeof RJ_FONTS;
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
  children,
}: {
  dark: boolean;
  density: DensityKey;
  children: ReactNode;
}) {
  const value = useMemo<RJThemeValue>(
    () => ({
      c: dark ? RJ_DARK : RJ_LIGHT,
      f: RJ_FONTS,
      d: RJ_DENSITY[density],
      dark,
      density,
    }),
    [dark, density]
  );
  return <RJThemeContext.Provider value={value}>{children}</RJThemeContext.Provider>;
}
