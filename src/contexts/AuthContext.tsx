import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest } from "../lib/api";
import { AuthContext } from "./auth-context";

const TOKEN_KEY = "nebula-cbt.access-token";

export interface AuthUser {
  id: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  mustChangePassword: boolean;
}

interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}



function readStoredToken(): string | null {
  try {
    return (
      sessionStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem(TOKEN_KEY)
    );
  } catch {
    return null;
  }
}

function saveToken(token: string, rememberDevice: boolean): void {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);

  if (rememberDevice) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

function clearStoredToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(readStoredToken()));

  useEffect(() => {
    if (!token) return;

    let active = true;

    apiRequest<AuthUser>("/auth/me", { token })
      .then((profile) => {
        if (active) setUser(profile);
      })
      .catch(() => {
        if (active) {
          clearStoredToken();
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const login = useCallback(
    async (
      identifier: string,
      password: string,
      rememberDevice: boolean,
    ) => {
      const result = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });

      saveToken(result.accessToken, rememberDevice);
      setUser(result.user);
      setToken(result.accessToken);
    },
    [],
  );

  const logout = useCallback(async () => {
    const activeToken = token;

    try {
      if (activeToken) {
        await apiRequest("/auth/logout", {
          method: "POST",
          token: activeToken,
        });
      }
    } catch {
      // Local credentials are cleared even if the network is unavailable.
    } finally {
      clearStoredToken();
      setToken(null);
      setUser(null);
      setIsLoading(false);
    }
  }, [token]);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!token) throw new Error("Sesi tidak ditemukan.");

      await apiRequest("/auth/change-password", {
        method: "POST",
        token,
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      clearStoredToken();
      setToken(null);
      setUser(null);
      setIsLoading(false);
    },
    [token],
  );

  const value = useMemo(
    () => ({ user, isLoading, login, logout, changePassword }),
    [user, isLoading, login, logout, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

