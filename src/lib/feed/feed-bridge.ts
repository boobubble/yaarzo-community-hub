import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { supabase as browserSupabase } from "@/lib/supabase";

type BridgeStatus = {
  user: User | null;
  access_token?: string;
  expires_at?: number;
  canRenew?: boolean;
};
type Listener = (event: string) => void;
let endpoint: string | null = null;
let token: string | null = null;
let generation = 0;
let pending: Promise<BridgeStatus> | null = null;
let client: SupabaseClient | null = null;
const listeners = new Set<Listener>();
const emit = (event: string) => listeners.forEach((listener) => listener(event));

async function request(action: string, extra: Record<string, string> = {}) {
  if (!endpoint) throw new Error("Feed bridge is not configured");
  const response = await fetch(endpoint, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...extra }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("Feed session unavailable");
  return response.json();
}
export function isFeedBridge() {
  return endpoint !== null;
}
export function configureFeedBridge(sessionEndpoint?: string) {
  generation++;
  endpoint = null;
  pending = null;
  token = null;
  if (client) {
    client.realtime.disconnect();
    client = null;
  }
  if (sessionEndpoint) {
    const url = new URL(sessionEndpoint, window.location.href);
    if (
      url.origin !== window.location.origin ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    )
      throw new Error("Feed session endpoint must be same-origin");
    endpoint = url.href;
    const auth = {
      getUser: async () => {
        try {
          const status = await verifyFeedBridge();
          return { data: { user: status.user }, error: null };
        } catch {
          return { data: { user: null }, error: new Error("Feed session unavailable") };
        }
      },
      onAuthStateChange: (callback: Listener) => {
        listeners.add(callback);
        return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
      },
      signOut: async () => {
        generation++;
        pending = null;
        token = null;
        client?.realtime.disconnect();
        emit("SIGNED_OUT");
        try {
          await request("disconnect");
          return { error: null };
        } catch {
          return { error: new Error("Could not disconnect") };
        }
      },
    };
    const raw = createClient(
      import.meta.env["VITE_SUPABASE_URL"],
      import.meta.env["VITE_SUPABASE_ANON_KEY"],
      {
        accessToken: async () => {
          const status = await verifyFeedBridge();
          // Reads can remain public; mutation identity guards separately reject null users.
          return status.user ? token : null;
        },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      },
    );
    client = new Proxy(raw, {
      get(target, key) {
        if (key === "auth") return auth;
        const value = Reflect.get(target, key);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  } else endpoint = null;
}
export async function verifyFeedBridge(): Promise<BridgeStatus> {
  if (pending) return pending;
  const current = generation;
  const task = (async () => {
    try {
      const status = (await request("status")) as BridgeStatus;
      if (current !== generation) throw new Error("Feed session changed");
      const valid =
        status.user &&
        !status.user.is_anonymous &&
        typeof status.access_token === "string" &&
        typeof status.expires_at === "number" &&
        status.expires_at > Date.now() / 1000;
      const previous = token;
      token = valid ? status.access_token! : null;
      if (!token) client?.realtime.disconnect();
      else if (token !== previous) void client?.realtime.setAuth(token);
      if (!valid) return { user: null, canRenew: status.canRenew === true };
      return status;
    } catch {
      if (current === generation) token = null;
      return { user: null, canRenew: false };
    } finally {
      if (current === generation) pending = null;
    }
  })();
  pending = task;
  return task;
}
export async function renewFeedBridge() {
  const result = await request("renew", { return_path: window.location.pathname });
  if (typeof result.url !== "string" || new URL(result.url).protocol !== "https:")
    throw new Error("Renewal unavailable");
  window.location.assign(result.url);
}
// Feed components use the dedicated bridge client only in the Grupo island.
// Ordinary Yaarzo Feed and all Chat/auth clients keep their existing behavior.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, key) {
    const selected = client ?? browserSupabase;
    const value = Reflect.get(selected, key);
    return typeof value === "function" ? value.bind(selected) : value;
  },
});
