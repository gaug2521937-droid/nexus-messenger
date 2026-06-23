// WebSocket simulation with auto-reconnect and message delivery confirmation
import { useChatStore } from '../store/chatStore';
import { v4 as uuidv4 } from 'uuid';

type WSEventType =
  | 'message'
  | 'typing'
  | 'online'
  | 'offline'
  | 'read'
  | 'reaction'
  | 'delivered'
  | 'connect'
  | 'disconnect'
  | 'bot_reply';

interface WSEvent {
  type: WSEventType;
  payload: Record<string, unknown>;
}

type WSListener = (event: WSEvent) => void;

class NexusWebSocket {
  private listeners: Map<WSEventType, WSListener[]> = new Map();
  private connected = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private pendingConfirms: Map<string, { message: unknown; retries: number; timer: ReturnType<typeof setTimeout> }> = new Map();
  private userId: string | null = null;
  private simulatedPeerTyping: ReturnType<typeof setTimeout> | null = null;

  connect(userId: string) {
    this.userId = userId;
    this.simulateConnect();
  }

  private simulateConnect() {
    setTimeout(() => {
      this.connected = true;
      this.emit('connect', { userId: this.userId });
      this.startPing();
      this.deliverOfflineMessages();
    }, 300);
  }

  private startPing() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (!this.connected) {
        this.reconnect();
      }
    }, 30000);
  }

  private reconnect() {
    if (this.reconnectTimer) return;
    this.connected = false;
    this.emit('disconnect', {});
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.simulateConnect();
    }, 2000);
  }

  private deliverOfflineMessages() {
    // Simulate offline message delivery
    const store = useChatStore.getState();
    store.chats.forEach(chat => {
      const msgs = store.messages[chat.id] || [];
      msgs
        .filter(m => m.status === 'sending')
        .forEach(m => {
          setTimeout(() => {
            useChatStore.getState().editMessage(chat.id, m.id, m.text || '');
          }, 500);
        });
    });
  }

  send(type: WSEventType, payload: Record<string, unknown>) {
    if (!this.connected) {
      this.queueForRetry(type, payload);
      return;
    }
    this.processOutgoing(type, payload);
  }

  private queueForRetry(type: WSEventType, payload: Record<string, unknown>) {
    const id = uuidv4();
    const timer = setTimeout(() => {
      if (this.connected) {
        this.processOutgoing(type, payload);
        this.pendingConfirms.delete(id);
      } else {
        const pending = this.pendingConfirms.get(id);
        if (pending && pending.retries < 5) {
          this.pendingConfirms.set(id, { ...pending, retries: pending.retries + 1 });
          this.queueForRetry(type, payload);
        }
      }
    }, 2000);
    this.pendingConfirms.set(id, { message: { type, payload }, retries: 0, timer });
  }

  private processOutgoing(type: WSEventType, payload: Record<string, unknown>) {
    // Simulate server processing
    if (type === 'message') {
      const msgId = payload.messageId as string;
      // Confirm delivery
      setTimeout(() => {
        this.emit('delivered', { messageId: msgId, chatId: payload.chatId });
      }, 300 + Math.random() * 500);

      // Simulate bot reply if bot chat
      if ((payload.chatId as string)?.startsWith('bot-')) {
        this.simulateBotReply(payload);
      } else {
        // Simulate peer typing then reply for demo
        this.simulatePeerResponse(payload);
      }
    } else if (type === 'typing') {
      // Broadcast to other participants (simulated)
    }
  }

  private simulatePeerResponse(payload: Record<string, unknown>) {
    const chatId = payload.chatId as string;
    const store = useChatStore.getState();
    const chat = store.chats.find(c => c.id === chatId);
    if (!chat) return;

    const otherMember = chat.members.find(m => m.userId !== this.userId);
    if (!otherMember) return;

    // 30% chance of auto-reply for demo
    if (Math.random() > 0.3) return;

    const responses = [
      'Понял! 👍',
      'Хорошо, спасибо!',
      'Окей, разберёмся.',
      'Отличная идея! 🚀',
      '👌',
      'Договорились!',
      'Ясно, буду иметь в виду.',
      'Спасибо за информацию!',
    ];

    // Show typing indicator
    setTimeout(() => {
      store.setTyping(chatId, otherMember.userId, true);
    }, 1000);

    // Send reply
    const delay = 2000 + Math.random() * 3000;
    if (this.simulatedPeerTyping) clearTimeout(this.simulatedPeerTyping);
    this.simulatedPeerTyping = setTimeout(() => {
      store.setTyping(chatId, otherMember.userId, false);
      store.sendMessage(chatId, otherMember.userId, {
        type: 'text',
        text: responses[Math.floor(Math.random() * responses.length)],
        status: 'delivered',
      });
    }, delay);
  }

  private simulateBotReply(payload: Record<string, unknown>) {
    const chatId = payload.chatId as string;
    const text = payload.text as string;

    // Show typing
    setTimeout(() => {
      useChatStore.getState().setTyping(chatId, 'bot-nexus-ai', true);
    }, 500);

    setTimeout(() => {
      useChatStore.getState().setTyping(chatId, 'bot-nexus-ai', false);
      this.emit('bot_reply', { chatId, text, userText: text });
    }, 1500 + Math.random() * 2000);
  }

  on(type: WSEventType, listener: WSListener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);
  }

  off(type: WSEventType, listener: WSListener) {
    const arr = this.listeners.get(type) || [];
    this.listeners.set(
      type,
      arr.filter(l => l !== listener)
    );
  }

  private emit(type: WSEventType, payload: Record<string, unknown>) {
    const listeners = this.listeners.get(type) || [];
    listeners.forEach(l => l({ type, payload }));
  }

  disconnect() {
    this.connected = false;
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.simulatedPeerTyping) clearTimeout(this.simulatedPeerTyping);
    this.pendingConfirms.forEach(p => clearTimeout(p.timer));
    this.pendingConfirms.clear();
    this.emit('disconnect', {});
  }

  isConnected() {
    return this.connected;
  }
}

export const ws = new NexusWebSocket();
