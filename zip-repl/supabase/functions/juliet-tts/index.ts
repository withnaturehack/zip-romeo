// Supabase Edge Function: juliet-tts
// Server-side proxy for ElevenLabs text-to-speech. Keeps the ElevenLabs API
// key out of the client bundle — the app calls this function instead of
// hitting ElevenLabs directly.
//
// Requires these secrets set via `supabase secrets set`:
//   ELEVENLABS_API_KEY   — server-side only, never EXPO_PUBLIC_*
//   ELEVENLABS_VOICE_ID  — the voice to speak with
//
// Deploy with: supabase functions deploy juliet-tts
// Auth: requires a valid Supabase user JWT (verify_jwt defaults to true).

// deno-lint-ignore-file no-explicit-any
// @ts-nocheck — Deno runtime, not part of the Expo/TS project graph.
// Uses the Deno-native `Deno.serve` (no remote std/http import needed).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Explicitly require a real authenticated user (not just the anon key).
    // Platform JWT verification confirms the token is well-formed, but this
    // checks it actually resolves to a user account.
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!token || !supabaseUrl || !anonKey) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    });
    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    const voiceId = Deno.env.get('ELEVENLABS_VOICE_ID');
    if (!apiKey || !voiceId) {
      console.error('juliet-tts misconfigured: missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID');
      return new Response(JSON.stringify({ error: 'TTS not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing "text" field' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { Accept: 'audio/mpeg', 'Content-Type': 'application/json', 'xi-api-key': apiKey },
      body: JSON.stringify({
        text: text.replace(/\n+/g, ' '),
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.48, similarity_boost: 0.82, style: 0.28, use_speaker_boost: true },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('ElevenLabs TTS failed:', res.status, errText);
      return new Response(JSON.stringify({ error: 'TTS failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const audio = await res.arrayBuffer();
    return new Response(audio, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' },
    });
  } catch (e) {
    console.error('juliet-tts unexpected error:', e);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
