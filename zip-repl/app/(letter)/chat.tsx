// RJ-APP/app/(letter)/chat.tsx
// Non-scrollable layout, keyboard responsive on both iOS and Android
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { WaxSeal } from '@/components/primitives/WaxSeal';
import { IconBtn } from '@/components/primitives/IconBtn';
import { IconBack } from '@/components/primitives/Icons';
type ChatMessage = { id: string; sender: 'me' | 'them' | '__typing__'; text: string; ts: string };
import { useStatus, useMatches, otherUserName, otherArchetype } from '@/lib/hooks';
import { ARCHETYPES } from '@/lib/archetypes';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatTime(iso: string): string {
  const d   = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  const hhmm = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  if (diffDays === 0) return hhmm;
  if (diffDays === 1) return `Yesterday ${hhmm}`;
  return `${MONTHS[d.getMonth()]} ${d.getDate()} · ${hhmm}`;
}

function Bubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  const { c, f } = useRJTheme();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, []);
  return (
    <Animated.View style={[
      styles.bubbleWrap,
      isMe ? styles.bubbleRight : styles.bubbleLeft,
      { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] },
    ]}>
      <View style={[
        styles.bubble,
        isMe
          ? { backgroundColor: c.forest, borderColor: 'transparent' }
          : { backgroundColor: c.bgCard, borderColor: c.ruleSoft },
      ]}>
        <Text style={{
          fontFamily: f.serif, fontSize: 16,
          color: isMe ? '#FAF5EB' : c.ink,
          lineHeight: 25,
        }}>
          {msg.text}
        </Text>
      </View>
      <Text style={{
        fontFamily: f.mono, fontSize: 6.5, letterSpacing: 0.8,
        color: c.inkMuted, marginTop: 4, textTransform: 'uppercase',
        alignSelf: isMe ? 'flex-end' : 'flex-start',
      }}>
        {formatTime(msg.ts)}
      </Text>
    </Animated.View>
  );
}

// Each dot is its own component so hooks are never called inside a loop
function TypingDot({ delay }: { delay: number }) {
  const { c } = useRJTheme();
  const a = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1,    duration: 380, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(a, { toValue: 0.25, duration: 380,        easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.forest, opacity: a }} />;
}

function TypingBubble() {
  const { c } = useRJTheme();
  return (
    <View style={[styles.bubbleWrap, styles.bubbleLeft]}>
      <View style={[styles.bubble, { backgroundColor: c.bgCard, borderColor: c.ruleSoft, flexDirection: 'row', gap: 6, paddingVertical: 16 }]}>
        <TypingDot delay={0} />
        <TypingDot delay={140} />
        <TypingDot delay={280} />
      </View>
    </View>
  );
}

export default function Chat() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const { userId } = useStatus(15000);
  const { matches } = useMatches(userId);
  const [input, setInput]   = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listRef = useRef<FlatList>(null);
  const activeMatch = useMemo(() => {
    const preferred = matches.find((m) => {
      const status = (m.status ?? '').toLowerCase();
      return ['accepted', 'chatting', 'active', 'letter_ready'].includes(status);
    });
    return preferred ?? matches[0];
  }, [matches]);
  const matchName = activeMatch ? otherUserName(activeMatch, userId) : 'James';
  const matchArchetypeKey = activeMatch ? otherArchetype(activeMatch, userId) : null;
  const matchArchetype = matchArchetypeKey && matchArchetypeKey in ARCHETYPES
    ? ARCHETYPES[matchArchetypeKey as keyof typeof ARCHETYPES]
    : ARCHETYPES.slow;

  useEffect(() => {
    const timer = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    return () => clearTimeout(timer);
  }, [messages.length]);

  if (!activeMatch) {
    const topPad = Platform.OS === 'web' ? 60 : insets.top;
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <PaperNoise />
        <View style={[styles.header, {
          paddingTop: topPad + 10,
          paddingHorizontal: d.pad,
          borderBottomColor: c.ruleSoft,
          backgroundColor: c.bg,
          justifyContent: 'center',
        }]}>
          <Text style={{ fontFamily: f.serifI, fontSize: 22, color: c.ink, lineHeight: 26 }}>Chats</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 14 }}>
          <WaxSeal size={54} pulse />
          <Text style={{ fontFamily: f.serifI, fontSize: 20, color: c.inkMuted, textAlign: 'center', lineHeight: 28 }}>
            No active conversations yet.
          </Text>
          <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.inkMuted, textAlign: 'center', opacity: 0.7, lineHeight: 21 }}>
            Once Romeo introduces you to a match, your conversation will open here.
          </Text>
        </View>
      </View>
    );
  }

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    const ts = new Date().toISOString();
    setMessages(m => [...m, { id: `${ts}-${m.length}`, sender: 'me', text, ts }]);
    setTyping(true);
    setTimeout(() => setTyping(false), 2600 + Math.random() * 400);
  }, [input]);

  const topPad = Platform.OS === 'web' ? 60 : insets.top;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      {/* ── Header (fixed, never scrolls) ── */}
      <View style={[styles.header, {
        paddingTop: topPad + 10,
        paddingHorizontal: d.pad,
        borderBottomColor: c.ruleSoft,
        backgroundColor: c.bg,
      }]}>
        <PaperNoise />
        <IconBtn onPress={() => router.canGoBack() ? router.back() : router.replace('/(main)/home' as never)}>
          <IconBack />
        </IconBtn>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontFamily: f.serifI, fontSize: 22, color: c.ink, lineHeight: 26 }}>{matchName}</Text>
          <MonoLabel size={7} color={c.gold as string}>{matchArchetype.name}</MonoLabel>
        </View>
        <WaxSeal size={32} />
      </View>

      {/* ── Message list (fills remaining space) ── */}
      <FlatList
        ref={listRef}
        data={typing ? [...messages, { id: '__typing__', sender: '__typing__', text: '', ts: '' }] : messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          if (item.id === '__typing__') return <TypingBubble />;
          return <Bubble msg={item} isMe={item.sender === 'me'} />;
        }}
        contentContainerStyle={{ padding: d.pad, paddingBottom: 8, gap: 4 }}
        style={{ flex: 1, backgroundColor: c.bg }}
        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ alignItems: 'center', paddingBottom: 20 }}>
            <View style={{
              paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1,
              borderColor: c.ruleSoft, borderStyle: 'dashed',
            }}>
              <Text style={{
                fontFamily: f.bodyI, fontSize: 13, color: c.inkMuted,
                textAlign: 'center', lineHeight: 18,
              }}>
                Romeo introduced you to {matchName}.{'\n'}This is the beginning of your correspondence.
              </Text>
            </View>
          </View>
        }
      />

      {/* ── Input bar (fixed at bottom, pushes up with keyboard) ── */}
      <View style={[styles.inputRow, {
        borderTopColor: c.ruleSoft,
        backgroundColor: c.bgCard,
        paddingHorizontal: d.pad,
        paddingBottom: Math.max(insets.bottom, 16),
        paddingTop: 12,
      }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={`Write to ${matchName}\u2026`}
          placeholderTextColor={c.inkMuted as string}
          multiline
          returnKeyType="default"
          blurOnSubmit={false}
          style={[styles.input, {
            borderColor: input.trim() ? c.rule : c.ruleSoft,
            color: c.ink,
            fontFamily: f.serif,
            fontSize: 16,
            backgroundColor: c.bg,
          }]}
        />
        <Pressable
          onPress={send}
          style={({ pressed }) => [styles.sendBtn, {
            backgroundColor: input.trim()
              ? (pressed ? c.forestDk : c.forest)
              : c.ruleSoft,
          }]}
        >
          <Text style={{
            fontFamily: f.mono, fontSize: 8.5,
            color: input.trim() ? '#FAF5EB' : c.inkMuted,
            letterSpacing: 1.5, textTransform: 'uppercase',
          }}>
            Send
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingBottom: 14, borderBottomWidth: 1,
  },
  bubbleWrap: { marginBottom: 2 },
  bubbleLeft:  { alignSelf: 'flex-start', maxWidth: '80%' },
  bubbleRight: { alignSelf: 'flex-end',   maxWidth: '80%' },
  bubble: {
    padding: 14, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10, borderTopWidth: 1,
  },
  input: {
    flex: 1, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 11,
    maxHeight: 100, lineHeight: 23,
  },
  sendBtn: {
    paddingHorizontal: 16, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    minWidth: 60,
  },
});
