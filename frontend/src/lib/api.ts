import { supabase } from './supabase';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export async function api<T = void>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.auth) {
    const { data } = await supabase.auth.getSession();
    if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  const res = await fetch(BASE + path, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.error ?? res.statusText);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}
