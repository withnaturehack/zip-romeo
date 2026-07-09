// RJ-APP/components/primitives/IconBtn.tsx
import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

export function IconBtn({
  children, onPress, style, testID,
}: { children: ReactNode; onPress?: () => void; style?: ViewStyle; testID?: string }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPressIn={() => { setPressed(true); Haptics.selectionAsync(); }}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      hitSlop={8}
      testID={testID}
      style={[styles.btn, { opacity: pressed ? 0.5 : 1 }, style]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
});
