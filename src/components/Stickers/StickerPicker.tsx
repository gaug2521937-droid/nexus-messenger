import { useState } from 'react';
import { useStickerStore, Sticker } from '../../store/stickerStore';
import { useAuthStore } from '../../store/authStore';
import { StickerCreator } from './StickerCreator';

interface StickerPickerProps {
  onSelect: (sticker: { url: string; emoji?: string }) => void;
  onClose: () => void;
}

const EMOJI_LIST = ['😊', '😂', '❤️', '🔥', '👍', '🎉', '😎', '🤔', '😢', '😮', '💀', '🤡', '👏', '🙏', '💯'];

export function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
  const { packs, getUserPacks } = useStickerStore();
  const { currentAccount } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'stickers' | 'emoji' | 'create'>('stickers');
  const [showCreator, setShowCreator] = useState(false);

  const userId = currentAccount?.id || '';
  const userPacks = getUserPacks(userId);
  const availablePacks = [...packs.filter(p => !p.isPremium || currentAccount?.isPremium), ...userPacks.filter(p => !packs.some(sp => sp.id === p.id))];
  const allStickers = availablePacks.flatMap(p => p.stickers);

  const handleStickerClick = (sticker: Sticker) => {
    onSelect({ url: sticker.url, emoji: sticker.emoji });
    onClose();
  };

  const handleEmojiClick = (emoji: string) => {
    onSelect({ url: '', emoji });
    onClose();
  };

  return (
    <div className="absolute bottom-full right-0 mb-2 w-[320px] bg-[#1A1A2E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-30">
      {/* Tabs */}
      <div className="flex border-b border-white/8">
        {[
          { key: 'stickers' as const, label: '🎭 Стикеры' },
          { key: 'emoji' as const, label: '😊 Эмодзи' },
          { key: 'create' as const, label: '➕ Создать' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2.5 text-xs font-medium transition-all ${
              activeTab === t.key
                ? 'text-[#6C63FF] border-b-2 border-[#6C63FF]'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {t.label}
          </button>
        ))}
        <button onClick={onClose} className="px-3 text-white/30 hover:text-white/60">×</button>
      </div>

      {/* Content */}
      <div className="h-[240px] overflow-y-auto p-2">
        {activeTab === 'stickers' && (
          <div>
            {allStickers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-white/20 text-sm gap-2">
                <span className="text-4xl">🎭</span>
                <span>Нет стикеров</span>
                <button
                  onClick={() => setActiveTab('create')}
                  className="text-[#6C63FF] text-xs hover:underline"
                >
                  Создать стикер
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1">
                {allStickers.map(sticker => (
                  <button
                    key={sticker.id}
                    onClick={() => handleStickerClick(sticker)}
                    className="aspect-square rounded-xl overflow-hidden hover:bg-white/5 transition-all hover:scale-105 flex items-center justify-center p-1"
                  >
                    <img src={sticker.url} alt={sticker.emoji || 'sticker'} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'emoji' && (
          <div className="grid grid-cols-6 gap-1">
            {EMOJI_LIST.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="aspect-square rounded-xl hover:bg-white/5 transition-all hover:scale-110 flex items-center justify-center text-2xl"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="flex flex-col gap-2 p-2">
            <button
              onClick={() => setShowCreator(true)}
              className="w-full py-3 rounded-xl bg-[#6C63FF]/10 border border-[#6C63FF]/20 text-[#6C63FF] text-sm font-medium hover:bg-[#6C63FF]/20 transition-all"
            >
              📷 Создать стикер из фото
            </button>
            <p className="text-xs text-white/30 text-center">
              Загрузи фото, обрежь и создай собственный стикер
            </p>
          </div>
        )}
      </div>

      {showCreator && (
        <StickerCreator onClose={() => { setShowCreator(false); setActiveTab('stickers'); }} />
      )}
    </div>
  );
}
