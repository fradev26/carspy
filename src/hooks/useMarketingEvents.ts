import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'vatuur_session_id';
const UTM_KEY = 'vatuur_utm';

type UtmData = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  referrer?: string | null;
};

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? `s_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function captureUtm(): UtmData {
  if (typeof window === 'undefined') return {};
  try {
    const cached = sessionStorage.getItem(UTM_KEY);
    if (cached) return JSON.parse(cached);
    const params = new URLSearchParams(window.location.search);
    const data: UtmData = {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      referrer: document.referrer || null,
    };
    sessionStorage.setItem(UTM_KEY, JSON.stringify(data));
    return data;
  } catch {
    return {};
  }
}

export interface TrackOptions {
  payload?: Record<string, unknown>;
  email?: string;
}

export function useMarketingEvents(page: string) {
  const utmRef = useRef<UtmData>({});
  const sessionRef = useRef<string>('');

  useEffect(() => {
    sessionRef.current = getSessionId();
    utmRef.current = captureUtm();
  }, []);

  const trackEvent = useCallback(
    async (eventName: string, options: TrackOptions = {}) => {
      try {
        const { payload = {}, email } = options;
        // Push to GTM dataLayer for future tag managers
        if (typeof window !== 'undefined') {
          // @ts-expect-error dataLayer optional global
          window.dataLayer = window.dataLayer || [];
          // @ts-expect-error dataLayer optional global
          window.dataLayer.push({ event: eventName, page, ...payload });
        }
        const { data: userData } = await supabase.auth.getUser();
        await supabase.from('marketing_events').insert({
          event_name: eventName,
          session_id: sessionRef.current || getSessionId(),
          user_id: userData?.user?.id ?? null,
          page,
          email: email ?? null,
          payload: payload as never,
          utm_source: utmRef.current.utm_source ?? null,
          utm_medium: utmRef.current.utm_medium ?? null,
          utm_campaign: utmRef.current.utm_campaign ?? null,
          referrer: utmRef.current.referrer ?? null,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
        });
      } catch (e) {
        // Tracking mag nooit de UX breken
        console.warn('trackEvent failed', e);
      }
    },
    [page],
  );

  return { trackEvent };
}
