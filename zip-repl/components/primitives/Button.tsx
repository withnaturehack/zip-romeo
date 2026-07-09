// RJ-APP/components/primitives/Button.tsx
import { ReactNode, useState } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRJTheme } from '@/theme/useRJTheme';

type BtnProps = {
  children: ReactNode;
  onPress?: () => void;
  full?: boolean;
  style?: ViewStyle | ViewStyle[];
};

export function PrimaryButton({ children, onPress, full = true, style }: BtnProps) {
  const { c, f, d } = useRJTheme();
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPressIn={() => { setPressed(true); Haptics.selectionAsync(); }}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={[{
        backgroundColor: pressed ? c.forestDk : c.forest,
        paddingVertical: Math.round(d.pad * 0.7),
        paddingHorizontal: d.pad * 1.4,
        alignSelf: full ? 'stretch' : 'flex-start',
        alignItems: 'center',
      }, style]}
    >
      <Text style={{
        color: c.bg, fontFamily: f.mono, fontSize: d.mono + 1,
        letterSpacing: (d.mono + 1) * 0.22, textTransform: 'uppercase',
      }}>{children}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ children, onPress, full = true, style }: BtnProps) {
  const { c, f, d } = useRJTheme();
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPressIn={() => { setPressed(true); Haptics.selectionAsync(); }}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={[{
        backgroundColor: pressed ? c.forest : 'transparent',
        borderColor: c.forest, borderWidth: 1,
        paddingVertical: Math.round(d.pad * 0.7),
        paddingHorizontal: d.pad * 1.4,
        alignSelf: full ? 'stretch' : 'flex-start',
        alignItems: 'center',
      }, style]}
    >
      <Text style={{
        color: pressed ? c.bg : c.forest,
        fontFamily: f.mono, fontSize: d.mono + 1,
        letterSpacing: (d.mono + 1) * 0.22, textTransform: 'uppercase',
      }}>{children}</Text>
    </Pressable>
  );
}

export function TextLink({ children, onPress, color, style }: { children: ReactNode; onPress?: () => void; color?: string; style?: ViewStyle | ViewStyle[] }) {
  const { c, f } = useRJTheme();
  return (
    <Pressable onPress={onPress} style={[styles.link, style]}>
      <Text style={{
        color: color ?? c.forest, fontFamily: f.mono, fontSize: 10,
        letterSpacing: 2.2, textTransform: 'uppercase',
      }}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { alignSelf: 'flex-start', paddingVertical: 2 },
});
