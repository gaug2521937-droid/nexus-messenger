import { useState } from 'react';
import { Logo } from '../Common/Logo';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useChatStore } from '../../store/chatStore';
import { useUserStore } from '../../store/userStore';
import { useStickerStore } from '../../store/stickerStore';
import toast from 'react-hot-toast';

type AuthMode = 'login' | 'register';

export function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, register } = useAuthStore();
  const { setView } = useUIStore();
  const { initializeDemoData } = useChatStore();
  const { initUsers } = useUserStore();
  const { initDefaultPacks } = useStickerStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (mode === 'register' && password !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      let account;
      if (mode === 'login') {
        account = await login(username, password);
      } else {
        account = await register(username, displayName || username, password);
      }
      
      initUsers();
      initDefaultPacks();
      initializeDemoData(account.id);
      
      toast.success(`Добро пожаловать, ${account.displayName}!`);
      setView('chat');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка авторизации';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (user: 'admin' | 'alice' | 'bob') => {
    const creds = {
      admin: { username: 'admin', password: 'admin123' },
      alice: { username: 'alice', password: 'alice123' },
      bob: { username: 'bob', password: 'bob123' },
    };
    setUsername(creds[user].username);
    setPassword(creds[user].password);
    setMode('login');
  };

  return (
    <div
      className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(108,99,255,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Back to landing */}
        <button
          onClick={() => setView('landing')}
          className="mb-6 flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          ← Назад
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size={48} />
        </div>

        {/* Card */}
        <div
          className="p-8 rounded-3xl border border-white/8"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-2xl p-1 mb-8">
            {(['login', 'register'] as AuthMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-[#6C63FF] text-white shadow-lg'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {m === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-white/40 mb-1.5 font-medium uppercase tracking-wider">
                Имя пользователя
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="nexus_user"
                required
                autoComplete="username"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#6C63FF]/50 focus:bg-white/8 transition-all"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs text-white/40 mb-1.5 font-medium uppercase tracking-wider">
                  Отображаемое имя
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Иван Иванов"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#6C63FF]/50 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-white/40 mb-1.5 font-medium uppercase tracking-wider">
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#6C63FF]/50 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-lg"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs text-white/40 mb-1.5 font-medium uppercase tracking-wider">
                  Повторите пароль
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#6C63FF]/50 transition-all"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              style={{
                background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)',
                boxShadow: '0 4px 20px rgba(108,99,255,0.4)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'login' ? 'Входим...' : 'Регистрируем...'}
                </span>
              ) : mode === 'login' ? (
                'Войти в NEXUS'
              ) : (
                'Создать аккаунт'
              )}
            </button>
          </form>

          {/* Demo accounts */}
          {mode === 'login' && (
            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-xs text-white/30 text-center mb-3">Демо аккаунты</p>
              <div className="flex gap-2">
                {[
                  { key: 'admin' as const, label: '🛡 Admin', color: '#6C63FF' },
                  { key: 'alice' as const, label: '⭐ Alice', color: '#EC4899' },
                  { key: 'bob' as const, label: '👤 Bob', color: '#10B981' },
                ].map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => fillDemo(key)}
                    className="flex-1 py-2 rounded-xl text-xs font-medium border border-white/8 hover:border-white/20 text-white/50 hover:text-white/80 transition-all"
                    style={{ borderColor: `${color}30` }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {mode === 'login' && (
          <p className="text-center text-xs text-white/20 mt-4">
            Нет аккаунта?{' '}
            <button
              onClick={() => setMode('register')}
              className="text-[#6C63FF] hover:text-[#8B5CF6] transition-colors"
            >
              Зарегистрироваться
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
