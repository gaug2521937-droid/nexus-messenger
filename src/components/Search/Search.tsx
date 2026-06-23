import { useState } from 'react';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useUIStore } from '../../store/uiStore';
import { Avatar } from '../Common/Avatar';
import { VerifiedBadge } from '../Common/VerifiedBadge';
import { ScamLabel } from '../Common/ScamLabel';

interface SearchProps {
  onClose: () => void;
}

export function Search({ onClose }: SearchProps) {
  const [query, setQuery] = useState('');
  const { searchUsers } = useUserStore();
  const { currentAccount } = useAuthStore();
  const { chats, createChat, setActiveChat } = useChatStore();
  const { setView } = useUIStore();

  const results = query.trim().length >= 1 ? searchUsers(query) : [];

  const handleStartChat = (targetId: string) => {
    if (!currentAccount) return;
    if (targetId === currentAccount.id) return;

    // Check if direct chat already exists
    const existing = chats.find(
      c =>
        c.type === 'direct' &&
        c.members.some(m => m.userId === currentAccount.id) &&
        c.members.some(m => m.userId === targetId)
    );

    if (existing) {
      setActiveChat(existing.id);
    } else {
      const targetUser = results.find(u => u.id === targetId);
      const chat = createChat('direct', targetUser?.displayName || 'Чат', [currentAccount.id, targetId], currentAccount.id);
      setActiveChat(chat.id);
    }

    onClose();
    setView('chat');
  };

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-all"
        >
          ←
        </button>
        <h2 className="font-semibold text-white">Поиск людей</h2>
      </div>

      {/* Search input */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Поиск по нику или имени..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 border border-white/8 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#6C63FF]/40 transition-all"
        />
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {query.trim() && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-white/20">
            <span className="text-4xl mb-3">🔍</span>
            <p className="text-sm">Пользователи не найдены</p>
            <p className="text-xs mt-1">Попробуй другой запрос</p>
          </div>
        )}

        {!query.trim() && (
          <div className="flex flex-col items-center justify-center py-12 text-white/20">
            <span className="text-4xl mb-3">👥</span>
            <p className="text-sm">Найди любого пользователя</p>
            <p className="text-xs mt-1 text-center max-w-[200px]">
              Напиши прямо без заявок — как в Telegram
            </p>
          </div>
        )}

        {results.map(user => (
          <div
            key={user.id}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/4 border border-transparent hover:border-white/5 transition-all"
          >
            <Avatar
              src={user.avatar}
              name={user.displayName}
              size={44}
              online={user.isOnline}
              isPremium={user.isPremium}
              liveEmoji={user.liveEmoji}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white text-sm">{user.displayName}</span>
                {user.isVerified && <VerifiedBadge size={13} />}
                {user.isScam && <ScamLabel compact />}
                {user.isPremium && <span className="text-[10px] text-yellow-400">⭐</span>}
              </div>
              <p className="text-xs text-white/35">@{user.username}</p>
              {user.bio && (
                <p className="text-xs text-white/25 truncate mt-0.5">{user.bio}</p>
              )}
            </div>
            {user.id !== currentAccount?.id && (
              <button
                onClick={() => handleStartChat(user.id)}
                className="px-3 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)',
                  fontSize: '12px',
                }}
              >
                Написать
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
