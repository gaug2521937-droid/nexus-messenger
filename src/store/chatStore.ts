import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'voice'
  | 'circle'
  | 'file'
  | 'sticker'
  | 'emoji'
  | 'system';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Reaction {
  emoji: string;
  userIds: string[];
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  voiceText?: string;
  thumbnailUrl?: string;
  stickerId?: string;
  replyToId?: string;
  forwardedFrom?: string;
  reactions: Reaction[];
  status: MessageStatus;
  createdAt: string;
  editedAt?: string;
  isDeleted?: boolean;
  isPinned?: boolean;
  aiGenerated?: boolean;
}

export type ChatType = 'direct' | 'group' | 'channel' | 'bot';

export interface ChatMember {
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  isMuted?: boolean;
  isBanned?: boolean;
}

export interface Chat {
  id: string;
  type: ChatType;
  name: string;
  avatar: string | null;
  description?: string;
  members: ChatMember[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  isVerified?: boolean;
  verificationPending?: boolean;
  isScam?: boolean;
  scamDescription?: string;
  createdAt: string;
  createdBy: string;
  maxMembers?: number;
}

interface TypingUser {
  userId: string;
  chatId: string;
  timestamp: number;
}

interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChatId: string | null;
  typingUsers: TypingUser[];
  onlineUsers: Set<string>;
  pinnedMessages: Record<string, string[]>;

  setActiveChat: (chatId: string | null) => void;
  sendMessage: (chatId: string, senderId: string, content: Partial<Message>) => Message;
  editMessage: (chatId: string, messageId: string, text: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  pinMessage: (chatId: string, messageId: string) => void;
  addReaction: (chatId: string, messageId: string, emoji: string, userId: string) => void;
  markAsRead: (chatId: string, userId: string) => void;
  createChat: (type: ChatType, name: string, members: string[], creatorId: string) => Chat;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  deleteChat: (chatId: string) => void;
  setTyping: (chatId: string, userId: string, isTyping: boolean) => void;
  setOnline: (userId: string, isOnline: boolean) => void;
  getMessages: (chatId: string) => Message[];
  initializeDemoData: (currentUserId: string) => void;
}

// Demo messages generator
const generateDemoMessages = (chatId: string, userId1: string, userId2: string): Message[] => {
  const now = Date.now();
  return [
    {
      id: uuidv4(),
      chatId,
      senderId: userId2,
      type: 'text',
      text: 'Привет! Как дела? 👋',
      reactions: [],
      status: 'read',
      createdAt: new Date(now - 3600000 * 2).toISOString(),
    },
    {
      id: uuidv4(),
      chatId,
      senderId: userId1,
      type: 'text',
      text: 'Отлично! Работаю над новым проектом. А ты?',
      reactions: [{ emoji: '👍', userIds: [userId2] }],
      status: 'read',
      createdAt: new Date(now - 3600000 * 1.5).toISOString(),
    },
    {
      id: uuidv4(),
      chatId,
      senderId: userId2,
      type: 'text',
      text: 'Классно! Я как раз хотел спросить про NEXUS. Это действительно впечатляет!',
      reactions: [],
      status: 'read',
      createdAt: new Date(now - 3600000).toISOString(),
    },
    {
      id: uuidv4(),
      chatId,
      senderId: userId1,
      type: 'text',
      text: 'Да, функционал огромный. Голосовые, кружки, стикеры — всё есть 🚀',
      reactions: [{ emoji: '🔥', userIds: [userId2] }, { emoji: '❤️', userIds: [userId2] }],
      status: 'read',
      createdAt: new Date(now - 1800000).toISOString(),
    },
    {
      id: uuidv4(),
      chatId,
      senderId: userId2,
      type: 'text',
      text: 'Попробую ИИ-ассистента!',
      reactions: [],
      status: 'delivered',
      createdAt: new Date(now - 600000).toISOString(),
    },
  ];
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      messages: {},
      activeChatId: null,
      typingUsers: [],
      onlineUsers: new Set(['user-alice', 'admin-001']),
      pinnedMessages: {},

      setActiveChat: (chatId) => {
        set({ activeChatId: chatId });
        if (chatId) {
          const state = get();
          const chat = state.chats.find(c => c.id === chatId);
          if (chat && chat.unreadCount > 0) {
            set(s => ({
              chats: s.chats.map(c =>
                c.id === chatId ? { ...c, unreadCount: 0 } : c
              ),
            }));
          }
        }
      },

      sendMessage: (chatId, senderId, content) => {
        const message: Message = {
          id: uuidv4(),
          chatId,
          senderId,
          type: 'text',
          reactions: [],
          status: 'sending',
          createdAt: new Date().toISOString(),
          ...content,
        };

        set(state => ({
          messages: {
            ...state.messages,
            [chatId]: [...(state.messages[chatId] || []), message],
          },
          chats: state.chats.map(c =>
            c.id === chatId
              ? {
                  ...c,
                  lastMessage: message,
                  unreadCount: c.id === state.activeChatId ? 0 : c.unreadCount + 1,
                }
              : c
          ),
        }));

        // Simulate delivery
        setTimeout(() => {
          set(state => ({
            messages: {
              ...state.messages,
              [chatId]: (state.messages[chatId] || []).map(m =>
                m.id === message.id ? { ...m, status: 'delivered' } : m
              ),
            },
          }));
        }, 500);

        // Simulate read
        setTimeout(() => {
          set(state => ({
            messages: {
              ...state.messages,
              [chatId]: (state.messages[chatId] || []).map(m =>
                m.id === message.id ? { ...m, status: 'read' } : m
              ),
            },
          }));
        }, 1500);

        return message;
      },

      editMessage: (chatId, messageId, text) => {
        set(state => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).map(m =>
              m.id === messageId ? { ...m, text, editedAt: new Date().toISOString() } : m
            ),
          },
        }));
      },

      deleteMessage: (chatId, messageId) => {
        set(state => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).map(m =>
              m.id === messageId ? { ...m, isDeleted: true, text: 'Сообщение удалено' } : m
            ),
          },
        }));
      },

      pinMessage: (chatId, messageId) => {
        set(state => ({
          pinnedMessages: {
            ...state.pinnedMessages,
            [chatId]: [...(state.pinnedMessages[chatId] || []), messageId],
          },
        }));
      },

      addReaction: (chatId, messageId, emoji, userId) => {
        set(state => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).map(m => {
              if (m.id !== messageId) return m;
              const existing = m.reactions.find(r => r.emoji === emoji);
              if (existing) {
                const hasUser = existing.userIds.includes(userId);
                return {
                  ...m,
                  reactions: m.reactions.map(r =>
                    r.emoji === emoji
                      ? {
                          ...r,
                          userIds: hasUser
                            ? r.userIds.filter(id => id !== userId)
                            : [...r.userIds, userId],
                        }
                      : r
                  ).filter(r => r.userIds.length > 0),
                };
              }
              return { ...m, reactions: [...m.reactions, { emoji, userIds: [userId] }] };
            }),
          },
        }));
      },

      markAsRead: (chatId, userId) => {
        set(state => ({
          chats: state.chats.map(c =>
            c.id === chatId ? { ...c, unreadCount: 0 } : c
          ),
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).map(m =>
              m.senderId !== userId && m.status !== 'read' ? { ...m, status: 'read' } : m
            ),
          },
        }));
      },

      createChat: (type, name, members, creatorId) => {
        const chatId = uuidv4();
        const chat: Chat = {
          id: chatId,
          type,
          name,
          avatar: null,
          members: members.map(uid => ({
            userId: uid,
            role: uid === creatorId ? 'owner' : 'member',
            joinedAt: new Date().toISOString(),
          })),
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          createdAt: new Date().toISOString(),
          createdBy: creatorId,
          maxMembers: type === 'group' ? 200 : undefined,
        };

        set(state => ({
          chats: [chat, ...state.chats],
          messages: { ...state.messages, [chatId]: [] },
        }));

        return chat;
      },

      updateChat: (chatId, updates) => {
        set(state => ({
          chats: state.chats.map(c => (c.id === chatId ? { ...c, ...updates } : c)),
        }));
      },

      deleteChat: (chatId) => {
        set(state => {
          const { [chatId]: _, ...restMessages } = state.messages;
          return {
            chats: state.chats.filter(c => c.id !== chatId),
            messages: restMessages,
            activeChatId: state.activeChatId === chatId ? null : state.activeChatId,
          };
        });
      },

      setTyping: (chatId, userId, isTyping) => {
        set(state => {
          const filtered = state.typingUsers.filter(
            t => !(t.chatId === chatId && t.userId === userId)
          );
          if (isTyping) {
            return {
              typingUsers: [...filtered, { chatId, userId, timestamp: Date.now() }],
            };
          }
          return { typingUsers: filtered };
        });

        if (isTyping) {
          setTimeout(() => {
            set(state => ({
              typingUsers: state.typingUsers.filter(
                t => !(t.chatId === chatId && t.userId === userId)
              ),
            }));
          }, 3000);
        }
      },

      setOnline: (userId, isOnline) => {
        set(state => {
          const newSet = new Set(state.onlineUsers);
          if (isOnline) newSet.add(userId);
          else newSet.delete(userId);
          return { onlineUsers: newSet };
        });
      },

      getMessages: (chatId) => {
        return get().messages[chatId] || [];
      },

      initializeDemoData: (currentUserId: string) => {
        const state = get();
        if (state.chats.length > 0) return;

        const aliceId = 'user-alice';
        const bobId = 'user-bob';
        const adminId = 'admin-001';

        const chat1Id = `direct-${currentUserId}-${aliceId}`;
        const chat2Id = `direct-${currentUserId}-${bobId}`;
        const groupId = `group-nexus-team`;
        const botId = `bot-nexus-ai`;

        const now = Date.now();

        const chat1: Chat = {
          id: chat1Id,
          type: 'direct',
          name: 'Alice Johnson',
          avatar: null,
          members: [
            { userId: currentUserId, role: 'member', joinedAt: new Date().toISOString() },
            { userId: aliceId, role: 'member', joinedAt: new Date().toISOString() },
          ],
          unreadCount: 2,
          isPinned: true,
          isMuted: false,
          isArchived: false,
          createdAt: new Date(now - 86400000 * 7).toISOString(),
          createdBy: currentUserId,
        };

        const chat2: Chat = {
          id: chat2Id,
          type: 'direct',
          name: 'Bob Smith',
          avatar: null,
          members: [
            { userId: currentUserId, role: 'member', joinedAt: new Date().toISOString() },
            { userId: bobId, role: 'member', joinedAt: new Date().toISOString() },
          ],
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          createdAt: new Date(now - 86400000 * 3).toISOString(),
          createdBy: currentUserId,
        };

        const groupChat: Chat = {
          id: groupId,
          type: 'group',
          name: 'NEXUS Team 🚀',
          avatar: null,
          description: 'Official NEXUS development team',
          members: [
            { userId: adminId, role: 'owner', joinedAt: new Date().toISOString() },
            { userId: currentUserId, role: 'admin', joinedAt: new Date().toISOString() },
            { userId: aliceId, role: 'member', joinedAt: new Date().toISOString() },
            { userId: bobId, role: 'member', joinedAt: new Date().toISOString() },
          ],
          unreadCount: 5,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          isVerified: true,
          createdAt: new Date(now - 86400000 * 30).toISOString(),
          createdBy: adminId,
          maxMembers: 2000,
        };

        const botChat: Chat = {
          id: botId,
          type: 'bot',
          name: 'NEXUS AI Assistant',
          avatar: null,
          description: 'Your personal AI assistant',
          members: [{ userId: currentUserId, role: 'member', joinedAt: new Date().toISOString() }],
          unreadCount: 0,
          isPinned: true,
          isMuted: false,
          isArchived: false,
          createdAt: new Date().toISOString(),
          createdBy: 'system',
        };

        const msgs1 = generateDemoMessages(chat1Id, currentUserId, aliceId);
        const msgs2 = generateDemoMessages(chat2Id, currentUserId, bobId);
        const msgsGroup = [
          {
            id: uuidv4(),
            chatId: groupId,
            senderId: adminId,
            type: 'text' as MessageType,
            text: 'Добро пожаловать в NEXUS Team! 🎉',
            reactions: [{ emoji: '🎉', userIds: [currentUserId, aliceId, bobId] }],
            status: 'read' as MessageStatus,
            createdAt: new Date(now - 86400000 * 30).toISOString(),
          },
          {
            id: uuidv4(),
            chatId: groupId,
            senderId: aliceId,
            type: 'text' as MessageType,
            text: 'Привет всем! Рада быть здесь 😊',
            reactions: [],
            status: 'read' as MessageStatus,
            createdAt: new Date(now - 86400000 * 29).toISOString(),
          },
          {
            id: uuidv4(),
            chatId: groupId,
            senderId: currentUserId,
            type: 'text' as MessageType,
            text: 'Давайте обсудим новые фичи NEXUS',
            reactions: [{ emoji: '👍', userIds: [adminId, aliceId] }],
            status: 'read' as MessageStatus,
            createdAt: new Date(now - 3600000 * 3).toISOString(),
          },
          {
            id: uuidv4(),
            chatId: groupId,
            senderId: bobId,
            type: 'text' as MessageType,
            text: 'Когда релиз? 👀',
            reactions: [],
            status: 'delivered' as MessageStatus,
            createdAt: new Date(now - 1800000).toISOString(),
          },
          {
            id: uuidv4(),
            chatId: groupId,
            senderId: adminId,
            type: 'text' as MessageType,
            text: 'Скоро! Следите за обновлениями 🚀',
            reactions: [],
            status: 'delivered' as MessageStatus,
            createdAt: new Date(now - 900000).toISOString(),
          },
        ];

        const botMessages: Message[] = [
          {
            id: uuidv4(),
            chatId: botId,
            senderId: 'bot-nexus-ai',
            type: 'text',
            text: '👋 Привет! Я NEXUS AI — твой персональный ассистент.\n\nМогу помочь с:\n• Ответами на вопросы\n• Исправлением текста\n• Переводом\n• Улучшением стиля\n\nПросто напиши что-нибудь!',
            reactions: [],
            status: 'read',
            createdAt: new Date().toISOString(),
            aiGenerated: true,
          },
        ];

        set({
          chats: [botChat, chat1, groupChat, chat2],
          messages: {
            [chat1Id]: msgs1,
            [chat2Id]: msgs2,
            [groupId]: msgsGroup,
            [botId]: botMessages,
          },
        });

        // Update lastMessage for chats
        setTimeout(() => {
          const s = get();
          set({
            chats: s.chats.map(c => ({
              ...c,
              lastMessage: (s.messages[c.id] || []).slice(-1)[0] || c.lastMessage,
            })),
          });
        }, 100);
      },
    }),
    {
      name: 'nexus-chats',
      partialize: state => ({
        chats: state.chats,
        messages: state.messages,
        pinnedMessages: state.pinnedMessages,
      }),
    }
  )
);
