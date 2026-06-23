import { useState } from 'react';
import { Logo } from '../Common/Logo';
import { useUIStore } from '../../store/uiStore';

const features = [
  {
    icon: '⚡',
    title: 'Мгновенная доставка',
    desc: 'WebSocket с подтверждением каждого сообщения. Автоматическое переподключение и хранение офлайн-сообщений.',
  },
  {
    icon: '🎙️',
    title: 'Голосовые сообщения',
    desc: 'Запись с визуализацией волн. Распознавание голоса в текст через Whisper AI.',
  },
  {
    icon: '⭕',
    title: 'Видеокружки',
    desc: 'Круглые видеосообщения до 60 секунд. Как в Telegram — только лучше.',
  },
  {
    icon: '🤖',
    title: 'ИИ-ассистент',
    desc: 'Умный ассистент на базе Llama 3.3. Исправление текста, перевод, улучшение стиля.',
  },
  {
    icon: '🎭',
    title: 'Стикеры и эмодзи',
    desc: 'Создавай стикеры из фото. Живые анимированные эмодзи для премиум-пользователей.',
  },
  {
    icon: '🔒',
    title: 'Безопасность',
    desc: 'Двухфакторная аутентификация, управление сессиями, тонкие настройки приватности.',
  },
  {
    icon: '👥',
    title: 'Мультиаккаунтинг',
    desc: 'Несколько аккаунтов с мгновенным переключением. Полная изоляция данных.',
  },
  {
    icon: '👑',
    title: 'Премиум',
    desc: 'Файлы до 100 МБ, безлимитный ИИ, эксклюзивные стикеры и живые эмодзи.',
  },
];

const stats = [
  { value: '10M+', label: 'Пользователей' },
  { value: '99.9%', label: 'Uptime' },
  { value: '< 50ms', label: 'Задержка' },
  { value: '256-bit', label: 'Шифрование' },
];

export function Landing() {
  const { setView } = useUIStore();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div
      className="min-h-screen bg-[#0A0A0F] text-white overflow-x-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5">
        <Logo size={36} />
        <nav className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#features" className="hover:text-white transition-colors">Возможности</a>
          <a href="#premium" className="hover:text-white transition-colors">Премиум</a>
          <a href="#security" className="hover:text-white transition-colors">Безопасность</a>
        </nav>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('auth')}
            className="px-4 py-2 text-sm text-white/80 hover:text-white transition-colors rounded-xl hover:bg-white/5"
          >
            Войти
          </button>
          <button
            onClick={() => setView('auth')}
            className="px-5 py-2 text-sm font-semibold rounded-xl transition-all"
            style={{
              background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)',
              boxShadow: '0 4px 20px rgba(108,99,255,0.3)',
            }}
          >
            Начать бесплатно
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center pt-20">
        {/* Background gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(108,99,255,0.15) 0%, transparent 70%)',
          }}
        />

        {/* Floating orbs */}
        <div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)',
            animation: 'float 6s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite reverse',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#6C63FF]/30 bg-[#6C63FF]/10 text-sm text-[#A78BFA] mb-8">
            <span className="w-2 h-2 rounded-full bg-[#6C63FF] animate-pulse" />
            Версия 2.0 — уже доступна
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
            Мессенджер нового{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #6C63FF, #A855F7, #EC4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              поколения
            </span>
          </h1>

          <p className="text-xl text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed">
            NEXUS объединяет мгновенный обмен сообщениями, ИИ-ассистента, голосовые сообщения,
            видеокружки и умные стикеры в одном продукте.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setView('auth')}
              className="w-full sm:w-auto px-8 py-4 text-base font-bold rounded-2xl transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)',
                boxShadow: '0 8px 32px rgba(108,99,255,0.4)',
              }}
            >
              Начать бесплатно →
            </button>
            <button
              onClick={() => setView('auth')}
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold rounded-2xl border border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition-all"
            >
              Уже есть аккаунт
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
            {stats.map(stat => (
              <div key={stat.label} className="text-center">
                <div
                  className="text-2xl md:text-3xl font-black mb-1"
                  style={{
                    background: 'linear-gradient(135deg, #6C63FF, #A855F7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {stat.value}
                </div>
                <div className="text-sm text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20 text-xs">
          <span>Прокрути вниз</span>
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-2">
            <div
              className="w-1 h-2 rounded-full bg-white/40"
              style={{ animation: 'scrollDot 2s ease-in-out infinite' }}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Всё что нужно{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #6C63FF, #A855F7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              в одном месте
            </span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Никаких компромиссов. NEXUS создан для людей, которые ценят качество.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="relative p-6 rounded-2xl border transition-all duration-300 cursor-default"
              style={{
                background:
                  hoveredFeature === i
                    ? 'rgba(108,99,255,0.1)'
                    : 'rgba(255,255,255,0.03)',
                borderColor:
                  hoveredFeature === i ? 'rgba(108,99,255,0.4)' : 'rgba(255,255,255,0.06)',
                transform: hoveredFeature === i ? 'translateY(-4px)' : 'none',
              }}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-base mb-2 text-white">{f.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Premium section */}
      <section
        id="premium"
        className="py-24 px-6"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(108,99,255,0.08) 0%, transparent 70%)',
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 text-sm text-yellow-400 mb-8">
            ⭐ Премиум доступ
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Разблокируй полный{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #F59E0B, #F97316)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              потенциал
            </span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              { icon: '🤖', title: 'Безлимитный ИИ', desc: 'Без ограничений на запросы' },
              { icon: '📁', title: 'Файлы до 100 МБ', desc: 'Против 20 МБ на бесплатном' },
              { icon: '👥', title: 'Группы до 2000', desc: 'Против 200 участников' },
              { icon: '🎭', title: 'Живые эмодзи', desc: 'Анимированные из видео' },
              { icon: '🎨', title: 'Эксклюзивные стикеры', desc: 'Премиум наборы' },
              { icon: '⭐', title: 'Эмодзи у ника', desc: 'Живое эмодзи перед именем' },
            ].map((item, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-yellow-400/10 bg-yellow-400/5 text-center"
              >
                <div className="text-2xl mb-3">{item.icon}</div>
                <div className="font-semibold text-sm text-white mb-1">{item.title}</div>
                <div className="text-xs text-white/40">{item.desc}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setView('auth')}
            className="mt-10 px-8 py-4 text-base font-bold rounded-2xl transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #F59E0B, #F97316)',
              boxShadow: '0 8px 32px rgba(245,158,11,0.3)',
            }}
          >
            Попробовать Премиум
          </button>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-24 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-black mb-4">
          Безопасность — это{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            приоритет
          </span>
        </h2>
        <p className="text-white/40 mb-12">
          256-битное шифрование, 2FA, управление сессиями, тонкие настройки приватности.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {['🔐 256-bit AES', '🔑 2FA', '📱 Управление сессиями', '👁 Настройки приватности', '🛡 Anti-spam', '⚡ E2E шифрование'].map(item => (
            <span
              key={item}
              className="px-4 py-2 rounded-full border border-white/10 text-sm text-white/60"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div
          className="max-w-3xl mx-auto p-12 rounded-3xl border border-[#6C63FF]/20"
          style={{ background: 'rgba(108,99,255,0.05)' }}
        >
          <Logo size={60} className="justify-center mb-6" />
          <h2 className="text-4xl font-black mb-4">Готов начать?</h2>
          <p className="text-white/40 mb-8">Присоединяйся к миллионам пользователей NEXUS</p>
          <button
            onClick={() => setView('auth')}
            className="px-10 py-4 text-lg font-bold rounded-2xl transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)',
              boxShadow: '0 8px 32px rgba(108,99,255,0.4)',
            }}
          >
            Начать бесплатно →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size={28} />
          <p className="text-white/30 text-sm">
            © 2025 NEXUS Messenger. Все права защищены.
          </p>
          <div className="flex gap-6 text-sm text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">Конфиденциальность</a>
            <a href="#" className="hover:text-white/60 transition-colors">Условия</a>
            <a href="#" className="hover:text-white/60 transition-colors">Поддержка</a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes scrollDot {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(8px); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
