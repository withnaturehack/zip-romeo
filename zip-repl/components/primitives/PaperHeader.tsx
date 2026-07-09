// RJ-APP/components/primitives/PaperHeader.tsx
import { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRJTheme } from '@/theme/useRJTheme';
import { MonoLabel } from './MonoLabel';

export function PaperHeader({
  left, center, sub, right,
}: { left?: ReactNode; center?: string; sub?: string; right?: ReactNode }) {
  const { c, f } = useRJTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, {
      paddingTop: insets.top + 8,
      backgroundColor: c.bg,
      borderBottomColor: c.rule,
    }]}>
      <View style={styles.row}>
        <View style={styles.side}>{left}</View>
        <View style={styles.center}>
          {!!center && (
            <Text style={{ fontFamily: f.serifI, fontSize: 22, color: c.ink }}>{center}</Text>
          )}
          {!!sub && (
            <View style={{ marginTop: 2 }}>
              <MonoLabel size={7.5} color={c.inkMuted}>{sub}</MonoLabel>
            </View>
          )}
        </View>
        <View style={[styles.side, { alignItems: 'flex-end' }]}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: { width: 60, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center' },
});
