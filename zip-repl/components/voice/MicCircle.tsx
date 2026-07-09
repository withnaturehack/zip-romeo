// RJ-APP/components/voice/MicCircle.tsx
import { useEffect, useRef } from 'react';
import { Animated, Pressable, View, StyleSheet, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useRJTheme } from '@/theme/useRJTheme';

export type MicState = 'idle' | 'connecting' | 'connected';

export function MicCircle({
  state, onPress, size = 120,
}: { state: MicState; onPress: () => void; size?: number }) {
  const { c } = useRJTheme();
  const press = useRef(new Animated.Value(1)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const loops = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    loops.current.forEach(l => l.stop());
    loops.current = [];
    ring1.setValue(0); ring2.setValue(0); ring3.setValue(0);

    if (state === 'connecting' || state === 'connected') {
      const makeLoop = (sv: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(sv, { toValue: 1, duration: 2400, easing: Easing.out(Easing.ease), useNativeDriver: false }),
            Animated.timing(sv, { toValue: 0, duration: 0, useNativeDriver: false }),
          ])
        );
      const l1 = makeLoop(ring1, 0);
      const l2 = makeLoop(ring2, 800);
      const l3 = makeLoop(ring3, 1600);
      loops.current = [l1, l2, l3];
      l1.start(); l2.start(); l3.start();
    }
    return () => { loops.current.forEach(l => l.stop()); };
  }, [state]);

  const ringStyle = (sv: Animated.Value) => ({
    transform: [{ scale: sv.interpolate({ inputRange: [0, 1], outputRange: [0.7, 2.0] }) }],
    opacity: sv.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
  });

  const onPressIn = () => {
    Animated.timing(press, { toValue: 0.94, duration: 120, useNativeDriver: false }).start();
    Haptics.selectionAsync();
  };
  const onPressOut = () => {
    Animated.timing(press, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };

  return (
    <View style={{ width: size * 2.4, height: size * 2.4, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[styles.ring, { width: size, height: size, borderColor: c.forest }, ringStyle(ring1)]} />
      <Animated.View style={[styles.ring, { width: size, height: size, borderColor: c.forest }, ringStyle(ring2)]} />
      <Animated.View style={[styles.ring, { width: size, height: size, borderColor: c.forest }, ringStyle(ring3)]} />

      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={{ position: 'absolute' }}
      >
        <Animated.View style={[styles.btn, {
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: state === 'connected' ? c.forest : c.bgCard,
          borderColor: c.forest,
          transform: [{ scale: press }],
        }]}>
          <Svg width={size * 0.36} height={size * 0.36} viewBox="0 0 24 24" fill="none">
            <Path d="M9 3h6v12a3 3 0 0 1-6 0V3z" stroke={state === 'connected' ? c.bg : c.forest} strokeWidth={1.4} strokeLinecap="round" />
            <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke={state === 'connected' ? c.bg : c.forest} strokeWidth={1.4} strokeLinecap="round" />
          </Svg>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute', borderRadius: 9999, borderWidth: 1 },
  btn: {
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12,
    elevation: 6,
  },
});
