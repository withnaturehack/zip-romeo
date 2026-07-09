// RJ-APP/theme/tokens.ts

export type RJColors = {
  bg: string; bgAlt: string; bgCard: string; bgSunken: string; bgParchment: string;
  ink: string; inkSoft: string; inkMuted: string;
  forest: string; forestDk: string; forestLight: string;
  indigo: string; gold: string; goldLight: string; goldDim: string; danger: string;
  rule: string; ruleSoft: string; rulePaper: string;
  wax: string; waxDeep: string; waxGlow: string;
};

// Full warm cream / parchment — no olive, no two-tone
export const RJ_LIGHT: RJColors = {
  bg:           '#F2E8D0',   // warm parchment — main background
  bgAlt:        '#EAE0C4',   // slightly deeper parchment
  bgCard:       '#FAF5EB',   // near-white cream — letter cards, panels
  bgSunken:     '#E4D8BE',   // recessed wells, inputs
  bgParchment:  '#EDE2C6',   // aged paper tone for letter bodies
  ink:          '#2A2518',   // dark espresso — primary text
  inkSoft:      '#52493A',   // secondary text
  inkMuted:     'rgba(42,37,24,0.48)',
  forest:       '#4A6020',   // deep forest green — accent
  forestDk:     '#364416',
  forestLight:  '#7E9A44',
  indigo:       '#272040',   // deep indigo — user bubbles
  gold:         '#AE8A4A',
  goldLight:    '#CAA666',
  goldDim:      'rgba(174,138,74,0.18)',
  danger:       '#8B2E2E',
  rule:         'rgba(42,37,24,0.14)',
  ruleSoft:     'rgba(42,37,24,0.07)',
  rulePaper:    'rgba(42,37,24,0.04)',
  wax:          '#2E4A12',   // dark forest green seal — matches reference image
  waxDeep:      '#1C3008',
  waxGlow:      '#537A22',
};

export const RJ_DARK: RJColors = {
  bg:           '#181510',
  bgAlt:        '#201C15',
  bgCard:       '#26201A',
  bgSunken:     '#131009',
  bgParchment:  '#2C2519',
  ink:          '#F0E6CC',
  inkSoft:      '#C8BAA0',
  inkMuted:     'rgba(240,230,204,0.55)',
  forest:       '#8FA05C',
  forestDk:     '#A5B872',
  forestLight:  '#B3C680',
  indigo:       '#B8B0DC',
  gold:         '#D4B98A',
  goldLight:    '#E5CFA4',
  goldDim:      'rgba(212,185,138,0.18)',
  danger:       '#D48080',
  rule:         'rgba(212,185,138,0.18)',
  ruleSoft:     'rgba(212,185,138,0.08)',
  rulePaper:    'rgba(212,185,138,0.04)',
  wax:          '#A03838',
  waxDeep:      '#722525',
  waxGlow:      '#C84848',
};

export const RJ_FONTS = {
  serif:  'CormorantGaramond_400Regular',
  serifI: 'CormorantGaramond_400Regular_Italic',
  serifM: 'CormorantGaramond_500Medium',
  serifSB: 'CormorantGaramond_600SemiBold',
  body:   'EBGaramond_400Regular',
  bodyI:  'EBGaramond_400Regular_Italic',
  mono:   'JetBrainsMono_400Regular',
  script: 'Caveat_400Regular',
} as const;

export type RJDensity = {
  pad: number; gap: number;
  hero: number; headline: number; body: number; mono: number;
};

export const RJ_DENSITY: Record<'compact' | 'comfortable' | 'spacious', RJDensity> = {
  compact:     { pad: 16, gap: 12, hero: 36, headline: 22, body: 14, mono: 8 },
  comfortable: { pad: 20, gap: 16, hero: 44, headline: 26, body: 15, mono: 9 },
  spacious:    { pad: 24, gap: 20, hero: 52, headline: 30, body: 16, mono: 10 },
};

export type DensityKey = keyof typeof RJ_DENSITY;
