import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Sticker {
  id: string;
  url: string;
  emoji?: string;
  packId: string;
  createdBy: string;
  createdAt: string;
}

export interface StickerPack {
  id: string;
  name: string;
  description?: string;
  stickers: Sticker[];
  createdBy: string;
  createdAt: string;
  isPublic: boolean;
  isPremium: boolean;
}

export interface LiveEmoji {
  id: string;
  name: string;
  url: string;
  videoUrl?: string;
  createdBy: string;
  createdAt: string;
  isPremium: boolean;
  packId: string;
}

export interface EmojiPack {
  id: string;
  name: string;
  emojis: LiveEmoji[];
  createdBy: string;
  isPremium: boolean;
}

interface StickerState {
  packs: StickerPack[];
  userPacks: Record<string, string[]>; // userId -> packIds
  liveEmojis: LiveEmoji[];
  emojiPacks: EmojiPack[];
  userEmojis: Record<string, string[]>;

  createPack: (name: string, userId: string, isPremium?: boolean) => StickerPack;
  addStickerToPack: (packId: string, sticker: Omit<Sticker, 'id' | 'packId'>) => void;
  addPackToUser: (userId: string, packId: string) => void;
  removePackFromUser: (userId: string, packId: string) => void;
  getUserPacks: (userId: string) => StickerPack[];
  addLiveEmoji: (emoji: Omit<LiveEmoji, 'id' | 'packId'>) => LiveEmoji;
  getUserEmojis: (userId: string) => LiveEmoji[];
  addEmojiToUser: (userId: string, emojiId: string) => void;
  initDefaultPacks: () => void;
}

const DEFAULT_STICKER_URLS = [
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDUiIGZpbGw9IiNGRkQwNjAiLz48Y2lyY2xlIGN4PSIzNSIgY3k9IjQwIiByPSI1IiBmaWxsPSIjMzMzIi8+PGNpcmNsZSBjeD0iNjUiIGN5PSI0MCIgcj0iNSIgZmlsbD0iIzMzMyIvPjxwYXRoIGQ9Ik0zMCA2MCBRNTAgODAgNzAgNjAiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=',
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDUiIGZpbGw9IiNGRjYwNjAiLz48Y2lyY2xlIGN4PSIzNSIgY3k9IjQwIiByPSI1IiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iNjUiIGN5PSI0MCIgcj0iNSIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0zMCA2NSBRNTAgNDUgNzAgNjUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=',
];

export const useStickerStore = create<StickerState>()(
  persist(
    (set, get) => ({
      packs: [],
      userPacks: {},
      liveEmojis: [],
      emojiPacks: [],
      userEmojis: {},

      createPack: (name, userId, isPremium = false) => {
        const pack: StickerPack = {
          id: uuidv4(),
          name,
          stickers: [],
          createdBy: userId,
          createdAt: new Date().toISOString(),
          isPublic: false,
          isPremium,
        };
        set(state => ({
          packs: [...state.packs, pack],
          userPacks: {
            ...state.userPacks,
            [userId]: [...(state.userPacks[userId] || []), pack.id],
          },
        }));
        return pack;
      },

      addStickerToPack: (packId, stickerData) => {
        const sticker: Sticker = {
          id: uuidv4(),
          packId,
          ...stickerData,
        };
        set(state => ({
          packs: state.packs.map(p =>
            p.id === packId ? { ...p, stickers: [...p.stickers, sticker] } : p
          ),
        }));
      },

      addPackToUser: (userId, packId) => {
        set(state => {
          const existing = state.userPacks[userId] || [];
          if (existing.includes(packId)) return state;
          return {
            userPacks: { ...state.userPacks, [userId]: [...existing, packId] },
          };
        });
      },

      removePackFromUser: (userId, packId) => {
        set(state => ({
          userPacks: {
            ...state.userPacks,
            [userId]: (state.userPacks[userId] || []).filter(id => id !== packId),
          },
        }));
      },

      getUserPacks: (userId) => {
        const state = get();
        const packIds = state.userPacks[userId] || [];
        return state.packs.filter(p => packIds.includes(p.id));
      },

      addLiveEmoji: (emojiData) => {
        const emoji: LiveEmoji = {
          id: uuidv4(),
          packId: 'default',
          ...emojiData,
        };
        set(state => ({ liveEmojis: [...state.liveEmojis, emoji] }));
        return emoji;
      },

      getUserEmojis: (userId) => {
        const state = get();
        const emojiIds = state.userEmojis[userId] || [];
        return state.liveEmojis.filter(e => emojiIds.includes(e.id));
      },

      addEmojiToUser: (userId, emojiId) => {
        set(state => {
          const existing = state.userEmojis[userId] || [];
          if (existing.includes(emojiId)) return state;
          return {
            userEmojis: { ...state.userEmojis, [userId]: [...existing, emojiId] },
          };
        });
      },

      initDefaultPacks: () => {
        const state = get();
        if (state.packs.length > 0) return;

        const defaultPack: StickerPack = {
          id: 'pack-default',
          name: 'NEXUS Stickers',
          description: 'Default sticker pack',
          stickers: DEFAULT_STICKER_URLS.map((url, i) => ({
            id: `sticker-default-${i}`,
            url,
            emoji: ['😊', '😢'][i],
            packId: 'pack-default',
            createdBy: 'system',
            createdAt: new Date().toISOString(),
          })),
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          isPublic: true,
          isPremium: false,
        };

        const premiumPack: StickerPack = {
          id: 'pack-premium',
          name: 'Premium Collection ✨',
          description: 'Exclusive premium stickers',
          stickers: [],
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          isPublic: true,
          isPremium: true,
        };

        set({ packs: [defaultPack, premiumPack] });
      },
    }),
    { name: 'nexus-stickers' }
  )
);
