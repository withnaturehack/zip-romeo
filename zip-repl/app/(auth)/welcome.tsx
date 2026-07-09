// RJ-APP/app/(auth)/welcome.tsx — Non-scrollable, fixed layout
import { useRef, useEffect } from 'react';
import {
  Animated, View, Text, StyleSheet, Pressable,
  Easing, Image, Dimensions, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { WaxSeal } from '@/components/primitives/WaxSeal';
import { PaperNoise } from '@/components/primitives/PaperNoise';

const portrait = require('@/assets/juliet-portrait.png');
const { width: W, height: H } = Dimensions.get('window');
const HERO_FLEX = 0.56;

function FadeIn({ delay = 0, duration = 600, fromY = 0, children, style }: {
  delay?: number; duration?: number; fromY?: number;
  children: React.ReactNode; style?: object;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, []);
  return (
    <Animated.View style={[style, {
      opacity: anim,
      transform: [{ translateY: fromY ? anim.interpolate({ inputRange: [0, 1], outputRange: [fromY, 0] }) : 0 }],
    }]}>
      {children}
    </Animated.View>
  );
}

export default function Welcome() {
  const { c, f } = useRJTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 48 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0c06' }}>

      {/* ── Hero portrait (top 56%) ── */}
      <View style={[styles.hero, { flex: HERO_FLEX }]}>
        {/* Image anchored to bottom so the face shows, not just the hair */}
        <Image
          source={portrait}
          style={styles.heroImage}
          resizeMode="cover"
        />

        {/* Vignettes */}
        <LinearGradient colors={['rgba(0,0,0,0.60)', 'rgba(0,0,0,0.0)']}
          style={[StyleSheet.absoluteFillObject, { height: '50%' }]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
        <LinearGradient colors={['rgba(0,0,0,0.22)', 'rgba(0,0,0,0)']}
          style={[StyleSheet.absoluteFillObject, { width: '28%' }]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(8,10,4,0.92)']}
          style={[StyleSheet.absoluteFillObject, { top: '48%' }]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />

        {/* Brand — top */}
        <FadeIn fromY={-12} duration={520} style={[styles.heroTop, { paddingTop: topPad + 16 }]}>
          <View>
            <Text style={{ fontFamily: f.serif, fontSize: 13, color: 'rgba(242,232,208,0.50)', letterSpacing: 3.5, textTransform: 'uppercase' }}>
              Romeo &amp; Juliet
            </Text>
            <Text style={{ fontFamily: f.mono, fontSize: 6.5, color: 'rgba(242,232,208,0.35)', letterSpacing: 2.8, textTransform: 'uppercase', marginTop: 3 }}>
              Est. 2026 · By referral only
            </Text>
          </View>
          {/* Circular stamp */}
          <View style={styles.stampCircle}>
            <Text style={{ fontFamily: f.mono, fontSize: 4.5, color: 'rgba(242,232,208,0.55)', letterSpacing: 0.8, textTransform: 'uppercase' }}>ROMEO</Text>
            <Text style={{ fontFamily: f.serifI, fontSize: 10, color: 'rgba(242,232,208,0.7)', lineHeight: 12 }}>R&J</Text>
            <Text style={{ fontFamily: f.mono, fontSize: 4.5, color: 'rgba(242,232,208,0.55)', letterSpacing: 0.8, textTransform: 'uppercase' }}>JULIET</Text>
          </View>
        </FadeIn>

        {/* Juliet label — bottom of hero */}
        <FadeIn delay={260} duration={650} fromY={10} style={styles.heroBottom}>
          <Text style={{ fontFamily: f.mono, fontSize: 6.5, color: 'rgba(242,232,208,0.40)', letterSpacing: 2.8, textTransform: 'uppercase', marginBottom: 5 }}>
            Your matchmaker
          </Text>
          <Text style={{ fontFamily: f.serifI, fontSize: 42, color: '#F2E8D0', lineHeight: 46, letterSpacing: 0.3 }}>
            Juliet
          </Text>
        </FadeIn>
      </View>

      {/* ── Content panel (bottom 44%) ── */}
      <View style={[styles.content, { flex: 1 - HERO_FLEX, backgroundColor: c.bg, paddingBottom: Math.max(insets.bottom, 20) }]}>
        <PaperNoise />

        {/* Seal overlap */}
        <FadeIn delay={300} duration={500} style={styles.sealWrap}>
          <WaxSeal size={50} pulse />
        </FadeIn>

        {/* Main headline */}
        <FadeIn delay={380} duration={700} fromY={16} style={{ alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontFamily: f.serif, fontSize: 36, color: c.ink, textAlign: 'center', lineHeight: 40 }}>
            One letter.
          </Text>
          <Text style={{ fontFamily: f.serifI, fontSize: 36, color: c.forest, textAlign: 'center', lineHeight: 40 }}>
            One introduction.
          </Text>
        </FadeIn>

        {/* Tagline */}
        <FadeIn delay={480} duration={600} style={{ alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ fontFamily: f.bodyI, fontSize: 13, color: c.inkMuted, textAlign: 'center', maxWidth: 260, lineHeight: 20, marginTop: 6 }}>
            No algorithms. No swiping.{'\n'}Juliet reads you. Romeo writes the letter.
          </Text>
        </FadeIn>

        {/* Ornament line */}
        <FadeIn delay={520} duration={400} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, paddingHorizontal: 32, gap: 10 }}>
          <View style={{ flex: 1, height: 0.5, backgroundColor: c.gold, opacity: 0.4 }} />
          <Text style={{ color: c.gold, opacity: 0.55, fontSize: 11 }}>✦</Text>
          <View style={{ flex: 1, height: 0.5, backgroundColor: c.gold, opacity: 0.4 }} />
        </FadeIn>

        {/* CTAs */}
        <FadeIn delay={580} duration={500} fromY={12} style={{ paddingHorizontal: 24, gap: 10 }}>
          <Pressable
            onPress={() => router.push('/(auth)/signin' as never)}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: pressed ? c.forestDk : c.forest }]}
          >
            <Text style={{ fontFamily: f.mono, fontSize: 9, letterSpacing: 2.2, color: '#F2E8D0', textTransform: 'uppercase' }}>
              Open the room
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(auth)/referral' as never)}
            style={({ pressed }) => [styles.secondaryBtn, { borderColor: c.forest, backgroundColor: pressed ? `${c.forest}18` : 'transparent' }]}
          >
            <Text style={{ fontFamily: f.mono, fontSize: 9, letterSpacing: 2.2, color: c.forest, textTransform: 'uppercase' }}>
              Apply with referral code
            </Text>
          </Pressable>
        </FadeIn>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', overflow: 'hidden', backgroundColor: '#0a0c06', position: 'relative' },
  heroImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '120%',
  },
  heroTop: {
    position: 'absolute', top: 0, left: 22, right: 22,
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  heroBottom: { position: 'absolute', bottom: 26, left: 26 },
  stampCircle: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1,
    borderColor: 'rgba(242,232,208,0.28)',
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  content: { paddingTop: 14, position: 'relative', overflow: 'hidden' },
  sealWrap: { alignItems: 'center', marginBottom: 8, marginTop: -4 },
  primaryBtn: {
    paddingVertical: 15, alignItems: 'center',
  },
  secondaryBtn: {
    paddingVertical: 14, alignItems: 'center', borderWidth: 1,
  },
});
