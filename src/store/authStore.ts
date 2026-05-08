"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Korisnik } from "@/types";

interface AuthState {
  currentUser: Korisnik | null;
  isAuthenticated: boolean;
  isNewUser: boolean;
  login: (user: Korisnik, newUser?: boolean) => void;
  logout: () => void;
  updateUser: (updates: Partial<Korisnik>) => void;
  clearNewUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      isNewUser: false,

      login: (user, newUser = false) =>
        set({ currentUser: user, isAuthenticated: true, isNewUser: newUser }),

      logout: () => {
        try {
          localStorage.removeItem("forum1_mat_home");
          localStorage.removeItem("forum1_mat_pinned");
          localStorage.removeItem("notif_topComment");
        } catch {}
        set({ currentUser: null, isAuthenticated: false, isNewUser: false });
      },

      updateUser: (updates) =>
        set((state) => ({
          currentUser: state.currentUser
            ? { ...state.currentUser, ...updates }
            : null,
        })),

      clearNewUser: () => set({ isNewUser: false }),
    }),
    {
      name: "forum1-auth",
      partialize: (state) => ({
        currentUser: state.currentUser
          ? { ...state.currentUser, lozinka: undefined }
          : null,
        isAuthenticated: state.isAuthenticated,
        // isNewUser intentionally excluded — never persisted
      }),
    }
  )
);
