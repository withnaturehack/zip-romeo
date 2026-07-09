import { useRef, useEffect, useMemo } from 'react';
import { Animated, View, Text, StyleSheet, ScrollView, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useRJTheme } from '@/theme/useRJTheme';
import { Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { TextLink, PrimaryButton, SecondaryButton } from '@/components/primitives/Button';
import { ArchetypeStamp } from '@/components/primitives/ArchetypeStamp';
import { WaxSeal } from '@/components/primitives/WaxSeal';
import { ARCHETYPES } from '@/lib/archetypes';
import { useStatus, useMatches, otherUserName, otherArchetype } from '@/lib/hooks';

function FadeSlide({ delay = 0, fromY = 20, children, style }: {
  delay?: number; fromY?: number; children: React.ReactNode; style?: object;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 580, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [fromY, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

export default function Match() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const { userId } = useStatus(15000);
  const { matches } = useMatches(userId);
  const activeMatch = useMemo(() => {
    const preferred = matches.find((m) => {
      const status = (m.status ?? '').toLowerCase();
      return ['accepted', 'chatting', 'active', 'letter_ready'].includes(status);
    });
    return preferred ?? matches[0];
  }, [matches]);
  const matchName = activeMatch ? otherUserName(activeMatch, userId) : 'Your match';
  const matchArchetypeKey = activeMatch ? otherArchetype(activeMatch, userId) : null;
  const matchArchetype = matchArchetypeKey && matchArchetypeKey in ARCHETYPES
    ? ARCHETYPES[matchArchetypeKey as keyof typeof ARCHETYPES]
    : ARCHETYPES.romantic;
  const intro = `${matchName} seems like the kind of person who notices the small, ordinary things and keeps them close.`;
  const note = `${matchName} has a thoughtful, steady presence, and the introduction feels genuine rather than performative.`;
  const details = [
    { label: 'Name', value: matchName },
    { label: 'Archetype', value: matchArchetype.name },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <PaperNoise />

      <FadeSlide fromY={-10} delay={0}>
        <Row justify="space-between" align="center" style={{ paddingHorizontal: d.pad, paddingVertical: 12 }}>
          <TextLink onPress={() => safeBack()}>← Letter</TextLink>
          <MonoLabel size={7.5}>{matchName} · Introduced by Romeo</MonoLabel>
        </Row>
      </FadeSlide>

      <ScrollView contentContainerStyle={{ paddingHorizontal: d.pad, paddingBottom: 48 }}>

        {/* Photo placeholder */}
        <FadeSlide delay={100} fromY={20}>
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <View style={[styles.photoArea, { borderColor: c.rule, backgroundColor: c.bgSunken }]}>
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Text style={{ fontFamily: f.serif, fontSize: 64, color: c.forest, opacity: 0.6 }}>{matchName?.[0] ?? 'M'}</Text>
                <MonoLabel size={7.5} color={c.inkMuted}>{matchName} · introduced</MonoLabel>
              </View>
              {/* Olive green accent stripe */}
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, backgroundColor: c.forest }} />
            </View>
          </View>
        </FadeSlide>

        {/* Name & headline */}
        <FadeSlide delay={200} fromY={16} style={{ marginTop: 22, alignItems: 'center', gap: 6 }}>
          <Text style={{ fontFamily: f.serif, fontSize: 42, color: c.ink, lineHeight: 46 }}>{matchName},</Text>
          <Text style={{ fontFamily: f.bodyI, fontSize: 15, color: c.inkMuted }}>A real connection from your match list</Text>
        </FadeSlide>

        {/* Archetype */}
        <FadeSlide delay={300} fromY={16} style={{ marginTop: 20, alignItems: 'center', gap: 6 }}>
          <ArchetypeStamp archetype={matchArchetype} height={90} />
          <Text style={{ fontFamily: f.serifI, fontSize: 19, color: c.forest, marginTop: 6 }}>{matchArchetype.name}</Text>
          <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.inkMuted }}>{matchArchetype.sub}</Text>
        </FadeSlide>

        <FadeSlide delay={370} style={{ marginTop: 22 }}>
          <OrnamentDivider />
        </FadeSlide>

        {/* Romeo's introduction */}
        <FadeSlide delay={440} fromY={16} style={{ marginTop: 18 }}>
          <MonoLabel size={7} color={c.gold} style={{ marginBottom: 8 }}>Romeo's introduction</MonoLabel>
          <Text style={{ fontFamily: f.bodyI, fontSize: 16, color: c.inkSoft, lineHeight: 26 }}>{intro}</Text>
        </FadeSlide>

        {/* Detail rows */}
        <FadeSlide delay={500} fromY={12} style={{ marginTop: 20 }}>
          <View style={{ borderWidth: 1, borderColor: c.ruleSoft, overflow: 'hidden' }}>
            {details.map((d2, i) => (
              <View key={d2.label} style={{
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                paddingHorizontal: 14, paddingVertical: 12,
                borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.ruleSoft,
              }}>
                <MonoLabel size={7.5} color={c.inkMuted}>{d2.label}</MonoLabel>
                <Text style={{ fontFamily: f.serif, fontSize: 15, color: c.ink }}>{d2.value}</Text>
              </View>
            ))}
          </View>
        </FadeSlide>

        {/* His note */}
        <FadeSlide delay={560} fromY={16} style={{ marginTop: 20 }}>
          <MonoLabel size={7} color={c.gold} style={{ marginBottom: 10 }}>In his own words</MonoLabel>
          <View style={{ padding: 20, borderWidth: 1, borderColor: c.ruleSoft, borderStyle: 'dashed', gap: 12 }}>
            <Text style={{ fontFamily: f.serifI, fontSize: 18, color: c.ink, lineHeight: 28, textAlign: 'center' }}>
              &ldquo;{note}&rdquo;
            </Text>
            <Row justify="flex-end">
              <Text style={{ fontFamily: f.script, fontSize: 20, color: c.forest }}>— {matchName}</Text>
            </Row>
          </View>
        </FadeSlide>

        <FadeSlide delay={640} fromY={12} style={{ marginTop: 28 }}>
          <Stack gap={10}>
            <PrimaryButton onPress={() => router.push('/(letter)/chat' as never)}>Open a conversation</PrimaryButton>
            <SecondaryButton onPress={() => router.push('/(letter)/respond' as never)}>Reply through Romeo</SecondaryButton>
          </Stack>
        </FadeSlide>

        <FadeSlide delay={700} style={{ marginTop: 18 }}>
          <View style={{ padding: 12, borderWidth: 1, borderColor: c.ruleSoft, borderStyle: 'dashed' }}>
            <Row gap={8} align="flex-start">
              <WaxSeal size={28} />
              <Text style={{ fontFamily: f.bodyI, fontSize: 12, color: c.inkMuted, flex: 1, lineHeight: 18 }}>
                Romeo has vouched for {matchName}. Their identity is verified and they are a member in good standing.
              </Text>
            </Row>
          </View>
        </FadeSlide>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  photoArea: {
    width: 240, height: 300, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
});
