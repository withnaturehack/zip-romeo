import { useRef, useEffect } from 'react';
import {
  Animated, View, Text, StyleSheet,
  Easing, Dimensions, Platform, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, {
  Rect, Path, Line, Defs, LinearGradient as SvgLinear, Stop,
} from 'react-native-svg';
import { useRJTheme } from '@/theme/useRJTheme';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { TextLink } from '@/components/primitives/Button';
import { WaxSeal } from '@/components/primitives/WaxSeal';
import { useStatus } from '@/lib/hooks';

const { width: W } = Dimensions.get('window');
const ENV_W  = Math.min(W * 0.72, 300);
const ENV_H  = ENV_W * 0.68;
const SEAL_D = ENV_W * 0.40;   // diameter of the real seal image over the flap

// ── Envelope (SVG body only, no SVG seal) ────────────────────────────────────
function Envelope() {
  const EW = ENV_W;
  const EH = ENV_H;
  const goldLight = '#D4B98A';

  return (
    <Svg width={EW} height={EH} viewBox={`0 0 ${EW} ${EH}`}>
      <Defs>
        <SvgLinear id="envGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor="#E8E2D4" />
          <Stop offset="100%" stopColor="#CEC6B2" />
        </SvgLinear>
        <SvgLinear id="flapGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor="#DED8C8" />
          <Stop offset="100%" stopColor="#C8C0AC" />
        </SvgLinear>
        <SvgLinear id="shadowGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor="#000" stopOpacity={0.10} />
          <Stop offset="100%" stopColor="#000" stopOpacity={0.0} />
        </SvgLinear>
      </Defs>

      {/* Drop shadow */}
      <Rect x={EW * 0.05} y={EH * 0.94} width={EW * 0.9} height={18} rx={9}
        fill="url(#shadowGrad)" />

      {/* Envelope body */}
      <Rect x={0} y={0} width={EW} height={EH} rx={3} fill="url(#envGrad)" />

      {/* Inner border */}
      <Rect x={6} y={6} width={EW - 12} height={EH - 12} rx={1}
        fill="none" stroke="#C4BAA4" strokeWidth={0.6} strokeOpacity={0.5} />

      {/* Bottom centre fold */}
      <Path d={`M0,${EH} L${EW * 0.5},${EH * 0.56} L${EW},${EH}`}
        fill="#CAC2AE" opacity={0.8} />

      {/* Left wing */}
      <Path d={`M0,0 L${EW * 0.5},${EH * 0.56} L0,${EH}`}
        fill="#C4BAA4" opacity={0.55} />

      {/* Right wing */}
      <Path d={`M${EW},0 L${EW * 0.5},${EH * 0.56} L${EW},${EH}`}
        fill="#C4BAA4" opacity={0.42} />

      {/* Top flap */}
      <Path d={`M0,0 L${EW * 0.5},${EH * 0.48} L${EW},0`}
        fill="url(#flapGrad)" />
      <Path d={`M0,0 L${EW * 0.5},${EH * 0.48} L${EW},0`}
        fill="none" stroke="#C4BAA4" strokeWidth={0.6} strokeOpacity={0.4} />

      {/* Diagonal fold lines */}
      <Line x1={EW * 0.5} y1={EH * 0.56} x2={0}  y2={EH}
        stroke="#C4BAA4" strokeWidth={0.8} strokeOpacity={0.3} />
      <Line x1={EW * 0.5} y1={EH * 0.56} x2={EW} y2={EH}
        stroke="#C4BAA4" strokeWidth={0.8} strokeOpacity={0.3} />

      {/* Postage mark (top-right) */}
      {[0, 6, 12].map(dy => (
        <Line key={dy} x1={EW - 32} y1={10 + dy} x2={EW - 10} y2={10 + dy}
          stroke={goldLight} strokeWidth={1.2} strokeOpacity={0.5} />
      ))}
      <Rect x={EW - 32} y={8} width={22} height={18} rx={1}
        fill="none" stroke={goldLight} strokeWidth={0.8} strokeOpacity={0.35} />
    </Svg>
  );
}

// ── Full envelope + real seal floating together ───────────────────────────────
function EnvelopeSeal() {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1, duration: 2800,
          easing: Easing.inOut(Easing.sin), useNativeDriver: false,
        }),
        Animated.timing(floatAnim, {
          toValue: 0, duration: 2800,
          easing: Easing.inOut(Easing.sin), useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const translateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  // The seal sits centered on the flap crease (48% down the envelope height)
  // Half the seal pokes above the crease, half below.
  const sealTop = ENV_H * 0.48 - SEAL_D / 2;

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      {/* Envelope body */}
      <Envelope />

      {/* Real wax seal — absolutely positioned over the flap crease */}
      <View style={[
        StyleSheet.absoluteFillObject,
        {
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: sealTop,
          pointerEvents: 'none',
        },
      ]}>
        <WaxSeal size={SEAL_D} pulse />
      </View>
    </Animated.View>
  );
}

// ── Pulsing dot ───────────────────────────────────────────────────────────────
function Dot({ delay }: { delay: number }) {
  const { c } = useRJTheme();
  const a = useRef(new Animated.Value(0.25)).current;
  const s = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(a, { toValue: 1,    duration: 600, useNativeDriver: false }),
        Animated.timing(s, { toValue: 1.35, duration: 600, easing: Easing.out(Easing.back(2)), useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.timing(a, { toValue: 0.25, duration: 600, useNativeDriver: false }),
        Animated.timing(s, { toValue: 1,    duration: 600, useNativeDriver: false }),
      ]),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View style={{
      width: 6, height: 6, borderRadius: 3,
      backgroundColor: c.forest,
      opacity: a, transform: [{ scale: s }],
    }} />
  );
}

// ── Fade-up wrapper ───────────────────────────────────────────────────────────
function FadeUp({ delay = 0, children, style }: {
  delay?: number; children: React.ReactNode; style?: object;
}) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, {
      toValue: 1, duration: 700, delay,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, []);
  return (
    <Animated.View style={[style, {
      opacity: a,
      transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
    }]}>
      {children}
    </Animated.View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function Pending() {
  const { c, f } = useRJTheme();
  const insets = useSafeAreaInsets();
  const { phase, loading } = useStatus(8000);

  // Register for push notifications at the natural moment — right after the
  // profile has been submitted and we're waiting on approval. Silently
  // no-ops on web / when permission is denied.
  useEffect(() => {
    import('@/lib/push').then(({ registerForPushNotificationsAsync }) => {
      registerForPushNotificationsAsync().then((result) => {
        if (result.status === 'error') {
          console.warn('[Pending] push registration error:', result.reason);
        }
      });
    });
  }, []);

  useEffect(() => {
    if (loading) return;
    if (phase === 'APPROVED' || phase === 'CHATTING') router.replace('/(conversation)/voice' as never);
    else if (phase === 'REJECTED') router.replace('/(auth)/rejected' as never);
    else if (phase === 'PROFILE' || phase === 'REFERRAL') router.replace('/');
  }, [phase, loading]);

  const onSignOut = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      await supabase.auth.signOut();
    } catch {}
    router.replace('/');
  };

  const topPad = insets.top + (Platform.OS === 'web' ? 20 : 0);
  const botPad = Math.max(insets.bottom, 24);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PaperNoise />

      {/* Top status bar */}
      <FadeUp delay={0} style={[styles.topBar, { paddingTop: topPad + 14 }]}>
        <View>
          <MonoLabel size={6.5} color={c.inkMuted}>Application</MonoLabel>
          <MonoLabel size={6.5} color={c.forest} style={{ marginTop: 3 }}>Under review</MonoLabel>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <MonoLabel size={6.5} color={c.inkMuted}>Romeo &amp; Juliet</MonoLabel>
          <MonoLabel size={6.5} color={c.inkMuted} style={{ marginTop: 3, opacity: 0.5 }}>Est. 2026</MonoLabel>
        </View>
      </FadeUp>

      <FadeUp delay={80}>
        <View style={{ height: 0.5, backgroundColor: c.ruleSoft, marginHorizontal: 24, marginTop: 12, opacity: 0.6 }} />
      </FadeUp>

      {/* Centre */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 20 }}>

        <FadeUp delay={200} style={{ marginBottom: 36 }}>
          <EnvelopeSeal />
        </FadeUp>

        <FadeUp delay={420} style={{ alignItems: 'center', paddingHorizontal: 28 }}>
          <Text style={{
            fontFamily: f.serifI, fontSize: 40,
            color: c.ink, textAlign: 'center', lineHeight: 46, letterSpacing: 0.2,
          }}>
            Juliet is reading.
          </Text>
        </FadeUp>

        <FadeUp delay={560} style={{ alignItems: 'center', marginTop: 14, paddingHorizontal: 36 }}>
          <Text style={{
            fontFamily: f.bodyI, fontSize: 16,
            color: c.inkMuted, textAlign: 'center', lineHeight: 25,
          }}>
            She takes her time. Most applications are answered within two days. We will write to you the moment she replies.
          </Text>
        </FadeUp>

        {/* Ornament */}
        <FadeUp delay={680} style={{
          flexDirection: 'row', alignItems: 'center',
          marginTop: 28, paddingHorizontal: 48, gap: 10,
        }}>
          <View style={{ flex: 1, height: 0.5, backgroundColor: c.rule, opacity: 0.5 }} />
          <Text style={{ color: c.gold, opacity: 0.5, fontSize: 10 }}>✦</Text>
          <View style={{ flex: 1, height: 0.5, backgroundColor: c.rule, opacity: 0.5 }} />
        </FadeUp>

        {/* Three dots */}
        <FadeUp delay={760} style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
          <Dot delay={0} />
          <Dot delay={200} />
          <Dot delay={400} />
        </FadeUp>
      </View>

      {/* Footer */}
      <FadeUp delay={900} style={[styles.footer, { paddingBottom: botPad + 8 }]}>
        <View style={{ height: 0.5, backgroundColor: c.ruleSoft, marginHorizontal: 24, marginBottom: 18, opacity: 0.5 }} />
        <Text style={{
          fontFamily: f.bodyI, fontSize: 13,
          color: c.inkMuted, textAlign: 'center', letterSpacing: 0.1, marginBottom: 12,
        }}>
          You may close the app. We'll find you.
        </Text>
        <TextLink onPress={onSignOut} color={c.inkMuted} style={{ opacity: 0.55 }}>
          Sign out
        </TextLink>
      </FadeUp>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar:  { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24 },
  footer:  { alignItems: 'center', paddingBottom: 24 },
});
