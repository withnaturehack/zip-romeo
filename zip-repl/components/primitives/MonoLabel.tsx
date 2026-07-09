// RJ-APP/components/primitives/MonoLabel.tsx
import { ReactNode } from 'react';
import { Text, TextStyle } from 'react-native';
import { useRJTheme } from '@/theme/useRJTheme';

export function MonoLabel({
  children, color, size = 9, style,
}: { children: ReactNode; color?: string; size?: number; style?: TextStyle }) {
  const { c, f } = useRJTheme();
  return (
    <Text style={[{
      fontFamily: f.mono,
      fontSize: size,
      letterSpacing: size * 0.22,
      color: color ?? c.forest,
      textTransform: 'uppercase',
    }, style]}>
      {children}
    </Text>
  );
}
