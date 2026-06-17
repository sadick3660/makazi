import {
  createContext, useContext, useState, useEffect,
  useCallback, type ReactNode,
} from "react";
import type { User, AuthTokens, LoginRequest, RegisterRequest } from "../types";
import { authApi } from "../services/api";
import toast from "react-hot-toast";

interface AuthContextValue {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "nyumbalink_tokens";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(() => {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      return raw ? (JSON.parse(raw) as AuthTokens) : null;
    } catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(true);

  const persistTokens = (t: AuthTokens | null) => {
    setTokens(t);
    if (t) localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
    else    localStorage.removeItem(TOKEN_KEY);
  };

  const refreshUser = useCallback(async () => {
    if (!tokens?.access) { setIsLoading(false); return; }
    try {
      const me = await authApi.me(tokens.access);
      setUser(me);
    } catch {
      persistTokens(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [tokens?.access]);

  useEffect(() => { refreshUser(); }, []);                      // eslint-disable-line

  const login = async (data: LoginRequest) => {
    const result = await authApi.login(data);
    persistTokens(result.tokens);
    setUser(result.user);
    toast.success(`Welcome back, ${result.user.full_name.split(" ")[0]}!`);
  };

  const register = async (data: RegisterRequest) => {
    const result = await authApi.register(data);
    persistTokens(result.tokens);
    setUser(result.user);
    toast.success("Account created successfully!");
  };

  const logout = () => {
    persistTokens(null);
    setUser(null);
    toast("Logged out successfully", { icon: "👋" });
  };

  return (
    <AuthContext.Provider value={{
      user, tokens, isLoading,
      isAuthenticated: !!user,
      login, register, logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
