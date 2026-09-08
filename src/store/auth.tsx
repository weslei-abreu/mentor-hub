import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, ApiError, clearTokens, getAccessToken, setTokens } from "@/lib/api";
import type { User } from "@/types";

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      if (!getAccessToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await apiFetch<User>("/auth/me");
        setUser(me);
      } catch (err) {
        // Só encerra a sessão quando o servidor de fato rejeitou os tokens
        // (401, já depois da tentativa de refresh dentro de apiFetch). Uma
        // falha de rede ou um erro 5xx transitório não deve deslogar o
        // usuário — na próxima carga da página os tokens ainda estarão
        // salvos e o bootstrap tenta de novo.
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
        }
      } finally {
        setLoading(false);
      }
    }
    void bootstrap();
  }, []);

  async function login(email: string, password: string) {
    const data = await apiFetch<{ accessToken: string; refreshToken: string; user: User }>(
      "/auth/login",
      {
        method: "POST",
        body: { email, password },
      },
    );
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    const refreshToken = localStorage.getItem("locus_refresh_token");
    clearTokens();
    setUser(null);
    if (refreshToken) {
      try {
        await apiFetch("/auth/logout", { method: "POST", body: { refreshToken } });
      } catch {
        /* ignora falha de logout no servidor */
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
