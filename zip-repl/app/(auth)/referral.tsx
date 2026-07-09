// RJ-APP/app/(auth)/referral.tsx
import { useRef, useEffect, useState } from 'react';
import { Animated, View, Text, TextInput, StyleSheet, Alert, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PrimaryButton, TextLink } from '@/components/primitives/Button';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { PostmarkStamp } from '@/components/primitives/PostmarkStamp';
import { validateReferral } from '@/lib/api';
import { setPendingReferral } from '@/lib/referral-pending';

function FadeSlide({ delay = 0, fromY = 20, children, style }: {
  delay?: number; fromY?: number; children: React.ReactNode; style?: object;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 520, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [fromY, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

export default function Referral() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError('Enter your invitation code.');
      return;
    }
    setError(null);
    setBusy(true);
    const r = await validateReferral(trimmed);
    setBusy(false);
    if (!r.ok) {
      setError(r.error ?? 'That code did not open the door.');
      return;
    }
    await setPendingReferral(trimmed);
    // Valid code — go to sign-up (signup mode)
    router.push({ pathname: '/(auth)/signin', params: { mode: 'signup', referral: trimmed } } as never);
  };

  return (
    <ScreenScroll style={{ backgroundColor: c.bg }}>
      <PaperNoise />
      <View style={{ padding: d.pad, paddingTop: d.pad + insets.top, flex: 1 }}>

        <FadeSlide fromY={-10} delay={0}>
          <Row justify="space-between" align="center">
            <TextLink onPress={() => safeBack()}>← Back</TextLink>
            <MonoLabel size={7.5}>Step 1 of 4</MonoLabel>
          </Row>
        </FadeSlide>

        <FadeSlide delay={100} fromY={0} style={{ alignItems: 'center', marginTop: 28, marginBottom: 22 }}>
          <PostmarkStamp size={72} rotate={-6} text="INVITE" />
        </FadeSlide>

        <FadeSlide delay={180} fromY={20}>
          <View style={{ gap: 12 }}>
            <MonoLabel color={c.forest}>By referral only</MonoLabel>
            <Text style={{ fontFamily: f.serif, fontSize: d.hero, color: c.ink, lineHeight: d.hero * 1.08 }}>
              Who sent{'\n'}you here?
            </Text>
            <Text style={{ fontFamily: f.bodyI, fontSize: 16, color: c.inkMuted, lineHeight: 24, maxWidth: 300 }}>
              Romeo &amp; Juliet only meets people brought by friends. Enter the code you were given.
            </Text>
          </View>
        </FadeSlide>

        <FadeSlide delay={280} style={{ marginTop: 28, marginBottom: 16 }}>
          <OrnamentDivider />
        </FadeSlide>

        <FadeSlide delay={360} fromY={16}>
          <Stack gap={12}>
            <View>
              <MonoLabel size={7.5} color={focused ? c.forest : undefined}>Your invitation code</MonoLabel>
              <TextInput
                value={code}
                onChangeText={v => { setCode(v); setError(null); }}
                placeholder="LAUNCH-001"
                placeholderTextColor={c.inkMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={[styles.input, {
                  borderColor: error ? c.danger : focused ? c.forest : c.rule,
                  color: c.ink,
                  fontFamily: f.mono,
                  backgroundColor: c.bgCard,
                  borderWidth: focused ? 2 : 1,
                }]}
              />
            </View>

            {error && (
              <View style={{ paddingHorizontal: 4, paddingVertical: 8, borderLeftWidth: 3, borderLeftColor: c.danger, backgroundColor: `${c.danger}10` }}>
                <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.danger, lineHeight: 20 }}>{error}</Text>
              </View>
            )}

            <PrimaryButton onPress={submit}>{busy ? 'Checking…' : 'Open the door'}</PrimaryButton>

            <View style={{ alignItems: 'center', marginTop: 4 }}>
              <TextLink onPress={() => router.push('/(auth)/signin' as never)}>I already have an account →</TextLink>
            </View>
          </Stack>
        </FadeSlide>

        <FadeSlide delay={480} style={{ marginTop: 28 }}>
          <View style={{ padding: 14, borderWidth: 1, borderColor: c.ruleSoft, borderStyle: 'dashed' }}>
            <MonoLabel size={7} color={c.gold} style={{ marginBottom: 6 }}>Don't have a code?</MonoLabel>
            <Text style={{ fontFamily: f.bodyI, fontSize: 13, color: c.inkMuted, lineHeight: 19 }}>
              Ask a current member to share their referral code with you. The room grows by introduction only.
            </Text>
          </View>
        </FadeSlide>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  input: { padding: 18, fontSize: 20, letterSpacing: 5, textAlign: 'center', marginTop: 8 },
});
