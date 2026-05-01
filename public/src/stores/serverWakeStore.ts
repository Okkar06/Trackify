import { create } from "zustand";

type WakePhase = "hidden" | "loading" | "timeout";

type WakeState = {
  phase: WakePhase;
  inFlight: number;
  showAfterMs: number;
  timeoutMs: number;
  lastError: string;
  openLoading: () => void;
  openTimeout: (message?: string) => void;
  close: () => void;
  requestStarted: () => void;
  requestFinished: () => void;
};

export const useServerWakeStore = create<WakeState>((set, get) => ({
  phase: "hidden",
  inFlight: 0,
  showAfterMs: 2500,
  timeoutMs: 60000,
  lastError: "",
  openLoading: () => {
    set((s) => (s.phase === "timeout" ? s : { ...s, phase: "loading", lastError: "" }));
  },
  openTimeout: (message) => {
    set((s) => ({ ...s, phase: "timeout", lastError: message || "Server is taking longer than expected. Please try again." }));
  },
  close: () => set((s) => ({ ...s, phase: "hidden", lastError: "" })),
  requestStarted: () => {
    set((s) => ({ ...s, inFlight: s.inFlight + 1 }));
  },
  requestFinished: () => {
    const next = Math.max(0, get().inFlight - 1);
    const phase = get().phase;
    set((s) => ({ ...s, inFlight: next, phase: next === 0 && phase !== "timeout" ? "hidden" : s.phase }));
  },
}));

