import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { PostmarkStamp } from '@/components/primitives/PostmarkStamp';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { EnvelopeOpening } from '@/components/letter/EnvelopeOpening';

export default function Envelope() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.bgAlt, padding: d.pad, paddingTop: d.pad + insets.top, paddingBottom: d.pad + insets.bottom }}>
      <PaperNoise />
      <Row justify="space-between">
        <MonoLabel>A letter has arrived</MonoLabel>
        <PostmarkStamp size={52} rotate={-9} text="ROMEO" />
      </Row>

      <Stack gap={4} style={{ marginTop: 22, alignItems: 'center' }}>
        <Text style={{ fontFamily: f.serifI, fontSize: 28, color: c.ink, textAlign: 'center', maxWidth: 280, lineHeight: 36 }}>
          Tap to open
        </Text>
        <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.inkMuted, textAlign: 'center' }}>
          when you have a quiet moment.
        </Text>
      </Stack>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <EnvelopeOpening onComplete={() => setTimeout(() => router.replace('/(letter)/letter' as never), 600)} />
      </View>
    </View>
  );
}
