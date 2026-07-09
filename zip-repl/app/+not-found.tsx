// RJ-APP/app/+not-found.tsx
import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useRJTheme } from '@/theme/useRJTheme';

export default function NotFound() {
  const { c, f } = useRJTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Lost' }} />
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <Text style={{ fontFamily: f.serifI, fontSize: 28, color: c.ink }}>
          This path is unwritten.
        </Text>
        <Link href="/" style={{ marginTop: 20 }}>
          <Text style={{ fontFamily: f.mono, color: c.forest, letterSpacing: 2 }}>
            RETURN
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
