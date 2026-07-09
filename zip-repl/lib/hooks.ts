import { useEffect, useRef, useState, useCallback } from 'react';

export type Phase =
  | 'REFERRAL'
  | 'PROFILE'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'CHAT'
  | 'CHATTING'
  | 'QUESTIONNAIRE_DONE'
  | 'WAITING'
  | 'LETTER_READY'
  | 'COMPLETE'
  | 'REJECTED';

export type Profile = {
  user_id: string;
  phase: Phase;
  first_name: string | null;
  social_handle: string | null;
  photo_urls: string[] | null;
  archetype: string | null;
  questionnaire_answers: Record<string, unknown> | null;
};

export type StatusResult = {
  loading: boolean;
  phase: Phase;
  profile: Profile | null;
  userId: string | null;
  refresh: () => Promise<void>;
};

export type MatchProfile = { first_name: string | null; archetype: string | null } | null;
export type MatchRow = {
  id: string;
  user_a: string | null;
  user_b: string | null;
  status: string | null;
  a_response: string | null;
  b_response: string | null;
  created_at: string | null;
  profile_a: MatchProfile;
  profile_b: MatchProfile;
};

export type MatchesResult = {
  matches: MatchRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

// ─── useStatus ────────────────────────────────────────────────────────────────
// Combines:
//  • An initial fetch (fast first render)
//  • A Supabase Realtime subscription (instant push when profile.phase changes)
//  • A periodic poll fallback (in case realtime is unavailable)

export function useStatus(pollMs = 5000): StatusResult {
  // Unique ID per hook instance so concurrent mounts (during navigation transitions)
  // each get their own Supabase channel name and don't collide on subscribe().
  const instanceId = useRef(Math.random().toString(36).slice(2, 8)).current;
  const [realProfile, setRealProfile] = useState<Profile | null>(null);
  const [realUserId, setRealUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const { supabase } = await import('./supabase');
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();
      setRealProfile((data as Profile | null) ?? null);
    } catch {
      // silently ignore — poll will retry
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<Awaited<typeof import('./supabase')>['supabase']['channel']> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;

    const setupProfile = async (uid: string) => {
      const { supabase } = await import('./supabase');
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();
      if (!cancelled) {
        setRealProfile((data as Profile | null) ?? null);
        setLoading(false);
      }

      // ── Realtime subscription ──────────────────────────────────────────
      // Channel name includes instanceId so concurrent hook mounts (e.g. during
      // navigation transitions) never share a Supabase channel object and can't
      // trigger the "cannot add callbacks after subscribe()" error.
      if (!channel) {
        channel = supabase
          .channel(`profile:${uid}:${instanceId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'profiles', filter: `user_id=eq.${uid}` },
            (payload) => { if (!cancelled && payload.new) setRealProfile(payload.new as Profile); }
          )
          .subscribe();
      }

      // ── Poll fallback ──────────────────────────────────────────────────
      if (pollMs && !pollTimer) {
        pollTimer = setInterval(() => { if (!cancelled) fetchProfile(uid); }, pollMs);
      }
    };

    const init = async () => {
      // 8-second safety timeout so a bad Supabase URL never hangs the loading screen
      const safetyTimer = setTimeout(() => { if (!cancelled) setLoading(false); }, 8000);

      try {
        const { supabase } = await import('./supabase');

        // ── Listen for ALL auth state changes, including INITIAL_SESSION ────
        // We call setupProfile ONLY from here to prevent concurrent channel
        // subscriptions (calling it from both here and getSession() caused a
        // race where two .subscribe() calls fired on the same channel name).
        const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('[useStatus] authStateChange:', event, 'user:', session?.user?.email ?? 'null');
          if (cancelled) return;
          if (session?.user) {
            setRealUserId(session.user.id);
            await setupProfile(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            // Guard against false SIGNED_OUT events. These happen on Android when:
            // - the image picker (or any intent) sends the app to background
            // - Supabase tries a token refresh exactly while SecureStore is mid-write
            //   (secureSet deletes old chunks then writes new ones — a read during
            //   that window returns null, causing Supabase to think session is gone)
            // Verify with getSession() before clearing state.
            const { data: { session: live } } = await supabase.auth.getSession();
            if (cancelled) return;
            if (live?.user) {
              console.log('[useStatus] SIGNED_OUT was a false alarm — session still valid, re-syncing');
              setRealUserId(live.user.id);
              await setupProfile(live.user.id);
            } else {
              setRealUserId(null);
              setRealProfile(null);
              setLoading(false);
            }
          } else {
            setRealUserId(null);
            setRealProfile(null);
            setLoading(false);
          }
        });
        authListener = listener;

        // ── Fast-path: read local session to clear the safety timer quickly ─
        // We do NOT call setupProfile here — onAuthStateChange(INITIAL_SESSION)
        // already fired (or will fire) and owns that work exclusively.
        const { data: { session } } = await supabase.auth.getSession();
        clearTimeout(safetyTimer);
        if (cancelled) return;

        const user = session?.user ?? null;
        console.log('[useStatus] init session user:', user?.email ?? 'null');

        if (user) {
          // Optimistically set userId so the index screen knows we're authenticated
          // while INITIAL_SESSION fires and finishes loading the full profile.
          setRealUserId(user.id);
        } else {
          // No session — INITIAL_SESSION will also fire with null, but set state
          // directly here so the UI doesn't wait unnecessarily.
          setRealUserId(null);
          setRealProfile(null);
          setLoading(false);
        }
      } catch (e) {
        clearTimeout(safetyTimer);
        console.log('[useStatus] error:', e instanceof Error ? e.message : String(e));
        if (!cancelled) setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      authListener?.subscription.unsubscribe();
      if (channel) {
        import('./supabase').then(({ supabase }) => supabase.removeChannel(channel!)).catch(() => {});
      }
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [pollMs, fetchProfile]);

  return {
    loading,
    // If authenticated but no profile row yet → send to onboarding (PROFILE phase)
    // If not authenticated at all → send to referral/welcome (REFERRAL phase)
    phase: realUserId
      ? (realProfile?.phase ?? 'PROFILE')
      : 'REFERRAL',
    profile: realProfile,
    userId: realUserId,
    refresh: async () => {},
  };
}

// ─── useMatches ───────────────────────────────────────────────────────────────

export function useMatches(userId: string | null): MatchesResult {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setMatches([]); setLoading(false); return; }

    let cancelled = false;
    const fetch = async () => {
      try {
        const { supabase } = await import('./supabase');

        // Step 1: fetch matches (no join — avoids FK-name dependency)
        const { data, error: err } = await supabase
          .from('matches')
          .select('*')
          .or(`user_a.eq.${userId},user_b.eq.${userId}`)
          .order('created_at', { ascending: false });
        if (cancelled) return;
        if (err) { setError(err.message); setMatches([]); return; }

        // Step 2: collect unique user IDs and fetch their profiles
        const rows = (data ?? []) as Array<Omit<MatchRow, 'profile_a' | 'profile_b'>>;
        const userIds = new Set<string>();
        rows.forEach(m => { if (m.user_a) userIds.add(m.user_a); if (m.user_b) userIds.add(m.user_b); });

        const profileMap = new Map<string, MatchProfile>();
        if (userIds.size > 0) {
          const { data: profiles, error: profErr } = await supabase
            .from('profiles')
            .select('user_id, first_name, archetype')
            .in('user_id', [...userIds]);
          if (profErr) {
            console.warn('[useMatches] profile fetch error:', profErr.message);
          }
          (profiles ?? []).forEach((p: any) => profileMap.set(p.user_id, { first_name: p.first_name, archetype: p.archetype }));
        }

        // Step 3: merge profile data onto each match row
        const enriched: MatchRow[] = rows.map(m => ({
          ...m,
          profile_a: profileMap.get(m.user_a ?? '') ?? null,
          profile_b: profileMap.get(m.user_b ?? '') ?? null,
        }));

        if (!cancelled) { setMatches(enriched); setError(null); }
      } catch (e) {
        if (!cancelled) { setError(e instanceof Error ? e.message : 'unknown'); setMatches([]); }
      } finally { if (!cancelled) setLoading(false); }
    };
    fetch();
    return () => { cancelled = true; };
  }, [userId]);

  return { matches, loading, error, refresh: async () => {} };
}

// ─── helpers ─────────────────────────────────────────────────────────────────

export function otherUserName(m: MatchRow, userId: string | null): string {
  const other = m.user_a === userId ? m.profile_b : m.profile_a;
  return other?.first_name ?? 'Someone';
}

export function otherArchetype(m: MatchRow, userId: string | null): string | null {
  const other = m.user_a === userId ? m.profile_b : m.profile_a;
  return other?.archetype ?? null;
}
