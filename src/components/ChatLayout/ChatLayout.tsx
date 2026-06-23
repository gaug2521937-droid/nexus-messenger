import { useEffect } from 'react';
import { ChatList } from '../ChatList/ChatList';
import { ChatWindow } from '../ChatWindow/ChatWindow';
import { Profile } from '../Profile/Profile';
import { Search } from '../Search/Search';
import { useUIStore } from '../../store/uiStore';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { ws } from '../../services/websocket';

export function ChatLayout() {
  const { rightPanelOpen, rightPanelContent, setRightPanel, isMobile, setMobile } = useUIStore();
  const { currentAccount } = useAuthStore();
  const { initializeDemoData } = useChatStore();
  const { initUsers } = useUserStore();
  const { activeChatId } = useChatStore();

  useEffect(() => {
    const checkMobile = () => setMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setMobile]);

  useEffect(() => {
    if (currentAccount) {
      ws.connect(currentAccount.id);
      initUsers();
      initializeDemoData(currentAccount.id);
    }
    return () => ws.disconnect();
  }, [currentAccount?.id]);

  const showSidebar = !isMobile || !activeChatId;
  const showChat = !isMobile || !!activeChatId;

  return (
    <div className="flex h-screen bg-[#0A0A0F] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Chat list sidebar */}
      {showSidebar && (
        <div className={`flex-shrink-0 ${isMobile ? 'w-full' : 'w-[320px]'}`}>
          <ChatList />
        </div>
      )}

      {/* Main chat area */}
      {showChat && (
        <div className="flex-1 min-w-0 relative">
          <ChatWindow />
        </div>
      )}

      {/* Right panel */}
      {rightPanelOpen && rightPanelContent && !isMobile && (
        <div className="w-[300px] flex-shrink-0 border-l border-white/5 overflow-y-auto">
          {rightPanelContent === 'profile' && (
            <Profile onClose={() => setRightPanel(null)} />
          )}
          {rightPanelContent === 'search' && (
            <Search onClose={() => setRightPanel(null)} />
          )}
        </div>
      )}

      {/* Mobile right panel overlay */}
      {rightPanelOpen && rightPanelContent && isMobile && (
        <div className="fixed inset-0 z-40 bg-[#0F0F1A]">
          {rightPanelContent === 'profile' && (
            <Profile onClose={() => setRightPanel(null)} />
          )}
          {rightPanelContent === 'search' && (
            <Search onClose={() => setRightPanel(null)} />
          )}
        </div>
      )}
    </div>
  );
}
