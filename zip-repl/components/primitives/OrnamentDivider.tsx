// RJ-APP/components/primitives/OrnamentDivider.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useRJTheme } from '@/theme/useRJTheme';

export function OrnamentDivider({ width = 80, style }: { width?: number; style?: object }) {
  const { c, f } = useRJTheme();
  return (
    <View style={[styles.row, style]}>
      <View style={{ width, height: 1, backgroundColor: c.gold, opacity: 0.5 }} />
      <Text style={{ fontFamily: f.serifI, fontSize: 16, color: c.gold, opacity: 0.7 }}>§</Text>
      <View style={{ width, height: 1, backgroundColor: c.gold, opacity: 0.5 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
});
