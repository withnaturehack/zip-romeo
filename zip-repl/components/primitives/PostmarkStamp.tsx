// RJ-APP/components/primitives/PostmarkStamp.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useRJTheme } from '@/theme/useRJTheme';

export function PostmarkStamp({
  size = 56, rotate = -7, text = 'BY HAND',
}: { size?: number; rotate?: number; text?: string }) {
  const { c, f } = useRJTheme();
  return (
    <View style={[styles.stamp, {
      width: size, height: size, borderRadius: size / 2,
      borderColor: c.forest,
      transform: [{ rotate: `${rotate}deg` }],
      opacity: 0.6,
    }]}>
      <Text style={[styles.tiny, { fontFamily: f.mono, color: c.forest }]}>ROMEO & JULIET</Text>
      <Text style={[styles.mark, { fontFamily: f.serifI, color: c.forest }]}>R&J</Text>
      <Text style={[styles.tiny, { fontFamily: f.mono, color: c.forest }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  tiny: { fontSize: 5, letterSpacing: 0.9 },
  mark: { fontSize: 11, marginVertical: 2 },
});
