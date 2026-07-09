// RJ-APP/app/(auth)/rejected.tsx
import { useRef, useEffect } from 'react';
import { Animated, View, Text, StyleSheet, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { SecondaryButton } from '@/components/primitives/Button';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { JulietPortrait } from '@/components/primitives/JulietPortrait';
import { WaxSeal } from '@/components/primitives/WaxSeal';

function FadeSlide({ delay = 0, fromY = 20, children, style }: {
  delay?: number; fromY?: number; children: React.ReactNode; style?: object;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 600, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [fromY, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

export default function Rejected() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();

  const onSignOut = async () => {
    try { const { supabase } = await import('@/lib/supabase'); await supabase.auth.signOut(); } catch {}
    router.replace('/');
  };

  return (
    <ScreenScroll style={{ backgroundColor: c.bg }}>
      <PaperNoise />
      <View style={{
        padding: d.pad,
        paddingTop: d.pad + insets.top,
        paddingBottom: d.pad + insets.bottom,
        flex: 1, alignItems: 'center', justifyContent: 'center',
      }}>
        <Stack gap={0} style={{ alignItems: 'center', maxWidth: 320 }}>
          <FadeSlide delay={0} fromY={0}>
            <MonoLabel size={7} color={c.inkMuted}>With our regrets</MonoLabel>
          </FadeSlide>

          <FadeSlide delay={200} fromY={20} style={{ marginTop: 28, opacity: 0.45 }}>
            <JulietPortrait width={140} height={170} rotate={-2} label="" />
          </FadeSlide>

          <FadeSlide delay={380} fromY={20} style={{ marginTop: 28, alignItems: 'center', gap: 10 }}>
            <Text style={{ fontFamily: f.serifI, fontSize: 26, color: c.ink, textAlign: 'center', lineHeight: 34 }}>
              The room isn&rsquo;t open{'\n'}to you at this time.
            </Text>
          </FadeSlide>

          <FadeSlide delay={500} style={{ marginTop: 20, width: '100%' }}>
            <OrnamentDivider />
          </FadeSlide>

          <FadeSlide delay={600} fromY={12} style={{ marginTop: 18, alignItems: 'center', gap: 14 }}>
            <Text style={{ fontFamily: f.bodyI, fontSize: 15, color: c.inkMuted, textAlign: 'center', lineHeight: 23 }}>
              With our regrets — Romeo &amp; Juliet
            </Text>
            <Text style={{ fontFamily: f.bodyI, fontSize: 13, color: c.inkMuted, textAlign: 'center', lineHeight: 20 }}>
              The room is carefully curated. We are not always able to extend an invitation, but we are grateful you applied.
            </Text>
          </FadeSlide>

          <FadeSlide delay={720} fromY={12} style={{ marginTop: 24, gap: 14, alignItems: 'center' }}>
            <View style={{ width: 220 }}>
              <SecondaryButton onPress={onSignOut}>Sign out</SecondaryButton>
            </View>
            <View style={{ marginTop: 8, alignItems: 'center', gap: 6 }}>
              <WaxSeal size={32} />
              <MonoLabel size={7} color={c.inkMuted}>Romeo &amp; Juliet · Est. 2026</MonoLabel>
            </View>
          </FadeSlide>
        </Stack>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({});
