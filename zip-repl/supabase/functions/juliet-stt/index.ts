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
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
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
      return new Response(JSON.stringify({ error: 'ElevenLabs STT failed', detail: errText }), {
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
    return new Response(JSON.stringify({ error: 'Unexpected error', detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
