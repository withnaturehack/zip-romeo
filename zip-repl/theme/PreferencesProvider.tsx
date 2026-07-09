import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import type { DensityKey } from './tokens';

export type Preferences = { dark: boolean; density: DensityKey };
const DEFAULTS: Preferences = { dark: false, density: 'comfortable' };

type PrefsCtx = {
  prefs: Preferences;
  loaded: boolean;
  update: (next: Partial<Preferences>) => Promise<void>;
};

const PrefsContext = createContext<PrefsCtx>({
  prefs: DEFAULTS,
  loaded: false,
  update: async () => {},
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [d, den] = await Promise.all([
          storage.getItem('rj.theme.dark'),
          storage.getItem('rj.theme.density'),
        ]);
        setPrefs({ dark: d === '1', density: (den as DensityKey) ?? DEFAULTS.density });
      } catch {
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const update = async (next: Partial<Preferences>) => {
    setPrefs(p => ({ ...p, ...next }));
    try {
      if (next.dark !== undefined) await storage.setItem('rj.theme.dark', next.dark ? '1' : '0');
      if (next.density !== undefined) await storage.setItem('rj.theme.density', next.density);
    } catch {}
  };

  return <PrefsContext.Provider value={{ prefs, loaded, update }}>{children}</PrefsContext.Provider>;
}

export function usePreferences() {
  return useContext(PrefsContext);
}
