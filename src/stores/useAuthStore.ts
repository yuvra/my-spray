import { create } from 'zustand';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';
import type { UserProfile } from '@/types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isDemo: boolean;
  isPhoneVerified: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  phoneConfirmationId: string | null;
  isAuthenticated: () => boolean;
  setPhoneConfirmationId: (id: string | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  enterDemoMode: () => void;
  enterPhoneVerifiedMode: (profile: UserProfile) => void;
  logout: () => Promise<void>;
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isDemo: false,
  isPhoneVerified: false,
  isLoading: false,
  isInitialized: false,
  phoneConfirmationId: null,

  isAuthenticated: () => Boolean(get().user || get().isDemo || get().isPhoneVerified),

  setPhoneConfirmationId: (phoneConfirmationId) => set({ phoneConfirmationId }),

  enterDemoMode: () =>
    set({
      isDemo: true,
      isPhoneVerified: false,
      profile: {
        uid: 'demo-user',
        phone: '9999999999',
        name: 'Demo Farmer',
        village: 'Demo Village',
        preferredCrops: ['pomegranate'],
        language: 'en',
        createdAt: new Date().toISOString(),
      },
    }),

  enterPhoneVerifiedMode: (profile) =>
    set({
      user: null,
      isDemo: false,
      isPhoneVerified: true,
      profile,
      phoneConfirmationId: null,
    }),

  setProfile: (profile) => set({ profile }),

  logout: async () => {
    if (get().isDemo || get().isPhoneVerified) {
      set({
        user: null,
        profile: null,
        phoneConfirmationId: null,
        isDemo: false,
        isPhoneVerified: false,
      });
      return;
    }
    try {
      await signOut(getFirebaseAuth());
    } catch {
      // ignore sign-out errors
    }
    set({
      user: null,
      profile: null,
      phoneConfirmationId: null,
      isDemo: false,
      isPhoneVerified: false,
    });
  },

  initialize: () => {
    if (!isFirebaseConfigured) {
      set({ isInitialized: true });
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      set({ user, isInitialized: true, isLoading: false });
    });

    return unsubscribe;
  },
}));
