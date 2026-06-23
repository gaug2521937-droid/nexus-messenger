import { useEffect, useRef, useState } from 'react';
import { useChatStore, Message } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useUIStore } from '../../store/uiStore';
import { chatWithAI } from '../../services/groqAI';
import { ws } from '../../services/websocket';
import { MessageBubble } from './Message';
import { MessageInput } from './MessageInput';
import { Avatar } from '../Common/Avatar';
import { VerifiedBadge } from '../Common/VerifiedBadge';
import { ScamLabel } from '../Common/ScamLabel';
import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';

interface DateSeparatorProps {
  date: string;
}

function DateSeparator({ date }: DateSeparatorProps) {
  const d = new Date(date);
  let label: string;
  if (isToday(d)) label = 'Сегодня';
  else if (isYesterday(d)) label = 'Вчера';
  else label = format(d, 'd MMMM yyyy', { locale: ru });

  return (
    <div className="flex items-center justify-center py-3">
      <span className="text-xs text-white/25 px-3 py-1 rounded-full bg-white/4 border border-white/5">
        {label}
      </span>
    </div>
  );
}

export function ChatWindow() {
  const { activeChatId, chats, messages, typingUsers, sendMessage, setActiveChat } = useChatStore();
  const { currentAccount } = useAuthStore();
  const { getUserById } = useUserStore();
  const { setRightPanel } = useUIStore();
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  const chat = chats.find(c => c.id === activeChatId);
  const chatMessages = activeChatId ? (messages[activeChatId] || []) : [];
  const chatTypingUsers = typingUsers.filter(t => t.chatId === activeChatId && t.userId !== currentAccount?.id);

  // Handle bot messages via WebSocket
  useEffect(() => {
    const handleBotReply = async (event: { type: string; payload: Record<string, unknown> }) => {
      if (event.type !== 'bot_reply') return;
      const { chatId, userText } = event.payload as { chatId: string; userText: string };
      if (chatId !== activeChatId) return;

      try {
        const chatHistory = (messages[chatId] || [])
          .filter(m => !m.aiGenerated || m.senderId !== 'bot-nexus-ai')
          .slice(-10)
          .map(m => ({
            role: m.senderId === 'bot-nexus-ai' ? 'assistant' as const : 'user' as const,
            content: m.text || '',
          }));

        chatHistory.push({ role: 'user', content: userText as string });

        const reply = await chatWithAI(chatHistory);
        sendMessage(chatId, 'bot-nexus-ai', {
          id: uuidv4(),
          type: 'text',
          text: reply,
          status: 'delivered',
          aiGenerated: true,
        });
      } catch {
        sendMessage(chatId, 'bot-nexus-ai', {
          id: uuidv4(),
          type: 'text',
          text: 'Извини, произошла ошибка. Попробуй позже.',
          status: 'delivered',
          aiGenerated: true,
        });
      }
    };

    ws.on('bot_reply', handleBotReply);
    return () => ws.off('bot_reply', handleBotReply);
  }, [activeChatId, messages, sendMessage]);

  // Auto scroll to bottom
  useEffect(() => {
    if (!isScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages.length, isScrolledUp]);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const diff = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsScrolledUp(diff > 100);
  };

  if (!activeChatId || !chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0A0A0F] gap-4">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(168,85,247,0.15))' }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(108,99,255,0.5)" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white/40 mb-1">NEXUS Messenger</h3>
          <p className="text-sm text-white/20">Выбери чат чтобы начать общение</p>
        </div>
        <div className="flex items-center gap-6 mt-4">
          {['💬', '🤖', '📢'].map(icon => (
            <div key={icon} className="flex flex-col items-center gap-1 text-white/15">
              <span className="text-2xl">{icon}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Get other user info for direct chats
  const otherMemberId = chat.type === 'direct'
    ? chat.members.find(m => m.userId !== currentAccount?.id)?.userId
    : null;
  const otherUser = otherMemberId ? getUserById(otherMemberId) : null;
  const isOnline = otherMemberId ? ['user-alice', 'admin-001'].includes(otherMemberId) : false;
  const isBot = chat.type === 'bot';

  // Group messages by date and sender
  const groupedMessages = chatMessages.reduce(
    (acc, msg, idx) => {
      const date = format(new Date(msg.createdAt), 'yyyy-MM-dd');
      const prev = chatMessages[idx - 1];
      const showDate = !prev || format(new Date(prev.createdAt), 'yyyy-MM-dd') !== date;
      const isGrouped = !showDate && prev && prev.senderId === msg.senderId &&
        new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() < 60000;

      acc.push({ msg, showDate, date, isGrouped });
      return acc;
    },
    [] as Array<{ msg: Message; showDate: boolean; date: string; isGrouped: boolean }>
  );

  const chatName =
    chat.type === 'direct' ? otherUser?.displayName || chat.name : chat.name;
  const chatAvatar =
    chat.type === 'direct' ? otherUser?.avatar || chat.avatar : chat.avatar;

  const memberCount = chat.members.length;

  return (
    <div className="flex flex-col h-full bg-[#0A0A0F]">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0F0F1A]"
        style={{ boxShadow: '0 1px 20px rgba(0,0,0,0.3)' }}
      >
        {/* Back button (mobile) */}
        <button
          onClick={() => setActiveChat(null)}
          className="md:hidden p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-all"
        >
          ←
        </button>

        {/* Avatar */}
        {isBot ? (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' }}
          >
            🤖
          </div>
        ) : (
          <Avatar
            src={chatAvatar}
            name={chatName}
            size={40}
            online={chat.type === 'direct' ? isOnline : undefined}
            isPremium={otherUser?.isPremium}
            liveEmoji={otherUser?.liveEmoji}
            onClick={() => setRightPanel('profile')}
            className="cursor-pointer"
          />
        )}

        {/* Info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setRightPanel('profile')}>
          <div className="flex items-center gap-1.5">
            <h2 className="font-semibold text-white text-sm truncate">{chatName}</h2>
            {chat.isVerified && <VerifiedBadge size={14} />}
            {otherUser?.isScam && <ScamLabel compact />}
            {otherUser?.isPremium && <span className="text-[10px] text-yellow-400">⭐</span>}
          </div>
          <p className="text-xs text-white/35">
            {chat.type === 'direct'
              ? chatTypingUsers.length > 0
                ? 'печатает...'
                : isOnline
                ? 'онлайн'
                : 'был(а) недавно'
              : chat.type === 'bot'
              ? 'ИИ ассистент'
              : `${memberCount} участник${memberCount === 1 ? '' : memberCount < 5 ? 'а' : 'ов'}`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-all">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
          <button className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-all">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-2"
        style={{
          backgroundImage: 'radial-gradient(ellipse at 50% 100%, rgba(108,99,255,0.03) 0%, transparent 70%)',
        }}
      >
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20">
            <span className="text-5xl">{isBot ? '🤖' : '💬'}</span>
            <p className="text-sm">
              {isBot
                ? 'Напиши мне что-нибудь!'
                : 'Начни диалог!'}
            </p>
          </div>
        )}

        {groupedMessages.map(({ msg, showDate, date, isGrouped }) => (
          <div key={msg.id}>
            {showDate && <DateSeparator date={date} />}
            <MessageBubble
              message={msg}
              chatId={activeChatId}
              showAvatar={chat.type !== 'direct'}
              isGrouped={isGrouped}
              onReply={setReplyTo}
            />
          </div>
        ))}

        {/* Typing indicator */}
        {chatTypingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-white/30"
                  style={{
                    animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-white/30">печатает...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {isScrolledUp && (
        <button
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-24 right-6 w-10 h-10 rounded-full bg-[#1A1A2E] border border-white/10 flex items-center justify-center text-white/60 hover:text-white shadow-2xl transition-all hover:scale-110"
        >
          ↓
        </button>
      )}

      {/* Input */}
      <MessageInput
        chatId={activeChatId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
