import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { routeAfterAuth } from '@/lib/post-auth';

/** Web OAuth return handler — keeps users in the app instead of the marketing site. */
export default function AuthCallback() {
  const { c } = useRJTheme();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { supabase } = await import('@/lib/supabase');

      // Allow Supabase to parse tokens from the URL hash/query
      await new Promise((r) => setTimeout(r, 150));
      const { data: { session } } = await supabase.auth.getSession();

      if (cancelled) return;
      if (session?.user) {
        await routeAfterAuth();
        return;
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        if (cancelled || !nextSession?.user) return;
        subscription.unsubscribe();
        await routeAfterAuth();
      });

      setTimeout(() => {
        if (!cancelled) router.replace('/(auth)/signin' as never);
      }, 10000);
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
      <ActivityIndicator color={c.forest} size="large" />
    </View>
  );
}
