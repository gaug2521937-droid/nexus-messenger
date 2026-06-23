import { useState, useRef, useEffect } from 'react';
import { useChatStore, Message } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { ws } from '../../services/websocket';
import { VoiceRecorder } from './VoiceRecorder';
import { CircleRecorder } from './CircleRecorder';
import { PhotoEditor } from './PhotoEditor';
import { AIHelper } from './AIHelper';
import { StickerPicker } from '../Stickers/StickerPicker';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface MessageInputProps {
  chatId: string;
  replyTo?: Message | null;
  onCancelReply?: () => void;
}

export function MessageInput({ chatId, replyTo, onCancelReply }: MessageInputProps) {
  const { sendMessage, setTyping } = useChatStore();
  const { currentAccount } = useAuthStore();
  const [text, setText] = useState('');
  const [showVoice, setShowVoice] = useState(false);
  const [showCircle, setShowCircle] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wordCount = text.trim().split(/\s+/).filter(w => w).length;
  const showAIPencil = wordCount >= 5;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    // Typing indicator
    if (currentAccount) {
      setTyping(chatId, currentAccount.id, true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setTyping(chatId, currentAccount.id, false);
      }, 2000);
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !currentAccount) return;

    const msgId = uuidv4();
    sendMessage(chatId, currentAccount.id, {
      id: msgId,
      type: 'text',
      text: trimmed,
      replyToId: replyTo?.id,
      status: 'sending',
    });

    ws.send('message', { messageId: msgId, chatId, text: trimmed });

    setText('');
    onCancelReply?.();
    setShowAIHelper(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setTyping(chatId, currentAccount.id, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceSend = (blob: Blob, duration: number, voiceText?: string) => {
    if (!currentAccount) return;
    const url = URL.createObjectURL(blob);
    sendMessage(chatId, currentAccount.id, {
      type: 'voice',
      mediaUrl: url,
      duration,
      voiceText,
      status: 'sending',
    });
    setShowVoice(false);
  };

  const handleCircleSend = (blob: Blob, duration: number) => {
    if (!currentAccount) return;
    const url = URL.createObjectURL(blob);
    sendMessage(chatId, currentAccount.id, {
      type: 'circle',
      mediaUrl: url,
      duration,
      status: 'sending',
    });
    setShowCircle(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentAccount) return;

    const maxSize = currentAccount.isPremium ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Максимальный размер файла: ${currentAccount.isPremium ? '100' : '20'} МБ`);
      return;
    }

    const url = URL.createObjectURL(file);

    if (file.type.startsWith('image/')) {
      setPendingImage(url);
      setShowPhotoEditor(true);
    } else if (file.type.startsWith('video/')) {
      sendMessage(chatId, currentAccount.id, {
        type: 'video',
        mediaUrl: url,
        fileName: file.name,
        fileSize: file.size,
        status: 'sending',
      });
    } else {
      sendMessage(chatId, currentAccount.id, {
        type: 'file',
        fileName: file.name,
        fileSize: file.size,
        mediaUrl: url,
        status: 'sending',
      });
    }

    setShowAttachMenu(false);
    e.target.value = '';
  };

  const handlePhotoSend = (dataUrl: string, caption: string) => {
    if (!currentAccount) return;
    sendMessage(chatId, currentAccount.id, {
      type: 'image',
      mediaUrl: dataUrl,
      text: caption,
      status: 'sending',
    });
    setShowPhotoEditor(false);
    setPendingImage(null);
  };

  const handleStickerSend = (sticker: { url: string; emoji?: string }) => {
    if (!currentAccount) return;
    sendMessage(chatId, currentAccount.id, {
      type: 'sticker',
      mediaUrl: sticker.url,
      text: sticker.emoji,
      status: 'sending',
    });
    setShowStickerPicker(false);
  };

  if (showVoice) {
    return (
      <div className="p-3">
        <VoiceRecorder
          onSend={handleVoiceSend}
          onCancel={() => setShowVoice(false)}
        />
      </div>
    );
  }

  return (
    <>
      {showCircle && (
        <CircleRecorder
          onSend={handleCircleSend}
          onCancel={() => setShowCircle(false)}
        />
      )}

      {showPhotoEditor && pendingImage && (
        <PhotoEditor
          imageUrl={pendingImage}
          onSend={handlePhotoSend}
          onCancel={() => { setShowPhotoEditor(false); setPendingImage(null); }}
        />
      )}

      {showStickerPicker && (
        <StickerPicker
          onSelect={handleStickerSend}
          onClose={() => setShowStickerPicker(false)}
        />
      )}

      <div className="px-3 py-3 bg-[#0F0F1A] border-t border-white/5">
        {/* Reply preview */}
        {replyTo && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-white/5 border-l-2 border-[#6C63FF]">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#6C63FF] font-medium mb-0.5">Ответ</p>
              <p className="text-xs text-white/50 truncate">{replyTo.text || 'Медиа'}</p>
            </div>
            <button
              onClick={onCancelReply}
              className="text-white/30 hover:text-white/60 text-lg flex-shrink-0"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Attach button */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="p-2.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            {showAttachMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-[#1A1A2E] border border-white/10 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 z-20 min-w-[160px]">
                {[
                  { icon: '🖼', label: 'Фото / Видео', accept: 'image/*,video/*' },
                  { icon: '📄', label: 'Файл', accept: '*' },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = item.accept;
                        fileInputRef.current.click();
                      }
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-sm text-white/70 hover:text-white transition-all text-left"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
                <button
                  onClick={() => { setShowCircle(true); setShowAttachMenu(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-sm text-white/70 hover:text-white transition-all text-left"
                >
                  <span>⭕</span>
                  <span>Видеокружок</span>
                </button>
              </div>
            )}
          </div>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Сообщение..."
              rows={1}
              className="w-full resize-none bg-white/5 border border-white/8 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#6C63FF]/40 transition-all pr-10"
              style={{ maxHeight: '120px' }}
            />
            {/* AI pencil */}
            {showAIPencil && (
              <button
                onClick={() => setShowAIHelper(!showAIHelper)}
                className={`absolute right-3 bottom-3 text-base transition-all hover:scale-110 ${
                  showAIHelper ? 'text-[#6C63FF]' : 'text-white/30 hover:text-[#6C63FF]'
                }`}
                title="ИИ-помощник"
              >
                ✏️
              </button>
            )}

            {/* AI Helper panel */}
            {showAIHelper && (
              <AIHelper
                text={text}
                onResult={result => setText(result)}
                onClose={() => setShowAIHelper(false)}
              />
            )}
          </div>

          {/* Sticker button */}
          <button
            onClick={() => setShowStickerPicker(!showStickerPicker)}
            className="p-2.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-all flex-shrink-0"
          >
            🎭
          </button>

          {/* Voice / Send */}
          {text.trim() ? (
            <button
              onClick={handleSend}
              className="p-2.5 rounded-xl flex-shrink-0 transition-all hover:scale-110 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22 11 13 2 9l20-7z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setShowVoice(true)}
              className="p-2.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-all flex-shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          )}
        </div>

        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
      </div>
    </>
  );
}
