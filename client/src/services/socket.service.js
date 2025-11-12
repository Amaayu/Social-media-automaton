import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) {
      console.log('[SocketService] Already connected, socket ID:', this.socket.id);
      return this.socket;
    }

    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    console.log('[SocketService] Connecting to:', serverUrl);
    
    this.socket = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('[SocketService] ✅ Connected to server, socket ID:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('[SocketService] ❌ Disconnected from server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] ❌ Connection error:', error.message);
    });

    this.socket.on('error', (error) => {
      console.error('[SocketService] ❌ Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  on(event, callback) {
    if (!this.socket) {
      this.connect();
    }

    this.socket.on(event, callback);
    
    // Store listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }

    // Remove from stored listeners
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (!this.socket) {
      this.connect();
    }
    this.socket.emit(event, data);
  }

  // Subscribe to post generation updates for a specific user
  subscribeToPostGeneration(userId, callback) {
    const event = `post-generation:${userId}`;
    console.log('[SocketService] Subscribing to event:', event);
    this.on(event, callback);
    return () => {
      console.log('[SocketService] Unsubscribing from event:', event);
      this.off(event, callback);
    };
  }
}

export default new SocketService();
