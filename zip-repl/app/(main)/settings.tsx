// RJ-APP/app/(main)/settings.tsx
import { useRef, useEffect, useState } from 'react';
import {
  Animated, View, Text, Switch, Pressable, StyleSheet, Easing, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import * as Haptics from 'expo-haptics';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { PaperHeader } from '@/components/primitives/PaperHeader';
import { IconBtn } from '@/components/primitives/IconBtn';
import { IconBack, IconArrow } from '@/components/primitives/Icons';
import { ArchetypeStamp } from '@/components/primitives/ArchetypeStamp';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { WaxSeal } from '@/components/primitives/WaxSeal';
import { JulietLogo } from '@/components/primitives/JulietLogo';
import { useStatus } from '@/lib/hooks';
import { usePreferences } from '@/theme/PreferencesProvider';
import { ARCHETYPES, ArchetypeId } from '@/lib/archetypes';
import { signOutCompletely } from '@/lib/supabase';
import type { DensityKey } from '@/theme/tokens';

function FadeSlide({ delay = 0, fromY = 12, children, style }: {
  delay?: number; fromY?: number; children: React.ReactNode; style?: object;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [fromY, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

function memberNo(userId: string | null): string {
  if (!userId) return '0000';
  let sum = 0;
  for (let i = 0; i < userId.length; i++) sum = (sum + userId.charCodeAt(i) * 7) % 99991;
  return String(sum % 9999).padStart(4, '0');
}

function referralCode(name: string | null): string {
  const base = (name ?? 'GUEST').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 9);
  let sum = 0;
  for (let i = 0; i < base.length; i++) sum = (sum + base.charCodeAt(i) * 3) % 97;
  return `${base || 'GUEST'}-${String(sum).padStart(2, '0')}`;
}

function SectionHeader({ label }: { label: string }) {
  const { c } = useRJTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
      <MonoLabel size={8} color={c.forest}>{label}</MonoLabel>
      <View style={{ flex: 1, height: 1, backgroundColor: `${c.forest}30` }} />
    </View>
  );
}

function ToggleRow({ label, value, onToggle, sub }: { label: string; value: boolean; onToggle: (v: boolean) => void; sub?: string }) {
  const { c, f } = useRJTheme();
  return (
    <View style={[styles.rowBase, { borderColor: c.ruleSoft }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: f.serif, fontSize: 16, color: c.ink }}>{label}</Text>
        {sub && <Text style={{ fontFamily: f.bodyI, fontSize: 12, color: c.inkMuted, marginTop: 1 }}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={v => { Haptics.selectionAsync(); onToggle(v); }}
        trackColor={{ false: c.ruleSoft as string, true: c.gold as string }}
        thumbColor={value ? '#FBF2E3' : c.bgAlt as string}
        ios_backgroundColor={c.ruleSoft as string}
      />
    </View>
  );
}

function TapRow({ label, value, onPress, danger, sub, isLast }: {
  label: string; value?: string; onPress?: () => void; danger?: boolean; sub?: string; isLast?: boolean;
}) {
  const { c, f } = useRJTheme();
  return (
    <Pressable
      onPress={() => { if (onPress) { Haptics.selectionAsync(); onPress(); } }}
      style={({ pressed }) => [
        styles.rowBase,
        { borderColor: c.ruleSoft, opacity: pressed ? 0.65 : 1 },
        isLast && { borderBottomWidth: 1, borderBottomColor: c.ruleSoft },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: f.serif, fontSize: 16, color: danger ? c.danger : c.ink }}>{label}</Text>
        {sub && <Text style={{ fontFamily: f.bodyI, fontSize: 12, color: c.inkMuted, marginTop: 1 }}>{sub}</Text>}
      </View>
      {value
        ? <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.inkMuted }}>{value}</Text>
        : onPress ? <IconArrow color={danger ? c.danger : c.inkMuted} size={14} /> : null}
    </Pressable>
  );
}

const WRITE_FREQ_OPTIONS    = ['When ready', 'Every few days', 'Once a week'];
const READING_SPEED_OPTIONS = ['Slow', 'Moderate', 'Fast'];
const PHOTO_PRIVACY_OPTIONS = ['Romeo only', 'Matched users', 'Private'];

function PickerSheet({ visible, title, options, selected, onSelect, onClose, c, f }: {
  visible: boolean; title: string; options: string[]; selected: string;
  onSelect: (v: string) => void; onClose: () => void;
  c: ReturnType<typeof useRJTheme>['c']; f: ReturnType<typeof useRJTheme>['f'];
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: visible ? 1 : 0, duration: 260, useNativeDriver: false }).start();
  }, [visible]);
  if (!visible) return null;
  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 99, justifyContent: 'flex-end' }]}>
      <Pressable style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.35)' }]} onPress={onClose} />
      <Animated.View style={{
        backgroundColor: c.bg, paddingBottom: 34,
        borderTopWidth: 1, borderTopColor: c.rule,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }],
      }}>
        <View style={{ padding: 18, borderBottomWidth: 1, borderBottomColor: c.ruleSoft }}>
          <MonoLabel size={8} color={c.forest}>{title}</MonoLabel>
        </View>
        {options.map(opt => (
          <Pressable
            key={opt}
            onPress={() => { Haptics.selectionAsync(); onSelect(opt); onClose(); }}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.ruleSoft }}
          >
            <Text style={{ fontFamily: f.serif, fontSize: 17, color: opt === selected ? c.forest : c.ink }}>{opt}</Text>
            {opt === selected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.forest }} />}
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
}

// Inline sign-out confirmation — avoids unreliable Alert.alert on web
function SignOutConfirm({ onConfirm, onCancel, c, f }: {
  onConfirm: () => void; onCancel: () => void;
  c: ReturnType<typeof useRJTheme>['c']; f: ReturnType<typeof useRJTheme>['f'];
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: false, speed: 22, bounciness: 2 }).start();
  }, []);
  return (
    <Animated.View style={[styles.confirmBox, {
      borderColor: c.danger,
      backgroundColor: `${c.danger}0C`,
      opacity: anim,
      transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }],
    }]}>
      <Text style={{ fontFamily: f.serifI, fontSize: 17, color: c.ink, marginBottom: 6 }}>
        Sign out of Romeo &amp; Juliet?
      </Text>
      <Text style={{ fontFamily: f.bodyI, fontSize: 13, color: c.inkMuted, lineHeight: 19, marginBottom: 14 }}>
        You can sign back in at any time. Your letters and conversations will be waiting.
      </Text>
      <Row gap={10}>
        <Pressable
          onPress={onCancel}
          style={[styles.confirmBtn, { borderColor: c.ruleSoft, flex: 1 }]}
        >
          <Text style={{ fontFamily: f.mono, fontSize: 8, color: c.inkMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          style={[styles.confirmBtn, { backgroundColor: c.danger, borderColor: c.danger, flex: 1 }]}
        >
          <Text style={{ fontFamily: f.mono, fontSize: 8, color: '#FBF2E3', letterSpacing: 1.5, textTransform: 'uppercase' }}>Sign out</Text>
        </Pressable>
      </Row>
    </Animated.View>
  );
}

export default function Settings() {
  const { c, f, d } = useRJTheme();
  const { profile, userId } = useStatus(0);
  const { prefs, update } = usePreferences();
  const [email, setEmail]               = useState<string | null>(null);
  const [densityOpen, setDensityOpen]   = useState(false);
  const [pauseIntros, setPauseIntros]   = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [writeFreq, setWriteFreq]       = useState('When ready');
  const [readingSpeed, setReadingSpeed] = useState('Slow');
  const [photoPrivacy, setPhotoPrivacy] = useState('Romeo only');
  const [picker, setPicker] = useState<null | {
    title: string; options: string[]; selected: string; onSelect: (v: string) => void;
  }>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : 0;

  useEffect(() => {
    let cancelled = false;
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }) => {
        if (!cancelled) setEmail(data.user?.email ?? null);
      }).catch(() => {});
    });
    return () => { cancelled = true; };
  }, []);

  const archetype = profile?.archetype && profile.archetype in ARCHETYPES
    ? ARCHETYPES[profile.archetype as ArchetypeId]
    : null;

  const doSignOut = async () => {
    setSigningOut(true);
    try {
      await signOutCompletely();
    } catch {
      // ignore — still redirect
    }
    router.replace('/');
  };

  const truncEmail = email ? (email.length > 28 ? `${email.slice(0, 14)}…` : email) : '—';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PaperHeader
        left={<IconBtn onPress={() => safeBack('/(main)/home')} testID="settings-back-btn"><IconBack /></IconBtn>}
        center="Settings"
        sub="Your account"
      />
      <ScreenScroll>
        <PaperNoise />
        <View style={{ paddingHorizontal: d.pad, paddingBottom: Platform.OS === 'web' ? 34 : 32 }}>

          {/* Profile card with Juliet portrait */}
          <FadeSlide delay={80} fromY={16}>
            <View style={[styles.profileCard, { backgroundColor: c.bgCard, borderColor: c.rule, marginTop: 16 }]}>
              <JulietLogo size={56} circle />
              <View style={{ flex: 1, paddingLeft: 4 }}>
                {archetype ? (
                  <>
                    <MonoLabel size={7} color={c.forest}>Juliet sees you as</MonoLabel>
                    <Text style={{ fontFamily: f.serifI, fontSize: 20, color: c.forest, lineHeight: 22, marginTop: 3 }}>{archetype.name}</Text>
                    <Text style={{ fontFamily: f.bodyI, fontSize: 13, color: c.inkMuted, marginTop: 2, lineHeight: 17 }}>{archetype.sub}</Text>
                  </>
                ) : (
                  <Text style={{ fontFamily: f.serifI, fontSize: 18, color: c.ink }}>
                    {profile?.first_name ?? 'Member'}
                  </Text>
                )}
                <Text style={{ fontFamily: f.mono, fontSize: 7, letterSpacing: 1.2, color: c.inkMuted, textTransform: 'uppercase', marginTop: 6 }}>
                  {profile?.first_name ?? 'Member'} · No. {memberNo(userId)}
                </Text>
              </View>
            </View>
          </FadeSlide>

          <FadeSlide delay={130}>
            <OrnamentDivider style={{ marginVertical: 22 }} />
          </FadeSlide>

          {/* Display */}
          <FadeSlide delay={170} fromY={12}>
            <View style={{ marginBottom: 24 }}>
              <SectionHeader label="Display" />
              <ToggleRow
                label="Dark mode"
                sub="Switch between paper and night"
                value={prefs.dark}
                onToggle={v => update({ dark: v })}
              />
              <Pressable
                testID="settings-density-row"
                onPress={() => { Haptics.selectionAsync(); setDensityOpen(o => !o); }}
                style={[styles.rowBase, { borderColor: c.ruleSoft }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: f.serif, fontSize: 16, color: c.ink }}>Density</Text>
                  <Text style={{ fontFamily: f.bodyI, fontSize: 12, color: c.inkMuted, marginTop: 1 }}>How much breathing room</Text>
                </View>
                <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.inkMuted, marginRight: 6 }}>
                  {prefs.density.charAt(0).toUpperCase() + prefs.density.slice(1)}
                </Text>
                <IconArrow color={c.inkMuted} size={13} />
              </Pressable>
              {densityOpen && (
                <View style={{ paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: c.ruleSoft }}>
                  <Row gap={8}>
                    {(['compact', 'comfortable', 'spacious'] as DensityKey[]).map(k => {
                      const active = prefs.density === k;
                      return (
                        <Pressable
                          key={k}
                          testID={`settings-density-${k}`}
                          onPress={() => { Haptics.selectionAsync(); update({ density: k }); setDensityOpen(false); }}
                          style={[styles.densityBtn, {
                            borderColor: active ? c.forest : c.rule,
                            backgroundColor: active ? `${c.forest}18` : 'transparent',
                          }]}
                        >
                          <Text style={{ fontFamily: f.mono, fontSize: 8, letterSpacing: 1.2, color: active ? c.forest : c.inkMuted, textTransform: 'uppercase' }}>
                            {k}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </Row>
                </View>
              )}
            </View>
          </FadeSlide>

          {/* You */}
          <FadeSlide delay={230} fromY={12}>
            <View style={{ marginBottom: 24 }}>
              <SectionHeader label="You" />
              <TapRow label="Name" value={profile?.first_name ?? '—'} />
              <TapRow label="Email" value={truncEmail} />
              <TapRow label="Your archetype" value={archetype?.name ?? '—'} />
              <TapRow
                label="Edit photographs"
                sub="Manage your profile photos"
                onPress={() => {}}
                isLast
              />
            </View>
          </FadeSlide>

          {/* Correspondence */}
          <FadeSlide delay={290} fromY={12}>
            <View style={{ marginBottom: 24 }}>
              <SectionHeader label="Correspondence" />
              <ToggleRow
                label="Pause introductions"
                sub="Stop Romeo from making new matches"
                value={pauseIntros}
                onToggle={setPauseIntros}
              />
              <TapRow
                label="How often Romeo writes"
                value={writeFreq}
                onPress={() => setPicker({ title: 'How often Romeo writes', options: WRITE_FREQ_OPTIONS, selected: writeFreq, onSelect: setWriteFreq })}
              />
              <TapRow
                label="Reading speed"
                value={readingSpeed}
                sub="Paces how letters are revealed"
                onPress={() => setPicker({ title: 'Reading speed', options: READING_SPEED_OPTIONS, selected: readingSpeed, onSelect: setReadingSpeed })}
                isLast
              />
            </View>
          </FadeSlide>

          {/* Privacy */}
          <FadeSlide delay={340} fromY={12}>
            <View style={{ marginBottom: 24 }}>
              <SectionHeader label="Privacy" />
              <TapRow
                label="Who can see your photographs"
                value={photoPrivacy}
                onPress={() => setPicker({ title: 'Photograph visibility', options: PHOTO_PRIVACY_OPTIONS, selected: photoPrivacy, onSelect: setPhotoPrivacy })}
              />
              <TapRow label="Download my data" sub="Receive an archive by email" onPress={() => {}} />
              <TapRow label="Remove me from the room" danger onPress={() => {}} isLast />
            </View>
          </FadeSlide>

          {/* The room */}
          <FadeSlide delay={390} fromY={12}>
            <View style={{ marginBottom: 24 }}>
              <SectionHeader label="The room" />
              <TapRow
                label="Your referral code"
                value={referralCode(profile?.first_name ?? null)}
              />
              <ToggleRow label="Notifications" sub="Letters and message alerts" value={notifications} onToggle={setNotifications} />
            </View>
          </FadeSlide>

          {/* Sign out — inline confirmation, no Alert */}
          <FadeSlide delay={440} fromY={12}>
            <View style={{ marginBottom: 24 }}>
              <SectionHeader label="Account" />
              {!showSignOutConfirm ? (
                <TapRow
                  label={signingOut ? 'Signing out…' : 'Sign out'}
                  danger
                  sub="You can sign back in at any time"
                  onPress={() => setShowSignOutConfirm(true)}
                  isLast
                />
              ) : (
                <SignOutConfirm
                  onConfirm={doSignOut}
                  onCancel={() => setShowSignOutConfirm(false)}
                  c={c} f={f}
                />
              )}
            </View>
          </FadeSlide>

          <FadeSlide delay={500}>
            <OrnamentDivider style={{ marginVertical: 16 }} />
            <View style={{ alignItems: 'center', gap: 12 }}>
              <JulietLogo size={48} circle />
              <Text style={{ textAlign: 'center', fontFamily: f.mono, fontSize: 7.5, letterSpacing: 1.5, color: c.inkMuted, textTransform: 'uppercase', opacity: 0.6 }}>
                Romeo &amp; Juliet · v1.0 · Est. 2026
              </Text>
            </View>
          </FadeSlide>

        </View>
      </ScreenScroll>

      {picker && (
        <PickerSheet
          visible
          title={picker.title}
          options={picker.options}
          selected={picker.selected}
          onSelect={picker.onSelect}
          onClose={() => setPicker(null)}
          c={c} f={f}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', padding: 16, borderWidth: 1, marginBottom: 4 },
  rowBase: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1 },
  densityBtn: { flex: 1, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
  confirmBox: { borderWidth: 1, padding: 16, marginBottom: 16 },
  confirmBtn: { borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
});
