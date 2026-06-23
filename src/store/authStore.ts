import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Account {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string;
  phone: string;
  email: string;
  isPremium: boolean;
  isAdmin: boolean;
  isSupport: boolean;
  supportRole?: 'moderator' | 'administrator' | 'creator';
  isScam: boolean;
  scamDescription?: string;
  isVerified: boolean;
  liveEmoji?: string;
  createdAt: string;
  lastSeen: string;
  token: string;
}

interface AuthState {
  accounts: Account[];
  currentAccountId: string | null;
  isAuthenticated: boolean;
  currentAccount: Account | null;
  login: (username: string, password: string) => Promise<Account>;
  register: (username: string, displayName: string, password: string) => Promise<Account>;
  logout: () => void;
  switchAccount: (accountId: string) => void;
  addAccount: (username: string, password: string) => Promise<Account>;
  removeAccount: (accountId: string) => void;
  updateAccount: (accountId: string, updates: Partial<Account>) => void;
  getCurrentAccount: () => Account | null;
}

// Predefined admin account
const ADMIN_ACCOUNT: Account = {
  id: 'admin-001',
  username: 'admin',
  displayName: 'NEXUS Admin',
  avatar: null,
  bio: 'Platform Administrator',
  phone: '+1000000000',
  email: 'admin@nexus.app',
  isPremium: true,
  isAdmin: true,
  isSupport: true,
  supportRole: 'creator',
  isScam: false,
  isVerified: true,
  liveEmoji: undefined,
  createdAt: '2024-01-01T00:00:00Z',
  lastSeen: new Date().toISOString(),
  token: 'admin-token-super-secret',
};

// Demo users
const DEMO_USERS: { username: string; password: string; account: Account }[] = [
  {
    username: 'admin',
    password: 'admin123',
    account: ADMIN_ACCOUNT,
  },
  {
    username: 'alice',
    password: 'alice123',
    account: {
      id: 'user-alice',
      username: 'alice',
      displayName: 'Alice Johnson',
      avatar: null,
      bio: 'Designer & Creative',
      phone: '+1234567890',
      email: 'alice@example.com',
      isPremium: true,
      isAdmin: false,
      isSupport: false,
      isScam: false,
      isVerified: true,
      createdAt: '2024-02-15T10:00:00Z',
      lastSeen: new Date().toISOString(),
      token: 'alice-token-123',
    },
  },
  {
    username: 'bob',
    password: 'bob123',
    account: {
      id: 'user-bob',
      username: 'bob',
      displayName: 'Bob Smith',
      avatar: null,
      bio: 'Developer',
      phone: '+0987654321',
      email: 'bob@example.com',
      isPremium: false,
      isAdmin: false,
      isSupport: false,
      isScam: false,
      isVerified: false,
      createdAt: '2024-03-01T10:00:00Z',
      lastSeen: new Date().toISOString(),
      token: 'bob-token-123',
    },
  },
];

const storedUsers = new Map<string, { password: string; account: Account }>();
DEMO_USERS.forEach(u => storedUsers.set(u.username, { password: u.password, account: u.account }));

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accounts: [],
      currentAccountId: null,
      isAuthenticated: false,
      currentAccount: null,

      getCurrentAccount: () => {
        const state = get();
        if (!state.currentAccountId) return null;
        return state.accounts.find(a => a.id === state.currentAccountId) || null;
      },

      login: async (username: string, password: string) => {
        await new Promise(r => setTimeout(r, 600));
        const found = storedUsers.get(username.toLowerCase());
        if (!found || found.password !== password) {
          throw new Error('Invalid username or password');
        }
        const account = { ...found.account, lastSeen: new Date().toISOString() };
        set(state => {
          const exists = state.accounts.find(a => a.id === account.id);
          const accounts = exists
            ? state.accounts.map(a => (a.id === account.id ? account : a))
            : [...state.accounts, account];
          return {
            accounts,
            currentAccountId: account.id,
            isAuthenticated: true,
            currentAccount: account,
          };
        });
        return account;
      },

      register: async (username: string, displayName: string, password: string) => {
        await new Promise(r => setTimeout(r, 800));
        if (storedUsers.has(username.toLowerCase())) {
          throw new Error('Username already taken');
        }
        const newAccount: Account = {
          id: `user-${Date.now()}`,
          username: username.toLowerCase(),
          displayName,
          avatar: null,
          bio: '',
          phone: '',
          email: '',
          isPremium: false,
          isAdmin: false,
          isSupport: false,
          isScam: false,
          isVerified: false,
          createdAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          token: `token-${Date.now()}`,
        };
        storedUsers.set(username.toLowerCase(), { password, account: newAccount });
        set(state => ({
          accounts: [...state.accounts, newAccount],
          currentAccountId: newAccount.id,
          isAuthenticated: true,
          currentAccount: newAccount,
        }));
        return newAccount;
      },

      logout: () => {
        set(state => {
          const remaining = state.accounts.filter(a => a.id !== state.currentAccountId);
          const next = remaining[0] || null;
          return {
            accounts: remaining,
            currentAccountId: next?.id || null,
            isAuthenticated: !!next,
            currentAccount: next,
          };
        });
      },

      switchAccount: (accountId: string) => {
        set(state => {
          const account = state.accounts.find(a => a.id === accountId);
          if (!account) return state;
          return {
            currentAccountId: accountId,
            isAuthenticated: true,
            currentAccount: account,
          };
        });
      },

      addAccount: async (username: string, password: string) => {
        await new Promise(r => setTimeout(r, 600));
        const found = storedUsers.get(username.toLowerCase());
        if (!found || found.password !== password) {
          throw new Error('Invalid username or password');
        }
        const account = { ...found.account, lastSeen: new Date().toISOString() };
        set(state => {
          const exists = state.accounts.find(a => a.id === account.id);
          if (exists) return state;
          return { accounts: [...state.accounts, account] };
        });
        return account;
      },

      removeAccount: (accountId: string) => {
        set(state => {
          const remaining = state.accounts.filter(a => a.id !== accountId);
          if (state.currentAccountId === accountId) {
            const next = remaining[0] || null;
            return {
              accounts: remaining,
              currentAccountId: next?.id || null,
              isAuthenticated: !!next,
              currentAccount: next,
            };
          }
          return { accounts: remaining };
        });
      },

      updateAccount: (accountId: string, updates: Partial<Account>) => {
        set(state => ({
          accounts: state.accounts.map(a => (a.id === accountId ? { ...a, ...updates } : a)),
          currentAccount:
            state.currentAccountId === accountId
              ? { ...state.currentAccount!, ...updates }
              : state.currentAccount,
        }));
        // Also update in storedUsers
        storedUsers.forEach((val, key) => {
          if (val.account.id === accountId) {
            storedUsers.set(key, { ...val, account: { ...val.account, ...updates } });
          }
        });
      },
    }),
    {
      name: 'nexus-auth',
      partialize: state => ({
        accounts: state.accounts,
        currentAccountId: state.currentAccountId,
        isAuthenticated: state.isAuthenticated,
        currentAccount: state.currentAccount,
      }),
    }
  )
);

// Export storedUsers for access from other stores
export { storedUsers };
