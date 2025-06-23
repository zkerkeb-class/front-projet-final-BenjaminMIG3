import io from 'socket.io-client';

interface SocketServiceConfig {
  maxReconnectAttempts: number;
  reconnectDelay: number;
  maxReconnectDelay: number;
  backoffFactor: number;
}

class SocketService {
  private socket: any = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isReconnecting = false;
  private config: SocketServiceConfig = {
    maxReconnectAttempts: 10,
    reconnectDelay: 1000, // 1 seconde
    maxReconnectDelay: 30000, // 30 secondes
    backoffFactor: 1.5
  };
  private listeners: { [event: string]: Function[] } = {};

  /**
   * Établit une connexion WebSocket avec reconnexion automatique
   */
  connect() {
    // Vérifier s'il y a déjà une connexion active
    if (this.socket && this.socket.connected) {
      console.log('🔌 [SocketService] Connexion déjà active, ignorée');
      return;
    }

    // Nettoyer toute connexion existante avant d'en créer une nouvelle
    if (this.socket) {
      console.log('🔌 [SocketService] Nettoyage de l\'ancienne connexion');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    try {
      const socketUrl = 'http://localhost:3000';
      console.log('🔌 [SocketService] Création d\'une nouvelle connexion vers:', socketUrl);
      
      this.socket = io(socketUrl, {
        autoConnect: true,
        reconnection: false, // On gère la reconnexion manuellement
        timeout: 10000,
        transports: ['websocket', 'polling']
      });

      this.setupEventListeners();

    } catch (error) {
      console.error('🔌 [SocketService] Erreur lors de la connexion:', error);
      this.handleReconnection();
    }
  }

  /**
   * Configure les écouteurs d'événements du socket
   */
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connexion WebSocket établie - Socket ID:', this.socket.id);
      this.isConnected = true;
      this.isReconnecting = false;
      this.reconnectAttempts = 0;
      
      // Nettoyer le timer de reconnexion
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      this.emit('connected', this.socket.id);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Connexion WebSocket fermée. Raison:', reason);
      this.isConnected = false;
      this.emit('disconnected', reason);
      
      // Tenter une reconnexion si la déconnexion n'est pas volontaire
      if (reason !== 'io client disconnect') {
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Erreur de connexion:', error);
      this.isConnected = false;
      this.emit('connect_error', error);
      this.handleReconnection();
    });

    // Écouter les messages entrants pour debug
    this.socket.on('message', (data: any) => {
      console.log('Message reçu du serveur:', data);
      this.emit('message', data);
    });
  }

  /**
   * Gère la logique de reconnexion avec backoff exponentiel
   */
  private handleReconnection() {
    if (this.isReconnecting || this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
        console.error('Nombre maximum de tentatives de reconnexion atteint');
        this.emit('max_reconnect_attempts_reached');
      }
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    // Calculer le délai avec backoff exponentiel
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(this.config.backoffFactor, this.reconnectAttempts - 1),
      this.config.maxReconnectDelay
    );

    console.log(`Tentative de reconnexion ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} dans ${delay}ms`);
    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

    this.reconnectTimer = setTimeout(() => {
      console.log(`Reconnexion en cours... (tentative ${this.reconnectAttempts})`);
      
      // Nettoyer l'ancienne connexion
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
      }
      
      // Créer une nouvelle connexion
      this.connect();
    }, delay);
  }

  /**
   * Force une reconnexion immédiate
   */
  forceReconnect() {
    console.log('Reconnexion forcée demandée');
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.disconnect();
    setTimeout(() => this.connect(), 100);
  }

  /**
   * Ferme la connexion
   */
  disconnect() {
    console.log('Déconnexion du socket...');
    
    // Nettoyer le timer de reconnexion
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Récupère l'instance socket
   */
  getSocket() {
    return this.socket;
  }

  /**
   * Vérifie si le socket est connecté
   */
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  /**
   * Vérifie si une reconnexion est en cours
   */
  isReconnectingState() {
    return this.isReconnecting;
  }

  /**
   * Récupère le nombre de tentatives de reconnexion
   */
  getReconnectAttempts() {
    return this.reconnectAttempts;
  }

  /**
   * Envoie un message (avec vérification de connexion)
   */
  sendMessage(message: string) {
    if (!this.isSocketConnected()) {
      console.error('Impossible d\'envoyer le message: socket non connecté');
      return false;
    }
    
    console.log('Envoi du message:', message);
    this.socket.emit('message', message);
    return true;
  }

  /**
   * Ajoute un écouteur d'événement personnalisé
   */
  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Supprime un écouteur d'événement
   */
  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Émet un événement personnalisé
   */
  private emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erreur dans l'écouteur d'événement ${event}:`, error);
        }
      });
    }
  }

  /**
   * Met à jour la configuration de reconnexion
   */
  updateConfig(newConfig: Partial<SocketServiceConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Récupère l'état actuel de la connexion
   */
  getConnectionState() {
    return {
      isConnected: this.isConnected,
      isReconnecting: this.isReconnecting,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.config.maxReconnectAttempts,
      socketId: this.socket?.id || null
    };
  }
}

export const socketService = new SocketService();
export default socketService; 