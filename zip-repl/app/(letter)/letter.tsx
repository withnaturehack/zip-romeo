// RJ-APP/app/(letter)/letter.tsx
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
import { PrimaryButton, SecondaryButton, TextLink } from '@/components/primitives/Button';
import { WaxSeal } from '@/components/primitives/WaxSeal';
import { PostmarkStamp } from '@/components/primitives/PostmarkStamp';
import { useStatus, useMatches, otherUserName, otherArchetype } from '@/lib/hooks';
import { ARCHETYPES } from '@/lib/archetypes';

function FadeSlide({ delay = 0, fromY = 20, children, style }: {
  delay?: number; fromY?: number; children: React.ReactNode; style?: object;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 650, delay,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, []);
  return (
    <Animated.View style={[style, {
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [fromY, 0] }) }],
    }]}>
      {children}
    </Animated.View>
  );
}

export default function Letter() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const { profile, userId } = useStatus(15000);
  const { matches } = useMatches(userId);
  const activeMatch = useMemo(() => {
    const preferred = matches.find((m) => {
      const status = (m.status ?? '').toLowerCase();
      return ['accepted', 'chatting', 'active', 'letter_ready'].includes(status);
    });
    return preferred ?? matches[0];
  }, [matches]);
  const recipientName = activeMatch ? otherUserName(activeMatch, userId) : null;
  const recipientArchetypeKey = activeMatch ? otherArchetype(activeMatch, userId) : null;
  const recipientArchetype = recipientArchetypeKey && recipientArchetypeKey in ARCHETYPES
    ? ARCHETYPES[recipientArchetypeKey as keyof typeof ARCHETYPES]
    : ARCHETYPES.romantic;
  const name = profile?.first_name ?? 'friend';
  const letterLabel = recipientName ? `Letter for ${recipientName}` : 'Letter from Romeo';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <PaperNoise />

      {/* Nav bar */}
      <FadeSlide fromY={-10} delay={0}>
        <Row justify="space-between" align="center"
          style={{ paddingHorizontal: d.pad, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.ruleSoft }}>
          <TextLink onPress={() => safeBack()}>← Envelope</TextLink>
          <Row gap={10} align="center">
            <MonoLabel size={7.5}>{letterLabel}</MonoLabel>
            <PostmarkStamp size={36} rotate={-8} text="ROMEO" />
          </Row>
        </Row>
      </FadeSlide>

      <ScrollView contentContainerStyle={{ paddingHorizontal: d.pad, paddingBottom: 56 }}>

        {/* ── Paper letter — parchment card ── */}
        <FadeSlide delay={200} fromY={28}>
          <View style={[styles.paper, {
            backgroundColor: c.bgCard,
            borderColor: c.rule,
            shadowColor: c.ink,
          }]}>
            {/* Top edge gradient — aged paper feel */}
            <View style={[styles.paperTopEdge, { backgroundColor: c.bgParchment }]} />

            {/* Seal header */}
            <View style={{ alignItems: 'center', paddingTop: 28, marginBottom: 16 }}>
              <WaxSeal size={58} />
              <MonoLabel size={7} color={c.inkMuted as string} style={{ marginTop: 10 }}>
                From Romeo · with care
              </MonoLabel>
            </View>

            <OrnamentDivider style={{ marginBottom: 22 }} />

            {/* Letter body */}
            <Text style={{ fontFamily: f.script, fontSize: 32, color: c.indigo, marginBottom: 22, lineHeight: 38 }}>
              Dear {name},
            </Text>

            <Text style={{ fontFamily: f.serif, fontSize: 18, color: c.ink, lineHeight: 32 }}>
              I have just finished reading your letter to Juliet — twice, actually,
              because the second time I wanted to be sure I hadn't imagined the part
              about your grandmother's kitchen.
            </Text>

            <View style={[styles.pullQuote, { borderLeftColor: c.forest, backgroundColor: c.goldDim }]}>
              <Text style={{ fontFamily: f.serifI, fontSize: 17, color: c.forest, lineHeight: 28 }}>
                "He keeps a record of which restaurants are quiet on Tuesdays."
              </Text>
            </View>

            <Text style={{ fontFamily: f.serif, fontSize: 18, color: c.ink, lineHeight: 32, marginTop: 4 }}>
              I think you might like {recipientName ?? 'your match'}. {recipientName ? `${recipientName} carries the ${recipientArchetype.name} energy.` : 'They carry a thoughtful, steady presence.'}
            </Text>

            <Text style={{ fontFamily: f.serif, fontSize: 18, color: c.ink, lineHeight: 32, marginTop: 18 }}>
              Take a moment with their note. There is no clock running.
            </Text>

            <OrnamentDivider style={{ marginTop: 28, marginBottom: 20 }} />

            {/* Signature */}
            <Row justify="space-between" align="flex-end">
              <View>
                <Text style={{ fontFamily: f.script, fontSize: 28, color: c.indigo, lineHeight: 34 }}>
                  Yours,{'\n'}Romeo.
                </Text>
              </View>
              <PostmarkStamp size={48} rotate={5} />
            </Row>

            {/* Bottom paper texture strip */}
            <View style={[styles.paperBottomEdge, { backgroundColor: c.bgParchment }]} />
          </View>
        </FadeSlide>

        {/* About this letter */}
        <FadeSlide delay={400} fromY={16} style={{ marginTop: 18 }}>
          <View style={[styles.noteBox, { borderLeftColor: c.forest, backgroundColor: `${c.forest}0D` }]}>
            <MonoLabel size={7} color={c.forest as string} style={{ marginBottom: 6 }}>About this letter</MonoLabel>
            <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.inkSoft, lineHeight: 22 }}>
              Romeo wrote this by hand, based on what Juliet told him about you both.
              He takes no fee and makes no promises — just introductions.
            </Text>
          </View>
        </FadeSlide>

        {/* CTAs */}
        <FadeSlide delay={520} fromY={16} style={{ marginTop: 24 }}>
          <Stack gap={12}>
            <PrimaryButton onPress={() => router.push('/(letter)/match' as never)}>
              Meet {recipientName ?? 'your match'} →
            </PrimaryButton>
            <SecondaryButton onPress={() => router.push('/(letter)/respond' as never)}>
              Reply through Romeo
            </SecondaryButton>
          </Stack>
        </FadeSlide>

        <FadeSlide delay={620} style={{ marginTop: 14 }}>
          <View style={[styles.noteBox, { borderLeftColor: c.gold, backgroundColor: `${c.gold}12` }]}> 
            <MonoLabel size={7} color={c.gold as string} style={{ marginBottom: 8 }}>Continue the conversation</MonoLabel>
            <PrimaryButton onPress={() => router.push('/(letter)/chat' as never)}>
              Open chat with {recipientName ?? 'your match'} →
            </PrimaryButton>
          </View>
        </FadeSlide>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    borderWidth: 1, marginTop: 10,
    overflow: 'hidden',
    paddingHorizontal: 26, paddingBottom: 26,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16, shadowRadius: 40,
    elevation: 8,
  },
  paperTopEdge: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 4,
  },
  paperBottomEdge: {
    marginHorizontal: -26, marginBottom: -26, marginTop: 20, height: 4,
  },
  pullQuote: {
    borderLeftWidth: 3, paddingLeft: 16, paddingVertical: 14,
    marginVertical: 20,
  },
  noteBox: {
    borderLeftWidth: 3, paddingLeft: 16, paddingVertical: 14, paddingRight: 14,
  },
});
