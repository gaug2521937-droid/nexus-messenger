import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useChatStore } from '../../store/chatStore';
import { useUIStore } from '../../store/uiStore';
import { Avatar } from '../Common/Avatar';
import { VerifiedBadge } from '../Common/VerifiedBadge';
import { ScamLabel } from '../Common/ScamLabel';
import toast from 'react-hot-toast';

type AdminTab = 'users' | 'chats' | 'support' | 'verification' | 'logs';

const TABS = [
  { key: 'users' as AdminTab, icon: '👥', label: 'Пользователи' },
  { key: 'chats' as AdminTab, icon: '💬', label: 'Чаты / Каналы' },
  { key: 'support' as AdminTab, icon: '🛡', label: 'Саппорт' },
  { key: 'verification' as AdminTab, icon: '✅', label: 'Верификация' },
  { key: 'logs' as AdminTab, icon: '📋', label: 'Логи' },
];

const FAKE_LOGS = [
  { time: '14:23:01', event: 'Вход пользователя alice', level: 'info' },
  { time: '14:22:15', event: 'Новое сообщение в группе "NEXUS Team"', level: 'info' },
  { time: '14:20:00', event: 'Регистрация нового пользователя: newuser123', level: 'success' },
  { time: '14:18:43', event: 'Попытка входа с неверным паролем: unknown', level: 'warning' },
  { time: '14:15:11', event: 'Файл загружен: document.pdf (5.2 МБ)', level: 'info' },
  { time: '14:10:00', event: 'Сервер запущен успешно', level: 'success' },
  { time: '14:09:58', event: 'WebSocket подключение установлено', level: 'info' },
];

export function AdminPanel() {
  const { currentAccount } = useAuthStore();
  const { allUsers, setScam, setSupportRole, updateUser } = useUserStore();
  const { chats, updateChat } = useChatStore();
  const { setView } = useUIStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [scamModal, setScamModal] = useState<{ show: boolean; userId: string; desc: string }>({
    show: false, userId: '', desc: '',
  });
  const [supportModal, setSupportModal] = useState<{ show: boolean; userId: string; role: string }>({
    show: false, userId: '', role: 'moderator',
  });
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentAccount?.isAdmin) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0A0A0F] text-white/40">
        <div className="text-center">
          <span className="text-4xl mb-4 block">🚫</span>
          <p>Доступ запрещён</p>
        </div>
      </div>
    );
  }

  const filteredUsers = allUsers.filter(
    u =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'Пользователей', value: allUsers.length, icon: '👥' },
    { label: 'Чатов', value: chats.filter(c => c.type === 'direct').length, icon: '💬' },
    { label: 'Групп', value: chats.filter(c => c.type === 'group').length, icon: '👥' },
    { label: 'Онлайн', value: 2, icon: '🟢' },
  ];

  return (
    <div className="flex h-full bg-[#0A0A0F]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <div className="w-60 flex-shrink-0 bg-[#0F0F1A] border-r border-white/5 flex flex-col">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
          <button
            onClick={() => setView('chat')}
            className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70"
          >
            ←
          </button>
          <div>
            <h1 className="font-bold text-white text-sm">Админ-панель</h1>
            <p className="text-xs text-white/30">NEXUS Control</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 p-3 border-b border-white/5">
          {stats.map(s => (
            <div key={s.label} className="p-2 rounded-xl bg-white/3 text-center">
              <p className="text-lg font-bold text-white">{s.value}</p>
              <p className="text-[10px] text-white/30">{s.label}</p>
            </div>
          ))}
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                activeTab === tab.key
                  ? 'bg-[#6C63FF]/15 text-white border border-[#6C63FF]/20'
                  : 'text-white/50 hover:bg-white/4 hover:text-white/80'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0A0A0F]/90 backdrop-blur-sm border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-bold text-white text-base">
            {TABS.find(t => t.key === activeTab)?.icon} {TABS.find(t => t.key === activeTab)?.label}
          </h2>
          {(activeTab === 'users' || activeTab === 'chats') && (
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-white text-sm placeholder-white/20 focus:outline-none w-48"
            />
          )}
        </div>

        <div className="p-6">
          {/* Users tab */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              {filteredUsers.length === 0 ? (
                <p className="text-white/30 text-center py-8">Пользователи не найдены</p>
              ) : (
                filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/3 border border-white/5 hover:border-white/10 transition-all"
                  >
                    <Avatar src={user.avatar} name={user.displayName} size={44} online={user.isOnline} isPremium={user.isPremium} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">{user.displayName}</span>
                        {user.isVerified && <VerifiedBadge size={13} />}
                        {user.isScam && <ScamLabel compact />}
                        {user.isPremium && <span className="text-[10px] text-yellow-400">⭐ Премиум</span>}
                        {user.isAdmin && <span className="text-[10px] text-[#6C63FF]">🛡 Админ</span>}
                        {user.supportRole && (
                          <span className="text-[10px] text-green-400">{user.supportRole}</span>
                        )}
                      </div>
                      <p className="text-xs text-white/40">@{user.username}</p>
                    </div>
                    <div className="flex gap-2">
                      {!user.isScam && !user.isAdmin && (
                        <button
                          onClick={() => setScamModal({ show: true, userId: user.id, desc: '' })}
                          className="px-2.5 py-1.5 rounded-xl bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-all"
                        >
                          ⚠️ SCAM
                        </button>
                      )}
                      <button
                        onClick={() => setSupportModal({ show: true, userId: user.id, role: 'moderator' })}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 text-xs hover:bg-blue-500/20 transition-all"
                      >
                        🛡 Роль
                      </button>
                      {!user.isPremium && (
                        <button
                          onClick={() => { updateUser(user.id, { isPremium: true }); toast.success('Премиум выдан'); }}
                          className="px-2.5 py-1.5 rounded-xl bg-yellow-500/10 text-yellow-400 text-xs hover:bg-yellow-500/20 transition-all"
                        >
                          ⭐ Премиум
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Chats tab */}
          {activeTab === 'chats' && (
            <div className="space-y-3">
              {chats
                .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(chat => (
                  <div
                    key={chat.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/3 border border-white/5"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ background: 'rgba(108,99,255,0.2)' }}
                    >
                      {chat.type === 'group' ? '👥' : chat.type === 'channel' ? '📢' : '💬'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{chat.name}</span>
                        {chat.isVerified && <VerifiedBadge size={13} />}
                        {chat.isScam && <ScamLabel compact />}
                      </div>
                      <p className="text-xs text-white/40">
                        {chat.type} · {chat.members.length} участников
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!chat.isVerified && chat.type !== 'direct' && (
                        <button
                          onClick={() => { updateChat(chat.id, { isVerified: true }); toast.success('Верифицирован'); }}
                          className="px-2.5 py-1.5 rounded-xl bg-green-500/10 text-green-400 text-xs"
                        >
                          ✅ Верифицировать
                        </button>
                      )}
                      {!chat.isScam && (
                        <button
                          onClick={() => { updateChat(chat.id, { isScam: true, scamDescription: 'Спам/Мошенничество' }); toast.success('SCAM метка добавлена'); }}
                          className="px-2.5 py-1.5 rounded-xl bg-red-500/10 text-red-400 text-xs"
                        >
                          ⚠️ SCAM
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Support tab */}
          {activeTab === 'support' && (
            <div className="space-y-4">
              <p className="text-sm text-white/40">Команда поддержки NEXUS</p>
              {allUsers.filter(u => u.supportRole).map(user => (
                <div key={user.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/3 border border-white/5">
                  <Avatar src={user.avatar} name={user.displayName} size={40} />
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">{user.displayName}</p>
                    <p className="text-xs text-white/40">@{user.username}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                    user.supportRole === 'creator'
                      ? 'bg-[#6C63FF]/20 text-[#6C63FF]'
                      : user.supportRole === 'administrator'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {user.supportRole}
                  </span>
                </div>
              ))}
              {allUsers.filter(u => u.supportRole).length === 0 && (
                <p className="text-white/30 text-center py-8">Нет сотрудников поддержки</p>
              )}
            </div>
          )}

          {/* Verification tab */}
          {activeTab === 'verification' && (
            <div className="space-y-4">
              <p className="text-sm text-white/40">Заявки на верификацию</p>
              {chats.filter(c => c.verificationPending).map(chat => (
                <div key={chat.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/3 border border-[#6C63FF]/20">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg">📢</div>
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">{chat.name}</p>
                    <p className="text-xs text-white/40">{chat.members.length} подписчиков</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { updateChat(chat.id, { isVerified: true, verificationPending: false }); toast.success('Верифицирован!'); }}
                      className="px-3 py-1.5 rounded-xl bg-green-500/20 text-green-400 text-xs font-medium"
                    >
                      ✅ Одобрить
                    </button>
                    <button
                      onClick={() => { updateChat(chat.id, { verificationPending: false }); toast.error('Заявка отклонена'); }}
                      className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 text-xs"
                    >
                      ✕ Отклонить
                    </button>
                  </div>
                </div>
              ))}
              {chats.filter(c => c.verificationPending).length === 0 && (
                <div className="text-center py-8">
                  <span className="text-3xl block mb-2">✅</span>
                  <p className="text-white/30 text-sm">Нет активных заявок</p>
                </div>
              )}
            </div>
          )}

          {/* Logs tab */}
          {activeTab === 'logs' && (
            <div className="space-y-2">
              {FAKE_LOGS.map((log, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/2 border border-white/4 font-mono text-xs"
                >
                  <span className="text-white/30 flex-shrink-0">{log.time}</span>
                  <span
                    className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      log.level === 'success'
                        ? 'bg-green-500/20 text-green-400'
                        : log.level === 'warning'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {log.level.toUpperCase()}
                  </span>
                  <span className="text-white/60">{log.event}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SCAM Modal */}
      {scamModal.show && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-white mb-4">⚠️ Добавить метку SCAM</h3>
            <p className="text-xs text-white/40 mb-3">Описание метки нельзя будет удалить</p>
            <textarea
              value={scamModal.desc}
              onChange={e => setScamModal(m => ({ ...m, desc: e.target.value }))}
              placeholder="Причина (например: мошенничество, спам...)"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white text-sm placeholder-white/20 focus:outline-none resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!scamModal.desc.trim()) { toast.error('Укажите причину'); return; }
                  setScam(scamModal.userId, scamModal.desc);
                  setScamModal({ show: false, userId: '', desc: '' });
                  toast.success('Метка SCAM добавлена');
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold"
              >
                Подтвердить
              </button>
              <button
                onClick={() => setScamModal({ show: false, userId: '', desc: '' })}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Role Modal */}
      {supportModal.show && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-white mb-4">🛡 Назначить роль</h3>
            <div className="space-y-2 mb-4">
              {(['moderator', 'administrator', 'creator'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setSupportModal(m => ({ ...m, role }))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-sm transition-all ${
                    supportModal.role === role
                      ? 'border-[#6C63FF] bg-[#6C63FF]/10 text-white'
                      : 'border-white/8 text-white/50 hover:border-white/20'
                  }`}
                >
                  <span>{role === 'moderator' ? '🛡' : role === 'administrator' ? '⚙️' : '👑'}</span>
                  <div className="text-left">
                    <p className="font-medium capitalize">{role}</p>
                    <p className="text-xs text-white/30">
                      {role === 'moderator' ? 'Бан/Мут' : role === 'administrator' ? 'Управление каналами' : 'Полные права'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSupportRole(supportModal.userId, supportModal.role as 'moderator' | 'administrator' | 'creator');
                  setSupportModal({ show: false, userId: '', role: 'moderator' });
                  toast.success('Роль назначена');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#6C63FF] text-white text-sm font-semibold"
              >
                Назначить
              </button>
              <button
                onClick={() => setSupportModal({ show: false, userId: '', role: 'moderator' })}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
