"use client";

import { create } from "zustand";
import type { UserSession } from "@/types/api";

type AuthState = {
  user: UserSession | null;
  accessToken: string | null;
  setSession: (user: UserSession, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setSession: (user, accessToken) => set({ user, accessToken }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clearSession: () => set({ user: null, accessToken: null })
}));



