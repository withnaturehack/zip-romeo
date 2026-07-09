// RJ-APP/components/primitives/WaxSeal.tsx
// Uses the real photographed wax seal image.
// Drop-in replacement — same { size, pulse } API as before.
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet } from 'react-native';

const sealImage = require('@/assets/wax-seal.png');

export function WaxSeal({ size = 64, pulse = false }: { size?: number; pulse?: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacAnim  = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (!pulse) {
      scaleAnim.setValue(1);
      opacAnim.setValue(0.92);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.06,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(opacAnim, {
            toValue: 1,
            duration: 750,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(opacAnim, {
            toValue: 0.92,
            duration: 750,
            easing: Easing.in(Easing.quad),
            useNativeDriver: false,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        backgroundColor: 'transparent',
        transform: [{ scale: scaleAnim }],
        opacity: opacAnim,
      }}
    >
      <Image
        source={sealImage}
        style={{ width: size, height: size, backgroundColor: 'transparent' }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({});
