// RJ-APP/lib/push.ts
// Push notification registration for expo-notifications.
// Registers the device for push, stores the Expo push token on the user's
// profiles row, and sets up foreground/background notification handling.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Foreground behavior: show banner + sound while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type RegisterPushResult =
  | { status: 'registered'; token: string }
  | { status: 'skipped'; reason: string }
  | { status: 'error'; reason: string };

/**
 * Requests notification permission, gets the Expo push token, and stores it
 * on the current user's `profiles` row (column `expo_push_token`).
 * Safe to call multiple times — it's a no-op if permission is denied, and it
 * silently skips on web (Expo push tokens aren't supported there the same way).
 */
export async function registerForPushNotificationsAsync(): Promise<RegisterPushResult> {
  if (Platform.OS === 'web') {
    return { status: 'skipped', reason: 'web platform not supported' };
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return { status: 'skipped', reason: 'permission not granted' };
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      return { status: 'error', reason: 'missing EAS projectId in app.json extra.eas.projectId' };
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResponse.data;

    const { supabase } = await import('./supabase');
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      return { status: 'error', reason: 'no authenticated user' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ expo_push_token: token })
      .eq('user_id', userId);

    if (error) {
      return { status: 'error', reason: error.message };
    }

    return { status: 'registered', token };
  } catch (err) {
    return { status: 'error', reason: err instanceof Error ? err.message : String(err) };
  }
}
