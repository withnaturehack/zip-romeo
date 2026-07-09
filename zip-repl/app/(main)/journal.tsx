// RJ-APP/app/(main)/journal.tsx
import { useRef, useEffect, useMemo } from 'react';
import {
  Animated, View, Text, Pressable, StyleSheet,
  Platform, Easing, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { IconBtn } from '@/components/primitives/IconBtn';
import { IconBack, IconArrow } from '@/components/primitives/Icons';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { WaxSeal } from '@/components/primitives/WaxSeal';
import { safeBack } from '@/lib/nav';
import { useStatus, useMatches, otherUserName } from '@/lib/hooks';
import { NAV_H } from '@/components/nav/BottomNav';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatFull(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function FadeSlide({ delay = 0, fromY = 14, children, style }: {
  delay?: number; fromY?: number; children: React.ReactNode; style?: object;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 460, delay,
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

export default function Journal() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const { profile, userId } = useStatus(0);
  const { matches } = useMatches(userId);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const letters = matches.map(m => ({
    id: m.id,
    name: otherUserName(m, userId),
    date: formatFull(m.created_at),
    no: String(m.id.split('').reduce((s, c) => (s + c.charCodeAt(0)) % 9999, 0)).padStart(4, '0'),
    status: 'read' as string,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* ── Header ── */}
      <View style={[styles.header, {
        paddingTop: topPad + 14,
        paddingHorizontal: d.pad,
        paddingBottom: 20,
        borderBottomColor: c.ruleSoft,
        backgroundColor: c.bg,
      }]}>
        <PaperNoise />
        <FadeSlide delay={0} fromY={-10}>
          <Row justify="space-between" align="flex-start">
            <View style={{ flex: 1 }}>
              <IconBtn onPress={() => safeBack('/(main)/home')} testID="journal-back-btn">
                <IconBack />
              </IconBtn>
            </View>
            <Stack gap={3} style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: f.serifI, fontSize: 22, color: c.ink, lineHeight: 26 }}>
                Your Journal
              </Text>
              <MonoLabel size={7} color={c.inkMuted}>
                {profile?.first_name ?? 'Member'} · Est. June 2026
              </MonoLabel>
            </Stack>
            <View style={{ flex: 1 }} />
          </Row>
        </FadeSlide>
      </View>

      <ScreenScroll>
        <PaperNoise />
        <View style={{ padding: d.pad, paddingTop: 28, paddingBottom: Platform.OS === 'web' ? 40 : NAV_H + insets.bottom + 24 }}>

          {/* ── Letters archive ── */}
          <FadeSlide delay={80} fromY={14}>
            <Text style={[styles.sectionLabel, { color: c.inkMuted, fontFamily: f.mono }]}>
              Letters received
            </Text>

            {letters.length === 0 && (
              <View style={[styles.emptyBox, { borderColor: c.ruleSoft }]}>
                <WaxSeal size={48} pulse />
                <Text style={{
                  fontFamily: f.serifI, fontSize: 18, color: c.inkMuted,
                  textAlign: 'center', marginTop: 14, maxWidth: 220, lineHeight: 26,
                }}>
                  No letters yet.{'\n'}Romeo is composing.
                </Text>
              </View>
            )}

            {letters.map((letter, i) => (
              <FadeSlide key={letter.id} delay={100 + i * 60} fromY={10}>
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); router.push('/(letter)/letter' as never); }}
                  style={[styles.letterRow, {
                    borderTopWidth: i === 0 ? 1 : 0,
                    borderBottomWidth: 1,
                    borderColor: c.ruleSoft,
                  }]}
                >
                  <View style={[styles.letterDot, { backgroundColor: letter.status === 'replied' ? c.forest : c.gold }]} />
                  <View style={{ flex: 1 }}>
                    <Row gap={10} align="center" style={{ marginBottom: 4 }}>
                      <Text style={{ fontFamily: f.serifI, fontSize: 18, color: c.ink, lineHeight: 22 }}>
                        {letter.name}
                      </Text>
                      <View style={[styles.statusChip, {
                        backgroundColor: letter.status === 'replied' ? `${c.forest}15` : `${c.gold}15`,
                        borderColor: letter.status === 'replied' ? `${c.forest}30` : `${c.gold}30`,
                      }]}>
                        <Text style={{
                          fontFamily: f.mono, fontSize: 6, letterSpacing: 1.2,
                          color: letter.status === 'replied' ? c.forest : c.gold,
                          textTransform: 'uppercase',
                        }}>
                          {letter.status}
                        </Text>
                      </View>
                    </Row>
                    <Row gap={10}>
                      <MonoLabel size={7} color={c.forest}>No. {letter.no}</MonoLabel>
                      <MonoLabel size={7} color={c.inkMuted}>{letter.date}</MonoLabel>
                    </Row>
                  </View>
                  <IconArrow color={c.inkMuted} size={13} />
                </Pressable>
              </FadeSlide>
            ))}
          </FadeSlide>

          <OrnamentDivider style={{ marginVertical: 32 }} />



          {/* ── About this journal ── */}
          <FadeSlide delay={500} fromY={10}>
            <View style={[styles.infoBox, { borderColor: c.ruleSoft }]}>
              <Text style={{
                fontFamily: f.mono, fontSize: 7.5, color: c.inkMuted,
                letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 10,
              }}>
                About your archive
              </Text>
              <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.inkSoft, lineHeight: 23 }}>
                This is your private record of correspondence. Every letter Romeo has written,
                every word exchanged — kept here, quietly, for you alone.
              </Text>
            </View>
          </FadeSlide>

          {/* Footer */}
          <FadeSlide delay={600}>
            <OrnamentDivider style={{ marginTop: 32, marginBottom: 18 }} />
            <Text style={{
              textAlign: 'center', fontFamily: f.mono, fontSize: 7.5,
              letterSpacing: 1.8, color: c.inkMuted, textTransform: 'uppercase', opacity: 0.38,
            }}>
              Romeo &amp; Juliet · Est. 2026
            </Text>
          </FadeSlide>

        </View>
      </ScreenScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { borderBottomWidth: 1 },
  sectionLabel: {
    fontSize: 8, letterSpacing: 2.2, textTransform: 'uppercase', marginBottom: 14,
  },
  emptyBox: {
    alignItems: 'center', paddingVertical: 44,
    borderWidth: 1, borderStyle: 'dashed', marginBottom: 8,
  },
  letterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16,
  },
  letterDot: {
    width: 7, height: 7, borderRadius: 4,
  },
  statusChip: {
    paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1,
  },
  quoteCard: {
    padding: 18, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 1,
  },
  infoBox: {
    padding: 18, borderWidth: 1, borderStyle: 'dashed',
  },
});
