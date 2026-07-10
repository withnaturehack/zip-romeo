// RJ-APP/app/(conversation)/voice.tsx
// Voice-first conversation with Juliet — tap the orb to speak (Alexa-style)
// Works on web (Web Speech API) and native iOS/Android (expo-av + ElevenLabs STT)
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Animated, View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, Easing, Dimensions, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { WaxSeal } from '@/components/primitives/WaxSeal';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';

type Msg = { from: 'juliet' | 'user'; text: string };
type VoicePhase = 'idle' | 'listening' | 'thinking' | 'speaking';

const QUESTIONS = [
  "Hello. I'm glad you came.\n\nTell me — what does a perfect morning look like for you?",
  "And what kind of person do you find yourself drawn to most?",
  "What's something most people don't know about you yet?",
  "And what are you hoping to find here, really?",
];

const RESPONSES = [
  "That sounds lovely.",
  "A tender answer. Thank you.",
  "I'm glad you shared that.",
  "I'll carry that with me.",
];

const { width: SCREEN_W } = Dimensions.get('window');
const ORB_SIZE = Math.min(SCREEN_W * 0.52, 210);

// ─── Supabase Edge Function helpers ──────────────────────────────────────────
// TTS/STT are proxied through Supabase Edge Functions (juliet-tts, juliet-stt)
// so the ElevenLabs API key stays server-side and is never bundled into the
// client app.
async function functionUrl(name: string): Promise<string> {
  const base = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  return `${base.replace(/\/$/, '')}/functions/v1/${name}`;
}

async function authHeaders(): Promise<Record<string, string>> {
  const { supabase } = await import('@/lib/supabase');
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Not signed in — cannot use voice features.');
  }
  return { Authorization: `Bearer ${token}`, apikey: anon };
}

// ─── Juliet TTS — fetches audio via edge function and plays it cross-platform ─
async function speakElevenLabs(text: string): Promise<boolean> {
  try {
    const url = await functionUrl('juliet-tts');
    const headers = await authHeaders();
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return false;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Web path — blob → Audio()
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      return new Promise(resolve => {
        const audio = new (window as any).Audio(url) as HTMLAudioElement;
        audio.onended = () => { URL.revokeObjectURL(url); resolve(true); };
        audio.onerror = () => resolve(false);
        audio.play().catch(() => resolve(false));
      });
    } else {
      // Native path — arrayBuffer → base64 → temp file → expo-av Sound
      // Use base64-arraybuffer (installed) — no Buffer/atob needed in Hermes
      const { encode: encodeB64 } = await import('base64-arraybuffer');
      const FileSystem = await import('expo-file-system/legacy');
      const { Audio }  = await import('expo-av');

      const buf  = await res.arrayBuffer();
      const b64  = encodeB64(buf);
      const path = `${FileSystem.cacheDirectory}juliet_tts_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(path, b64, { encoding: FileSystem.EncodingType.Base64 });

      const { sound } = await Audio.Sound.createAsync(
        { uri: path },
        { shouldPlay: true, volume: 1.0 },
      );
      return new Promise(resolve => {
        let settled = false;
        const finish = (ok: boolean) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          cleanup();
          resolve(ok);
        };
        const cleanup = () => {
          sound.unloadAsync().catch(() => {});
          FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {});
        };
        // Guard against playback stalling (e.g. decode failure that never
        // fires didJustFinish) so the UI never gets stuck in "speaking".
        const timeoutId = setTimeout(() => finish(false), 30000);
        sound.setOnPlaybackStatusUpdate(status => {
          if (!status.isLoaded) {
            if ((status as any).error) finish(false);
            return;
          }
          if (status.didJustFinish) finish(true);
        });
      });
    }
  } catch {
    return false;
  }
}

function speakBrowserFallback(text: string): number {
  if (Platform.OS !== 'web') return 1500;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return 1500;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\n+/g, ' '));
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => /Samantha|Karen|Moira|Fiona|Victoria/i.test(v.name))
      ?? voices.find(v => v.lang.startsWith('en') && v.localService) ?? voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.lang = 'en-GB'; utterance.rate = 0.92; utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
    return Math.max(2000, text.length * 60);
  } catch {
    return 2000;
  }
}

// ─── Juliet STT (native only) — proxied via edge function ───────────────────
async function transcribeWithElevenLabs(audioUri: string): Promise<string | null> {
  try {
    // Use base64-arraybuffer (installed) to avoid atob/Buffer — safe in Hermes
    const { decode: decodeB64 } = await import('base64-arraybuffer');
    const FileSystem = await import('expo-file-system/legacy');

    const b64 = await FileSystem.readAsStringAsync(audioUri, { encoding: FileSystem.EncodingType.Base64 });
    const buf  = decodeB64(b64);
    const blob = new Blob([buf], { type: 'audio/m4a' });
    const form = new FormData();
    (form as any).append('file', blob, 'audio.m4a');

    const url = await functionUrl('juliet-stt');
    const headers = await authHeaders();
    const res = await fetch(url, { method: 'POST', headers, body: form });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.text as string | null) ?? null;
  } catch {
    return null;
  }
}

// ─── Orb — voice-phase aware (useNativeDriver: false everywhere) ──────────────
function JulietOrb({ phase, onPress }: { phase: VoicePhase; onPress: () => void }) {
  const p1     = useRef(new Animated.Value(1)).current;
  const p2     = useRef(new Animated.Value(1)).current;
  const p3     = useRef(new Animated.Value(1)).current;
  const glow   = useRef(new Animated.Value(0.3)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(1)).current;
  const pulse  = useRef(new Animated.Value(1)).current;

  const speaking  = phase === 'speaking';
  const listening = phase === 'listening';

  useEffect(() => {
    const ND = false;
    const ring = (a: Animated.Value, delay: number, to: number) =>
      Animated.loop(Animated.sequence([
        Animated.timing(a, { toValue: to,  duration: listening ? 600 : 2000, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
        Animated.timing(a, { toValue: 1,   duration: listening ? 600 : 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
      ]));

    const rings = [
      ring(p1, 0,   speaking ? 1.22 : listening ? 1.30 : 1.05),
      ring(p2, 340, speaking ? 1.42 : listening ? 1.55 : 1.10),
      ring(p3, 680, speaking ? 1.60 : listening ? 1.80 : 1.16),
    ];
    rings.forEach(r => r.start());

    const glowLoop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: listening ? 1.0 : speaking ? 0.9 : 0.5, duration: listening ? 500 : 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
      Animated.timing(glow, { toValue: 0.2, duration: listening ? 500 : 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
    ]));
    glowLoop.start();

    const rotLoop = Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: ND }),
    );
    rotLoop.start();

    const breathLoop = Animated.loop(Animated.sequence([
      Animated.timing(breath, { toValue: 1.028, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
      Animated.timing(breath, { toValue: 1.0,   duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
    ]));
    breathLoop.start();

    // Press pulse when listening
    if (listening) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
        Animated.timing(pulse, { toValue: 1.0,  duration: 400, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
      ])).start();
    } else {
      Animated.timing(pulse, { toValue: 1.0, duration: 300, useNativeDriver: ND }).start();
    }

    return () => { rings.forEach(r => r.stop()); glowLoop.stop(); rotLoop.stop(); breathLoop.stop(); };
  }, [phase]);

  const deg = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const borderCol = listening ? 'rgba(180,60,60,0.6)'
    : speaking ? 'rgba(174,138,74,0.55)'
    : 'rgba(174,138,74,0.2)';
  const shadowCol = listening ? '#C04040' : speaking ? '#AE8A4A' : '#4A6020';

  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ width: ORB_SIZE * 1.9, height: ORB_SIZE * 1.9, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pulse }] }}>
        {([p3, p2, p1] as Animated.Value[]).map((anim, i) => (
          <Animated.View key={i} style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center', transform: [{ scale: anim }] }]}>
            <View style={{
              width: ORB_SIZE + i * 28, height: ORB_SIZE + i * 28,
              borderRadius: (ORB_SIZE + i * 28) / 2,
              backgroundColor: listening
                ? (i === 0 ? 'rgba(180,60,60,0.10)' : i === 1 ? 'rgba(200,80,80,0.07)' : 'rgba(180,60,60,0.03)')
                : (i === 0 ? 'rgba(74,96,32,0.09)' : i === 1 ? 'rgba(174,138,74,0.06)' : 'rgba(74,96,32,0.03)'),
            }} />
          </Animated.View>
        ))}

        <Animated.View style={{
          position: 'absolute',
          width: ORB_SIZE + 30, height: ORB_SIZE + 30,
          borderRadius: (ORB_SIZE + 30) / 2,
          opacity: glow,
          shadowColor: shadowCol,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 50,
          elevation: 0,
        }} />

        <Animated.View style={{
          position: 'absolute', width: ORB_SIZE, height: ORB_SIZE,
          borderRadius: ORB_SIZE / 2, transform: [{ rotate: deg }], overflow: 'hidden',
        }}>
          <LinearGradient
            colors={['rgba(174,138,74,0.0)', 'rgba(174,138,74,0.18)', 'rgba(74,96,32,0.14)', 'rgba(174,138,74,0.0)']}
            style={{ flex: 1 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: breath }] }}>
          <LinearGradient
            colors={['#EEE4CA', '#F4EADA', '#E8DABC', '#D8CEAD']}
            style={{
              width: ORB_SIZE, height: ORB_SIZE,
              borderRadius: ORB_SIZE / 2,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1.5, borderColor: borderCol,
            }}
            start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.0)']}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: ORB_SIZE * 0.65, height: ORB_SIZE * 0.5,
                borderTopLeftRadius: ORB_SIZE / 2,
              }}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <WaxSeal size={ORB_SIZE * 0.38} pulse={speaking || listening} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Waveform bars — all refs declared at top level (no hooks in loops) ───────
const BAR_HEIGHTS = [0.3, 0.6, 0.85, 0.7, 0.45, 0.9, 0.65, 0.4, 0.78, 0.95, 0.55, 0.7, 0.42];

function WaveformBars({ active }: { active: boolean }) {
  const a0  = useRef(new Animated.Value(0.15)).current;
  const a1  = useRef(new Animated.Value(0.15)).current;
  const a2  = useRef(new Animated.Value(0.15)).current;
  const a3  = useRef(new Animated.Value(0.15)).current;
  const a4  = useRef(new Animated.Value(0.15)).current;
  const a5  = useRef(new Animated.Value(0.15)).current;
  const a6  = useRef(new Animated.Value(0.15)).current;
  const a7  = useRef(new Animated.Value(0.15)).current;
  const a8  = useRef(new Animated.Value(0.15)).current;
  const a9  = useRef(new Animated.Value(0.15)).current;
  const a10 = useRef(new Animated.Value(0.15)).current;
  const a11 = useRef(new Animated.Value(0.15)).current;
  const a12 = useRef(new Animated.Value(0.15)).current;
  const anims = [a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12];

  useEffect(() => {
    if (!active) {
      anims.forEach(a => Animated.timing(a, { toValue: 0.15, duration: 300, useNativeDriver: false }).start());
      return;
    }
    const loops = anims.map((a, i) => {
      const h = BAR_HEIGHTS[i];
      return Animated.loop(Animated.sequence([
        Animated.timing(a, { toValue: h,   duration: 220 + i * 24, delay: i * 30, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(a, { toValue: 0.1, duration: 220 + i * 24, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ]));
    });
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, [active]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, height: 32 }}>
      {anims.map((a, i) => (
        <Animated.View key={i} style={{
          width: 2.5, borderRadius: 2, backgroundColor: '#4A6020', opacity: 0.65,
          height: a.interpolate({ inputRange: [0, 1], outputRange: [3, 32] }),
        }} />
      ))}
    </View>
  );
}

// ─── Message fade-in ──────────────────────────────────────────────────────────
function MsgFade({ children }: { children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function Voice() {
  const { c, f, d } = useRJTheme();
  const insets   = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [messages,   setMessages]   = useState<Msg[]>([]);
  const [voicePhase, setVoicePhase] = useState<VoicePhase>('idle');
  const [step,       setStep]       = useState(0);
  const [done,       setDone]       = useState(false);
  const [answers,    setAnswers]    = useState<string[]>([]);
  const [liveText,   setLiveText]   = useState(''); // live transcript while listening
  const [showType,   setShowType]   = useState(false);
  const [typeInput,  setTypeInput]  = useState('');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const orbAnim    = useRef(new Animated.Value(0)).current;

  // Native recording ref
  const recordingRef    = useRef<any>(null);
  // Web speech recognition ref
  const recognitionRef  = useRef<any>(null);

  const progress = Math.min(((step + (done ? 1 : 0)) / QUESTIONS.length) * 100, 100);
  const topPad   = Platform.OS === 'web' ? 0 : insets.top;

  // ── TTS ──────────────────────────────────────────────────────────────────────
  const speakText = useCallback(async (text: string) => {
    setVoicePhase('speaking');
    try {
      const ok = await speakElevenLabs(text);
      if (!ok) {
        const dur = speakBrowserFallback(text);
        await new Promise(r => setTimeout(r, dur));
      }
    } catch {
      // silent
    } finally {
      setVoicePhase('idle');
    }
  }, []);

  // ── Mount: animate in + speak first question ──────────────────────────────
  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(orbAnim,    { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();

    const t = setTimeout(() => {
      const firstMsg = QUESTIONS[0];
      setMessages([{ from: 'juliet', text: firstMsg }]);
      speakText(firstMsg);
    }, 900);
    return () => clearTimeout(t);
  }, []);

  // ── Web speech recognition setup ─────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const SRC = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SRC) return;
    const rec = new SRC();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
    rec.onresult = (e: any) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0]?.transcript ?? '';
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setLiveText(final || interim);
      if (final) {
        // Stop immediately so Juliet's TTS voice isn't picked up as input
        try { rec.stop(); } catch {}
        setLiveText('');
        setVoicePhase('thinking');
        handleAnswerRef.current(final.trim());
      }
    };
    rec.onerror = () => { setVoicePhase('idle'); setLiveText(''); };
    rec.onend   = () => { setVoicePhase(prev => prev === 'listening' ? 'idle' : prev); };
    recognitionRef.current = rec;
    return () => { try { rec.stop(); } catch {} };
  }, []);

  // ── Scroll to bottom on new messages ─────────────────────────────────────
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }, [messages]);

  // ── Handle an answer (from voice or text) ────────────────────────────────
  const handleAnswer = useCallback(async (text: string) => {
    if (!text || done) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    const nextAnswers = [...answers, trimmed];
    setAnswers(nextAnswers);
    setLiveText('');
    setTypeInput('');
    setMessages(m => [...m, { from: 'user', text: trimmed }]);
    Haptics.selectionAsync().catch(() => {});

    const nextStep = step + 1;
    if (nextStep >= QUESTIONS.length) {
      setTimeout(async () => {
        const finale = "Thank you. I've heard enough to know you're someone worth knowing.";
        setMessages(m => [...m, { from: 'juliet', text: finale }]);
        await speakText(finale);
        setDone(true);
      }, 700);
      return;
    }

    setStep(nextStep);
    const delay = 700 + Math.min(trimmed.length * 10, 700);
    setTimeout(async () => {
      const reply = `${RESPONSES[Math.min(nextStep - 1, RESPONSES.length - 1)]} ${QUESTIONS[nextStep]}`;
      setMessages(m => [...m, { from: 'juliet', text: reply }]);
      await speakText(reply);
    }, delay);
  }, [answers, step, done, speakText]);

  // ── Always-current ref so the recognition onresult callback (set up once) ──
  // ── never calls a stale closure of handleAnswer. ────────────────────────────
  const handleAnswerRef = useRef<typeof handleAnswer>(handleAnswer);
  useEffect(() => { handleAnswerRef.current = handleAnswer; }, [handleAnswer]);

  // ── Start recording (native) ─────────────────────────────────────────────
  const startNativeRecording = useCallback(async () => {
    try {
      const { Audio } = await import('expo-av');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setVoicePhase('listening');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch (e) {
      Alert.alert('Microphone', 'Could not access microphone. Please check permissions.');
      setVoicePhase('idle');
    }
  }, []);

  // ── Stop recording and transcribe (native) ───────────────────────────────
  const stopNativeRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    setVoicePhase('thinking');
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      try {
        const { Audio } = await import('expo-av');
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      } catch {}
      if (!uri) { setVoicePhase('idle'); return; }
      const transcript = await transcribeWithElevenLabs(uri);
      if (transcript?.trim()) {
        await handleAnswer(transcript.trim());
      } else {
        Alert.alert('Didn\'t catch that', 'Please try speaking again.');
        setVoicePhase('idle');
      }
    } catch {
      setVoicePhase('idle');
    }
  }, [handleAnswer]);

  // ── Toggle orb tap ───────────────────────────────────────────────────────
  const handleOrbPress = useCallback(() => {
    if (voicePhase === 'speaking' || voicePhase === 'thinking' || done) return;

    if (Platform.OS === 'web') {
      const rec = recognitionRef.current;
      if (!rec) {
        // No speech recognition — show type mode instead
        setShowType(true); return;
      }
      if (voicePhase === 'listening') {
        rec.stop?.();
        setVoicePhase('idle');
      } else {
        setVoicePhase('listening');
        try { rec.start(); } catch { /* already started */ }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
    } else {
      if (voicePhase === 'listening') {
        stopNativeRecording();
      } else {
        startNativeRecording();
      }
    }
  }, [voicePhase, done, startNativeRecording, stopNativeRecording]);

  // ── Send from text input ─────────────────────────────────────────────────
  const sendTyped = useCallback(() => {
    if (!typeInput.trim() || voicePhase === 'speaking') return;
    handleAnswer(typeInput.trim());
    setShowType(false);
  }, [typeInput, voicePhase, handleAnswer]);

  // ── Finish and move to questionnaire ─────────────────────────────────────
  const onFinish = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from('profiles').update({ phase: 'QUESTIONNAIRE_DONE' }).eq('user_id', user.id);
    } catch {}
    router.replace('/(conversation)/questionnaire' as never);
  };

  const statusLabel = done            ? 'Our conversation is complete'
    : voicePhase === 'listening'      ? 'Listening…'
    : voicePhase === 'thinking'       ? 'Thinking…'
    : voicePhase === 'speaking'       ? 'Juliet is speaking…'
    : 'Tap to speak';

  const canTap = voicePhase === 'idle' || voicePhase === 'listening';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Header ── */}
      <Animated.View style={{ opacity: headerAnim, paddingTop: topPad + 20, paddingHorizontal: d.pad }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            {/* Back to home */}
            <Pressable
              onPress={() => router.replace('/(main)/home' as never)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, alignSelf: 'flex-start' }}
            >
              <Text style={{ fontFamily: f.mono, fontSize: 13, color: c.inkMuted, lineHeight: 16 }}>←</Text>
              <MonoLabel size={6.5} color={c.inkMuted as string}>Home</MonoLabel>
            </Pressable>
            <Text style={{ fontFamily: f.serifI, fontSize: 28, color: c.ink, lineHeight: 32 }}>Juliet</Text>
            <MonoLabel size={6.5} color={c.inkMuted as string} style={{ marginTop: 3 }}>
              Private conversation · by referral only
            </MonoLabel>
          </View>
          <WaxSeal size={34} />
        </View>
        <View style={{ height: 1, backgroundColor: c.ruleSoft, marginTop: 16 }}>
          <View style={{ height: 1, backgroundColor: c.gold, width: `${progress}%` as any, opacity: 0.7 }} />
        </View>
      </Animated.View>

      {/* ── Orb + status ── */}
      <Animated.View style={{ opacity: orbAnim, alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
        <JulietOrb phase={voicePhase} onPress={handleOrbPress} />

        {/* Live transcript bubble */}
        {liveText ? (
          <View style={[styles.liveTranscript, { backgroundColor: c.bgCard, borderColor: c.ruleSoft }]}>
            <Text style={{ fontFamily: f.serifI, fontSize: 15, color: c.ink, lineHeight: 22, textAlign: 'center' }}>
              {liveText}
            </Text>
          </View>
        ) : (
          <View style={{ height: 32, justifyContent: 'center', marginTop: 2 }}>
            {voicePhase === 'listening' || voicePhase === 'speaking'
              ? <WaveformBars active />
              : (
                <MonoLabel
                  size={7}
                  color={voicePhase === 'thinking' ? (c.gold as string) : (c.inkMuted as string)}
                  style={{ opacity: done ? 0 : 1 }}
                >
                  {statusLabel}
                </MonoLabel>
              )
            }
          </View>
        )}

        {/* Tap instruction when idle */}
        {voicePhase === 'idle' && !done && !liveText && (
          <MonoLabel size={6} color={c.inkMuted as string} style={{ marginTop: 4, opacity: 0.55 }}>
            {Platform.OS === 'web' && !(window as any)?.SpeechRecognition && !(window as any)?.webkitSpeechRecognition
              ? 'Type below to reply'
              : 'Tap orb to speak'}
          </MonoLabel>
        )}
      </Animated.View>

      <View style={{ height: 1, backgroundColor: c.ruleSoft, marginHorizontal: d.pad, opacity: 0.5 }} />

      {/* ── Messages ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: d.pad, paddingTop: 14, paddingBottom: 20, gap: 18 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: 2 }}>
          <MonoLabel size={6} color={c.inkMuted as string} style={{ opacity: 0.5 }}>
            Only you and Juliet can read this
          </MonoLabel>
        </View>

        {messages.map((m, i) => (
          <MsgFade key={i}>
            {m.from === 'juliet' ? (
              <View style={{ flexDirection: 'row', gap: 10, maxWidth: '92%' }}>
                <View style={{ width: 2, borderRadius: 1, backgroundColor: c.gold, opacity: 0.6, marginTop: 22, flexShrink: 0 }} />
                <View>
                  <MonoLabel size={6.5} color={c.gold as string} style={{ marginBottom: 8, opacity: 0.85 }}>Juliet</MonoLabel>
                  <Text style={{ fontFamily: f.serifI, fontSize: 17.5, color: c.ink, lineHeight: 30 }}>{m.text}</Text>
                </View>
              </View>
            ) : (
              <View style={{ alignSelf: 'flex-end', maxWidth: '84%' }}>
                <MonoLabel size={6.5} color={c.inkMuted as string} style={{ marginBottom: 6, alignSelf: 'flex-end', opacity: 0.7 }}>You</MonoLabel>
                <View style={[styles.userBubble, { backgroundColor: c.forest }]}>
                  <Text style={{ fontFamily: f.serif, fontSize: 16, color: '#F5EDDA', lineHeight: 26 }}>{m.text}</Text>
                </View>
              </View>
            )}
          </MsgFade>
        ))}

        {done && (
          <MsgFade>
            <View style={{ alignItems: 'center', marginTop: 24, gap: 16 }}>
              <OrnamentDivider />
              <View style={[styles.doneCard, { backgroundColor: c.bgCard, borderColor: c.ruleSoft }]}>
                <WaxSeal size={52} pulse />
                <Text style={{ fontFamily: f.serifI, fontSize: 23, color: c.forest, marginTop: 18, textAlign: 'center', lineHeight: 30 }}>
                  Our conversation is complete.
                </Text>
                <Text style={{ fontFamily: f.bodyI, fontSize: 15, color: c.inkMuted, textAlign: 'center', maxWidth: 280, lineHeight: 25, marginTop: 10 }}>
                  I'll pass your words to Romeo now.{'\n'}He'll write to you soon.
                </Text>
                <Pressable
                  onPress={onFinish}
                  style={({ pressed }) => [styles.finishBtn, { backgroundColor: pressed ? c.forestDk : c.forest, marginTop: 24 }]}
                >
                  <Text style={{ fontFamily: f.mono, fontSize: 9, letterSpacing: 2.5, color: '#F2E8D0', textTransform: 'uppercase' }}>
                    Continue →
                  </Text>
                </Pressable>
              </View>
            </View>
          </MsgFade>
        )}
      </ScrollView>

      {/* ── Type instead (secondary, collapsible) ── */}
      {!done && (
        <View style={{ borderTopColor: c.ruleSoft, borderTopWidth: 1, backgroundColor: c.bgCard }}>
          {/* Toggle row */}
          <Pressable
            onPress={() => setShowType(v => !v)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 6 }}
          >
            <Text style={{ fontSize: 12 }}>{showType ? '⌨️' : '⌨️'}</Text>
            <MonoLabel size={6.5} color={c.inkMuted as string}>{showType ? 'Hide keyboard' : 'Type instead'}</MonoLabel>
          </Pressable>

          {showType && (
            <View style={[styles.typeRow, {
              paddingHorizontal: d.pad,
              paddingBottom: Math.max(insets.bottom, 16),
              paddingTop: 4,
            }]}>
              <TextInput
                value={typeInput}
                onChangeText={setTypeInput}
                placeholder="Write to Juliet…"
                placeholderTextColor={c.inkMuted as string}
                multiline
                autoFocus
                style={[styles.typeInput, {
                  borderColor: typeInput.trim() ? c.rule : c.ruleSoft,
                  backgroundColor: c.bg,
                  color: c.ink,
                  fontFamily: f.serif,
                  fontSize: 16,
                }]}
              />
              <Pressable
                onPress={sendTyped}
                disabled={!typeInput.trim() || voicePhase === 'speaking'}
                style={({ pressed }) => [styles.sendBtn, {
                  backgroundColor: typeInput.trim() && voicePhase !== 'speaking'
                    ? (pressed ? c.forestDk : c.forest)
                    : c.ruleSoft,
                }]}
              >
                <Text style={{
                  fontFamily: f.mono, fontSize: 8,
                  color: typeInput.trim() && voicePhase !== 'speaking' ? '#F2E8D0' : c.inkMuted,
                  letterSpacing: 2, textTransform: 'uppercase',
                }}>
                  Send
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  liveTranscript: {
    marginTop: 10, marginHorizontal: 24,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 4, borderWidth: 1,
    maxWidth: 320, alignSelf: 'center',
  },
  userBubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 2 },
  doneCard:   { borderWidth: 1, padding: 28, alignItems: 'center', width: '100%' },
  finishBtn:  { paddingVertical: 16, paddingHorizontal: 40, borderRadius: 2 },
  typeRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  typeInput: {
    flex: 1, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10,
    maxHeight: 90, lineHeight: 24, borderRadius: 2,
  },
  sendBtn: {
    paddingHorizontal: 18, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center', borderRadius: 2,
  },
});
