import { router } from 'expo-router';
import { clearPendingReferral, getPendingReferral } from './referral-pending';

/** Route after OAuth or password sign-in based on profile state. */
export async function routeAfterAuth(fallbackReferral?: string): Promise<void> {
  const { supabase } = await import('./supabase');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    router.replace('/(auth)/signin' as never);
    return;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.warn('[routeAfterAuth] profile lookup error:', error.message);
  }

  if (!profile) {
    const referral = (await getPendingReferral()) ?? fallbackReferral?.toUpperCase().trim() ?? '';
    router.replace({
      pathname: '/(onboarding)/profile',
      params: { referral },
    } as never);
    return;
  }

  await clearPendingReferral();
  router.replace('/' as never);
}
