import io from 'socket.io-client';

interface SocketServiceConfig {
  maxReconnectAttempts: number;
  reconnectDelay: number;
  maxReconnectDelay: number;
  backoffFactor: number;
  typingTimeout: number;
}

interface MessageData {
  messageId: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  senderInfo: {
    username: string;
    email: string;
  };
}

interface TypingData {
  conversationId: string;
  userId: string;
  username?: string;
}

interface UserStatusData {
  userId: string;
  status: 'online' | 'offline';
  lastSeen?: string;
}

interface MessageReadData {
  messageId: string;
  conversationId: string;
  userId: string;
  timestamp: string;
}

class SocketManager {
  private socket: any = null;
  private connected = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnecting = false;
  private typingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private eventCallbacks = new Map<string, Function[]>();
  private userId: string | null = null;
  
  private config: SocketServiceConfig = {
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    maxReconnectDelay: 30000,
    backoffFactor: 2,
    typingTimeout: 3000
  };

  constructor() {
    // Constructor vide, l'initialisation se fait dans connect()
  }

  /**
   * Établit une connexion WebSocket
   */
  connect(userId?: string) {
    // Mettre à jour l'userId si fourni
    if (userId) {
      this.userId = userId;
    }

    // Vérifier s'il y a déjà une connexion active
    if (this.socket && this.socket.connected) {
      console.log('🔌 [SocketManager] Connexion déjà active');
      return;
    }

    // Nettoyer toute connexion existante
    if (this.socket) {
      console.log('🔌 [SocketManager] Nettoyage de l\'ancienne connexion');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    try {
      const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3000';
      console.log('🔌 [SocketManager] Connexion vers:', serverUrl);
      
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: false, // Gestion manuelle de la reconnexion
        timeout: 10000,
        autoConnect: true
      });

      this.setupEventListeners();

    } catch (error) {
      console.error('🔌 [SocketManager] Erreur lors de la connexion:', error);
      this.handleReconnection();
    }
  }

  /**
   * Configure les écouteurs d'événements Socket.IO
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Événements de connexion
    this.socket.on('connect', () => {
      console.log('✅ [SocketManager] Connecté au serveur Socket.IO - ID:', this.socket?.id);
      this.connected = true;
      this.reconnecting = false;
      this.reconnectAttempts = 0;
      
      // Nettoyer le timer de reconnexion
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      // Signaler que l'utilisateur est en ligne
      if (this.userId) {
        this.socket?.emit('user_online', this.userId);
      }

      this.emit('connection_status', { connected: true });
      this.emit('connected', this.socket?.id);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ [SocketManager] Déconnecté du serveur:', reason);
      this.connected = false;
      this.emit('connection_status', { connected: false, reason });
      this.emit('disconnected', reason);
      
      // Tenter une reconnexion si ce n'est pas volontaire
      if (reason !== 'io client disconnect') {
        this.handleReconnection();
      }
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('🔄 [SocketManager] Reconnecté après', attemptNumber, 'tentatives');
      if (this.userId) {
        this.socket?.emit('user_online', this.userId);
      }
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('🚨 [SocketManager] Erreur de connexion:', error.message);
      this.connected = false;
      this.emit('connection_error', { error: error.message });
      this.handleReconnection();
    });

    // Configurer les événements métier
    this.setupMessageEvents();
    this.setupTypingEvents();
    this.setupUserEvents();
    this.setupErrorEvents();
  }

  /**
   * Configure les événements liés aux messages
   */
  private setupMessageEvents() {
    if (!this.socket) return;

    // Nouveau message reçu
    this.socket.on('new_message', (data: MessageData) => {
      console.log('📩 [SocketManager] Nouveau message reçu:', data);
      this.emit('new_message', data);
    });

    // Message marqué comme lu
    this.socket.on('message_read', (data: MessageReadData) => {
      console.log('👁️ [SocketManager] Message marqué comme lu:', data);
      this.emit('message_read', data);
    });
  }

  /**
   * Configure les événements de statut de frappe
   */
  private setupTypingEvents() {
    if (!this.socket) return;

    this.socket.on('user_typing', (data: TypingData) => {
      console.log('⌨️ [SocketManager] Utilisateur en train de taper:', data);
      this.emit('user_typing', data);
    });

    this.socket.on('user_stopped_typing', (data: TypingData) => {
      console.log('⌨️ [SocketManager] Utilisateur a arrêté de taper:', data);
      this.emit('user_stopped_typing', data);
    });
  }

  /**
   * Configure les événements utilisateur
   */
  private setupUserEvents() {
    if (!this.socket) return;

    this.socket.on('user_status_changed', (data: UserStatusData) => {
      console.log('👤 [SocketManager] Statut utilisateur changé:', data);
      this.emit('user_status_changed', data);
    });
  }

  /**
   * Configure les événements d'erreur
   */
  private setupErrorEvents() {
    if (!this.socket) return;

    this.socket.on('error', (message: string) => {
      console.error('🚨 [SocketManager] Erreur Socket:', message);
      this.emit('socket_error', { message });
    });
  }

  /**
   * Rejoindre une conversation pour recevoir les messages en temps réel
   */
  joinConversation(conversationId: string) {
    if (this.socket?.connected) {
      console.log('🔗 [SocketManager] Rejoindre conversation:', conversationId);
      this.socket.emit('join_conversation', conversationId);
    } else {
      console.warn('🔗 [SocketManager] Impossible de rejoindre - socket non connecté');
    }
  }

  /**
   * Quitter une conversation
   */
  leaveConversation(conversationId: string) {
    if (this.socket?.connected) {
      console.log('🔗 [SocketManager] Quitter conversation:', conversationId);
      this.socket.emit('leave_conversation', conversationId);
    }
  }

  /**
   * Envoyer un nouveau message
   */
  sendMessage(conversationId: string, content: string) {
    if (!this.socket?.connected) {
      console.warn('📩 [SocketManager] Impossible d\'envoyer - socket non connecté');
      return false;
    }

    if (!this.userId) {
      console.warn('📩 [SocketManager] Impossible d\'envoyer - userId manquant');
      return false;
    }

    console.log('📩 [SocketManager] Envoi message:', { conversationId, content });
    this.socket.emit('send_message', {
      conversationId,
      content,
      senderId: this.userId
    });
    
    return true;
  }

  /**
   * Marquer un message comme lu
   */
  markAsRead(messageId: string, conversationId?: string) {
    if (this.socket?.connected && this.userId) {
      console.log('👁️ [SocketManager] Marquer comme lu:', messageId, conversationId ? `(conversation: ${conversationId})` : '');
      this.socket.emit('mark_as_read', {
        messageId,
        userId: this.userId,
        ...(conversationId && { conversationId }) // Inclure conversationId si fourni
      });
    }
  }

  /**
   * Commencer à taper
   */
  startTyping(conversationId: string) {
    if (!this.socket?.connected || !this.userId) return;

    console.log('⌨️ [SocketManager] Commencer à taper:', conversationId);
    this.socket.emit('typing_start', {
      conversationId,
      userId: this.userId
    });

    // Auto-stop après timeout
    this.clearTypingTimeout(conversationId);
    const timeout = setTimeout(() => {
      this.stopTyping(conversationId);
    }, this.config.typingTimeout);

    this.typingTimeouts.set(conversationId, timeout);
  }

  /**
   * Arrêter de taper
   */
  stopTyping(conversationId: string) {
    if (!this.socket?.connected || !this.userId) return;

    console.log('⌨️ [SocketManager] Arrêter de taper:', conversationId);
    this.socket.emit('typing_stop', {
      conversationId,
      userId: this.userId
    });

    this.clearTypingTimeout(conversationId);
  }

  /**
   * Nettoyer le timeout de frappe
   */
  private clearTypingTimeout(conversationId: string) {
    const timeout = this.typingTimeouts.get(conversationId);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(conversationId);
    }
  }

  /**
   * Gère la logique de reconnexion avec backoff exponentiel
   */
  private handleReconnection() {
    if (this.reconnecting || this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
        console.error('🚨 [SocketManager] Nombre maximum de tentatives de reconnexion atteint');
        this.emit('max_reconnect_attempts_reached');
      }
      return;
    }

    this.reconnecting = true;
    this.reconnectAttempts++;

    // Calculer le délai avec backoff exponentiel
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(this.config.backoffFactor, this.reconnectAttempts - 1),
      this.config.maxReconnectDelay
    );

    console.log(`🔄 [SocketManager] Tentative de reconnexion ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} dans ${delay}ms`);
    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Force une reconnexion immédiate
   */
  forceReconnect() {
    console.log('🔄 [SocketManager] Reconnexion forcée');
    this.reconnectAttempts = 0;
    this.reconnecting = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.disconnect();
    setTimeout(() => this.connect(), 100);
  }

  /**
   * Ferme la connexion et nettoie les ressources
   */
  disconnect() {
    console.log('🔌 [SocketManager] Déconnexion...');

    // Signaler que l'utilisateur est hors ligne
    if (this.socket?.connected && this.userId) {
      this.socket.emit('user_offline', this.userId);
    }

    // Nettoyer les timeouts de frappe
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();

    // Nettoyer le timer de reconnexion
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.reconnecting = false;
    this.reconnectAttempts = 0;

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Système d'événements personnalisé - Ajouter un écouteur
   */
  on(event: string, callback: Function) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  /**
   * Système d'événements personnalisé - Supprimer un écouteur
   */
  off(event: string, callback: Function) {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Système d'événements personnalisé - Émettre un événement
   */
  private emit(event: string, data?: any) {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`🚨 [SocketManager] Erreur dans le callback ${event}:`, error);
        }
      });
    }
  }

  /**
   * Utilitaires
   */
  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  getConnectionId(): string | null {
    return this.socket?.id || null;
  }

  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(newConfig: Partial<SocketServiceConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Récupère l'état actuel de la connexion
   */
  getConnectionState() {
    return {
      isConnected: this.connected,
      isReconnecting: this.reconnecting,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.config.maxReconnectAttempts,
      socketId: this.socket?.id || null
    };
  }

  /**
   * Nettoie toutes les ressources
   */
  cleanup() {
    this.disconnect();
    this.eventCallbacks.clear();
  }
}

// Instance singleton
export const socketManager = new SocketManager();

// Export pour rétrocompatibilité
export const socketService = socketManager; 