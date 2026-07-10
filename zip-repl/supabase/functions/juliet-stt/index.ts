// Supabase Edge Function: juliet-stt
// Server-side proxy for ElevenLabs speech-to-text. Keeps the ElevenLabs API
// key out of the client bundle — the native app uploads recorded audio here
// instead of calling ElevenLabs directly.
//
// Requires this secret set via `supabase secrets set`:
//   ELEVENLABS_API_KEY — server-side only, never EXPO_PUBLIC_*
//
// Deploy with: supabase functions deploy juliet-stt
// Auth: requires a valid Supabase user JWT (verify_jwt defaults to true).
// Expects multipart/form-data with a "file" field (audio/m4a).

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
    if (!apiKey) {
      console.error('juliet-stt misconfigured: missing ELEVENLABS_API_KEY');
      return new Response(JSON.stringify({ error: 'STT not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const incomingForm = await req.formData();
    const file = incomingForm.get('file');
    if (!file) {
      return new Response(JSON.stringify({ error: 'Missing "file" field' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const outgoingForm = new FormData();
    outgoingForm.append('file', file, 'audio.m4a');
    outgoingForm.append('model_id', 'scribe_v1');

    const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: outgoingForm,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('ElevenLabs STT failed:', res.status, errText);
      return new Response(JSON.stringify({ error: 'STT failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify({ text: data.text ?? null }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('juliet-stt unexpected error:', e);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
