import { useRef, useEffect, useState } from 'react';
import { Animated, View, Text, TextInput, StyleSheet, Alert, Easing, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PrimaryButton, TextLink } from '@/components/primitives/Button';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { JulietPortrait } from '@/components/primitives/JulietPortrait';
import { saveProfile } from '@/lib/api';
import { getPendingReferral } from '@/lib/referral-pending';
import { pickAndUploadPhoto } from '@/lib/upload';

function FadeSlide({ delay = 0, fromY = 20, children, style }: {
  delay?: number; fromY?: number; children: React.ReactNode; style?: object;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 520, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [anim, delay]);
  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [fromY, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

function Field({ label, value, onChange, placeholder, optional, hint, multiline = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; optional?: boolean; hint?: string; multiline?: boolean;
}) {
  const { c, f } = useRJTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <Row gap={6} align="center">
        <MonoLabel size={7.5} color={focused ? c.forest : undefined}>{label}</MonoLabel>
        {optional && <MonoLabel size={7} color={c.inkMuted as string}>· optional</MonoLabel>}
      </Row>
      <TextInput
        value={value} onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.inkMuted as string}
        autoCorrect={false}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          borderBottomWidth: focused ? 2 : 1,
          borderBottomColor: focused ? c.forest : c.rule,
          paddingVertical: 10, marginTop: 6,
          minHeight: multiline ? 92 : 44,
          fontFamily: f.serif, fontSize: multiline ? 16 : 22, color: c.ink,
        }}
      />
      {hint && <Text style={{ fontFamily: f.bodyI, fontSize: 12, color: c.inkMuted, marginTop: 4, lineHeight: 17 }}>{hint}</Text>}
    </View>
  );
}

export default function Profile() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ referral?: string }>();
  const [firstName, setFirstName] = useState('');
  const [social, setSocial] = useState('');
  const [bio, setBio] = useState('');
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    (async () => {
      const fromParams = params.referral?.toUpperCase().trim();
      if (fromParams) {
        setReferralCode(fromParams);
        return;
      }
      const pending = await getPendingReferral();
      if (pending) setReferralCode(pending);
    })();
  }, [params.referral]);

  const uploadPhoto = async (slotIndex: number) => {
    setPhotoBusy(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        Alert.alert('You need to sign in again', 'Your session expired before we could attach a photo.');
        setPhotoBusy(false);
        return;
      }

      const result = await pickAndUploadPhoto(user.id, slotIndex + 1);
      if (!result.ok) {
        if (result.error !== 'Cancelled') {
          Alert.alert('Photo upload failed', result.error);
        }
        setPhotoBusy(false);
        return;
      }

      setPhotoUrls(prev => {
        const next = [...prev];
        next[slotIndex] = result.url;
        return next.slice(0, 3);
      });
    } catch {
      Alert.alert('Photo upload failed', 'Your photo could not be attached right now.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = (slotIndex: number) => {
    setPhotoUrls(prev => {
      const next = [...prev];
      next.splice(slotIndex, 1);
      return next;
    });
  };

  const submit = async () => {
    if (!firstName.trim()) return Alert.alert('A name, please.', 'Juliet needs to know what to call you.');
    setBusy(true);
    const r = await saveProfile({
      firstName: firstName.trim(),
      socialHandle: social.trim() || null,
      bio: bio.trim() || null,
      photoUrls,
      referralCode: referralCode || null,
    });
    setBusy(false);
    if (!r.ok) {
      Alert.alert("Couldn't save your profile", r.error ?? 'Please try again.');
      return;
    }
    router.replace('/(onboarding)/pending' as never);
  };

  return (
    <ScreenScroll style={{ backgroundColor: c.bg }}>
      <PaperNoise />
      <View style={{ padding: d.pad, paddingTop: d.pad + insets.top, paddingBottom: d.pad + insets.bottom }}>

        <FadeSlide fromY={-10} delay={0}>
          <Row justify="space-between" align="center">
            <TextLink onPress={() => safeBack()}>← Back</TextLink>
            <MonoLabel size={7.5}>Your profile · Step 2 of 4</MonoLabel>
          </Row>
        </FadeSlide>

        <FadeSlide delay={100} fromY={16} style={{ alignItems: 'center', marginTop: 28 }}>
          <JulietPortrait width={100} height={125} rotate={-3} label="Juliet, no. 02" />
        </FadeSlide>

        <FadeSlide delay={200} fromY={20}>
          <View style={{ gap: 10, marginTop: 22 }}>
            <MonoLabel color={c.forest}>Tell her about yourself</MonoLabel>
            <Text style={{ fontFamily: f.serif, fontSize: d.hero * 0.9, color: c.ink, lineHeight: d.hero * 0.95 }}>
              A little more{'\n'}about you.
            </Text>
            <Text style={{ fontFamily: f.bodyI, fontSize: 15, color: c.inkMuted, lineHeight: 22, maxWidth: 300 }}>
              Juliet will read your letter carefully. Add a photo, a short note, and your handle so your match can recognize you.
            </Text>
          </View>
        </FadeSlide>

        <FadeSlide delay={300} style={{ marginTop: 24, marginBottom: 16 }}>
          <OrnamentDivider />
        </FadeSlide>

        <FadeSlide delay={380} fromY={16}>
          <Stack gap={20}>
            <Field
              label="First name" value={firstName} onChange={setFirstName}
              placeholder="Eleanor"
              hint="This is how Juliet and Romeo will address you."
            />
            <Field
              label="Social handle" value={social} onChange={setSocial}
              placeholder="@eleanor" optional
              hint="Your Instagram or similar — shared only with your match."
            />
            <Field
              label="Short note" value={bio} onChange={setBio}
              placeholder="I love letters, old books, and rainy afternoons."
              multiline
              optional
              hint="A few words about your style and what you hope to share."
            />

            <View>
              <Row justify="space-between" align="center">
                <MonoLabel size={7.5}>Photos</MonoLabel>
                <MonoLabel size={7} color={c.inkMuted as string}>{photoUrls.length}/3</MonoLabel>
              </Row>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                {Array.from({ length: 3 }).map((_, index) => {
                  const url = photoUrls[index];
                  return (
                    <Pressable
                      key={index}
                      onPress={() => (url ? removePhoto(index) : uploadPhoto(index))}
                      style={({ pressed }) => [{
                        flex: 1,
                        height: 160,
                        borderWidth: 1,
                        borderColor: url ? c.forest : c.ruleSoft,
                        borderStyle: url ? 'solid' : 'dashed',
                        borderRadius: 14,
                        backgroundColor: pressed ? c.bgSunken : c.bgCard,
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }]}
                    >
                      {url ? (
                        <>
                          <Image source={{ uri: url }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                          <View style={{ position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                            <Text style={{ fontFamily: f.mono, fontSize: 8, color: '#F2E8D0', textTransform: 'uppercase', letterSpacing: 1.2 }}>Remove</Text>
                          </View>
                        </>
                      ) : (
                        <View style={{ alignItems: 'center', gap: 4, paddingHorizontal: 8 }}>
                          <Text style={{ fontFamily: f.serif, fontSize: 20, color: c.forest }}>+</Text>
                          <Text style={{ fontFamily: f.bodyI, fontSize: 12, color: c.inkMuted, textAlign: 'center' }}>
                            {photoBusy ? 'Uploading…' : `Photo ${index + 1}`}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
              <Text style={{ fontFamily: f.bodyI, fontSize: 12, color: c.inkMuted, marginTop: 8, lineHeight: 18 }}>
                Add up to three photos so Juliet and Romeo can recognize you clearly.
              </Text>
            </View>
          </Stack>
        </FadeSlide>

        <FadeSlide delay={500} style={{ marginTop: 32 }}>
          <PrimaryButton onPress={submit}>{busy ? 'Sending to Juliet…' : 'Send to Juliet →'}</PrimaryButton>
        </FadeSlide>

        <FadeSlide delay={560} style={{ marginTop: 20 }}>
          <View style={{ padding: 14, borderWidth: 1, borderColor: c.ruleSoft, borderStyle: 'dashed', gap: 6 }}>
            <MonoLabel size={7} color={c.forest}>What happens next</MonoLabel>
            <Text style={{ fontFamily: f.bodyI, fontSize: 13, color: c.inkMuted, lineHeight: 19 }}>
              Juliet will review your application and, if the room is open to you, invite you for a private conversation. You'll hear from us within 48 hours.
            </Text>
          </View>
        </FadeSlide>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({});
