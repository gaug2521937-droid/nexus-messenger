import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { storedUsers } from './authStore';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string;
  isPremium: boolean;
  isAdmin: boolean;
  isScam: boolean;
  scamDescription?: string;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: string;
  liveEmoji?: string;
  supportRole?: string;
}

export interface PrivacySettings {
  whoCanSeeOnlineStatus: 'everyone' | 'contacts' | 'nobody';
  whoCanSeeAvatar: 'everyone' | 'contacts' | 'nobody';
  whoCanAddToGroups: 'everyone' | 'contacts' | 'nobody';
  whoCanSendMessages: 'everyone' | 'contacts' | 'nobody';
  readReceipts: boolean;
  twoFAEnabled: boolean;
}

export interface NotificationSettings {
  messagesEnabled: boolean;
  groupsEnabled: boolean;
  channelsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

interface UserState {
  allUsers: UserProfile[];
  privacySettings: Record<string, PrivacySettings>;
  notificationSettings: Record<string, NotificationSettings>;
  blockedUsers: Record<string, string[]>;
  contacts: Record<string, string[]>;

  getAllUsers: () => UserProfile[];
  getUserById: (id: string) => UserProfile | null;
  searchUsers: (query: string) => UserProfile[];
  updatePrivacy: (userId: string, settings: Partial<PrivacySettings>) => void;
  updateNotifications: (userId: string, settings: Partial<NotificationSettings>) => void;
  blockUser: (userId: string, targetId: string) => void;
  unblockUser: (userId: string, targetId: string) => void;
  isBlocked: (userId: string, targetId: string) => boolean;
  setScam: (targetId: string, description: string) => void;
  removeScam: (targetId: string) => void;
  setSupportRole: (targetId: string, role: 'moderator' | 'administrator' | 'creator') => void;
  initUsers: () => void;
  updateUser: (userId: string, updates: Partial<UserProfile>) => void;
}

const DEFAULT_PRIVACY: PrivacySettings = {
  whoCanSeeOnlineStatus: 'everyone',
  whoCanSeeAvatar: 'everyone',
  whoCanAddToGroups: 'everyone',
  whoCanSendMessages: 'everyone',
  readReceipts: true,
  twoFAEnabled: false,
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  messagesEnabled: true,
  groupsEnabled: true,
  channelsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      allUsers: [],
      privacySettings: {},
      notificationSettings: {},
      blockedUsers: {},
      contacts: {},

      getAllUsers: () => get().allUsers,

      getUserById: (id) => {
        return get().allUsers.find(u => u.id === id) || null;
      },

      searchUsers: (query) => {
        const q = query.toLowerCase().trim();
        if (!q) return [];
        return get().allUsers.filter(
          u =>
            u.username.toLowerCase().includes(q) ||
            u.displayName.toLowerCase().includes(q)
        );
      },

      updatePrivacy: (userId, settings) => {
        set(state => ({
          privacySettings: {
            ...state.privacySettings,
            [userId]: { ...(state.privacySettings[userId] || DEFAULT_PRIVACY), ...settings },
          },
        }));
      },

      updateNotifications: (userId, settings) => {
        set(state => ({
          notificationSettings: {
            ...state.notificationSettings,
            [userId]: {
              ...(state.notificationSettings[userId] || DEFAULT_NOTIFICATIONS),
              ...settings,
            },
          },
        }));
      },

      blockUser: (userId, targetId) => {
        set(state => ({
          blockedUsers: {
            ...state.blockedUsers,
            [userId]: [...(state.blockedUsers[userId] || []), targetId],
          },
        }));
      },

      unblockUser: (userId, targetId) => {
        set(state => ({
          blockedUsers: {
            ...state.blockedUsers,
            [userId]: (state.blockedUsers[userId] || []).filter(id => id !== targetId),
          },
        }));
      },

      isBlocked: (userId, targetId) => {
        return (get().blockedUsers[userId] || []).includes(targetId);
      },

      setScam: (targetId, description) => {
        set(state => ({
          allUsers: state.allUsers.map(u =>
            u.id === targetId
              ? { ...u, isScam: true, scamDescription: description }
              : u
          ),
        }));
      },

      removeScam: (targetId) => {
        // Note: scam description CANNOT be removed per requirements
        // This only removes the visual badge but keeps the record
        set(state => ({
          allUsers: state.allUsers.map(u =>
            u.id === targetId ? { ...u, isScam: false } : u
          ),
        }));
      },

      setSupportRole: (targetId, role) => {
        set(state => ({
          allUsers: state.allUsers.map(u =>
            u.id === targetId ? { ...u, supportRole: role, isSupport: true } : u
          ),
        }));
      },

      initUsers: () => {
        const users: UserProfile[] = [];
        storedUsers.forEach((val) => {
          const acc = val.account;
          const existing = get().allUsers.find(u => u.id === acc.id);
          if (!existing) {
            users.push({
              id: acc.id,
              username: acc.username,
              displayName: acc.displayName,
              avatar: acc.avatar,
              bio: acc.bio,
              isPremium: acc.isPremium,
              isAdmin: acc.isAdmin,
              isScam: acc.isScam,
              scamDescription: acc.scamDescription,
              isVerified: acc.isVerified,
              isOnline: true,
              lastSeen: acc.lastSeen,
              liveEmoji: acc.liveEmoji,
              supportRole: acc.supportRole,
            });
          }
        });
        if (users.length > 0) {
          set(state => ({
            allUsers: [
              ...state.allUsers,
              ...users.filter(u => !state.allUsers.some(eu => eu.id === u.id)),
            ],
          }));
        }
      },

      updateUser: (userId, updates) => {
        set(state => ({
          allUsers: state.allUsers.map(u => (u.id === userId ? { ...u, ...updates } : u)),
        }));
      },
    }),
    { name: 'nexus-users' }
  )
);
