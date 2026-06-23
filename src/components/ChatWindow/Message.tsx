import { useState, useRef, useEffect } from 'react';
import { Message as MessageType } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useChatStore } from '../../store/chatStore';
import { Avatar } from '../Common/Avatar';
import { VerifiedBadge } from '../Common/VerifiedBadge';
import { PlaybackWave } from './VoiceWave';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface MessageProps {
  message: MessageType;
  chatId: string;
  showAvatar?: boolean;
  isGrouped?: boolean;
  onReply?: (msg: MessageType) => void;
}

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

function AudioPlayer({ src, duration, bars }: { src: string; duration?: number; bars: number[] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.onended = () => { setIsPlaying(false); setProgress(0); setCurrentTime(0); };
    audio.ontimeupdate = () => {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
        setCurrentTime(audio.currentTime);
      }
    };
    return () => audio.pause();
  }, [src]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (p: number) => {
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = p * audioRef.current.duration;
      setProgress(p);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-110"
        style={{ background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' }}
      >
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </button>
      <div className="flex flex-col gap-1">
        <PlaybackWave isPlaying={isPlaying} progress={progress} bars={bars} onSeek={handleSeek} />
        <span className="text-[10px] text-white/40">{fmt(currentTime)} / {fmt(duration || 0)}</span>
      </div>
    </div>
  );
}

function CirclePlayer({ src }: { src: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggle = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="relative w-[120px] h-[120px] cursor-pointer" onClick={toggle}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover rounded-full"
        loop
        onEnded={() => setIsPlaying(false)}
        playsInline
      />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        </div>
      )}
      <div
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: 'inset 0 0 0 3px rgba(108,99,255,0.5)' }}
      />
    </div>
  );
}

export function MessageBubble({ message, chatId, showAvatar = true, isGrouped = false, onReply }: MessageProps) {
  const { currentAccount } = useAuthStore();
  const { getUserById } = useUserStore();
  const { addReaction, editMessage, deleteMessage } = useChatStore();
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showVoiceText, setShowVoiceText] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || '');
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwn = message.senderId === currentAccount?.id;
  const sender = getUserById(message.senderId);
  const isBot = message.senderId === 'bot-nexus-ai' || message.senderId.startsWith('bot-');

  // Default wave bars for audio
  const defaultBars = Array.from({ length: 40 }, (_: unknown, i: number) =>
    0.3 + Math.sin(i * 0.5) * 0.3 + Math.random() * 0.2
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowReactions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-4 py-0.5`}>
        <span className="text-xs text-white/20 italic px-3 py-1">🗑 Сообщение удалено</span>
      </div>
    );
  }

  const handleEdit = () => {
    if (editText.trim() && editText !== message.text) {
      editMessage(chatId, message.id, editText.trim());
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  const formatTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'HH:mm', { locale: ru });
    } catch {
      return '';
    }
  };

  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="max-w-[280px]">
            <img
              src={message.mediaUrl}
              alt="Photo"
              className="rounded-xl w-full object-cover max-h-[300px] cursor-pointer hover:opacity-90 transition-opacity"
            />
            {message.text && (
              <p className="mt-2 text-sm text-white/90 leading-relaxed">{message.text}</p>
            )}
          </div>
        );

      case 'voice':
        return (
          <div className="flex flex-col gap-2 min-w-[200px]">
            {message.mediaUrl ? (
              <AudioPlayer
                src={message.mediaUrl}
                duration={message.duration}
                bars={defaultBars}
              />
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(108,99,255,0.3)' }}
                >
                  🎙
                </div>
                <span className="text-sm text-white/50">Голосовое сообщение</span>
              </div>
            )}
            {message.voiceText && (
              <div className={`text-xs text-white/60 px-1 leading-relaxed ${showVoiceText ? '' : 'hidden'}`}>
                "{message.voiceText}"
              </div>
            )}
            <button
              onClick={() => setShowVoiceText(!showVoiceText)}
              className="text-xs text-[#6C63FF] hover:text-[#8B5CF6] transition-colors text-left"
            >
              {showVoiceText ? 'Скрыть текст' : 'Аа — Показать текст'}
            </button>
          </div>
        );

      case 'circle':
        return (
          <div>
            {message.mediaUrl ? (
              <CirclePlayer src={message.mediaUrl} />
            ) : (
              <div className="w-[120px] h-[120px] rounded-full bg-white/5 flex items-center justify-center">
                ⭕ Кружок
              </div>
            )}
          </div>
        );

      case 'sticker':
        return (
          <div className="w-[120px] h-[120px]">
            {message.mediaUrl ? (
              <img src={message.mediaUrl} alt="Sticker" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">
                {message.text || '🎭'}
              </div>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="flex items-center gap-3 min-w-[200px] max-w-[280px]">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(108,99,255,0.2)' }}
            >
              📄
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/90 truncate">{message.fileName || 'Файл'}</p>
              <p className="text-xs text-white/40">
                {message.fileSize ? `${(message.fileSize / 1024 / 1024).toFixed(1)} МБ` : ''}
              </p>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="text-center">
            <span className="text-xs text-white/30 px-3 py-1 rounded-full bg-white/5">
              {message.text}
            </span>
          </div>
        );

      default:
        return (
          <div>
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="bg-transparent text-white text-sm resize-none outline-none border-b border-[#6C63FF]/50 min-w-[200px]"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={handleEdit}
                    className="text-[#6C63FF] hover:text-[#8B5CF6] transition-colors"
                  >
                    ✓ Сохранить
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setEditText(message.text || ''); }}
                    className="text-white/40 hover:text-white/60 transition-colors"
                  >
                    ✕ Отмена
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-white/90 whitespace-pre-wrap break-words max-w-[380px]">
                {message.text}
              </p>
            )}
          </div>
        );
    }
  };

  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-white/25 px-3 py-1.5 rounded-full bg-white/5">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`group flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} gap-2 px-4 py-0.5 ${isGrouped ? '' : 'pt-2'}`}
    >
      {/* Avatar */}
      {!isOwn && showAvatar && !isGrouped && (
        <Avatar
          src={sender?.avatar || null}
          name={sender?.displayName || 'Unknown'}
          size={32}
          liveEmoji={sender?.liveEmoji}
          className="self-end mb-1 flex-shrink-0"
        />
      )}
      {!isOwn && isGrouped && <div className="w-8 flex-shrink-0" />}

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
        {/* Sender name for groups */}
        {!isOwn && !isGrouped && (
          <div className="flex items-center gap-1.5 mb-1 px-1">
            <span className="text-xs font-semibold" style={{ color: '#6C63FF' }}>
              {isBot ? '🤖 NEXUS AI' : sender?.displayName || 'Unknown'}
            </span>
            {sender?.isVerified && <VerifiedBadge size={11} />}
            {sender?.isPremium && <span className="text-[9px] text-yellow-400">⭐</span>}
          </div>
        )}

        {/* Message bubble */}
        <div
          className="relative"
          onContextMenu={e => {
            e.preventDefault();
            setShowMenu(true);
          }}
        >
          <div
            className={`rounded-2xl px-4 py-2.5 ${
              message.type === 'sticker' || message.type === 'circle'
                ? 'bg-transparent px-0 py-0'
                : isOwn
                ? 'rounded-tr-sm'
                : 'rounded-tl-sm'
            }`}
            style={
              message.type === 'sticker' || message.type === 'circle'
                ? {}
                : isOwn
                ? {
                    background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)',
                    boxShadow: '0 2px 12px rgba(108,99,255,0.3)',
                  }
                : {
                    background: isBot ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }
            }
          >
            {renderContent()}

            {/* Time and status */}
            {message.type !== 'sticker' && message.type !== 'circle' && (
              <div
                className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                {message.editedAt && (
                  <span className="text-[9px] text-white/30">изм.</span>
                )}
                <span className="text-[10px] text-white/30">
                  {formatTime(message.createdAt)}
                </span>
                {isOwn && (
                  <span
                    className={`text-[10px] ${
                      message.status === 'read'
                        ? 'text-[#6C63FF]'
                        : message.status === 'delivered'
                        ? 'text-white/50'
                        : 'text-white/25'
                    }`}
                  >
                    {message.status === 'sending' ? '⏳' : message.status === 'read' ? '✓✓' : '✓✓'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Reactions */}
          {message.reactions.length > 0 && (
            <div
              className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              {message.reactions.map(r => (
                <button
                  key={r.emoji}
                  onClick={() => addReaction(chatId, message.id, r.emoji, currentAccount!.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all hover:scale-110 ${
                    r.userIds.includes(currentAccount?.id || '')
                      ? 'bg-[#6C63FF]/30 border-[#6C63FF]/50 text-white'
                      : 'bg-white/5 border-white/10 text-white/70'
                  }`}
                >
                  <span>{r.emoji}</span>
                  <span>{r.userIds.length}</span>
                </button>
              ))}
            </div>
          )}

          {/* Emoji reaction picker */}
          {showReactions && (
            <div
              className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-12 z-20 flex gap-1 p-2 rounded-2xl bg-[#1A1A2E] border border-white/10 shadow-2xl`}
              ref={menuRef}
            >
              {EMOJI_LIST.map(e => (
                <button
                  key={e}
                  onClick={() => {
                    addReaction(chatId, message.id, e, currentAccount!.id);
                    setShowReactions(false);
                  }}
                  className="text-xl hover:scale-125 transition-transform"
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          {/* Context menu */}
          {showMenu && (
            <div
              ref={menuRef}
              className={`absolute ${isOwn ? 'right-0' : 'left-0'} top-full z-20 mt-1 bg-[#1A1A2E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden min-w-[160px]`}
            >
              {[
                { icon: '😊', label: 'Реакция', action: () => { setShowMenu(false); setShowReactions(true); } },
                { icon: '↩️', label: 'Ответить', action: () => { onReply?.(message); setShowMenu(false); } },
                ...(isOwn ? [
                  { icon: '✏️', label: 'Редактировать', action: () => { setIsEditing(true); setShowMenu(false); } },
                  { icon: '🗑', label: 'Удалить', action: () => { deleteMessage(chatId, message.id); setShowMenu(false); } },
                ] : []),
                { icon: '📋', label: 'Скопировать', action: () => { navigator.clipboard.writeText(message.text || ''); setShowMenu(false); } },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-all text-left"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick reaction button */}
      <div
        className={`opacity-0 group-hover:opacity-100 transition-opacity self-center flex-shrink-0 ${
          isOwn ? 'order-first mr-1' : 'ml-1'
        }`}
      >
        <button
          onClick={() => setShowReactions(!showReactions)}
          className="p-1.5 rounded-xl hover:bg-white/8 text-white/30 hover:text-white/70 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 13s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>
      </div>
    </div>
  );
}
