import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserInfo {
  _id: string;
  email: string;
  credits: number;
  referralCode: string;
  token: string;
}

interface AuthState {
  userInfo: UserInfo | null;
  login: (user: UserInfo) => void;
  logout: () => void;
  updateCredits: (newCredits: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userInfo: null,
      login: (user) => set({ userInfo: user }),
      logout: () => set({ userInfo: null }),
      updateCredits: (newCredits) =>
        set((state) => ({
          userInfo: state.userInfo
            ? { ...state.userInfo, credits: newCredits }
            : null,
        })),
    }),
    {
      name: 'auth-storage', // key in localStorage
    }
  )
);