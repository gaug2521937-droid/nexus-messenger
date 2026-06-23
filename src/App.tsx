import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useUIStore } from './store/uiStore';
import { useAuthStore } from './store/authStore';
import { Landing } from './components/Landing/Landing';
import { Auth } from './components/Auth/Auth';
import { ChatLayout } from './components/ChatLayout/ChatLayout';
import { Settings } from './components/Settings/Settings';
import { AdminPanel } from './components/AdminPanel/AdminPanel';

export default function App() {
  const { view, setView, theme } = useUIStore();
  const { isAuthenticated, currentAccount } = useAuthStore();

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark);

    if (isDark) {
      root.classList.add('dark');
      document.body.style.backgroundColor = '#0A0A0F';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#F8F9FA';
    }
  }, [theme]);

  // Redirect logic
  useEffect(() => {
    if (isAuthenticated && currentAccount) {
      if (view === 'landing' || view === 'auth') {
        setView('chat');
      }
    }
  }, [isAuthenticated, currentAccount]);

  const renderView = () => {
    switch (view) {
      case 'landing':
        return <Landing />;
      case 'auth':
        return <Auth />;
      case 'chat':
        return isAuthenticated ? <ChatLayout /> : <Auth />;
      case 'settings':
        return isAuthenticated ? <Settings /> : <Auth />;
      case 'admin':
        return isAuthenticated ? <AdminPanel /> : <Auth />;
      default:
        return <Landing />;
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {renderView()}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A1A2E',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '13px',
          },
          success: {
            iconTheme: { primary: '#6C63FF', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#fff' },
          },
        }}
      />
    </div>
  );
}
