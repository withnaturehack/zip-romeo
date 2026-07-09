import Constants from 'expo-constants';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

/** OAuth redirect URI registered in Supabase Auth → Redirect URLs. */
export function getOAuthRedirectUri(): string {
  // Always let expo-auth-session compute the correct callback URL.
  // This avoids web-origin mismatches that can cause Supabase to fall back to a default website URL.
  if (Platform.OS === 'web') {
    return makeRedirectUri({ path: 'auth/callback' });
  }

  // Expo Go uses exp:// — dev client / standalone use rj-app://
  const isExpoGo = Constants.appOwnership === 'expo';
  if (isExpoGo) {
    return makeRedirectUri({ path: 'auth/callback' });
  }

  return makeRedirectUri({ scheme: 'rj-app', path: 'auth/callback' });
}

