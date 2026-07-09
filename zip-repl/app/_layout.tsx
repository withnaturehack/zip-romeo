// RJ-APP/app/_layout.tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts as useCormorant,
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  EBGaramond_400Regular,
  EBGaramond_400Regular_Italic,
  EBGaramond_500Medium,
} from '@expo-google-fonts/eb-garamond';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { Caveat_400Regular } from '@expo-google-fonts/caveat';
import { View, ActivityIndicator, Text } from 'react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { PreferencesProvider, usePreferences } from '@/theme/PreferencesProvider';
import { RJ_LIGHT, RJ_DARK } from '@/theme/tokens';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useEffect } from 'react';

function AppShell() {
  const { prefs, loaded: prefsLoaded } = usePreferences();
  const [fontsLoaded, fontError] = useCormorant({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    EBGaramond_400Regular,
    EBGaramond_400Regular_Italic,
    EBGaramond_500Medium,
    JetBrainsMono_400Regular,
    Caveat_400Regular,
  });

  useEffect(() => {
    console.log('[AppShell] fontsLoaded:', fontsLoaded, 'fontError:', !!fontError);
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: RJ_LIGHT.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={RJ_LIGHT.forest} />
        <Text style={{ marginTop: 8, fontSize: 11, color: '#999', marginHorizontal: 16, textAlign: 'center' }}>
          Loading fonts...
        </Text>
      </View>
    );
  }

  if (fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: RJ_LIGHT.bg, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text style={{ color: '#c00', fontWeight: 'bold', fontSize: 14 }}>Font Load Error</Text>
        <Text style={{ color: '#666', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
          {String(fontError)}
        </Text>
      </View>
    );
  }

  const palette = prefs.dark ? RJ_DARK : RJ_LIGHT;

  return (
    <ThemeProvider dark={prefs.dark} density={prefs.density}>
      <StatusBar style={prefs.dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.bg },
          animation: 'fade',
        }}
      />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    console.log('[RootLayout] App starting...');
    console.log('[RootLayout] Platform:', typeof window !== 'undefined' ? 'web' : 'native');
    try {
      const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      console.log('[RootLayout] Supabase URL configured:', !!url);
      console.log('[RootLayout] Supabase Key configured:', !!key);
      
      // Run health check
      import('@/lib/health-check').then(({ checkHealth, logHealth }) => {
        checkHealth().then(status => {
          logHealth(status);
        }).catch(e => {
          console.error('[RootLayout] Health check failed:', e);
        });
      });
    } catch (e) {
      console.error('[RootLayout] Error checking env:', e);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <PreferencesProvider>
          <AppShell />
        </PreferencesProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
