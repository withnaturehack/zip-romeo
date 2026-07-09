// RJ-APP/components/primitives/JulietPortrait.tsx
import { View, Text, Image, StyleSheet } from 'react-native';
import { useRJTheme } from '@/theme/useRJTheme';
const juliet = require('@/assets/juliet.png');

export function JulietPortrait({
  width = 200, height = 250, rotate = -2, label = 'Juliet, no. 02',
}: { width?: number; height?: number; rotate?: number; label?: string }) {
  const { c, f } = useRJTheme();
  return (
    <View style={[styles.mount, {
      width, height, backgroundColor: c.bg,
      borderColor: c.rule,
      transform: [{ rotate: `${rotate}deg` }],
    }]}>
      <View style={[styles.tape, { backgroundColor: 'rgba(184,151,102,0.4)' }]} />
      <Image source={juliet} style={styles.photo} resizeMode="cover" />
      {!!label && (
        <Text style={[styles.label, { fontFamily: f.serifI, color: c.forest }]}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mount: { padding: 10, borderWidth: 1, position: 'relative' },
  tape: {
    position: 'absolute', top: -8, left: '30%',
    width: 36, height: 12, transform: [{ rotate: '-8deg' }],
  },
  photo: { width: '100%', height: '100%' },
  label: {
    position: 'absolute', bottom: -24, left: 0, right: 0,
    textAlign: 'center', fontSize: 18,
  },
});
