import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useUserStore } from '../../store/userStore';
import { Avatar } from '../Common/Avatar';
import { Logo } from '../Common/Logo';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'privacy' | 'notifications' | 'security' | 'theme' | 'accounts' | 'premium';

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: 'profile', icon: '👤', label: 'Профиль' },
  { key: 'privacy', icon: '🔒', label: 'Приватность' },
  { key: 'notifications', icon: '🔔', label: 'Уведомления' },
  { key: 'security', icon: '🛡', label: 'Безопасность' },
  { key: 'theme', icon: '🎨', label: 'Внешний вид' },
  { key: 'accounts', icon: '👥', label: 'Аккаунты' },
  { key: 'premium', icon: '⭐', label: 'Премиум' },
];

export function Settings() {
  const { currentAccount, accounts, logout, switchAccount, addAccount, removeAccount, updateAccount } = useAuthStore();
  const { setView, theme, setTheme } = useUIStore();
  const { updatePrivacy, updateNotifications, privacySettings, notificationSettings } = useUserStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [editProfile, setEditProfile] = useState(false);
  const [displayName, setDisplayName] = useState(currentAccount?.displayName || '');
  const [bio, setBio] = useState(currentAccount?.bio || '');
  const [addAccountForm, setAddAccountForm] = useState({ show: false, username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const userId = currentAccount?.id || '';
  const privacy = privacySettings[userId] || {
    whoCanSeeOnlineStatus: 'everyone',
    whoCanSeeAvatar: 'everyone',
    whoCanAddToGroups: 'everyone',
    whoCanSendMessages: 'everyone',
    readReceipts: true,
    twoFAEnabled: false,
  };
  const notifications = notificationSettings[userId] || {
    messagesEnabled: true,
    groupsEnabled: true,
    channelsEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  };

  const handleSaveProfile = () => {
    if (!currentAccount) return;
    updateAccount(currentAccount.id, { displayName, bio });
    setEditProfile(false);
    toast.success('Профиль обновлён');
  };

  const handleAddAccount = async () => {
    setLoading(true);
    try {
      const acc = await addAccount(addAccountForm.username, addAccountForm.password);
      switchAccount(acc.id);
      setAddAccountForm({ show: false, username: '', password: '' });
      toast.success(`Аккаунт ${acc.displayName} добавлен`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar
                  src={currentAccount?.avatar}
                  name={currentAccount?.displayName || 'User'}
                  size={80}
                  isPremium={currentAccount?.isPremium}
                />
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#6C63FF] flex items-center justify-center text-white text-sm shadow-lg">
                  📷
                </button>
              </div>
              <div className="text-center">
                <p className="font-semibold text-white">{currentAccount?.displayName}</p>
                <p className="text-sm text-white/40">@{currentAccount?.username}</p>
                {currentAccount?.isPremium && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 text-xs mt-1">
                    ⭐ Премиум
                  </span>
                )}
              </div>
            </div>

            {/* Edit form */}
            {editProfile ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Имя</label>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-[#6C63FF]/40"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">О себе</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-[#6C63FF]/40 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveProfile} className="flex-1 py-2.5 rounded-xl bg-[#6C63FF] text-white text-sm font-semibold">Сохранить</button>
                  <button onClick={() => setEditProfile(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm">Отмена</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Имя', value: currentAccount?.displayName },
                  { label: 'Никнейм', value: `@${currentAccount?.username}` },
                  { label: 'О себе', value: currentAccount?.bio || 'Не указано' },
                  { label: 'Email', value: currentAccount?.email || 'Не указан' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/5">
                    <div>
                      <p className="text-xs text-white/30 mb-0.5">{item.label}</p>
                      <p className="text-sm text-white/80">{item.value}</p>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setEditProfile(true)}
                  className="w-full py-3 rounded-2xl bg-white/5 border border-white/8 text-sm text-white/60 hover:bg-white/8 hover:text-white transition-all"
                >
                  ✏️ Редактировать профиль
                </button>
              </div>
            )}
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-4">
            {[
              { key: 'whoCanSeeOnlineStatus', label: 'Кто видит онлайн-статус' },
              { key: 'whoCanSeeAvatar', label: 'Кто видит аватарку' },
              { key: 'whoCanAddToGroups', label: 'Кто может добавлять в группы' },
              { key: 'whoCanSendMessages', label: 'Кто может писать сообщения' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-white/70">{item.label}</span>
                <select
                  value={privacy[item.key as keyof typeof privacy] as string}
                  onChange={e => updatePrivacy(userId, { [item.key]: e.target.value })}
                  className="bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="everyone">Все</option>
                  <option value="contacts">Контакты</option>
                  <option value="nobody">Никто</option>
                </select>
              </div>
            ))}
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-white/70">Уведомления о прочтении</span>
              <button
                onClick={() => updatePrivacy(userId, { readReceipts: !privacy.readReceipts })}
                className={`w-12 h-6 rounded-full transition-all ${privacy.readReceipts ? 'bg-[#6C63FF]' : 'bg-white/10'}`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${privacy.readReceipts ? 'translate-x-7' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            {[
              { key: 'messagesEnabled', label: '💬 Сообщения' },
              { key: 'groupsEnabled', label: '👥 Группы' },
              { key: 'channelsEnabled', label: '📢 Каналы' },
              { key: 'soundEnabled', label: '🔊 Звук' },
              { key: 'vibrationEnabled', label: '📳 Вибрация' },
              { key: 'quietHoursEnabled', label: '🌙 Тихие часы' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-white/70">{item.label}</span>
                <button
                  onClick={() => updateNotifications(userId, { [item.key]: !notifications[item.key as keyof typeof notifications] })}
                  className={`w-12 h-6 rounded-full transition-all ${notifications[item.key as keyof typeof notifications] ? 'bg-[#6C63FF]' : 'bg-white/10'}`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-7' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>
            ))}
            {notifications.quietHoursEnabled && (
              <div className="flex items-center gap-4 py-3">
                <div className="flex-1">
                  <p className="text-xs text-white/40 mb-1">Начало</p>
                  <input type="time" value={notifications.quietHoursStart}
                    onChange={e => updateNotifications(userId, { quietHoursStart: e.target.value })}
                    className="bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/40 mb-1">Конец</p>
                  <input type="time" value={notifications.quietHoursEnd}
                    onChange={e => updateNotifications(userId, { quietHoursEnd: e.target.value })}
                    className="bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/3 border border-white/5 space-y-3">
              <p className="font-semibold text-white text-sm">Смена пароля</p>
              {['Текущий пароль', 'Новый пароль', 'Подтвердите пароль'].map(placeholder => (
                <input
                  key={placeholder}
                  type="password"
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#6C63FF]/40"
                />
              ))}
              <button className="w-full py-2.5 rounded-xl bg-[#6C63FF] text-white text-sm font-semibold">
                Изменить пароль
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div>
                <p className="text-sm text-white/80">Двухфакторная аутентификация</p>
                <p className="text-xs text-white/30">Дополнительная защита аккаунта</p>
              </div>
              <button
                onClick={() => updatePrivacy(userId, { twoFAEnabled: !privacy.twoFAEnabled })}
                className={`w-12 h-6 rounded-full transition-all ${privacy.twoFAEnabled ? 'bg-[#6C63FF]' : 'bg-white/10'}`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${privacy.twoFAEnabled ? 'translate-x-7' : 'translate-x-0.5'}`}
                />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white/3 border border-white/5">
              <p className="font-semibold text-white text-sm mb-3">Активные сессии</p>
              {[
                { device: '💻 Windows Chrome', location: 'Москва, Россия', current: true },
                { device: '📱 iPhone Safari', location: 'Санкт-Петербург', current: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm text-white/80">{s.device}</p>
                    <p className="text-xs text-white/30">{s.location} {s.current && '· Текущая'}</p>
                  </div>
                  {!s.current && (
                    <button className="text-xs text-red-400 hover:text-red-300">Завершить</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'theme':
        return (
          <div className="space-y-4">
            <p className="text-xs text-white/30 uppercase tracking-wider">Тема оформления</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'dark' as const, label: '🌙 Тёмная', bg: '#0A0A0F', text: '#fff' },
                { key: 'light' as const, label: '☀️ Светлая', bg: '#F8F9FA', text: '#0A0A0F' },
                { key: 'system' as const, label: '⚙️ Системная', bg: 'linear-gradient(135deg, #0A0A0F, #F8F9FA)', text: '#fff' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTheme(t.key)}
                  className={`p-4 rounded-2xl border transition-all text-sm font-medium ${
                    theme === t.key
                      ? 'border-[#6C63FF] bg-[#6C63FF]/10 text-[#6C63FF]'
                      : 'border-white/8 text-white/50 hover:border-white/20 hover:text-white/80'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-xs text-white/30 uppercase tracking-wider mb-3">Цвет акцента</p>
              <div className="flex gap-3">
                {['#6C63FF', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'].map(c => (
                  <button
                    key={c}
                    className="w-9 h-9 rounded-full border-2 border-transparent hover:scale-110 transition-all"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'accounts':
        return (
          <div className="space-y-4">
            <p className="text-xs text-white/30 uppercase tracking-wider">Аккаунты</p>
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center gap-3 py-3 border-b border-white/5">
                <Avatar src={acc.avatar} name={acc.displayName} size={40} online={acc.id === currentAccount?.id} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{acc.displayName}</p>
                  <p className="text-xs text-white/40">@{acc.username}</p>
                </div>
                <div className="flex gap-2">
                  {acc.id !== currentAccount?.id && (
                    <button
                      onClick={() => switchAccount(acc.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#6C63FF]/20 text-[#6C63FF] text-xs font-medium"
                    >
                      Переключить
                    </button>
                  )}
                  {acc.id === currentAccount?.id && (
                    <span className="px-3 py-1.5 rounded-xl bg-green-500/10 text-green-400 text-xs">Активный</span>
                  )}
                  <button
                    onClick={() => { removeAccount(acc.id); if (acc.id === currentAccount?.id) setView('auth'); }}
                    className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 text-xs"
                  >
                    Выйти
                  </button>
                </div>
              </div>
            ))}

            {addAccountForm.show ? (
              <div className="space-y-3 p-4 rounded-2xl bg-white/3 border border-white/8">
                <p className="text-sm font-semibold text-white">Добавить аккаунт</p>
                <input
                  type="text"
                  placeholder="Никнейм"
                  value={addAccountForm.username}
                  onChange={e => setAddAccountForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/20 text-sm focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="Пароль"
                  value={addAccountForm.password}
                  onChange={e => setAddAccountForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/20 text-sm focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddAccount}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-[#6C63FF] text-white text-sm font-semibold disabled:opacity-50"
                  >
                    {loading ? 'Добавление...' : 'Добавить'}
                  </button>
                  <button
                    onClick={() => setAddAccountForm({ show: false, username: '', password: '' })}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddAccountForm(f => ({ ...f, show: true }))}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-white/10 text-white/40 text-sm hover:border-[#6C63FF]/40 hover:text-[#6C63FF] transition-all"
              >
                + Добавить аккаунт
              </button>
            )}
          </div>
        );

      case 'premium':
        return (
          <div className="space-y-4">
            {currentAccount?.isPremium ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-400/10 to-orange-400/10 border border-yellow-400/20 text-center">
                <span className="text-4xl">⭐</span>
                <p className="text-lg font-bold text-yellow-400 mt-2">NEXUS Премиум</p>
                <p className="text-sm text-white/50 mt-1">Активен навсегда</p>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#6C63FF]/10 to-purple-800/10 border border-[#6C63FF]/20 text-center">
                <Logo size={40} showText={false} className="justify-center mb-3" />
                <p className="text-base font-bold text-white">Перейди на Премиум</p>
                <p className="text-sm text-white/40 mt-1 mb-4">Безлимитный ИИ, файлы до 100 МБ, группы до 2000</p>
                <button
                  className="w-full py-3 rounded-xl font-bold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' }}
                >
                  Получить Премиум
                </button>
              </div>
            )}
            <div className="space-y-2">
              {[
                { icon: '🤖', title: 'Безлимитный ИИ', desc: 'Неограниченные запросы' },
                { icon: '📁', title: 'Файлы до 100 МБ', desc: 'Вместо 20 МБ' },
                { icon: '👥', title: 'Группы до 2000', desc: 'Вместо 200' },
                { icon: '🎭', title: 'Живые эмодзи', desc: 'Анимированные из видео' },
                { icon: '⭐', title: 'Эмодзи у ника', desc: 'Живое эмодзи перед именем' },
              ].map(item => (
                <div key={item.title} className="flex items-center gap-3 py-3 border-b border-white/5">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-white/80">{item.title}</p>
                    <p className="text-xs text-white/30">{item.desc}</p>
                  </div>
                  {currentAccount?.isPremium && (
                    <span className="ml-auto text-green-400 text-sm">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full bg-[#0A0A0F]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-[#0F0F1A] border-r border-white/5 flex flex-col">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
          <button
            onClick={() => setView('chat')}
            className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-all"
          >
            ←
          </button>
          <h1 className="font-bold text-white text-base">Настройки</h1>
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
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => { logout(); setView('auth'); }}
            className="w-full py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all border border-red-500/20"
          >
            🚪 Выйти
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="text-lg font-bold text-white mb-6">
          {TABS.find(t => t.key === activeTab)?.icon}{' '}
          {TABS.find(t => t.key === activeTab)?.label}
        </h2>
        {renderContent()}
      </div>
    </div>
  );
}
