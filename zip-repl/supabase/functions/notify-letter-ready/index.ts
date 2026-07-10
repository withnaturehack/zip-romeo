// Supabase Edge Function: notify-letter-ready
// Invoked by the `trg_letter_ready` DB trigger (see
// supabase/migrations/005_push_notifications.sql) whenever a profile's phase
// transitions to LETTER_READY. Sends a push notification via Expo's Push API.
//
// Deploy with: supabase functions deploy notify-letter-ready

// deno-lint-ignore-file no-explicit-any
// @ts-nocheck — Deno runtime, not part of the Expo/TS project graph.
// Uses the Deno-native `Deno.serve` (no remote std/http import needed).

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req: Request) => {
  try {
    const { expo_push_token } = await req.json();

    if (!expo_push_token) {
      return new Response(JSON.stringify({ skipped: 'no push token on file' }), { status: 200 });
    }

    const message = {
      to: expo_push_token,
      sound: 'default',
      title: 'A letter has arrived',
      body: 'Your match has written to you. Open the app to read it.',
      data: { deepLink: 'rj-app://envelope' },
    };

    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await res.json();
    return new Response(JSON.stringify(result), {
      status: res.ok ? 200 : 502,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
