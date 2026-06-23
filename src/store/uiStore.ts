import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light' | 'system';
export type View =
  | 'landing'
  | 'auth'
  | 'chat'
  | 'settings'
  | 'admin'
  | 'profile'
  | 'search'
  | 'premium';

interface UIState {
  theme: Theme;
  view: View;
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  rightPanelContent: 'profile' | 'search' | 'stickers' | null;
  activeSettingsTab: string;
  notifications: boolean;
  soundEnabled: boolean;
  language: string;
  isMobile: boolean;

  setTheme: (theme: Theme) => void;
  setView: (view: View) => void;
  toggleSidebar: () => void;
  setRightPanel: (content: 'profile' | 'search' | 'stickers' | null) => void;
  setSettingsTab: (tab: string) => void;
  toggleNotifications: () => void;
  toggleSound: () => void;
  setMobile: (mobile: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      view: 'landing',
      sidebarOpen: true,
      rightPanelOpen: false,
      rightPanelContent: null,
      activeSettingsTab: 'profile',
      notifications: true,
      soundEnabled: true,
      language: 'ru',
      isMobile: false,

      setTheme: (theme) => set({ theme }),
      setView: (view) => set({ view }),
      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
      setRightPanel: (content) =>
        set({ rightPanelContent: content, rightPanelOpen: !!content }),
      setSettingsTab: (tab) => set({ activeSettingsTab: tab }),
      toggleNotifications: () => set(s => ({ notifications: !s.notifications })),
      toggleSound: () => set(s => ({ soundEnabled: !s.soundEnabled })),
      setMobile: (mobile) => set({ isMobile: mobile }),
    }),
    {
      name: 'nexus-ui',
      partialize: state => ({
        theme: state.theme,
        notifications: state.notifications,
        soundEnabled: state.soundEnabled,
        language: state.language,
      }),
    }
  )
);
