// RJ-APP/app/(main)/profile.tsx
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { WaxSeal } from '@/components/primitives/WaxSeal';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { NAV_H } from '@/components/nav/BottomNav';
import { useStatus } from '@/lib/hooks';

export default function Profile() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useStatus(0);

  const displayName = profile?.first_name ?? 'Member';
  const rawHandle = profile?.social_handle?.replace(/^@+/, '') ?? '';
  const displayHandle = rawHandle
    ? `@${rawHandle}${profile?.archetype ? ` · ${profile.archetype}` : ''}`
    : profile?.archetype ?? 'Romeo & Juliet · Member';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const onSignOut = async () => {
    const { signOutCompletely } = await import('@/lib/supabase');
    await signOutCompletely();
    router.replace('/(auth)/welcome' as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PaperNoise />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14, paddingHorizontal: d.pad, borderBottomColor: c.ruleSoft }]}>
        <Text style={{ fontFamily: f.serifI, fontSize: 28, color: c.ink }}>Profile</Text>
        <WaxSeal size={36} />
      </View>

      <ScrollView contentContainerStyle={{ padding: d.pad, paddingBottom: NAV_H + insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        {/* Identity card */}
        <View style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.ruleSoft }]}>
          <View style={{ alignItems: 'center', paddingVertical: 28 }}>
            <View style={[styles.avatar, { borderColor: c.forest, backgroundColor: c.bgSunken }]}>
              <Text style={{ fontFamily: f.serifI, fontSize: 36, color: c.forest }}>{avatarLetter}</Text>
            </View>
            <Text style={{ fontFamily: f.serifI, fontSize: 26, color: c.ink, marginTop: 14 }}>
              {displayName}
            </Text>
            <MonoLabel size={7} color={c.gold as string} style={{ marginTop: 4 }}>
              {displayHandle}
            </MonoLabel>
          </View>
        </View>

        <OrnamentDivider style={{ marginVertical: 22 }} />

        {/* Settings rows */}
        {[
          { label: 'Preferences', sub: 'Font size, theme, density', href: '/(main)/settings' },
          { label: 'Privacy',     sub: 'Who sees your profile',     href: '/(main)/settings' },
          { label: 'Referrals',   sub: 'Invite a friend',           href: '/(main)/referrals' },
        ].map(({ label, sub, href }) => (
          <Pressable
            key={label}
            onPress={() => router.push(href as never)}
            style={({ pressed }) => [
              styles.row,
              { borderBottomColor: c.ruleSoft, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: f.serif, fontSize: 18, color: c.ink }}>{label}</Text>
              <Text style={{ fontFamily: f.bodyI, fontSize: 13, color: c.inkMuted, marginTop: 2 }}>{sub}</Text>
            </View>
            <Text style={{ fontFamily: f.mono, fontSize: 12, color: c.inkMuted }}>›</Text>
          </Pressable>
        ))}

        <View style={{ marginTop: 32 }}>
          <Pressable
            onPress={onSignOut}
            style={({ pressed }) => [styles.signOutBtn, { borderColor: c.ruleSoft, backgroundColor: pressed ? c.bgSunken : 'transparent' }]}
          >
            <Text style={{ fontFamily: f.mono, fontSize: 9, letterSpacing: 2, color: c.inkMuted, textTransform: 'uppercase' }}>
              Sign out
            </Text>
          </Pressable>
        </View>

        <View style={{ alignItems: 'center', marginTop: 28 }}>
          <MonoLabel size={6.5} color={c.inkMuted as string} style={{ opacity: 0.4 }}>
            Romeo &amp; Juliet · Est. 2026
          </MonoLabel>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 16, borderBottomWidth: 1,
  },
  card: { borderWidth: 1, overflow: 'hidden' },
  avatar: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1,
  },
  signOutBtn: {
    paddingVertical: 16, borderWidth: 1, alignItems: 'center',
  },
});
