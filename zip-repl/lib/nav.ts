// RJ-APP/lib/nav.ts
// router.back() throws "the action GO_BACK isn't handled by any navigator"
// when the current screen is the first in the stack — e.g. when phase
// routing dropped the user directly onto signin or settings. safeBack
// falls back to the root router (/) which then routes by phase.
import { router } from 'expo-router';

export function safeBack(fallback: string = '/') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as never);
  }
}
