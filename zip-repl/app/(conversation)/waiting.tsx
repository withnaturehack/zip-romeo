// RJ-APP/app/(conversation)/waiting.tsx
// "She's passed your letter to Romeo" — stays here, no auto-redirect.
// Shows a banner + tap button when the letter is ready or Romeo has written back.
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { WaxSeal } from '@/components/primitives/WaxSeal';
import { useStatus } from '@/lib/hooks';

// Fixed refs — no hooks inside loops
function PulsingRings() {
  const { c } = useRJTheme();
  const a0 = useRef(new Animated.Value(0)).current;
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const anims = [a0, a1, a2];

  useEffect(() => {
    const loops = anims.map((a, i) =>
      Animated.loop(Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 2400, delay: i * 600, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(a, { toValue: 0, duration: 0, useNativeDriver: false }),
      ]))
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, []);

  return (
    <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
      {anims.map((a, i) => (
        <Animated.View key={i} style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
          <Animated.View style={{
            width: a.interpolate({ inputRange: [0, 1], outputRange: [80, 160] }),
            height: a.interpolate({ inputRange: [0, 1], outputRange: [80, 160] }),
            borderRadius: 80,
            borderWidth: 1.5,
            borderColor: c.forest,
            opacity: a.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.3, 0] }),
          }} />
        </Animated.View>
      ))}
      <WaxSeal size={80} pulse />
    </View>
  );
}

export default function Waiting() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const { phase } = useStatus(10000);
  const contentAnim = useRef(new Animated.Value(0)).current;
  const bannerAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(contentAnim, {
      toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, []);

  // Animate in the "ready" banner when phase arrives — no auto-redirect
  useEffect(() => {
    if (phase === 'LETTER_READY' || phase === 'APPROVED' || phase === 'CHATTING') {
      Animated.spring(bannerAnim, { toValue: 1, useNativeDriver: false, bounciness: 6 }).start();
    }
  }, [phase]);

  const letterReady   = phase === 'LETTER_READY';
  const backToConv    = phase === 'APPROVED' || phase === 'CHATTING';
  const showBanner    = letterReady || backToConv;

  const bannerTitle = letterReady  ? 'Your letter has arrived ✦'
    : backToConv ? 'Juliet is ready for you'
    : '';

  const bannerCTA   = letterReady  ? 'Open the envelope →'
    : backToConv ? 'Return to Juliet →'
    : '';

  const handleBannerPress = () => {
    if (letterReady)   router.replace('/(letter)/envelope' as never);
    else if (backToConv) router.replace('/(conversation)/voice' as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PaperNoise />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 14, paddingHorizontal: d.pad, borderBottomColor: c.ruleSoft }]}>
        <MonoLabel size={7}>Romeo is reading</MonoLabel>
        <MonoLabel size={7} color={c.inkMuted as string}>Please wait</MonoLabel>
      </View>

      {/* Center content */}
      <Animated.View style={{
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: d.pad, paddingBottom: insets.bottom + 20,
        opacity: contentAnim,
        transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
      }}>
        <PulsingRings />

        <Text style={[styles.headline, { fontFamily: f.serif, fontSize: 34, color: c.ink, marginTop: 36 }]}>
          She's passed your letter{'\n'}to Romeo now.
        </Text>

        <OrnamentDivider style={{ marginVertical: 22, width: 180 }} />

        <Text style={{ fontFamily: f.bodyI, fontSize: 16, color: c.inkMuted, textAlign: 'center', maxWidth: 300, lineHeight: 26 }}>
          He reads at his own pace. Your envelope will arrive when it arrives — usually within a few days.
        </Text>

        {/* What to expect */}
        <View style={[styles.infoCard, { backgroundColor: c.bgCard, borderColor: c.ruleSoft, marginTop: 32 }]}>
          {[
            { n: '01', t: 'Romeo reads', d: 'He considers your answers carefully.' },
            { n: '02', t: 'He writes',   d: 'A hand-crafted introduction, just for you.' },
            { n: '03', t: 'Your letter', d: "An envelope arrives when it's ready." },
          ].map(({ n, t, d: desc }, i) => (
            <View key={n} style={[styles.infoRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: c.ruleSoft }]}>
              <Text style={{ fontFamily: f.mono, fontSize: 9, color: c.gold, letterSpacing: 0.5, width: 24 }}>{n}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: f.mono, fontSize: 7, color: c.ink, letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 2 }}>{t}</Text>
                <Text style={{ fontFamily: f.bodyI, fontSize: 13, color: c.inkMuted, lineHeight: 19 }}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Ready banner (appears when letter/chat is ready) ── */}
        {showBanner && (
          <Animated.View style={{
            width: '100%', marginTop: 24,
            opacity: bannerAnim,
            transform: [{ translateY: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }}>
            <Pressable
              onPress={handleBannerPress}
              style={({ pressed }) => [styles.readyBanner, {
                backgroundColor: pressed ? c.forestDk : c.forest,
                borderColor: c.forest,
              }]}
            >
              <Text style={{ fontFamily: f.serifI, fontSize: 17, color: '#F5EDDA', textAlign: 'center', lineHeight: 24 }}>
                {bannerTitle}
              </Text>
              <Text style={{ fontFamily: f.mono, fontSize: 8, color: 'rgba(245,237,218,0.75)', letterSpacing: 2, marginTop: 6, textTransform: 'uppercase' }}>
                {bannerCTA}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 14, borderBottomWidth: 1,
  },
  headline: { textAlign: 'center', lineHeight: 44 },
  infoCard: {
    borderWidth: 1, width: '100%', overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 2,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  readyBanner: {
    borderWidth: 1, borderRadius: 2, paddingVertical: 20, paddingHorizontal: 24,
    alignItems: 'center',
  },
});
