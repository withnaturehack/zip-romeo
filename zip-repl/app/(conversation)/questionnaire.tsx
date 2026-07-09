// RJ-APP/app/(conversation)/questionnaire.tsx
// Keyboard-responsive, non-scrollable structured layout
import { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { WaxSeal } from '@/components/primitives/WaxSeal';

const QUESTIONS = [
  { id: 'q1', prompt: 'What does a perfect Sunday look like for you?' },
  { id: 'q2', prompt: 'What kind of person do you find yourself most drawn to?' },
  { id: 'q3', prompt: "What's something most people don't know about you?" },
  { id: 'q4', prompt: 'What are you most looking forward to in the next year?' },
  { id: 'q5', prompt: 'What would you want someone to know before they meet you?' },
];

export default function Questionnaire() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState('');
  const [busy, setBusy]       = useState(false);
  const inputRef              = useRef<TextInput>(null);
  const progressAnim          = useRef(new Animated.Value(1 / QUESTIONS.length)).current;

  const q      = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;

  const next = useCallback(async () => {
    if (!current.trim()) { Alert.alert('Please write something, even a few words.'); return; }
    const updated = { ...answers, [q.id]: current.trim() };
    setAnswers(updated);
    setCurrent('');

    // Animate progress
    Animated.timing(progressAnim, {
      toValue: (step + 2) / QUESTIONS.length,
      duration: 340, useNativeDriver: false,
    }).start();

    if (!isLast) {
      setStep(s => s + 1);
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }

    setBusy(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ questionnaire_answers: updated, phase: 'WAITING' }).eq('user_id', user.id);
      }
      router.replace('/(conversation)/waiting' as never);
    } catch {
      setBusy(false);
      Alert.alert('Could not save', 'Please try again.');
    }
  }, [current, answers, step, isLast, q.id]);

  const topPad = Platform.OS === 'web' ? 60 : insets.top;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <PaperNoise />

      {/* ── Fixed header ── */}
      <View style={[styles.header, {
        paddingTop: topPad + 12, paddingHorizontal: d.pad,
        borderBottomColor: c.ruleSoft, backgroundColor: c.bg,
      }]}>
        <MonoLabel size={7}>Juliet's questions</MonoLabel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <WaxSeal size={24} />
          <MonoLabel size={7} color={c.inkMuted as string}>{step + 1} / {QUESTIONS.length}</MonoLabel>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ height: 2, backgroundColor: c.ruleSoft }}>
        <Animated.View style={{
          height: 2, backgroundColor: c.gold,
          width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }} />
      </View>

      {/* ── Scrollable content (question + previous answers) ── */}
      <ScrollView
        style={{ flex: 1, backgroundColor: c.bg }}
        contentContainerStyle={{ padding: d.pad, paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Question */}
        <View style={{ marginTop: 20, marginBottom: 22 }}>
          <MonoLabel size={7} color={c.gold as string} style={{ marginBottom: 10 }}>
            Question {step + 1} of {QUESTIONS.length}
          </MonoLabel>
          <Text style={{ fontFamily: f.serifI, fontSize: 26, color: c.ink, lineHeight: 36, maxWidth: 340 }}>
            {q.prompt}
          </Text>
        </View>

        <OrnamentDivider />

        {/* Input */}
        <View style={{ marginTop: 20 }}>
          <TextInput
            ref={inputRef}
            value={current}
            onChangeText={setCurrent}
            placeholder="Write your answer…"
            placeholderTextColor={c.inkMuted as string}
            multiline
            autoFocus
            returnKeyType="default"
            blurOnSubmit={false}
            style={[styles.input, {
              borderColor: current.trim() ? c.rule : c.ruleSoft,
              color: c.ink, fontFamily: f.serif, fontSize: 17,
              backgroundColor: c.bgCard,
            }]}
          />
        </View>

        {/* Previous answers (collapsible strip) */}
        {step > 0 && (
          <View style={{ marginTop: 28 }}>
            <MonoLabel size={7} color={c.inkMuted as string} style={{ marginBottom: 10 }}>Earlier answers</MonoLabel>
            {QUESTIONS.slice(0, step).map(prev => (
              <View key={prev.id} style={[styles.prevAnswer, { borderLeftColor: c.ruleSoft, backgroundColor: c.bgCard }]}>
                <MonoLabel size={6.5} color={c.gold as string} style={{ marginBottom: 3 }}>
                  {prev.prompt.slice(0, 44)}{prev.prompt.length > 44 ? '…' : ''}
                </MonoLabel>
                <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.inkSoft, lineHeight: 21 }}>
                  {answers[prev.id]}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Fixed footer button (pushed up by keyboard) ── */}
      <View style={[styles.footer, {
        borderTopColor: c.ruleSoft, backgroundColor: c.bgCard,
        paddingBottom: Math.max(insets.bottom, 20),
        paddingHorizontal: d.pad,
      }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 14 }}>
          {step > 0 && (
            <Pressable
              onPress={() => { setStep(s => s - 1); setCurrent(answers[QUESTIONS[step - 1].id] ?? ''); }}
              style={[styles.backBtn, { borderColor: c.ruleSoft }]}
            >
              <Text style={{ fontFamily: f.mono, fontSize: 8.5, color: c.inkMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                ←
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={next}
            disabled={busy || !current.trim()}
            style={({ pressed }) => [styles.nextBtn, {
              backgroundColor: !current.trim() || busy ? c.ruleSoft : pressed ? c.forestDk : c.forest,
              flex: 1,
            }]}
          >
            <Text style={{
              fontFamily: f.mono, fontSize: 9.5, letterSpacing: 2,
              color: !current.trim() || busy ? c.inkMuted : '#F2E8D0',
              textTransform: 'uppercase',
            }}>
              {busy ? 'Sending…' : isLast ? 'Send to Romeo →' : 'Next →'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 14, borderBottomWidth: 1,
  },
  input: {
    borderWidth: 1, padding: 16, fontSize: 17, lineHeight: 28,
    minHeight: 140, textAlignVertical: 'top',
  },
  prevAnswer: {
    borderLeftWidth: 2, paddingLeft: 14, paddingVertical: 12, paddingRight: 12,
    marginBottom: 10,
  },
  footer: { borderTopWidth: 1 },
  backBtn: {
    borderWidth: 1, paddingVertical: 14, paddingHorizontal: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  nextBtn: { paddingVertical: 16, alignItems: 'center' },
});
