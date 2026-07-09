// RJ-APP/app/(main)/referrals.tsx
import { useRef, useEffect, useState, useCallback } from 'react';
import { Animated, View, Text, Pressable, StyleSheet, Easing, Platform, Share, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { safeBack } from '@/lib/nav';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { PaperHeader } from '@/components/primitives/PaperHeader';
import { IconBtn } from '@/components/primitives/IconBtn';
import { IconBack } from '@/components/primitives/Icons';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { getMyReferralCode, getMyReferrals, type MyReferral } from '@/lib/api';
import { supabase } from '@/lib/supabase';

function FadeSlide({ delay = 0, children, style }: { delay?: number; children: React.ReactNode; style?: object }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

export default function Referrals() {
  const { c, f, d } = useRJTheme();
  const [code, setCode] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<MyReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const [codeRes, refRes] = await Promise.all([getMyReferralCode(), getMyReferrals()]);
    if (codeRes.code) setCode(codeRes.code);
    if (codeRes.error) setLoadError(codeRes.error);
    setReferrals(refRes.referrals);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live updates: re-fetch the referrals list whenever a new profile row is
  // inserted or changes (e.g. someone joins using this member's code).
  useEffect(() => {
    const channel = supabase
      .channel('my-referrals')
      .on('postgres_changes' as never, { event: '*', schema: 'public', table: 'profiles' }, () => {
        getMyReferrals().then(res => setReferrals(res.referrals));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const onShare = async () => {
    if (!code) return;
    Haptics.selectionAsync();
    try {
      await Share.share({
        message: `Join me on Romeo & Juliet — a referral-only letter-writing app. Use my code ${code} to get in.`,
      });
    } catch {
      // user cancelled or share unavailable — ignore
    }
  };

  const onCopy = async () => {
    if (!code) return;
    Haptics.selectionAsync();
    try {
      const { setStringAsync } = await import('expo-clipboard').catch(() => ({ setStringAsync: null as any }));
      if (setStringAsync) await setStringAsync(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — sharing still works
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PaperHeader
        left={<IconBtn onPress={() => safeBack('/(main)/profile')}><IconBack /></IconBtn>}
        center="Referrals"
        sub="Invite a friend"
      />
      <ScreenScroll>
        <PaperNoise />
        <View style={{ paddingHorizontal: d.pad, paddingTop: Platform.OS === 'web' ? 20 : 16, paddingBottom: 40 }}>

          <FadeSlide delay={60}>
            <Text style={{ fontFamily: f.serifI, fontSize: 22, color: c.ink, lineHeight: 30, marginBottom: 6 }}>
              Romeo &amp; Juliet is by referral only.
            </Text>
            <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.inkMuted, lineHeight: 20, marginBottom: 22 }}>
              Share your code with someone thoughtful. When they join with it, they'll appear below.
            </Text>
          </FadeSlide>

          <FadeSlide delay={110}>
            <View style={[styles.codeCard, { backgroundColor: c.bgCard, borderColor: c.rule }]}>
              <MonoLabel size={8} color={c.forest}>Your code</MonoLabel>
              {loading ? (
                <ActivityIndicator color={c.forest as string} style={{ marginTop: 14 }} />
              ) : code ? (
                <Text style={{ fontFamily: f.mono, fontSize: 26, letterSpacing: 2, color: c.ink, marginTop: 10 }}>
                  {code}
                </Text>
              ) : (
                <Text style={{ fontFamily: f.bodyI, fontSize: 13, color: c.danger, marginTop: 10 }}>
                  {loadError ?? "Couldn't load your code."}
                </Text>
              )}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <Pressable
                  onPress={onCopy}
                  disabled={!code}
                  style={[styles.actionBtn, { borderColor: c.ruleSoft, opacity: code ? 1 : 0.4 }]}
                >
                  <Text style={{ fontFamily: f.mono, fontSize: 8, letterSpacing: 1.5, color: c.ink, textTransform: 'uppercase' }}>
                    {copied ? 'Copied ✓' : 'Copy'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={onShare}
                  disabled={!code}
                  style={[styles.actionBtn, { backgroundColor: c.forest, borderColor: c.forest, opacity: code ? 1 : 0.4 }]}
                >
                  <Text style={{ fontFamily: f.mono, fontSize: 8, letterSpacing: 1.5, color: '#FBF2E3', textTransform: 'uppercase' }}>
                    Share
                  </Text>
                </Pressable>
              </View>
            </View>
          </FadeSlide>

          <FadeSlide delay={160}>
            <OrnamentDivider style={{ marginVertical: 24 }} />
          </FadeSlide>

          <FadeSlide delay={200}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <MonoLabel size={8} color={c.forest}>People you've invited</MonoLabel>
              <View style={{ flex: 1, height: 1, backgroundColor: `${c.forest}30` }} />
            </View>

            {loading ? null : referrals.length === 0 ? (
              <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.inkMuted, lineHeight: 20 }}>
                No one has joined with your code yet. Once they do, they'll show up here — no refresh needed.
              </Text>
            ) : (
              referrals.map((r, i) => (
                <View
                  key={`${r.first_name ?? 'member'}-${r.created_at}-${i}`}
                  style={[styles.rowBase, { borderColor: c.ruleSoft }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: f.serif, fontSize: 16, color: c.ink }}>{r.first_name ?? 'A new member'}</Text>
                    <Text style={{ fontFamily: f.bodyI, fontSize: 12, color: c.inkMuted, marginTop: 1 }}>
                      Joined {new Date(r.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: f.mono, fontSize: 8, letterSpacing: 1, color: c.gold, textTransform: 'uppercase' }}>
                    {r.phase}
                  </Text>
                </View>
              ))
            )}
          </FadeSlide>

        </View>
      </ScreenScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  codeCard: { borderWidth: 1, padding: 20, alignItems: 'center' },
  actionBtn: { flex: 1, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  rowBase: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1 },
});
