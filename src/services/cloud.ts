import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { hydrateSave } from '@/src/store/logic';
import { useGame } from '@/src/store/gameStore';
import type { SaveState } from '@/src/store/types';

const SESSION_KEY = 'velvet-vault-cloud-session';
const EMAIL_REDIRECT_TO = 'https://carlsonmichael6453.github.io/velvet-vault/';

export type CloudSession = {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  expiresAt: number;
};

type CloudStatus = 'off' | 'signed-out' | 'signed-in' | 'saving' | 'error';

type CloudStore = {
  configured: boolean;
  status: CloudStatus;
  email: string | null;
  message: string | null;
  session: CloudSession | null;
  ready: boolean;
  boot: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
};

function env(name: string): string {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

export function supabaseUrl(): string {
  return env('EXPO_PUBLIC_SUPABASE_URL').replace(/\/$/, '');
}

export function supabaseAnonKey(): string {
  return env('EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export function cloudConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey());
}

function headers(token?: string): Record<string, string> {
  const key = supabaseAnonKey();
  return {
    apikey: key,
    Authorization: `Bearer ${token ?? key}`,
    'Content-Type': 'application/json',
  };
}

type AuthPayload = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: { id?: string; email?: string };
  email?: string;
  id?: string;
  msg?: string;
  error_description?: string;
  error?: string;
  message?: string;
};

function sessionFrom(payload: AuthPayload, fallbackEmail: string): CloudSession | null {
  if (!payload.access_token || !payload.refresh_token) return null;
  const userId = payload.user?.id ?? payload.id;
  if (!userId) return null;
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    userId,
    email: payload.user?.email ?? payload.email ?? fallbackEmail,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
  };
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as AuthPayload;
    return body.msg || body.error_description || body.message || body.error || `The cloud answered ${response.status}.`;
  } catch {
    return `The cloud answered ${response.status}.`;
  }
}

let lastPushedAt = -1;

async function refresh(session: CloudSession): Promise<CloudSession> {
  if (session.expiresAt > Date.now() + 60_000) return session;
  const response = await fetch(`${supabaseUrl()}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  if (!response.ok) throw new Error(await readError(response));
  const next = sessionFrom((await response.json()) as AuthPayload, session.email);
  if (!next) throw new Error('The cloud session could not be refreshed.');
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
  return next;
}

async function pull(session: CloudSession): Promise<{ save: SaveState; updatedAt: number } | null> {
  const response = await fetch(
    `${supabaseUrl()}/rest/v1/vault_saves?user_id=eq.${session.userId}&select=save,updated_at`,
    { headers: headers(session.accessToken) },
  );
  if (!response.ok) throw new Error(await readError(response));
  const rows = (await response.json()) as { save?: SaveState; updated_at?: string }[];
  const row = rows[0];
  if (!row?.save) return null;
  const save = hydrateSave(row.save);
  const updatedAt = typeof save.updatedAt === 'number' && save.updatedAt > 0
    ? save.updatedAt
    : row.updated_at
      ? Date.parse(row.updated_at)
      : 0;
  return { save: { ...save, updatedAt }, updatedAt };
}

async function push(session: CloudSession, save: SaveState): Promise<void> {
  const response = await fetch(`${supabaseUrl()}/rest/v1/vault_saves`, {
    method: 'POST',
    headers: { ...headers(session.accessToken), Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      user_id: session.userId,
      save,
      updated_at: new Date(save.updatedAt || Date.now()).toISOString(),
    }),
  });
  if (!response.ok) throw new Error(await readError(response));
  lastPushedAt = save.updatedAt;
}

export const useCloud = create<CloudStore>((set, get) => ({
  configured: cloudConfigured(),
  status: cloudConfigured() ? 'signed-out' : 'off',
  email: null,
  message: cloudConfigured() ? null : 'Cloud save is coming soon. Sign-in will use email, then Apple and Google.',
  session: null,
  ready: false,
  boot: async () => {
    if (!cloudConfigured()) {
      set({ ready: true, status: 'off' });
      return;
    }
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (!raw) {
        set({ ready: true, status: 'signed-out', session: null, email: null });
        return;
      }
      let session = JSON.parse(raw) as CloudSession;
      session = await refresh(session);
      set({ session, email: session.email, status: 'signed-in', ready: true, message: 'Signed in. Checking the cloud copy.' });
      await get().syncNow();
    } catch (error) {
      set({
        ready: true,
        status: 'error',
        message: error instanceof Error ? error.message : 'Cloud sign-in could not be restored.',
      });
    }
  },
  signUp: async (email, password) => {
    set({ status: 'saving', message: null });
    const response = await fetch(
      `${supabaseUrl()}/auth/v1/signup?redirect_to=${encodeURIComponent(EMAIL_REDIRECT_TO)}`,
      {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ email, password }),
      },
    );
    const payload = (await response.json()) as AuthPayload;
    if (!response.ok) {
      set({ status: 'error', message: payload.msg || payload.error_description || payload.message || 'Could not create the account.' });
      return;
    }
    const session = sessionFrom(payload, email);
    if (!session) {
      set({
        status: 'signed-out',
        message: 'Check your email to confirm this account, then come back and sign in. The vault stays on this device until then.',
      });
      return;
    }
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    set({ session, email: session.email, status: 'signed-in', message: 'Account created. Saving this vault to the cloud.' });
    await get().syncNow();
  },
  signIn: async (email, password) => {
    set({ status: 'saving', message: null });
    const response = await fetch(`${supabaseUrl()}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email, password }),
    });
    const payload = (await response.json()) as AuthPayload;
    if (!response.ok) {
      set({ status: 'error', message: payload.error_description || payload.msg || payload.message || 'Could not sign in.' });
      return;
    }
    const session = sessionFrom(payload, email);
    if (!session) {
      set({ status: 'error', message: 'The cloud did not return a session.' });
      return;
    }
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    set({ session, email: session.email, status: 'signed-in', message: 'Signed in.' });
    await get().syncNow();
  },
  signOut: async () => {
    const session = get().session;
    if (session) {
      await fetch(`${supabaseUrl()}/auth/v1/logout`, {
        method: 'POST',
        headers: headers(session.accessToken),
      }).catch(() => undefined);
    }
    await AsyncStorage.removeItem(SESSION_KEY);
    lastPushedAt = -1;
    set({ session: null, email: null, status: 'signed-out', message: 'Signed out. This device still has its copy.' });
  },
  syncNow: async () => {
    let session = get().session;
    if (!cloudConfigured() || !session) return;
    try {
      session = await refresh(session);
      set({ session, status: 'saving' });
      const remote = await pull(session);
      const local = useGame.getState().save;
      if (remote && remote.updatedAt > local.updatedAt) {
        useGame.getState().replaceSave(remote.save);
        lastPushedAt = remote.updatedAt;
        set({ status: 'signed-in', message: 'Brought the newer cloud vault onto this device.' });
        return;
      }
      if (local.updatedAt !== lastPushedAt) {
        await push(session, local);
        set({ status: 'signed-in', message: 'Saved to the cloud. Coins still have no cash value.' });
        return;
      }
      set({ status: 'signed-in', message: 'Cloud copy matches this device.' });
    } catch (error) {
      set({ status: 'error', message: error instanceof Error ? error.message : 'Cloud save failed. The device copy is safe.' });
    }
  },
}));

export function startCloudSync(): () => void {
  if (!cloudConfigured()) return () => undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const unsub = useGame.subscribe((state, previous) => {
    if (state.save === previous.save) return;
    if (state.save.updatedAt === lastPushedAt) return;
    if (!useCloud.getState().session) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void useCloud.getState().syncNow(), 800);
  });
  return () => {
    if (timer) clearTimeout(timer);
    unsub();
  };
}
