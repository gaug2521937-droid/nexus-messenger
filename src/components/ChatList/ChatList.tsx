import { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { NewChatModal } from './NewChatModal';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useUserStore } from '../../store/userStore';
import { Avatar } from '../Common/Avatar';
import { Logo } from '../Common/Logo';
import { VerifiedBadge } from '../Common/VerifiedBadge';

import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export function ChatList() {
  const { chats, activeChatId, setActiveChat, messages } = useChatStore();
  const { currentAccount } = useAuthStore();
  const { setView, setRightPanel } = useUIStore();
  const { getUserById } = useUserStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'groups' | 'channels'>('all');
  const [showNewChat, setShowNewChat] = useState(false);

  const userId = currentAccount?.id || '';

  const getOtherUser = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat || chat.type !== 'direct') return null;
    const otherId = chat.members.find(m => m.userId !== userId)?.userId;
    if (!otherId) return null;
    return getUserById(otherId);
  };

  const filteredChats = chats
    .filter(c => !c.isArchived)
    .filter(c => {
      if (search) {
        return c.name.toLowerCase().includes(search.toLowerCase());
      }
      if (filter === 'unread') return c.unreadCount > 0;
      if (filter === 'groups') return c.type === 'group';
      if (filter === 'channels') return c.type === 'channel';
      return true;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const aTime = a.lastMessage?.createdAt || a.createdAt;
      const bTime = b.lastMessage?.createdAt || b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

  const totalUnread = chats.reduce((sum, c) => sum + c.unreadCount, 0);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: false, locale: ru });
    } catch {
      return '';
    }
  };

  const getLastMessagePreview = (chat: typeof chats[0]) => {
    const chatMessages = messages[chat.id] || [];
    const last = chatMessages[chatMessages.length - 1] || chat.lastMessage;
    if (!last) return '';
    if (last.isDeleted) return '🗑 Сообщение удалено';
    switch (last.type) {
      case 'image': return '🖼 Фото';
      case 'video': return '🎬 Видео';
      case 'audio': return '🎵 Аудио';
      case 'voice': return '🎙 Голосовое';
      case 'circle': return '⭕ Видеосообщение';
      case 'sticker': return '🎭 Стикер';
      case 'file': return `📄 ${last.fileName || 'Файл'}`;
      default: return last.text || '';
    }
  };

  const getChatIcon = (chat: typeof chats[0]) => {
    if (chat.type === 'bot') return '🤖';
    if (chat.type === 'channel') return '📢';
    if (chat.type === 'group') return null;
    return null;
  };

  const isOnline = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat || chat.type !== 'direct') return false;
    const otherId = chat.members.find(m => m.userId !== userId)?.userId;
    return otherId ? ['user-alice', 'admin-001'].includes(otherId) : false;
  };

  return (
    <div className="flex flex-col h-full bg-[#0F0F1A] border-r border-white/5">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <Logo size={32} />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setRightPanel('search')}
              className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-all"
              title="Поиск"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <button
              onClick={() => setView('settings')}
              className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-all"
              title="Настройки"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            {currentAccount?.isAdmin && (
              <button
                onClick={() => setView('admin')}
                className="p-2 rounded-xl hover:bg-white/5 text-[#6C63FF]/70 hover:text-[#6C63FF] transition-all"
                title="Админ-панель"
              >
                🛡
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            width="14"
            height="14"
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
            placeholder="Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white/80 placeholder-white/20 text-sm focus:outline-none focus:border-[#6C63FF]/30 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {[
            { key: 'all', label: `Все${totalUnread > 0 ? ` (${totalUnread})` : ''}` },
            { key: 'unread', label: 'Непрочитанные' },
            { key: 'groups', label: 'Группы' },
            { key: 'channels', label: 'Каналы' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filter === f.key
                  ? 'bg-[#6C63FF]/20 text-[#6C63FF] border border-[#6C63FF]/30'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto space-y-0.5 px-2 py-1">
        {filteredChats.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-white/20 text-sm">
            <span className="text-3xl mb-2">💬</span>
            Нет чатов
          </div>
        )}

        {filteredChats.map(chat => {
          const otherUser = getOtherUser(chat.id);
          const chatIcon = getChatIcon(chat);
          const preview = getLastMessagePreview(chat);
          const chatMessages = messages[chat.id] || [];
          const lastMsg = chatMessages[chatMessages.length - 1] || chat.lastMessage;
          const isActive = activeChatId === chat.id;
          const online = isOnline(chat.id);

          return (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-left ${
                isActive
                  ? 'bg-[#6C63FF]/15 border border-[#6C63FF]/20'
                  : 'hover:bg-white/4 border border-transparent'
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {chatIcon ? (
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                    style={{
                      background: chat.type === 'bot'
                        ? 'linear-gradient(135deg, #6C63FF, #8B5CF6)'
                        : chat.type === 'channel'
                        ? 'linear-gradient(135deg, #EC4899, #F43F5E)'
                        : 'linear-gradient(135deg, #10B981, #059669)',
                    }}
                  >
                    {chatIcon}
                  </div>
                ) : (
                  <Avatar
                    src={otherUser?.avatar || chat.avatar}
                    name={chat.name}
                    size={44}
                    online={chat.type === 'direct' ? online : undefined}
                    isPremium={otherUser?.isPremium || chat.isVerified}
                    liveEmoji={otherUser?.liveEmoji}
                  />
                )}
                {chat.isPinned && (
                  <span className="absolute -top-1 -right-1 text-[10px]">📌</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`font-semibold text-sm truncate ${
                        isActive ? 'text-white' : 'text-white/90'
                      }`}
                    >
                      {chat.name}
                    </span>
                    {chat.isVerified && <VerifiedBadge size={13} />}
                    {chat.isScam && <span className="text-[10px] text-red-400">⚠️</span>}
                    {otherUser?.isPremium && (
                      <span className="text-[10px] text-yellow-400">⭐</span>
                    )}
                  </div>
                  <span className="text-[10px] text-white/25 flex-shrink-0">
                    {formatTime(lastMsg?.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1">
                  <p
                    className={`text-xs truncate ${
                      chat.isMuted ? 'text-white/20' : 'text-white/35'
                    }`}
                  >
                    {/* Typing indicator */}
                    {preview || 'Нет сообщений'}
                  </p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {chat.isMuted && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-white/20">
                        <path d="M18.5 3.5l-15 15M5.5 5.5v13l5-4h4l-5-4V9.5" />
                      </svg>
                    )}
                    {chat.unreadCount > 0 && (
                      <span
                        className={`flex items-center justify-center rounded-full text-[10px] font-bold text-white min-w-[18px] h-[18px] px-1 ${
                          chat.isMuted ? 'bg-white/20' : 'bg-[#6C63FF]'
                        }`}
                      >
                        {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                      </span>
                    )}
                    {lastMsg?.senderId === userId && (
                      <span className="text-[10px] text-white/30">
                        {lastMsg.status === 'read' ? '✓✓' : lastMsg.status === 'delivered' ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom user info */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-t border-white/5 cursor-pointer hover:bg-white/3 transition-all"
        onClick={() => setView('settings')}
      >
        <Avatar
          src={currentAccount?.avatar || null}
          name={currentAccount?.displayName || 'User'}
          size={36}
          online={true}
          isPremium={currentAccount?.isPremium}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-white/90 truncate">
              {currentAccount?.displayName}
            </span>
            {currentAccount?.isPremium && (
              <span className="text-[10px] text-yellow-400">⭐</span>
            )}
            {currentAccount?.isAdmin && (
              <span className="text-[10px] text-[#6C63FF]">🛡</span>
            )}
          </div>
          <span className="text-xs text-white/30">@{currentAccount?.username}</span>
        </div>
        <div className="text-white/20">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
