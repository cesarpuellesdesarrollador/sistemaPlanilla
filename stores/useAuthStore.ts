import { create } from 'zustand'
import { MOCK_USER } from '@/lib/mockAuth'

interface AuthState {
  user: any | null
  loading: boolean
  signingOut: boolean
  initialized: boolean
  userName: string
  userRole: string
  setUser: (user: any | null) => void
  setLoading: (loading: boolean) => void
  setSigningOut: (signingOut: boolean) => void
  setInitialized: (v: boolean) => void
  setUserProfile: (userName: string, userRole: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  signingOut: false,
  initialized: false,
  userName: '',
  userRole: '',
  setUser: (user) => {
    // Solo actualizar si el user.id cambió o si el usuario es null
    const currentUser = get().user;
    if (currentUser?.id !== user?.id) {
      set({ user, loading: false });
    } else if (currentUser === null && user === null) {
      // Si ambos son null, no hacer nada
      return;
    } else {
      // Si el ID es el mismo, solo actualizar loading
      set({ loading: false });
    }
  },
  setLoading: (loading) => set({ loading }),
  setSigningOut: (signingOut) => set({ signingOut }),
  setInitialized: (v: boolean) => set({ initialized: v }),
  setUserProfile: (userName, userRole) => set({ userName, userRole }),
  clearAuth: () => set({ user: null, loading: false, userName: '', userRole: '' }),
}))
