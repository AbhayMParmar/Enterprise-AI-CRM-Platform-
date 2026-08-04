import { create } from 'zustand';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'SuperAdmin' | 'Admin' | 'SalesManager' | 'SalesRep';
  avatar?: string;
}

interface AuthState {
  user: UserSession | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, user: UserSession) => void;
  logout: () => void;
  setAccessToken: (accessToken: string) => void;
  setLoading: (isLoading: boolean) => void;
}

const SESSION_FLAG = 'crm_has_session';

// If there is no session flag at all, we know loading is not needed.
// This prevents the initial loading spinner from appearing on fresh visits.
const hasInitialSession = !!localStorage.getItem(SESSION_FLAG);

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  // Only start in "loading" state if we have evidence of a prior session
  isLoading: hasInitialSession,

  login: (accessToken, user) => {
    localStorage.setItem(SESSION_FLAG, '1');
    set({ accessToken, user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem(SESSION_FLAG);
    set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false });
  },

  setAccessToken: (accessToken) => set({ accessToken }),

  setLoading: (isLoading) => set({ isLoading }),
}));

export default useAuthStore;
