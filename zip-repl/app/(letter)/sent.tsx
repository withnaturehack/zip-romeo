import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { WaxSeal } from '@/components/primitives/WaxSeal';
import { PrimaryButton } from '@/components/primitives/Button';

export default function Sent() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, padding: d.pad, paddingTop: d.pad + insets.top, paddingBottom: d.pad + insets.bottom }}>
      <PaperNoise />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Stack gap={28} style={styles.center}>
          <MonoLabel>Sent</MonoLabel>
          <WaxSeal size={100} />
          <Text style={{ fontFamily: f.serif, fontSize: 34, color: c.ink, textAlign: 'center', lineHeight: 40, maxWidth: 320 }}>
            Your reply is{' '}
            <Text style={{ fontStyle: 'italic', color: c.forest }}>on its way.</Text>
          </Text>
          <OrnamentDivider />
          <Text style={{ fontFamily: f.bodyI, fontSize: 17, color: c.inkMuted, textAlign: 'center', maxWidth: 300, lineHeight: 25 }}>
            Romeo will read it the next time he sits down. You&rsquo;ll hear back when he does.
          </Text>
        </Stack>
      </View>
      <PrimaryButton onPress={() => router.replace('/(main)/home' as never)}>Return to the room</PrimaryButton>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
});
