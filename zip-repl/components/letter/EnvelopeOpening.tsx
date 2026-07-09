// RJ-APP/components/letter/EnvelopeOpening.tsx
import { useEffect, useRef } from 'react';
import { Animated, View, Pressable, StyleSheet, Easing } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useRJTheme } from '@/theme/useRJTheme';
import { WaxSeal } from '@/components/primitives/WaxSeal';

const W = 300;
const H = 200;
const SEAL = 76;

export function EnvelopeOpening({ onComplete }: { onComplete?: () => void }) {
  const { c } = useRJTheme();
  const started = useRef(false);

  const sealRot   = useRef(new Animated.Value(0)).current;
  const sealScale = useRef(new Animated.Value(1)).current;
  const sealOpacity = useRef(new Animated.Value(1)).current;
  const sealX     = useRef(new Animated.Value(0)).current;
  const sealY     = useRef(new Animated.Value(0)).current;
  const flapRot   = useRef(new Animated.Value(0)).current;
  const letterY   = useRef(new Animated.Value(20)).current;
  const letterOpacity = useRef(new Animated.Value(0)).current;

  const tap = () => {
    if (started.current) return;
    started.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Phase 1 — wax cracks (800 ms)
    Animated.parallel([
      Animated.sequence([
        Animated.timing(sealRot, { toValue: -3,  duration: 200, useNativeDriver: false }),
        Animated.timing(sealRot, { toValue: 2,   duration: 250, useNativeDriver: false }),
        Animated.timing(sealRot, { toValue: -18, duration: 350, useNativeDriver: false }),
      ]),
      Animated.sequence([
        Animated.timing(sealScale, { toValue: 1.06, duration: 200, useNativeDriver: false }),
        Animated.timing(sealScale, { toValue: 0.94, duration: 250, useNativeDriver: false }),
        Animated.timing(sealScale, { toValue: 0.9,  duration: 350, useNativeDriver: false }),
      ]),
      Animated.timing(sealX,      { toValue: -22, duration: 800, useNativeDriver: false }),
      Animated.timing(sealY,      { toValue: 28,  duration: 800, useNativeDriver: false }),
      Animated.timing(sealOpacity,{ toValue: 0,   duration: 800, useNativeDriver: false }),
    ]).start();

    // Phase 2 — flap unfolds (800–1500 ms)
    Animated.sequence([
      Animated.delay(800),
      Animated.timing(flapRot, {
        toValue: 1,
        duration: 700,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    // Phase 3 — letter rises (1500–2400 ms)
    Animated.sequence([
      Animated.delay(1500),
      Animated.parallel([
        Animated.timing(letterY,      { toValue: -180, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.timing(letterOpacity,{ toValue: 1,    duration: 600, useNativeDriver: false }),
      ]),
    ]).start(({ finished }) => {
      if (finished && onComplete) onComplete();
    });
  };

  useEffect(() => {
    const id = setTimeout(tap, 600);
    return () => clearTimeout(id);
  }, []);

  const sealRotate = sealRot.interpolate({
    inputRange: [-18, -3, 0, 2],
    outputRange: ['-18deg', '-3deg', '0deg', '2deg'],
  });
  const flapRotateX = flapRot.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Pressable onPress={tap}>
      <View style={{ width: W, height: H + 200, alignItems: 'center', justifyContent: 'flex-end' }}>
        {/* Letter rises from inside */}
        <Animated.View style={[
          styles.letter,
          { width: W * 0.84, backgroundColor: c.bg, borderColor: c.rule },
          { transform: [{ translateY: letterY }], opacity: letterOpacity },
        ]}>
          <View style={{ height: 12, backgroundColor: c.bgSunken, marginBottom: 8 }} />
          <View style={{ height: 6, backgroundColor: c.bgSunken, width: '70%', marginBottom: 6 }} />
          <View style={{ height: 6, backgroundColor: c.bgSunken, width: '85%', marginBottom: 6 }} />
          <View style={{ height: 6, backgroundColor: c.bgSunken, width: '60%' }} />
        </Animated.View>

        {/* Envelope body */}
        <View style={{ position: 'absolute', bottom: 0, width: W, height: H }}>
          <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={StyleSheet.absoluteFill}>
            <Rect x={0} y={0} width={W} height={H} fill={c.bg} stroke={c.rule} strokeWidth={1} />
            <Path d={`M0 80 L${W/2} ${H} L${W} 80 L${W} ${H} L0 ${H} Z`} fill={c.bgSunken} />
          </Svg>

          {/* Flap */}
          <Animated.View style={[
            { position: 'absolute', top: 0, left: 0, width: W, height: H * 0.85 },
            { transform: [{ perspective: 800 }, { rotateX: flapRotateX }] },
          ]}>
            <Svg width={W} height={H * 0.85} viewBox={`0 0 ${W} ${H * 0.85}`}>
              <Path d={`M0 0 L${W} 0 L${W/2} ${H * 0.85} Z`} fill={c.bgAlt} stroke={c.rule} strokeWidth={1} />
            </Svg>
          </Animated.View>

          {/* Seal */}
          <Animated.View style={[
            { position: 'absolute', top: H * 0.32, left: W / 2 - SEAL / 2 },
            {
              transform: [
                { translateX: sealX },
                { translateY: sealY },
                { rotate: sealRotate },
                { scale: sealScale },
              ],
              opacity: sealOpacity,
            },
          ]}>
            <WaxSeal size={SEAL} />
          </Animated.View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  letter: {
    borderWidth: 1, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.18, shadowOffset: { width: 0, height: 12 }, shadowRadius: 24,
    elevation: 6,
    marginBottom: 30,
  },
});
