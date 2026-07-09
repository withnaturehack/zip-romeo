// RJ-APP/app/(main)/_layout.tsx
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { BottomNav } from '@/components/nav/BottomNav';

export default function MainLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      <BottomNav />
    </View>
  );
}
