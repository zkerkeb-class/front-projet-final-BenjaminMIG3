import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { socketManager } from '@/services/socketService';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface SocketConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  socketId: string | null;
}

interface SocketContextType {
  connectionState: SocketConnectionState;
  connect: () => void;
  disconnect: () => void;
  forceReconnect: () => void;
  updateConfig: (config: {
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
    maxReconnectDelay?: number;
    backoffFactor?: number;
    typingTimeout?: number;
  }) => void;
  
  // Fonctions de chat
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, content: string) => boolean;
  markAsRead: (messageId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  
  // Contrôle des notifications
  setActiveConversation: (conversationId: string | null) => void;
  getActiveConversation: () => string | null;
  
  // Fonctions utilitaires
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  socketId: string | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket doit être utilisé dans un SocketProvider');
  }
  return context;
}

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showNotification } = useNotification();
  const [connectionState, setConnectionState] = useState<SocketConnectionState>({
    isConnected: false,
    isReconnecting: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    socketId: null
  });

  // Utiliser le contexte d'authentification
  const { isLoggedIn, user } = useAuth();

  // Mettre à jour l'état de connexion
  const updateConnectionState = useCallback(() => {
    const state = socketManager.getConnectionState();
    setConnectionState(state);
  }, []);

  // Gestionnaires d'événements WebSocket
  const handleConnected = useCallback((socketId: string) => {
    console.log('🔌 [SocketContext] WebSocket connecté:', socketId);
    updateConnectionState();
    setTimeout(() => {
      showNotification('Connexion établie', 'success', 2000);
    }, 50);
  }, [updateConnectionState, showNotification]);

  const handleDisconnected = useCallback((reason: string) => {
    console.log('🔌 [SocketContext] WebSocket déconnecté:', reason);
    updateConnectionState();
    
    // Ne pas afficher de notification si c'est une déconnexion volontaire
    if (reason !== 'io client disconnect') {
      setTimeout(() => {
        showNotification('Connexion perdue', 'warning', 3000);
      }, 50);
    }
  }, [updateConnectionState, showNotification]);

  const handleReconnecting = useCallback((data: { attempt: number; delay: number }) => {
    console.log(`🔌 [SocketContext] Tentative de reconnexion ${data.attempt} dans ${data.delay}ms`);
    updateConnectionState();
    // Éviter les notifications trop fréquentes pendant la reconnexion
    if (data.attempt === 1 || data.attempt % 3 === 0) {
      setTimeout(() => {
        showNotification(
          `Reconnexion en cours... (tentative ${data.attempt})`, 
          'info', 
          Math.min(data.delay, 3000)
        );
      }, 50);
    }
  }, [updateConnectionState, showNotification]);

  const handleConnectError = useCallback((error: any) => {
    console.error('🔌 [SocketContext] Erreur de connexion WebSocket:', error);
    updateConnectionState();
    setTimeout(() => {
      showNotification('Erreur de connexion', 'error', 3000);
    }, 50);
  }, [updateConnectionState, showNotification]);

  const handleMaxReconnectAttemptsReached = useCallback(() => {
    console.error('🔌 [SocketContext] Nombre maximum de tentatives de reconnexion atteint');
    updateConnectionState();
    setTimeout(() => {
      showNotification(
        'Impossible de se reconnecter. Vérifiez votre connexion.', 
        'error', 
        5000
      );
    }, 50);
  }, [updateConnectionState, showNotification]);

  // Gestionnaires pour les événements de chat
  // Les notifications de nouveaux messages sont maintenant gérées dans chaque page spécifique
  // pour éviter les doublons

  const handleUserTyping = useCallback((data: any) => {
    console.log('⌨️ [SocketContext] Utilisateur en train de taper:', data);
    // Les composants de chat écouteront directement ces événements
  }, []);

  const handleUserStoppedTyping = useCallback((data: any) => {
    console.log('⌨️ [SocketContext] Utilisateur a arrêté de taper:', data);
    // Les composants de chat écouteront directement ces événements
  }, []);

  const handleUserStatusChanged = useCallback((data: any) => {
    console.log('👤 [SocketContext] Statut utilisateur changé:', data);
    // Les composants pourront écouter ces événements pour mettre à jour l'UI
  }, []);

  // Configurer les écouteurs d'événements (une seule fois)
  useEffect(() => {
    console.log('🔌 [SocketContext] Configuration des écouteurs d\'événements');
    
    // Événements de connexion
    socketManager.on('connected', handleConnected);
    socketManager.on('disconnected', handleDisconnected);
    socketManager.on('reconnecting', handleReconnecting);
    socketManager.on('connection_error', handleConnectError);
    socketManager.on('max_reconnect_attempts_reached', handleMaxReconnectAttemptsReached);

    // Événements de chat (sauf new_message qui est géré par les pages spécifiques)
    socketManager.on('user_typing', handleUserTyping);
    socketManager.on('user_stopped_typing', handleUserStoppedTyping);
    socketManager.on('user_status_changed', handleUserStatusChanged);

    // Mettre à jour l'état initial
    updateConnectionState();

    // Nettoyer les écouteurs au démontage
    return () => {
      console.log('🔌 [SocketContext] Nettoyage des écouteurs d\'événements');
      socketManager.off('connected', handleConnected);
      socketManager.off('disconnected', handleDisconnected);
      socketManager.off('reconnecting', handleReconnecting);
      socketManager.off('connection_error', handleConnectError);
      socketManager.off('max_reconnect_attempts_reached', handleMaxReconnectAttemptsReached);
      socketManager.off('user_typing', handleUserTyping);
      socketManager.off('user_stopped_typing', handleUserStoppedTyping);
      socketManager.off('user_status_changed', handleUserStatusChanged);
    };
  }, [
    handleConnected,
    handleDisconnected,
    handleReconnecting,
    handleConnectError,
    handleMaxReconnectAttemptsReached,
    handleUserTyping,
    handleUserStoppedTyping,
    handleUserStatusChanged,
    updateConnectionState
  ]);

  // Gérer la connexion automatique basée sur l'authentification
  useEffect(() => {
    if (isLoggedIn && user?.id && !connectionState.isConnected) {
      console.log('🔌 [SocketContext] Utilisateur connecté, initialisation WebSocket');
      socketManager.connect(user.id);
    } else if (!isLoggedIn && connectionState.isConnected) {
      console.log('🔌 [SocketContext] Utilisateur déconnecté, fermeture WebSocket');
      socketManager.disconnect();
    }
  }, [isLoggedIn, user?.id, connectionState.isConnected]);

  // Fonctions utilitaires
  const connect = useCallback(() => {
    console.log('🔌 [SocketContext] Demande de connexion');
    if (user?.id) {
      socketManager.connect(user.id);
    } else {
      console.warn('🔌 [SocketContext] Impossible de se connecter - userId manquant');
    }
  }, [user?.id]);

  const disconnect = useCallback(() => {
    console.log('🔌 [SocketContext] Demande de déconnexion');
    socketManager.disconnect();
  }, []);

  const forceReconnect = useCallback(() => {
    console.log('🔌 [SocketContext] Demande de reconnexion forcée');
    socketManager.forceReconnect();
    setTimeout(() => {
      showNotification('Reconnexion forcée...', 'info', 2000);
    }, 50);
  }, [showNotification]);

  const updateConfig = useCallback((config: {
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
    maxReconnectDelay?: number;
    backoffFactor?: number;
    typingTimeout?: number;
  }) => {
    socketManager.updateConfig(config);
    updateConnectionState();
  }, [updateConnectionState]);

  // Fonctions de chat
  const joinConversation = useCallback((conversationId: string) => {
    socketManager.joinConversation(conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketManager.leaveConversation(conversationId);
  }, []);

  const sendMessage = useCallback((conversationId: string, content: string) => {
    return socketManager.sendMessage(conversationId, content);
  }, []);

  const markAsRead = useCallback((messageId: string) => {
    socketManager.markAsRead(messageId);
  }, []);

  const startTyping = useCallback((conversationId: string) => {
    socketManager.startTyping(conversationId);
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    socketManager.stopTyping(conversationId);
  }, []);

  // Contrôle des notifications
  const setActiveConversation = useCallback((conversationId: string | null) => {
    // Implementation of setActiveConversation
  }, []);

  const getActiveConversation = useCallback(() => {
    // Implementation of getActiveConversation
    return null;
  }, []);

  const value = {
    connectionState,
    connect,
    disconnect,
    forceReconnect,
    updateConfig,
    
    // Fonctions de chat
    joinConversation,
    leaveConversation,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    
    // Contrôle des notifications
    setActiveConversation,
    getActiveConversation,
    
    // Fonctions utilitaires pour vérifier l'état
    isConnected: connectionState.isConnected,
    isReconnecting: connectionState.isReconnecting,
    reconnectAttempts: connectionState.reconnectAttempts,
    socketId: connectionState.socketId
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 