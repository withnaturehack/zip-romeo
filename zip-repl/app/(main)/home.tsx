// RJ-APP/app/(main)/home.tsx
import { useMemo, useEffect, useRef } from 'react';
import {
  Animated, View, Text, Pressable, StyleSheet,
  Platform, Easing, Image, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { IconBtn } from '@/components/primitives/IconBtn';
import { IconCog, IconArrow } from '@/components/primitives/Icons';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { WaxSeal } from '@/components/primitives/WaxSeal';
import { PostmarkStamp } from '@/components/primitives/PostmarkStamp';
import { useStatus, useMatches, otherUserName, MatchRow } from '@/lib/hooks';
import { NAV_H } from '@/components/nav/BottomNav';

const portrait = require('@/assets/juliet-portrait.png');
const julietFaded = require('@/assets/juliet-faded.png');

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = Math.min(SCREEN_W * 0.82, 340);

function letterNumber(match: MatchRow | undefined): string {
  if (!match) return '0000';
  let sum = 0;
  for (let i = 0; i < match.id.length; i++) sum = (sum + match.id.charCodeAt(i)) % 99991;
  return String(sum % 9999).padStart(4, '0');
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function FadeIn({ delay = 0, duration = 500, fromY = 0, children, style }: {
  delay?: number; duration?: number; fromY?: number;
  children: React.ReactNode; style?: object;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration, delay,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, []);
  return (
    <Animated.View style={[style, {
      opacity: anim,
      transform: [{ translateY: fromY
        ? anim.interpolate({ inputRange: [0, 1], outputRange: [fromY, 0] })
        : 0 }],
    }]}>
      {children}
    </Animated.View>
  );
}

function PressCard({ onPress, style, children, testID }: {
  onPress: () => void; style?: object; children: React.ReactNode; testID?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scale, { toValue: 0.972, useNativeDriver: false, speed: 30, bounciness: 0 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,     useNativeDriver: false, speed: 30, bounciness: 2 }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable testID={testID} onPress={onPress} onPressIn={onIn} onPressOut={onOut} style={style}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

function ShimmerRule() {
  const { c } = useRJTheme();
  const anim = useRef(new Animated.Value(0.2)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 0.75, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(anim, { toValue: 0.2,  duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <View style={{ marginVertical: 16 }}>
      <Animated.View style={{ height: 1, backgroundColor: c.gold, opacity: anim }} />
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  const { c, f } = useRJTheme();
  return (
    <Text style={{
      fontFamily: f.mono, fontSize: 8, letterSpacing: 2.2,
      color: c.inkMuted, textTransform: 'uppercase', marginBottom: 14,
    }}>
      {children}
    </Text>
  );
}

// ─── Journey progress tracker ─────────────────────────────────────────────────
const JOURNEY = [
  { key: 'juliet',  label: 'Juliet',    sub: 'Interview' },
  { key: 'quest',   label: 'Questions', sub: 'Answered' },
  { key: 'waiting', label: 'Waiting',   sub: 'Romeo reads' },
  { key: 'letter',  label: 'Letter',    sub: 'Received' },
  { key: 'match',   label: 'Meeting',   sub: 'Connected' },
];

function phaseToStep(phase: string | undefined, hasMatches: boolean, hasChat: boolean): number {
  if (!phase || phase === 'NEW') return 1;
  if (phase === 'INTERVIEW_DONE') return 2;
  if (phase === 'QUESTIONNAIRE_DONE' || phase === 'WAITING') return 3;
  if (phase === 'LETTER_READY') return 4;
  if (hasMatches) return 5;
  return 5;
}

function JourneyTracker({ phase, hasMatches, hasChat }: {
  phase: string | undefined; hasMatches: boolean; hasChat: boolean;
}) {
  const { c, f } = useRJTheme();
  const current = phaseToStep(phase, hasMatches, hasChat);
  const lineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(lineAnim, {
      toValue: (current - 1) / (JOURNEY.length - 1),
      duration: 1400, delay: 400, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.18, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, [current]);

  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 22, backgroundColor: c.bgCard, borderBottomWidth: 1, borderBottomColor: c.ruleSoft }}>
      <Text style={{ fontFamily: f.mono, fontSize: 7, letterSpacing: 2.2, color: c.inkMuted, textTransform: 'uppercase', marginBottom: 18 }}>
        Your journey
      </Text>

      {/* Connecting line + nodes */}
      <View style={{ flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
        {/* Background rail */}
        <View style={{ position: 'absolute', left: 10, right: 10, height: 1, backgroundColor: c.ruleSoft, top: 10 }} />
        {/* Animated fill */}
        <Animated.View style={{
          position: 'absolute', left: 10, height: 1, backgroundColor: c.forest,
          opacity: 0.7, top: 10,
          width: lineAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '85%'] }),
        }} />

        {JOURNEY.map((stage, i) => {
          const done    = i + 1 < current;
          const active  = i + 1 === current;
          const pending = i + 1 > current;
          return (
            <View key={stage.key} style={{ flex: 1, alignItems: 'center' }}>
              {/* Node */}
              {active ? (
                <Animated.View style={{
                  width: 20, height: 20, borderRadius: 10,
                  backgroundColor: c.forest, borderWidth: 2.5, borderColor: c.bg,
                  transform: [{ scale: pulseAnim }],
                  shadowColor: c.forest, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 },
                }} />
              ) : (
                <View style={{
                  width: done ? 18 : 14, height: done ? 18 : 14,
                  borderRadius: done ? 9 : 7,
                  backgroundColor: done ? c.forest : 'transparent',
                  borderWidth: done ? 0 : 1.5,
                  borderColor: pending ? c.ruleSoft : c.forest,
                  opacity: pending ? 0.4 : 1,
                }}>
                  {done && (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#F2E8D0', fontSize: 8, fontFamily: 'System' }}>✓</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Labels */}
      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        {JOURNEY.map((stage, i) => {
          const active = i + 1 === current;
          const done   = i + 1 < current;
          return (
            <View key={stage.key} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{
                fontFamily: f.mono, fontSize: 6, letterSpacing: 0.6,
                color: active ? c.forest : done ? c.inkSoft : c.inkMuted,
                textTransform: 'uppercase', textAlign: 'center',
              }}>{stage.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function Home() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const { phase, profile, userId } = useStatus(15000);
  const { matches, loading: matchesLoading } = useMatches(userId);
  const month   = useMemo(() => MONTHS[new Date().getMonth()], []);
  const dayName = useMemo(() => DAYS[new Date().getDay()], []);

  const mostRecent: MatchRow | undefined = matches[0];
  const earlier    = matches.slice(1);
  const otherName  = mostRecent ? otherUserName(mostRecent, userId) : null;
  const letterReady = phase === 'LETTER_READY';
  const activeMatch = matches.find(m => m.status === 'chatting' || m.status === 'active');
  const hasConversation = !!activeMatch;
  const conversationName = activeMatch ? otherUserName(activeMatch, userId) : null;

  const openLetter = () => { Haptics.selectionAsync(); router.push(letterReady ? '/(letter)/envelope' : '/(letter)/letter' as never); };
  const openChat   = () => { Haptics.selectionAsync(); router.push('/(letter)/chat' as never); };
  const openJuliet = () => { Haptics.selectionAsync(); router.push('/(conversation)/voice' as never); };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScreenScroll>
      {/* ── Dark cinematic hero ── */}
      <View style={[styles.heroWrap, { height: HERO_H }]}>
        <Image
          source={portrait}
          style={[StyleSheet.absoluteFillObject, { opacity: 0.55 }]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(8,10,4,0.72)', 'rgba(8,10,4,0.10)']}
          style={[StyleSheet.absoluteFillObject, { height: '60%' }]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.0)', 'rgba(12,14,7,0.95)']}
          style={[StyleSheet.absoluteFillObject, { top: '35%' }]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.28)', 'rgba(0,0,0,0)']}
          style={[StyleSheet.absoluteFillObject, { width: '32%' }]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        />

        {/* Top bar */}
        <FadeIn fromY={-12} duration={440} style={[styles.heroTop, { paddingTop: topPad + 14 }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: f.serifI, fontSize: 22, color: '#F3ECDA', letterSpacing: 0.2, lineHeight: 26 }}>
              Romeo &amp; Juliet
            </Text>
            <Text style={{
              fontFamily: f.mono, fontSize: 7, color: 'rgba(243,236,218,0.45)',
              letterSpacing: 2.2, textTransform: 'uppercase', marginTop: 4,
            }}>
              {dayName} · {month}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <PostmarkStamp size={40} rotate={-7} />
            <IconBtn
              onPress={() => router.push('/(main)/settings' as never)}
              testID="home-settings-btn"
            >
              <IconCog color="rgba(243,236,218,0.70)" />
            </IconBtn>
          </View>
        </FadeIn>

        {/* Greeting — bottom of hero */}
        <FadeIn delay={220} duration={600} fromY={10} style={styles.heroGreeting}>
          <Text style={{
            fontFamily: f.mono, fontSize: 7, color: 'rgba(243,236,218,0.42)',
            letterSpacing: 2.4, textTransform: 'uppercase', marginBottom: 6,
          }}>
            {greeting()}
          </Text>
          <Text style={{
            fontFamily: f.serifI, fontSize: 38, color: '#F3ECDA',
            lineHeight: 42, letterSpacing: 0.3,
          }}>
            {profile?.first_name ?? 'there'}.
          </Text>
        </FadeIn>
      </View>

      {/* ── Journey tracker ── */}
      <JourneyTracker phase={phase} hasMatches={matches.length > 0} hasChat={hasConversation} />

      {/* ── Parchment content ── */}
      <View style={{ backgroundColor: c.bg }}>
        <PaperNoise />
        <View style={{ padding: d.pad, paddingTop: 28, paddingBottom: Platform.OS === 'web' ? 40 : NAV_H + insets.bottom + 24 }}>

          {/* ── Letters from Romeo ── */}
          <FadeIn delay={100} duration={520} fromY={14} style={{ marginBottom: 20 }}>
            <Row justify="space-between" align="center" style={{ marginBottom: 16 }}>
              <SectionLabel>Letters from Romeo</SectionLabel>
              <PostmarkStamp size={34} rotate={-6} />
            </Row>

            {/* Loading skeleton */}
            {matchesLoading && (
              <View style={[styles.card, {
                backgroundColor: c.bgCard, borderColor: c.ruleSoft,
                opacity: 0.22, height: 140,
              }]} />
            )}

            {/* Main letter card */}
            {!matchesLoading && mostRecent && (
              <FadeIn delay={180} duration={560} fromY={18}>
                <PressCard
                  testID="home-most-recent-card"
                  onPress={openLetter}
                  style={[styles.card, {
                    backgroundColor: c.bgCard,
                    borderColor: c.ruleSoft,
                    shadowColor: c.ink,
                  }]}
                >
                  {letterReady && (
                    <View style={[styles.newBadge, { backgroundColor: c.forest }]}>
                      <Text style={{
                        fontFamily: f.mono, fontSize: 6.5, color: '#FBF2E3',
                        letterSpacing: 1.4, textTransform: 'uppercase',
                      }}>
                        New letter
                      </Text>
                    </View>
                  )}

                  <Row justify="space-between" align="flex-start" style={{ marginBottom: 4 }}>
                    <Stack gap={3}>
                      <MonoLabel size={7.5}>Letter no. {letterNumber(mostRecent)}</MonoLabel>
                      <MonoLabel size={7} color={c.inkMuted}>{formatDate(mostRecent.created_at)}</MonoLabel>
                    </Stack>
                    <WaxSeal size={44} pulse={letterReady} />
                  </Row>

                  <ShimmerRule />

                  <Text style={{
                    fontFamily: f.serifI, fontSize: 28, color: c.forest,
                    lineHeight: 32, marginBottom: 10,
                  }}>
                    Dear {profile?.first_name ?? 'friend'},
                  </Text>
                  <Text style={{
                    fontFamily: f.serif, fontSize: 16, color: c.ink,
                    lineHeight: 27, opacity: 0.82,
                  }}>
                    {otherName && otherName !== 'Someone'
                      ? `I'd like you to meet someone. Their name is ${otherName}, and they are, I think, kind in a way you might not have guessed…`
                      : `I’d like you to meet someone. A short note from me is inside…`}
                  </Text>

                  <View style={[styles.cardFooter, { borderTopColor: c.ruleSoft }]}>
                    <Text style={{ fontFamily: f.serifI, color: c.inkSoft, fontSize: 18, lineHeight: 22 }}>— R.</Text>
                    <Row gap={6} align="center">
                      <MonoLabel size={8.5} color={c.forest}>
                        {letterReady ? 'Open letter' : 'Read'}
                      </MonoLabel>
                      <IconArrow color={c.forest} size={13} />
                    </Row>
                  </View>
                </PressCard>
              </FadeIn>
            )}

            {/* Empty state */}
            {!matchesLoading && !mostRecent && (
              <FadeIn delay={200} duration={600} style={[styles.emptyState, { borderColor: c.ruleSoft }]}>
                <WaxSeal size={54} pulse />
                <Text style={{
                  fontFamily: f.serifI, fontSize: 20, color: c.inkMuted,
                  textAlign: 'center', maxWidth: 230, lineHeight: 28, marginTop: 14,
                }}>
                  Your first letter will arrive soon.
                </Text>
                <Text style={{
                  fontFamily: f.bodyI, fontSize: 13, color: c.inkMuted,
                  opacity: 0.6, marginTop: 6,
                }}>
                  Romeo is writing.
                </Text>
              </FadeIn>
            )}
          </FadeIn>

          {/* ── Active conversation ── */}
          {hasConversation && (
            <FadeIn delay={240} duration={520} fromY={16} style={{ marginBottom: 28 }}>
              <SectionLabel>Active conversation</SectionLabel>
              <PressCard
                onPress={openChat}
                style={[styles.chatCard, {
                  backgroundColor: `${c.forest}0D`,
                  borderColor: `${c.forest}28`,
                }]}
              >
                <View style={{ padding: 20 }}>
                  <Row justify="space-between" align="flex-start" style={{ marginBottom: 10 }}>
                    <Text style={{
                      fontFamily: f.serifI, fontSize: 28, color: c.ink, lineHeight: 30,
                    }}>
                      {conversationName ?? 'Your match'}
                    </Text>
                    <MonoLabel size={7} color={c.inkMuted}>Active</MonoLabel>
                  </Row>
                  <Text style={{
                    fontFamily: f.bodyI, fontSize: 15, color: c.inkSoft,
                    lineHeight: 24, fontStyle: 'italic',
                  }}>
                    Your conversation is open. Continue where you left off.
                  </Text>
                  <View style={{ marginTop: 18 }}>
                    <Pressable
                      onPress={openChat}
                      style={[styles.chatCta, { backgroundColor: c.forest }]}
                    >
                      <Text style={{
                        fontFamily: f.mono, fontSize: 8, letterSpacing: 1.8,
                        color: '#FBF2E3', textTransform: 'uppercase',
                      }}>
                        Open conversation
                      </Text>
                      <IconArrow color="#FBF2E3" size={11} />
                    </Pressable>
                  </View>
                </View>
              </PressCard>
            </FadeIn>
          )}

          {/* ── Earlier letters ── */}
          {earlier.length > 0 && (
            <FadeIn delay={280} duration={500} fromY={12} style={{ marginBottom: 28 }}>
              <SectionLabel>Earlier letters</SectionLabel>
              {earlier.map((m, i) => {
                const name = otherUserName(m, userId);
                return (
                  <Pressable
                    key={m.id}
                    testID={`home-earlier-${i}`}
                    onPress={() => { Haptics.selectionAsync(); openLetter(); }}
                    style={[styles.earlierRow, {
                      borderTopColor: c.ruleSoft,
                      borderBottomColor: i === earlier.length - 1 ? c.ruleSoft : 'transparent',
                    }]}
                  >
                    <Stack gap={3} style={{ flex: 1 }}>
                      <Row gap={10}>
                        <MonoLabel size={7} color={c.forest}>No. {letterNumber(m)}</MonoLabel>
                        <MonoLabel size={7} color={c.inkMuted}>{formatDate(m.created_at)}</MonoLabel>
                      </Row>
                      <Text style={{ fontFamily: f.serifI, fontSize: 18, color: c.ink, lineHeight: 22 }}>
                        {name}
                      </Text>
                    </Stack>
                    <IconArrow color={c.inkMuted} size={14} />
                  </Pressable>
                );
              })}
            </FadeIn>
          )}

          {/* ── Stats ── */}
          {profile && (
            <FadeIn delay={320} fromY={8} style={{ marginBottom: 28 }}>
              <View style={[styles.statsRow, { borderColor: c.ruleSoft }]}>
                {[
                  { label: 'Letters',       val: String(matches.length) },
                  { label: 'Conversations', val: activeMatch ? '1' : '0' },
                  { label: 'Member since',  val: "Jun '26" },
                ].map(({ label, val }, i) => (
                  <View key={label} style={[styles.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: c.ruleSoft }]}>
                    <Text style={{ fontFamily: f.serifI, fontSize: 22, color: c.forest, lineHeight: 26 }}>
                      {val}
                    </Text>
                    <Text style={{
                      fontFamily: f.mono, fontSize: 7, color: c.inkMuted,
                      letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 4,
                    }}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </FadeIn>
          )}

          {/* ── Your matchmaker ── */}
          <FadeIn delay={360} duration={500} fromY={16} style={{ marginBottom: 28 }}>
            <SectionLabel>Your matchmaker</SectionLabel>
            <PressCard
              testID="home-speak-juliet"
              onPress={openJuliet}
              style={[styles.julietCard, {
                borderColor: c.ruleSoft,
                backgroundColor: c.bgCard,
              }]}
            >
              <View style={[styles.julietImageWrap, { backgroundColor: '#0c0c08', borderColor: c.rule }]}>
                <Image
                  source={julietFaded}
                  style={{ width: '100%', height: '100%', opacity: 0.7 }}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                />
                <Text style={[styles.julietLabel, { fontFamily: f.serifI }]}>Juliet</Text>
              </View>
              <View style={{ flex: 1, paddingVertical: 2 }}>
                <Text style={{ fontFamily: f.serifI, fontSize: 22, color: c.ink, lineHeight: 26 }}>
                  Speak to Juliet.
                </Text>
                <Text style={{
                  fontFamily: f.bodyI, fontSize: 13, color: c.inkMuted,
                  marginTop: 5, lineHeight: 20,
                }}>
                  She remembers what you said.{'\n'}She is waiting for you.
                </Text>
                <Row gap={6} align="center" style={{ marginTop: 12 }}>
                  <MonoLabel size={8} color={c.forest}>Begin</MonoLabel>
                  <IconArrow color={c.forest} size={12} />
                </Row>
              </View>
            </PressCard>
          </FadeIn>

          {/* ── Journal shortcut ── */}
          <FadeIn delay={400} duration={500} fromY={12} style={{ marginBottom: 28 }}>
            <SectionLabel>Archive</SectionLabel>
            <PressCard
              onPress={() => { Haptics.selectionAsync(); router.push('/(main)/journal' as never); }}
              style={[styles.archiveRow, { borderColor: c.ruleSoft, backgroundColor: c.bgCard }]}
            >
              <Stack gap={3} style={{ flex: 1 }}>
                <Text style={{ fontFamily: f.serifI, fontSize: 20, color: c.ink, lineHeight: 24 }}>
                  Your journal.
                </Text>
                <Text style={{ fontFamily: f.bodyI, fontSize: 13, color: c.inkMuted, lineHeight: 19 }}>
                  Letters, moments, and the words between.
                </Text>
              </Stack>
              <IconArrow color={c.inkMuted} size={14} />
            </PressCard>
          </FadeIn>

          {/* ── How the room works ── */}
          <FadeIn delay={440} duration={500} fromY={10} style={{ marginBottom: 28 }}>
            <SectionLabel>How the room works</SectionLabel>
            <View style={[styles.howCard, { borderColor: c.ruleSoft, backgroundColor: c.bgCard }]}>
              {[
                { step: '01', title: 'Juliet listens', body: 'You speak with Juliet privately. She learns who you are, not just what you want.' },
                { step: '02', title: 'Romeo writes',   body: 'Romeo reads both sides and writes you a letter. One introduction at a time.' },
                { step: '03', title: 'You decide',     body: 'Open the letter when you\'re ready. Reply through Romeo, or start a conversation.' },
              ].map(({ step, title, body }, i) => (
                <View key={step} style={[styles.howRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: c.ruleSoft }]}>
                  <Text style={{ fontFamily: f.mono, fontSize: 10, color: c.gold, letterSpacing: 1, width: 24 }}>
                    {step}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontFamily: f.mono, fontSize: 8, color: c.ink,
                      letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 5,
                    }}>
                      {title}
                    </Text>
                    <Text style={{ fontFamily: f.bodyI, fontSize: 13, color: c.inkMuted, lineHeight: 20 }}>
                      {body}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </FadeIn>

          {/* Footer */}
          <FadeIn delay={500} duration={600}>
            <OrnamentDivider style={{ marginBottom: 18 }} />
            <Text style={{
              textAlign: 'center', fontFamily: f.mono, fontSize: 7.5,
              letterSpacing: 1.8, color: c.inkMuted, textTransform: 'uppercase', opacity: 0.38,
            }}>
              Romeo &amp; Juliet · Est. 2026
            </Text>
          </FadeIn>

        </View>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    width: '100%', position: 'relative', overflow: 'hidden',
    backgroundColor: '#0a0c06',
  },
  heroTop: {
    position: 'absolute', top: 0, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  heroGreeting: {
    position: 'absolute', bottom: 28, left: 24,
  },
  card: {
    padding: 18, borderWidth: 1,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.07, shadowRadius: 22, elevation: 2,
  },
  newBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 18, paddingTop: 14, borderTopWidth: 1,
  },
  chatCard: {
    borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 6 }, shadowRadius: 18, elevation: 2,
  },
  chatCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, paddingHorizontal: 22, alignSelf: 'flex-start',
  },
  earlierRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1,
  },
  statsRow: {
    flexDirection: 'row', borderWidth: 1, overflow: 'hidden',
  },
  statItem: {
    flex: 1, alignItems: 'center', paddingVertical: 16,
  },
  julietCard: {
    flexDirection: 'row', gap: 16, padding: 16, borderWidth: 1, alignItems: 'flex-start',
    shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 6 }, shadowRadius: 18, elevation: 2,
  },
  julietImageWrap: {
    width: 72, height: 92, borderWidth: 1, overflow: 'hidden', position: 'relative',
  },
  julietLabel: {
    position: 'absolute', bottom: 6, left: 0, right: 0,
    textAlign: 'center', fontSize: 14, color: '#F3ECDA', opacity: 0.9,
  },
  archiveRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderWidth: 1,
  },
  howCard: {
    borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 14, elevation: 1,
  },
  howRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  emptyState: {
    alignItems: 'center', paddingVertical: 48, gap: 0,
    borderWidth: 1, borderStyle: 'dashed',
  },
});
