import { useRef, useEffect } from 'react';
import { Animated, View, Text, Easing, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { safeBack } from '@/lib/nav';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PaperHeader } from '@/components/primitives/PaperHeader';
import { IconBtn } from '@/components/primitives/IconBtn';
import { IconBack } from '@/components/primitives/Icons';

function FadeSlide({ delay = 0, children, style }: {
  delay?: number; children: React.ReactNode; style?: object;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 480, delay,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, []);
  return (
    <Animated.View style={[style, {
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
    }]}>
      {children}
    </Animated.View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { c, f } = useRJTheme();
  return (
    <View style={{ marginBottom: 26 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <MonoLabel size={8} color={c.forest}>{title}</MonoLabel>
        <View style={{ flex: 1, height: 1, backgroundColor: `${c.forest}30` }} />
      </View>
      <Text style={{ fontFamily: f.body, fontSize: 15, color: c.ink, lineHeight: 24 }}>
        {children}
      </Text>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  const { c, f } = useRJTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
      <Text style={{ fontFamily: f.body, fontSize: 15, color: c.gold, lineHeight: 24 }}>·</Text>
      <Text style={{ fontFamily: f.body, fontSize: 15, color: c.ink, lineHeight: 24, flex: 1 }}>{text}</Text>
    </View>
  );
}

export default function PrivacyPolicy() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PaperHeader
        left={<IconBtn onPress={() => safeBack('/')}><IconBack /></IconBtn>}
        center="Privacy Policy"
        sub="Romeo & Juliet"
      />
      <ScreenScroll>
        <PaperNoise />
        <View style={{ paddingHorizontal: d.pad, paddingBottom: 48, paddingTop: topPad }}>

          <FadeSlide delay={60}>
            <Text style={{ fontFamily: f.serifI, fontSize: 22, color: c.ink, lineHeight: 30, marginBottom: 6 }}>
              Your privacy matters to us deeply.
            </Text>
            <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.inkMuted, lineHeight: 21, marginBottom: 22 }}>
              Last updated: July 2026 · Effective immediately upon use of the app.
            </Text>
          </FadeSlide>

          <FadeSlide delay={100}>
            <OrnamentDivider style={{ marginBottom: 28 }} />
          </FadeSlide>

          <FadeSlide delay={140}>
            <Section title="Who we are">
              Romeo &amp; Juliet is a referral-only correspondence platform that connects thoughtful people through slow, intentional letters. We are committed to handling your information with the same care and discretion we ask you to bring to every letter you write.
            </Section>
          </FadeSlide>

          <FadeSlide delay={180}>
            <Section title="What we collect">
              We collect only what is necessary to provide the service:
            </Section>
            <View style={{ marginTop: -16, marginBottom: 26 }}>
              <Bullet text="Your email address and name, provided during sign-up." />
              <Bullet text="Your archetype responses from the onboarding conversation." />
              <Bullet text="Letters and messages you write and receive within the app." />
              <Bullet text="Profile photographs you choose to upload." />
              <Bullet text="Basic usage data such as when you last opened the app." />
              <Bullet text="Your referral code and who referred you." />
            </View>
          </FadeSlide>

          <FadeSlide delay={220}>
            <Section title="How we use it">
              Your information is used solely to operate and improve Romeo &amp; Juliet:
            </Section>
            <View style={{ marginTop: -16, marginBottom: 26 }}>
              <Bullet text="To create and manage your account and match you with a correspondent." />
              <Bullet text="To deliver letters and conversation messages between matched users." />
              <Bullet text="To personalise your experience based on your archetype." />
              <Bullet text="To send you notifications about new letters (if you have enabled them)." />
              <Bullet text="To maintain the integrity and safety of the platform." />
            </View>
          </FadeSlide>

          <FadeSlide delay={260}>
            <Section title="Who sees your data">
              We do not sell your data. Ever.{'\n\n'}
              Your letters are private between you and your matched correspondent. Juliet (our AI companion) reads your onboarding conversation to understand you — those responses are stored securely and are never shown to other users.{'\n\n'}
              We use Supabase to store your data securely, ElevenLabs for voice features, and Expo/Google infrastructure for the app itself. Each of these partners handles data in accordance with their own privacy policies.
            </Section>
          </FadeSlide>

          <FadeSlide delay={300}>
            <Section title="Data retention">
              We keep your data for as long as your account is active. If you choose to leave — through "Remove me from the room" in Settings — we will delete your personal information, letters, and photographs within 30 days.{'\n\n'}
              You may also request an archive of your data at any time from the Settings screen.
            </Section>
          </FadeSlide>

          <FadeSlide delay={340}>
            <Section title="Photographs">
              Profile photographs you upload are stored securely and visible only according to the photograph visibility setting you choose in Settings. You can remove your photographs at any time from your profile.
            </Section>
          </FadeSlide>

          <FadeSlide delay={380}>
            <Section title="Your rights">
              Depending on where you live, you may have the right to access, correct, or delete your personal data. To exercise any of these rights, contact us at the address below. We will respond within 30 days.
            </Section>
          </FadeSlide>

          <FadeSlide delay={420}>
            <Section title="Children">
              Romeo &amp; Juliet is intended for adults aged 18 and over. We do not knowingly collect personal information from anyone under the age of 18. If we become aware that we have done so, we will delete it promptly.
            </Section>
          </FadeSlide>

          <FadeSlide delay={460}>
            <Section title="Changes to this policy">
              If we make material changes to this Privacy Policy, we will notify you inside the app before the changes take effect. Continued use of the app after that date constitutes your acceptance of the updated policy.
            </Section>
          </FadeSlide>

          <FadeSlide delay={500}>
            <Section title="Contact">
              For any questions about this Privacy Policy or your data, write to us at:{'\n\n'}
              <Text style={{ fontFamily: f.mono, fontSize: 12, color: c.forest, letterSpacing: 0.8 }}>
                privacy@romeoandjuliet.app
              </Text>
            </Section>
          </FadeSlide>

          <FadeSlide delay={540}>
            <OrnamentDivider style={{ marginVertical: 20 }} />
            <Text style={{ fontFamily: f.mono, fontSize: 7, letterSpacing: 1.8, color: c.inkMuted, textTransform: 'uppercase', opacity: 0.5, textAlign: 'center' }}>
              Romeo &amp; Juliet · By referral only
            </Text>
          </FadeSlide>

        </View>
      </ScreenScroll>
    </View>
  );
}
