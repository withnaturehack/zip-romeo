import { useRef, useEffect, useState } from 'react';
import {
  Animated, View, Text, TextInput, StyleSheet,
  Pressable, Easing, Image, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { getOAuthRedirectUri } from '@/lib/auth-redirect';
import { setPendingReferral } from '@/lib/referral-pending';
import { routeAfterAuth } from '@/lib/post-auth';
import { safeBack } from '@/lib/nav';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PrimaryButton, TextLink } from '@/components/primitives/Button';
import { PaperNoise } from '@/components/primitives/PaperNoise';

// Expo Go uses a dynamic exp:// redirect that can't be pre-registered in Supabase.
// Google OAuth only works in the native APK build (rj-app:// scheme).
const IS_EXPO_GO = Constants.appOwnership === 'expo';

WebBrowser.maybeCompleteAuthSession();

type Mode = 'signin' | 'signup';

const portrait = require('@/assets/juliet-portrait.png');

function FadeSlide({ delay = 0, fromY = 20, children, style }: {
  delay?: number; fromY?: number; children: React.ReactNode; style?: object;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 550, delay,
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

function GoogleButton({ onPress, loading }: { onPress: () => void; loading?: boolean }) {
  const { c, f } = useRJTheme();
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      style={[styles.googleBtn, {
        borderColor: c.rule,
        backgroundColor: pressed ? c.bgAlt : c.bgCard,
      }]}
    >
      <View style={styles.gIcon}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#4285F4' }}>G</Text>
      </View>
      <Text style={{ fontFamily: f.mono, fontSize: 9, letterSpacing: 1.8, color: c.ink, textTransform: 'uppercase', flex: 1, textAlign: 'center' }}>
        {loading ? 'Redirecting…' : 'Continue with Google'}
      </Text>
    </Pressable>
  );
}

export default function SignIn() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string; referral?: string }>();

  // If arriving from referral screen, default to signup mode
  const [mode, setMode] = useState<Mode>(params.mode === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focusEmail, setFocusEmail] = useState(false);
  const [focusPass, setFocusPass] = useState(false);

  const isSignUp = mode === 'signup';
  const cameFromReferral = !!params.referral;

  const onGoogle = async () => {
    setGoogleBusy(true); setError(null);
    try {
      const { supabase } = await import('@/lib/supabase');

      if (params.referral) await setPendingReferral(params.referral);

      const redirectTo = getOAuthRedirectUri();
      if (Platform.OS !== 'web') {
        const { data, error: err } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (err) { setError(err.message); setGoogleBusy(false); return; }
        if (data?.url) {
          const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
          console.log('[Google OAuth] result type:', result.type);
          if (result.type === 'success' && result.url) {
            // NOTE: Do NOT use `new URL()` here — it crashes silently on Android/Hermes
            // with non-standard schemes like exp://. Use regex parsing instead.
            const rawUrl = result.url;
            const hashIdx = rawUrl.indexOf('#');
            const queryIdx = rawUrl.indexOf('?');
            const queryStr = queryIdx !== -1
              ? rawUrl.slice(queryIdx + 1, hashIdx !== -1 ? hashIdx : undefined)
              : '';
            const hashStr = hashIdx !== -1 ? rawUrl.slice(hashIdx + 1) : '';
            const getParam = (str: string, key: string): string | null => {
              const m = str.match(new RegExp(`(?:^|&)${key}=([^&]*)`));
              return m ? decodeURIComponent(m[1]) : null;
            };

            // Handle PKCE flow (code param) and implicit flow (tokens in hash/query)
            const code = getParam(queryStr, 'code');
            const access_token = getParam(hashStr, 'access_token') ?? getParam(queryStr, 'access_token');
            const refresh_token = getParam(hashStr, 'refresh_token') ?? getParam(queryStr, 'refresh_token');

            // Log only presence, never values
            console.log('[Google OAuth] received code:', !!code, 'tokens:', !!access_token && !!refresh_token);

            let sessionErr: any = null;
            if (code) {
              // PKCE — exchange the code for a session
              const { data: sessionData, error: e } = await supabase.auth.exchangeCodeForSession(result.url);
              sessionErr = e;
              console.log('[Google OAuth] exchangeCodeForSession:', e?.message ?? 'ok', 'signed in:', !!sessionData?.session);
            } else if (access_token && refresh_token) {
              // Implicit — set session directly from tokens
              const { data: sessionData, error: e } = await supabase.auth.setSession({ access_token, refresh_token });
              sessionErr = e;
              console.log('[Google OAuth] setSession:', e?.message ?? 'ok', 'signed in:', !!sessionData?.session);
            } else {
              setError('Sign-in failed: no tokens in callback. Please try again.');
              setGoogleBusy(false);
              return;
            }

            if (sessionErr) {
              setError(sessionErr.message);
            } else {
              await routeAfterAuth(params.referral);
            }
          } else if (result.type === 'cancel' || result.type === 'dismiss') {
            setError(null); // User cancelled — no error needed
          }
        }
        setGoogleBusy(false);
      } else {
        const { error: err } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo },
        });
        if (err) { setError(err.message); setGoogleBusy(false); }
        // Browser navigates to Google then back to /auth/callback
      }
    } catch {
      setError('Google sign-in is not available. Please use your email and password.');
      setGoogleBusy(false);
    }
  };

  const onEmail = async () => {
    if (!email.trim() || password.length < 6) {
      setError('Enter your email and a password of at least 6 characters.');
      return;
    }
    setBusy(true); setError(null); setInfo(null);
    try {
      const { supabase } = await import('@/lib/supabase');
      if (isSignUp) {
        const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
        if (err) { setBusy(false); setError(err.message); return; }

        if (params.referral) await setPendingReferral(params.referral);

        if (data.session?.user) {
          const userId = data.session.user.id;
          // Try RPC first (SECURITY DEFINER, bypasses RLS), fall back to direct upsert
          const { error: rpcErr } = await supabase.rpc('create_initial_profile', { p_user_id: userId });
          if (rpcErr) {
            await supabase.from('profiles').upsert({ user_id: userId, phase: 'PROFILE' }, { onConflict: 'user_id' });
          }
          setBusy(false);
          router.replace({ pathname: '/(onboarding)/profile', params: { referral: params.referral ?? '' } } as never);
          return;
        }

        if (data.user) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
          setBusy(false);
          if (!signInErr && signInData.session?.user) {
            const userId = signInData.session.user.id;
            const { error: rpcErr2 } = await supabase.rpc('create_initial_profile', { p_user_id: userId });
            if (rpcErr2) {
              await supabase.from('profiles').upsert({ user_id: userId, phase: 'PROFILE' }, { onConflict: 'user_id' });
            }
            router.replace({ pathname: '/(onboarding)/profile', params: { referral: params.referral ?? '' } } as never);
            return;
          }

          const msg = signInErr?.message?.toLowerCase().includes('confirm') || signInErr?.message?.toLowerCase().includes('verified')
            ? 'Your account was created. Please confirm your email, then sign in again to continue.'
            : 'Your account was created, but we could not start your session automatically. Please sign in again.';
          setInfo(msg);
          return;
        }

        setBusy(false);
        setInfo('A confirmation note has been sent to your inbox. Open it to take your place.');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        setBusy(false);
        if (err) { setError(err.message); return; }
        await routeAfterAuth();
      }
    } catch {
      setBusy(false);
      setError('Cannot reach the server right now. Please try again in a moment.');
    }
  };

  return (
    <ScreenScroll style={{ backgroundColor: c.bg }}>
      <PaperNoise />
      <View style={{ paddingHorizontal: d.pad, paddingTop: d.pad + insets.top, paddingBottom: d.pad + insets.bottom }}>

        <FadeSlide fromY={-10} delay={0}>
          <Row justify="space-between" align="center">
            <TextLink onPress={() => safeBack()}>← Back</TextLink>
            <MonoLabel size={7.5}>{isSignUp ? 'Application' : 'Return'}</MonoLabel>
          </Row>
        </FadeSlide>

        <FadeSlide fromY={24} delay={80} style={{ alignItems: 'center', marginTop: 28, marginBottom: 24 }}>
          <View style={styles.portraitFrame}>
            <Image source={portrait} style={styles.portrait} resizeMode="cover" />
            <View style={[styles.portraitAccent, { backgroundColor: c.forest }]} />
          </View>
          <Text style={{ fontFamily: f.serifI, fontSize: 30, color: c.ink, textAlign: 'center', marginTop: 18, lineHeight: 36 }}>
            {isSignUp
              ? <>Begin your{'\n'}<Text style={{ color: c.forest }}>conversation.</Text></>
              : <>Welcome{'\n'}<Text style={{ color: c.forest }}>back.</Text></>}
          </Text>
          <Text style={{ fontFamily: f.bodyI, fontSize: 15, color: c.inkMuted, textAlign: 'center', marginTop: 6, maxWidth: 240, lineHeight: 22 }}>
            {isSignUp
              ? 'Your invitation is confirmed. Create your account to continue.'
              : 'Juliet has been keeping your place.'}
          </Text>
        </FadeSlide>

        <FadeSlide delay={160} style={{ marginVertical: 20 }}>
          <OrnamentDivider />
        </FadeSlide>

        <FadeSlide delay={220} fromY={16}>
          {IS_EXPO_GO ? (
            <View style={[styles.expoGoNote, { borderColor: c.ruleSoft, backgroundColor: c.bgCard }]}>
              <Text style={{ fontFamily: f.mono, fontSize: 7, letterSpacing: 1.6, color: c.gold, textTransform: 'uppercase', marginBottom: 6 }}>
                Expo Go preview
              </Text>
              <Text style={{ fontFamily: f.bodyI, fontSize: 13, color: c.inkMuted, lineHeight: 19 }}>
                Google sign-in is only available in the native app build.{'\n'}Use your email and password below to sign in.
              </Text>
            </View>
          ) : (
            <GoogleButton onPress={onGoogle} loading={googleBusy} />
          )}
        </FadeSlide>

        <FadeSlide delay={280} style={{ marginVertical: 18 }}>
          <Row align="center" gap={10}>
            <View style={{ flex: 1, height: 1, backgroundColor: c.ruleSoft }} />
            <MonoLabel size={7} color={c.inkMuted}>{IS_EXPO_GO ? 'sign in with email' : 'or continue with email'}</MonoLabel>
            <View style={{ flex: 1, height: 1, backgroundColor: c.ruleSoft }} />
          </Row>
        </FadeSlide>

        <FadeSlide delay={340} fromY={16}>
          <Stack gap={18}>
            <View>
              <MonoLabel size={7.5} color={focusEmail ? c.forest : undefined}>Your email</MonoLabel>
              <TextInput
                value={email} onChangeText={v => { setEmail(v); setError(null); }}
                placeholder="you@somewhere.com"
                placeholderTextColor={c.inkMuted as string}
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                onFocus={() => setFocusEmail(true)} onBlur={() => setFocusEmail(false)}
                style={[styles.input, {
                  borderBottomColor: focusEmail ? c.forest : c.rule,
                  color: c.ink, fontFamily: f.serif,
                  borderBottomWidth: focusEmail ? 2 : 1,
                }]}
              />
            </View>
            <View>
              <MonoLabel size={7.5} color={focusPass ? c.forest : undefined}>Your password</MonoLabel>
              <TextInput
                value={password} onChangeText={v => { setPassword(v); setError(null); }}
                placeholder="••••••••"
                placeholderTextColor={c.inkMuted as string}
                secureTextEntry autoCapitalize="none" autoCorrect={false}
                onFocus={() => setFocusPass(true)} onBlur={() => setFocusPass(false)}
                style={[styles.input, {
                  borderBottomColor: focusPass ? c.forest : c.rule,
                  color: c.ink, fontFamily: f.serif, letterSpacing: 4,
                  borderBottomWidth: focusPass ? 2 : 1,
                }]}
              />
            </View>
          </Stack>
        </FadeSlide>

        {(error || info) && (
          <FadeSlide delay={0} fromY={8} style={{ marginTop: 14 }}>
            <View style={[styles.messageBanner, {
              borderLeftColor: error ? c.danger : c.forest,
              backgroundColor: error ? `${c.danger}10` : `${c.forest}10`,
            }]}>
              <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: error ? c.danger : c.ink, lineHeight: 21 }}>
                {error ?? info}
              </Text>
            </View>
          </FadeSlide>
        )}

        <FadeSlide delay={420} style={{ marginTop: 22 }}>
          <PrimaryButton onPress={onEmail}>
            {busy ? 'One moment…' : isSignUp ? 'Create my account' : 'Sign in'}
          </PrimaryButton>
        </FadeSlide>

        <FadeSlide delay={480} style={{ marginTop: 20 }}>
          <View style={[styles.switchRow, { borderTopColor: c.ruleSoft }]}>
            <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.inkMuted }}>
              {isSignUp ? 'Already a correspondent? ' : 'New to Romeo & Juliet? '}
            </Text>
            <Text
              onPress={() => { setMode(isSignUp ? 'signin' : 'signup'); setError(null); setInfo(null); }}
              style={{ fontFamily: f.bodyI, fontSize: 14, color: c.forest, textDecorationLine: 'underline' }}
            >
              {isSignUp ? 'Sign in' : 'Apply for access'}
            </Text>
          </View>
        </FadeSlide>

        <FadeSlide delay={540} style={{ marginTop: 28, alignItems: 'center' }}>
          <Text style={{ fontFamily: f.mono, fontSize: 7, letterSpacing: 1.8, color: c.inkMuted, textTransform: 'uppercase', opacity: 0.5 }}>
            Romeo &amp; Juliet · By referral only
          </Text>
        </FadeSlide>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  portraitFrame: {
    width: 100, height: 100, borderRadius: 50, overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(85,107,47,0.4)',
    backgroundColor: '#0d0d09',
    shadowColor: '#000', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 10 }, shadowRadius: 24,
    elevation: 6,
    position: 'relative',
  },
  portrait: { width: '100%', height: '100%' },
  portraitAccent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, paddingVertical: 14, paddingHorizontal: 16,
  },
  gIcon: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e0e0e0', marginRight: 10,
    shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2,
    elevation: 1,
  },
  input: { fontSize: 22, paddingVertical: 10, marginTop: 6 },
  messageBanner: { padding: 14, borderLeftWidth: 3 },
  switchRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    paddingTop: 16, borderTopWidth: 1, borderStyle: 'dashed',
  },
  expoGoNote: {
    borderWidth: 1, borderStyle: 'dashed', padding: 14,
  },
});
