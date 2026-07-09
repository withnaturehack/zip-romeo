// RJ-APP/components/primitives/layout.tsx
import { ReactNode } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, ViewStyle } from 'react-native';
import { useRJTheme } from '@/theme/useRJTheme';

export function Stack({
  children, gap, style,
}: { children: ReactNode; gap?: number; style?: ViewStyle }) {
  const { d } = useRJTheme();
  return <View style={[{ gap: gap ?? d.gap }, style]}>{children}</View>;
}

export function Row({
  children, gap, justify = 'flex-start', align = 'center', style,
}: {
  children: ReactNode;
  gap?: number;
  justify?: 'flex-start' | 'flex-end' | 'space-between' | 'center';
  align?: 'flex-start' | 'flex-end' | 'center';
  style?: ViewStyle;
}) {
  const { d } = useRJTheme();
  return (
    <View style={[styles.row, { gap: gap ?? d.gap, justifyContent: justify, alignItems: align }, style]}>
      {children}
    </View>
  );
}

export function ScreenScroll({
  children, style,
}: { children: ReactNode; style?: ViewStyle }) {
  const { c } = useRJTheme();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
    >
      <ScrollView
        style={[{ flex: 1, backgroundColor: c.bg }, style]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  scrollContent: { flexGrow: 1 },
});
