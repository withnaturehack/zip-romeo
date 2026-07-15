// RJ-APP/app/(conversation)/questionnaire.tsx
// Keyboard-responsive, non-scrollable structured layout with 37 web-app questions
import { useState, useRef, useCallback, useEffect } from 'react';
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
import * as Haptics from 'expo-haptics';
import { ARCHETYPES, ArchetypeId } from '@/lib/archetypes';

type Question = {
  id: string;
  section: string;
  question: string;
  type: 'text' | 'select';
  optional?: boolean;
  options?: string[];
  placeholder?: string;
};

const QUESTIONS: Question[] = [
  // BASIC INFORMATION
  { id: 'dob', section: 'Basic Information', question: 'Date of birth', type: 'text', placeholder: 'DD/MM/YYYY' },
  { id: 'age_range', section: 'Basic Information', question: "Age range you'd like to date", type: 'text', placeholder: 'e.g. 28–38' },
  { id: 'gender', section: 'Basic Information', question: 'Your gender', type: 'text', placeholder: "however you'd describe it" },
  { id: 'who_to_meet', section: 'Basic Information', question: 'Who would you like to meet?', type: 'text', placeholder: "however you'd describe it" },

  // LOCATION
  { id: 'location', section: 'Location & Future Plans', question: 'Where are you currently based?', type: 'text', placeholder: 'city, country' },
  { id: 'living_here', section: 'Location & Future Plans', question: 'Do you see yourself living here over the next few years?', type: 'select', options: ["Yes, I'm settled here", 'Likely, but open to change', 'Unsure', 'Planning to move', 'Prefer not to say'] },
  { id: 'relocate', section: 'Location & Future Plans', question: 'Would you consider relocating for the right relationship?', type: 'select', options: ['Yes', 'Possibly', 'Unlikely', 'No', 'Unsure'] },
  { id: 'future_location', section: 'Location & Future Plans', question: 'Is there somewhere you imagine living in the future?', type: 'text', optional: true, placeholder: 'optional — a city, a country, a feeling' },

  // WORK & LIFE STAGE
  { id: 'work_type', section: 'Work & Life Stage', question: 'What kind of work do you currently do?', type: 'text', placeholder: 'your role or field' },
  { id: 'work_situation', section: 'Work & Life Stage', question: 'Current work situation', type: 'select', options: ['Employed full-time', 'Self-employed / founder', 'In education or training', 'Between roles', 'Exploring / transitioning'] },
  { id: 'financial_lifestyle', section: 'Work & Life Stage', question: 'How would you describe your current financial lifestyle?', type: 'select', options: ['Comfortable and stable', 'Doing well professionally', 'Building toward stability', 'Prefer not to say'] },
  { id: 'schedule', section: 'Work & Life Stage', question: 'Which best describes your typical weekly schedule?', type: 'select', options: ['Mostly predictable routine', 'Busy but flexible', 'Frequently changing schedule', 'Travel-heavy', 'Evenings or weekends often limited'] },

  // EDUCATION
  { id: 'education', section: 'Education & Intellectual Life', question: 'Educational background', type: 'select', options: ['Secondary school / equivalent', 'Vocational or technical training', 'Undergraduate degree', 'Postgraduate degree', 'Doctorate / professional degree', 'Education has followed a different path', 'Prefer not to say'] },
  { id: 'education_importance', section: 'Education & Intellectual Life', question: 'How important is it to you to share a similar educational or intellectual background?', type: 'select', options: ['Important', 'Somewhat important', 'Not especially important', 'Open to differences'] },
  { id: 'conversations', section: 'Education & Intellectual Life', question: 'What kinds of conversations or topics do you naturally enjoy?', type: 'text', placeholder: "the ones you'd stay up late for" },

  // RELATIONSHIP
  { id: 'relationship_goal', section: 'Relationship Direction & Readiness', question: 'What are you intentionally building toward right now?', type: 'select', options: ['Marriage', 'Long-term partnership', 'A committed relationship', 'Still figuring it out'] },
  { id: 'relationship_structure', section: 'Relationship Direction & Readiness', question: 'What kind of relationship structure are you looking for?', type: 'select', options: ['Monogamous', 'Ethically non-monogamous', 'Open to discussion', 'Unsure', 'Prefer not to say'] },
  { id: 'space_for_relationship', section: 'Relationship Direction & Readiness', question: 'How much space do you currently have in your life for a relationship?', type: 'select', options: ['A relationship is a clear priority', 'Open but balancing other commitments', 'Exploring connections casually', 'Unsure'] },
  { id: 'emotional_availability', section: 'Relationship Direction & Readiness', question: 'How emotionally available do you feel for a relationship right now?', type: 'select', options: ['Very ready', 'Mostly ready', 'Open but taking things slowly', 'Unsure'] },
  { id: 'last_relationship', section: 'Relationship Direction & Readiness', question: 'How long has it been since your last serious relationship?', type: 'select', options: ['Currently ending one', 'Within the past year', '1–3 years ago', 'Longer ago', 'Prefer not to say'] },
  { id: 'relationship_pace', section: 'Relationship Direction & Readiness', question: 'When relationships develop, what pace usually feels comfortable to you?', type: 'select', options: ['Slowly over time', 'A steady, natural pace', 'Fairly quickly when it feels right'] },

  // FAMILY
  { id: 'has_children', section: 'Family & Children', question: 'Do you currently have children?', type: 'select', options: ['Yes', 'No'] },
  { id: 'wants_children', section: 'Family & Children', question: 'How do you feel about having (more) children?', type: 'select', options: ['I would like children', 'I do not want children', 'Unsure', 'Only with the right partner', 'Not relevant'] },
  { id: 'partner_children', section: 'Family & Children', question: 'How do you feel about dating someone who has children?', type: 'select', options: ['Comfortable', 'Open depending on circumstances', 'Prefer not to', 'Unsure'] },

  // LIFESTYLE
  { id: 'lifestyle', section: 'Lifestyle', question: 'What does your day-to-day lifestyle usually look like?', type: 'text', placeholder: 'paint us a picture of a typical week' },
  { id: 'smoking', section: 'Lifestyle', question: 'Do you smoke?', type: 'select', options: ['No', 'Occasionally', 'Yes', 'Prefer not to say'] },
  { id: 'partner_smoking', section: 'Lifestyle', question: 'How do you feel about a partner who smokes?', type: 'select', options: ['Comfortable', 'Prefer they don\'t', 'Not compatible for me', 'Unsure'] },

  // VALUES
  { id: 'faith', section: 'Values, Faith & Culture', question: 'What role, if any, does faith or spirituality play in your life?', type: 'text', placeholder: "as much or as little as you'd like to share" },
  { id: 'faith_importance', section: 'Values, Faith & Culture', question: 'How important is it for a partner to share this?', type: 'select', options: ['Important', 'Preferred', 'Not important', 'Open'] },
  { id: 'cultural_traditions', section: 'Values, Faith & Culture', question: 'Are there cultural or religious traditions that are important in your daily or family life?', type: 'text', optional: true, placeholder: 'optional' },

  // POLITICAL
  { id: 'politics_role', section: 'Political & Social Outlook', question: 'How much are politics or social issues part of your life?', type: 'select', options: ['A big part of how I see the world', 'I care but it\'s not central', 'I follow occasionally', 'Not very important', 'Prefer not to engage'] },
  { id: 'politics_differences', section: 'Political & Social Outlook', question: 'How comfortable are you dating someone with different political or social views?', type: 'select', options: ['Prefer similar views', 'Some differences are fine', 'Comfortable with differences', 'Not important'] },
  { id: 'political_values', section: 'Political & Social Outlook', question: 'Are there social or political values that strongly shape your perspective?', type: 'text', optional: true, placeholder: 'optional' },

  // PHYSICAL
  { id: 'height', section: 'Physical & Attraction', question: 'What is your height?', type: 'text', placeholder: 'e.g. 5\'10" or 178cm' },
  { id: 'partner_height', section: 'Physical & Attraction', question: 'Do you have a preferred height range for a partner?', type: 'text', optional: true, placeholder: 'optional' },
  { id: 'physical_drawn_to', section: 'Physical & Attraction', question: 'Are there physical qualities or styles you naturally feel drawn to?', type: 'text', optional: true, placeholder: 'optional — as specific or vague as you like' },
  { id: 'attraction_importance', section: 'Physical & Attraction', question: 'How important is physical attraction early on?', type: 'select', options: ['Very important', 'Important but grows over time', 'Attraction usually develops for me', 'Unsure'] },
];

const HEURISTIC_RULES = [
  { field: 'relationship_pace', value: 'Slowly over time', archetype: 'Slow Burner', weight: 2 },
  { field: 'relationship_pace', value: 'A steady, natural pace', archetype: 'Grounded Builder', weight: 1 },
  { field: 'relationship_pace', value: 'Fairly quickly when it feels right', archetype: 'Magnetic Force', weight: 2 },
  { field: 'relationship_goal', value: 'Marriage', archetype: 'Romantic Idealist', weight: 2 },
  { field: 'relationship_goal', value: 'Long-term partnership', archetype: 'Grounded Builder', weight: 1 },
  { field: 'relationship_goal', value: 'A committed relationship', archetype: 'Grounded Builder', weight: 1 },
  { field: 'relationship_goal', value: 'Still figuring it out', archetype: 'Curious Explorer', weight: 1 },
  { field: 'emotional_availability', value: 'Very ready', archetype: 'Romantic Idealist', weight: 1 },
  { field: 'emotional_availability', value: 'Open but taking things slowly', archetype: 'Slow Burner', weight: 1 },
  { field: 'education_importance', value: 'Important', archetype: 'Intellectual Connector', weight: 1 },
  { field: 'attraction_importance', value: 'Very important', archetype: 'Magnetic Force', weight: 1 },
  { field: 'work_situation', value: 'Self-employed / founder', archetype: 'Magnetic Force', weight: 1 },
  { field: 'politics_role', value: 'A big part of how I see the world', archetype: 'Intellectual Connector', weight: 1 },
];

const HEURISTIC_KEYWORDS = [
  { keywords: ['debate', 'philosophy', 'ideas', 'politics', 'books'], archetype: 'Intellectual Connector', weight: 1 },
  { keywords: ['fun', 'humour', 'humor', 'jokes', 'laugh'], archetype: 'Playful Spark', weight: 1 },
  { keywords: ['travel', 'culture', 'new', 'explore', 'adventure'], archetype: 'Curious Explorer', weight: 1 },
];

const ARCHETYPE_NAMES = [
  'Romantic Idealist',
  'Playful Spark',
  'Slow Burner',
  'Curious Explorer',
  'Grounded Builder',
  'Intellectual Connector',
  'Magnetic Force',
] as const;

const ARCHETYPE_MAP: Record<string, ArchetypeId> = {
  'Romantic Idealist': 'romantic',
  'Playful Spark': 'playful',
  'Slow Burner': 'slow',
  'Curious Explorer': 'curious',
  'Grounded Builder': 'grounded',
  'Intellectual Connector': 'intellectual',
  'Magnetic Force': 'magnetic',
};

function classifyUserHeuristically(answers: Record<string, string>): string {
  const scores: Record<string, number> = {};
  ARCHETYPE_NAMES.forEach((name) => {
    scores[name] = 0;
  });

  for (const rule of HEURISTIC_RULES) {
    const value = answers[rule.field];
    if (value === rule.value) {
      scores[rule.archetype] += rule.weight;
    }
  }

  const freeText = Object.values(answers).flat().join(' ').toLowerCase();
  for (const { keywords, archetype, weight } of HEURISTIC_KEYWORDS) {
    if (keywords.some((kw) => freeText.includes(kw))) {
      scores[archetype] += weight;
    }
  }

  let best: typeof ARCHETYPE_NAMES[number] = ARCHETYPE_NAMES[0];
  for (const name of ARCHETYPE_NAMES) {
    if (scores[name] > scores[best]) {
      best = name;
    }
  }
  return best;
}

const formatDobInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const isValidDob = (s: string): boolean => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return false;
  const [d, m, y] = s.split('/').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const now = new Date();
  if (y < 1900 || y > now.getFullYear()) return false;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return false;
  let age = now.getFullYear() - y;
  if (now.getMonth() < m - 1 || (now.getMonth() === m - 1 && now.getDate() < d)) age--;
  return age >= 18 && age < 120;
};

export default function Questionnaire() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState('');
  const [busy, setBusy]       = useState(false);
  const inputRef              = useRef<TextInput>(null);
  const scrollRef             = useRef<ScrollView>(null);
  const progressAnim          = useRef(new Animated.Value(1 / QUESTIONS.length)).current;

  const q      = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;

  // Auto-focus text fields and scroll to top when changing steps
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    if (q.type === 'text') {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [step, q.type]);

  const nextWithAnswer = useCallback(async (answerVal: string) => {
    const trimmed = answerVal.trim();
    if (!trimmed && !q.optional) {
      Alert.alert('Please write something, even a few words.');
      return;
    }

    if (q.id === 'dob' && trimmed && !isValidDob(trimmed)) {
      Alert.alert('Invalid Date', 'Please enter a valid date of birth (DD/MM/YYYY) and ensure you are 18+.');
      return;
    }

    const updated = { ...answers, [q.id]: trimmed };
    setAnswers(updated);
    setCurrent('');

    // Animate progress
    Animated.timing(progressAnim, {
      toValue: (step + 2) / QUESTIONS.length,
      duration: 340, useNativeDriver: false,
    }).start();

    if (!isLast) {
      setStep(s => s + 1);
      const nextQ = QUESTIONS[step + 1];
      const nextAnswer = updated[nextQ.id] || '';
      setCurrent(nextAnswer);
      return;
    }

    setBusy(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Run local heuristic classification
        const archName = classifyUserHeuristically(updated);
        const archId = ARCHETYPE_MAP[archName] || 'curious';

        const updatedAnswers = {
          ...updated,
          _archetype: {
            name: archName,
            source: 'heuristic',
            computed_at: new Date().toISOString(),
          }
        };

        await supabase
          .from('profiles')
          .update({
            questionnaire_answers: updatedAnswers,
            archetype: archId,
            phase: 'WAITING'
          })
          .eq('user_id', user.id);
      }
      router.replace('/(conversation)/archetype' as never);
    } catch (err) {
      setBusy(false);
      Alert.alert('Could not save', 'Please try again.');
    }
  }, [answers, step, isLast, q.id, q.optional, progressAnim]);

  const next = useCallback(() => {
    nextWithAnswer(current);
  }, [current, nextWithAnswer]);

  const goBack = useCallback(() => {
    if (step > 0) {
      const prevStep = step - 1;
      setStep(prevStep);
      const prevVal = answers[QUESTIONS[prevStep].id] || '';
      setCurrent(prevVal);
      // Animate progress back
      Animated.timing(progressAnim, {
        toValue: (prevStep + 1) / QUESTIONS.length,
        duration: 340, useNativeDriver: false,
      }).start();
    }
  }, [step, answers, progressAnim]);

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

      {/* ── Scrollable content ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: c.bg }}
        contentContainerStyle={{ padding: d.pad, paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Section & Question */}
        <View style={{ marginTop: 20, marginBottom: 22 }}>
          <MonoLabel size={7} color={c.gold as string} style={{ marginBottom: 10 }}>
            {q.section}
          </MonoLabel>
          <Text style={{ fontFamily: f.serifI, fontSize: 25, color: c.ink, lineHeight: 34, maxWidth: 350 }}>
            {q.question}
          </Text>
        </View>

        <OrnamentDivider />

        {/* Input Option: Select vs Text */}
        {q.type === 'select' ? (
          <View style={styles.optionsContainer}>
            {q.options?.map((opt) => {
              const isSelected = current === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setCurrent(opt);
                    setTimeout(() => {
                      nextWithAnswer(opt);
                    }, 240);
                  }}
                  style={({ pressed }) => [
                    styles.optionBtn,
                    {
                      borderColor: isSelected ? c.forest : c.ruleSoft,
                      backgroundColor: isSelected ? `${c.forest}15` : pressed ? c.bgCard : c.bg,
                    }
                  ]}
                >
                  <Text style={[styles.optionText, { fontFamily: f.serif, color: isSelected ? c.forest : c.ink }]}>
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={{ marginTop: 20 }}>
            <TextInput
              ref={inputRef}
              value={current}
              onChangeText={(text) => {
                if (q.id === 'dob') {
                  setCurrent(formatDobInput(text));
                } else {
                  setCurrent(text);
                }
              }}
              placeholder={q.placeholder ?? "Write your answer…"}
              placeholderTextColor={c.inkMuted as string}
              multiline={q.id !== 'dob'} // DOB is single line
              keyboardType={q.id === 'dob' ? 'numeric' : 'default'}
              maxLength={q.id === 'dob' ? 10 : undefined}
              returnKeyType="default"
              blurOnSubmit={false}
              style={[styles.input, {
                borderColor: current.trim() ? c.rule : c.ruleSoft,
                color: c.ink, fontFamily: f.serif, fontSize: 17,
                backgroundColor: c.bgCard,
                minHeight: q.id === 'dob' ? 60 : 140,
                paddingTop: q.id === 'dob' ? 16 : 16,
              }]}
            />
            {q.id === 'dob' && current.length === 10 && !isValidDob(current) && (
              <Text style={{ fontFamily: f.mono, fontSize: 11, color: '#B5483A', marginTop: 8, letterSpacing: 0.5 }}>
                not a valid date — must be 18+ and a real DD/MM/YYYY
              </Text>
            )}
          </View>
        )}

        {/* Previous answers (collapsible list) */}
        {step > 0 && (
          <View style={{ marginTop: 32 }}>
            <MonoLabel size={7} color={c.inkMuted as string} style={{ marginBottom: 12 }}>Earlier answers</MonoLabel>
            {QUESTIONS.slice(Math.max(0, step - 3), step).map(prev => (
              <View key={prev.id} style={[styles.prevAnswer, { borderLeftColor: c.ruleSoft, backgroundColor: c.bgCard }]}>
                <MonoLabel size={6.5} color={c.gold as string} style={{ marginBottom: 3 }}>
                  {prev.question.slice(0, 44)}{prev.question.length > 44 ? '…' : ''}
                </MonoLabel>
                <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.inkSoft, lineHeight: 21 }}>
                  {answers[prev.id]}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Fixed footer button ── */}
      <View style={[styles.footer, {
        borderTopColor: c.ruleSoft, backgroundColor: c.bgCard,
        paddingBottom: Math.max(insets.bottom, 20),
        paddingHorizontal: d.pad,
      }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 14 }}>
          {step > 0 && (
            <Pressable
              onPress={goBack}
              style={[styles.backBtn, { borderColor: c.ruleSoft }]}
            >
              <Text style={{ fontFamily: f.mono, fontSize: 8.5, color: c.inkMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                ←
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={next}
            disabled={busy || (!current.trim() && !q.optional)}
            style={({ pressed }) => [styles.nextBtn, {
              backgroundColor: busy || (!current.trim() && !q.optional)
                ? c.ruleSoft
                : pressed ? c.forestDk : c.forest,
              flex: 1,
            }]}
          >
            <Text style={{
              fontFamily: f.mono, fontSize: 9.5, letterSpacing: 2,
              color: busy || (!current.trim() && !q.optional) ? c.inkMuted : '#F2E8D0',
              textTransform: 'uppercase',
            }}>
              {busy ? 'Sending…' : isLast ? 'Send to Romeo →' : q.optional && !current.trim() ? 'Skip →' : 'Next →'}
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
  optionsContainer: {
    marginTop: 20,
    gap: 10,
  },
  optionBtn: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 4,
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 16,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1, padding: 16, fontSize: 17, lineHeight: 28,
    textAlignVertical: 'top',
  },
  prevAnswer: {
    borderLeftWidth: 2, paddingLeft: 14, paddingVertical: 12, paddingRight: 12,
    marginBottom: 10,
  },
  footer: { borderTopWidth: 1 },
  backBtn: {
    borderWidth: 1, paddingVertical: 16, paddingHorizontal: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  nextBtn: { paddingVertical: 16, alignItems: 'center' },
});
