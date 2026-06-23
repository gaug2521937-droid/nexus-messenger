import { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { Avatar } from '../Common/Avatar';
import { VerifiedBadge } from '../Common/VerifiedBadge';
import { ScamLabel } from '../Common/ScamLabel';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ProfileProps {
  onClose: () => void;
}

export function Profile({ onClose }: ProfileProps) {
  const { activeChatId, chats } = useChatStore();
  const { currentAccount } = useAuthStore();
  const { getUserById } = useUserStore();
  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'members'>('info');

  const chat = chats.find(c => c.id === activeChatId);
  if (!chat) return null;

  const isGroup = chat.type === 'group';
  const otherMemberId =
    chat.type === 'direct'
      ? chat.members.find(m => m.userId !== currentAccount?.id)?.userId
      : null;
  const otherUser = otherMemberId ? getUserById(otherMemberId) : null;

  const name = isGroup ? chat.name : otherUser?.displayName || chat.name;
  const avatar = isGroup ? chat.avatar : otherUser?.avatar || chat.avatar;
  const isOnline = otherMemberId ? ['user-alice', 'admin-001'].includes(otherMemberId) : false;

  const formatLastSeen = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'd MMMM в HH:mm', { locale: ru });
    } catch { return ''; }
  };

  return (
    <div className="flex flex-col h-full bg-[#0F0F1A]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-all"
        >
          ←
        </button>
        <h2 className="font-semibold text-white text-sm">
          {isGroup ? 'Информация о группе' : 'Профиль'}
        </h2>
      </div>

      {/* Avatar section */}
      <div className="flex flex-col items-center py-6 px-4 border-b border-white/5">
        <Avatar
          src={avatar}
          name={name}
          size={80}
          online={!isGroup ? isOnline : undefined}
          isPremium={otherUser?.isPremium}
          liveEmoji={otherUser?.liveEmoji}
        />
        <div className="mt-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h3 className="font-bold text-white text-base">{name}</h3>
            {(chat.isVerified || otherUser?.isVerified) && <VerifiedBadge size={16} />}
            {otherUser?.isScam && <ScamLabel compact />}
          </div>
          {otherUser?.isPremium && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 text-xs mb-2">
              ⭐ Премиум
            </span>
          )}
          <p className="text-sm text-white/40">
            {isGroup
              ? `${chat.members.length} участников`
              : isOnline
              ? 'Онлайн'
              : otherUser?.lastSeen
              ? `Был(а) ${formatLastSeen(otherUser.lastSeen)}`
              : 'Не в сети'}
          </p>
          {otherUser?.isScam && otherUser.scamDescription && (
            <div className="mt-2">
              <ScamLabel description={otherUser.scamDescription} />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {[
          { key: 'info' as const, label: 'Инфо' },
          ...(isGroup ? [{ key: 'members' as const, label: 'Участники' }] : []),
          { key: 'media' as const, label: 'Медиа' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'text-[#6C63FF] border-b-2 border-[#6C63FF]'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'info' && (
          <div className="p-4 space-y-4">
            {!isGroup && otherUser && (
              <>
                <div>
                  <p className="text-xs text-white/30 mb-1">Никнейм</p>
                  <p className="text-sm text-white/80">@{otherUser.username}</p>
                </div>
                {otherUser.bio && (
                  <div>
                    <p className="text-xs text-white/30 mb-1">О себе</p>
                    <p className="text-sm text-white/80">{otherUser.bio}</p>
                  </div>
                )}
              </>
            )}
            {isGroup && chat.description && (
              <div>
                <p className="text-xs text-white/30 mb-1">Описание</p>
                <p className="text-sm text-white/80">{chat.description}</p>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white/60 hover:bg-white/8 transition-all">
                🔔 Без звука
              </button>
              <button className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 hover:bg-red-500/15 transition-all">
                🚫 Заблокировать
              </button>
            </div>
          </div>
        )}

        {activeTab === 'members' && isGroup && (
          <div className="p-4 space-y-2">
            {chat.members.map(member => {
              const user = getUserById(member.userId);
              if (!user) return null;
              return (
                <div key={member.userId} className="flex items-center gap-3 py-2">
                  <Avatar src={user.avatar} name={user.displayName} size={36} online={user.isOnline} isPremium={user.isPremium} />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-white/80">{user.displayName}</span>
                      {user.isVerified && <VerifiedBadge size={12} />}
                    </div>
                    <p className="text-xs text-white/30">@{user.username}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    member.role === 'owner'
                      ? 'text-yellow-400 bg-yellow-400/10'
                      : member.role === 'admin'
                      ? 'text-[#6C63FF] bg-[#6C63FF]/10'
                      : 'text-white/30'
                  }`}>
                    {member.role === 'owner' ? '👑' : member.role === 'admin' ? '⚙️' : ''}
                    {member.role}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'media' && (
          <div className="p-4">
            <p className="text-white/30 text-sm text-center py-8">📷 Медиафайлы появятся здесь</p>
          </div>
        )}
      </div>
    </div>
  );
}
