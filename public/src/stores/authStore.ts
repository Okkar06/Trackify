import { create } from "zustand";

import { clearSession, getAccessToken, setSession } from "@/services/apiClient";
import { login as loginRequest } from "@/services/authService";

type AuthState = {
  accessToken: string;
  isLoading: boolean;
  error: string;
  hydrate: () => void;
  login: (params: { email: string; password: string }) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: "",
  isLoading: false,
  error: "",
  hydrate: () => {
    set({ accessToken: getAccessToken() });
  },
  login: async ({ email, password }) => {
    set({ isLoading: true, error: "" });
    try {
      const res = await loginRequest({ email, password });
      const session = res?.session;
      setSession(session);
      set({ accessToken: String(session?.access_token || ""), isLoading: false });
    } catch (err: any) {
      set({
        error: err?.response?.data?.error?.message || err?.message || "Login failed",
        isLoading: false,
      });
    }
  },
  logout: () => {
    clearSession();
    set({ accessToken: "", error: "" });
  },
}));

