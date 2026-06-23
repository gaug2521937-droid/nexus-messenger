import { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { Avatar } from '../Common/Avatar';
import toast from 'react-hot-toast';

interface NewChatModalProps {
  onClose: () => void;
}

type ChatCreationType = 'direct' | 'group' | 'channel';

export function NewChatModal({ onClose }: NewChatModalProps) {
  const [type, setType] = useState<ChatCreationType>('group');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const { createChat, setActiveChat } = useChatStore();
  const { currentAccount } = useAuthStore();
  const { allUsers, searchUsers } = useUserStore();

  const userId = currentAccount?.id || '';
  const maxMembers = currentAccount?.isPremium ? 2000 : 200;

  const searchResults = search.trim() ? searchUsers(search) : allUsers.filter(u => u.id !== userId);

  const toggleUser = (uid: string) => {
    setSelectedUsers(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleCreate = () => {
    if (!name.trim() && type !== 'direct') {
      toast.error('Введите название');
      return;
    }
    if (selectedUsers.length === 0) {
      toast.error('Выберите хотя бы одного участника');
      return;
    }
    if (selectedUsers.length > maxMembers) {
      toast.error(`Максимум ${maxMembers} участников`);
      return;
    }

    const members = [userId, ...selectedUsers];
    let chatName = name.trim();

    if (type === 'direct') {
      const other = allUsers.find(u => u.id === selectedUsers[0]);
      chatName = other?.displayName || 'Чат';
    }

    const chat = createChat(type, chatName, members, userId);

    if (description && type !== 'direct') {
      // Would update chat description in a real app
    }

    setActiveChat(chat.id);
    onClose();
    toast.success(
      type === 'direct' ? 'Чат создан' : type === 'group' ? 'Группа создана' : 'Канал создан'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1A1A2E] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="font-bold text-white">Новый чат</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 text-xl">×</button>
        </div>

        {/* Type selector */}
        <div className="flex gap-2 p-4 border-b border-white/5">
          {[
            { key: 'direct' as const, icon: '💬', label: 'Диалог' },
            { key: 'group' as const, icon: '👥', label: 'Группа' },
            { key: 'channel' as const, icon: '📢', label: 'Канал' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border text-xs font-medium transition-all ${
                type === t.key
                  ? 'border-[#6C63FF] bg-[#6C63FF]/10 text-[#6C63FF]'
                  : 'border-white/8 text-white/40 hover:border-white/20 hover:text-white/70'
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {/* Name */}
          {type !== 'direct' && (
            <>
              <input
                type="text"
                placeholder={type === 'group' ? 'Название группы' : 'Название канала'}
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#6C63FF]/40"
              />
              <input
                type="text"
                placeholder="Описание (необязательно)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#6C63FF]/40"
              />
            </>
          )}

          {/* User search */}
          <input
            type="text"
            placeholder="Поиск участников..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#6C63FF]/40"
          />

          {/* Selected users */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(uid => {
                const user = allUsers.find(u => u.id === uid);
                if (!user) return null;
                return (
                  <button
                    key={uid}
                    onClick={() => toggleUser(uid)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#6C63FF]/20 border border-[#6C63FF]/30 text-xs text-[#6C63FF]"
                  >
                    <Avatar src={user.avatar} name={user.displayName} size={18} />
                    {user.displayName}
                    <span>×</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* User list */}
          <div className="space-y-1">
            {searchResults.map(user => (
              <button
                key={user.id}
                onClick={() => {
                  if (type === 'direct') {
                    setSelectedUsers([user.id]);
                  } else {
                    toggleUser(user.id);
                  }
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  selectedUsers.includes(user.id)
                    ? 'bg-[#6C63FF]/10 border border-[#6C63FF]/20'
                    : 'hover:bg-white/4 border border-transparent'
                }`}
              >
                <Avatar src={user.avatar} name={user.displayName} size={36} online={user.isOnline} />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white/90">{user.displayName}</p>
                  <p className="text-xs text-white/35">@{user.username}</p>
                </div>
                {selectedUsers.includes(user.id) && (
                  <span className="w-5 h-5 rounded-full bg-[#6C63FF] flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-white/8">
          <button
            onClick={handleCreate}
            disabled={selectedUsers.length === 0}
            className="w-full py-3 rounded-2xl font-semibold text-sm text-white transition-all disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' }}
          >
            {type === 'direct' ? '💬 Начать диалог' : type === 'group' ? '👥 Создать группу' : '📢 Создать канал'}
          </button>
        </div>
      </div>
    </div>
  );
}
