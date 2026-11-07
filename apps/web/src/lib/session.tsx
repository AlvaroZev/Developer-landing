import { createClient } from "@triunder/api-client";
import type { PlatformConfig, Profile, User } from "@triunder/contracts";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Account state for the showroom. Demonstrations keep working when this
 * request fails. The API base URL is empty unless VITE_API_URL is set, so
 * production calls the same origin.
 */
const client = createClient({ baseUrl: import.meta.env.VITE_API_URL ?? "" });

export const defaults: PlatformConfig = {
  ai: {
    provider: "openai",
    status: "missing_credentials",
    model: "gpt-4o-mini",
    features: { projectDescription: false, requirementsAssistance: false },
  },
  oauth: { google: false },
  featuredDemos: [],
  hiddenCaseStudies: [],
  copyOverrides: {},
};

interface SessionValue {
  user: User | null;
  profile: Profile | null;
  config: PlatformConfig;
  online: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [config, setConfig] = useState<PlatformConfig>(defaults);
  const [online, setOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [me, platform] = await Promise.all([
        client.request<{ user: User | null; profile: Profile | null }>("/api/v1/auth/me"),
        client.request<PlatformConfig>("/api/v1/platform/configuration"),
      ]);
      setUser(me.user);
      setProfile(me.profile);
      setConfig(platform);
      setOnline(true);
    } catch {
      setUser(null);
      setProfile(null);
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await client.request("/api/v1/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<SessionValue>(
    () => ({ user, profile, config, online, loading, refresh, logout }),
    [user, profile, config, online, loading, refresh, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("SessionProvider is missing");
  return value;
}

export { client };
