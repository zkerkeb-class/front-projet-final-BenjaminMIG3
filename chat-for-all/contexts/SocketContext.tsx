import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { socketService } from '@/services/socketService';
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
  }) => void;
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
    maxReconnectAttempts: 10,
    socketId: null
  });

  // Importer useAuth pour gérer la connexion automatique
  const { isLoggedIn, user } = useAuth();

  // Mettre à jour l'état de connexion
  const updateConnectionState = useCallback(() => {
    const state = socketService.getConnectionState();
    setConnectionState(state);
  }, []);

  // Gestionnaires d'événements WebSocket (une seule instance)
  const handleConnected = useCallback((socketId: string) => {
    console.log('🔌 [SocketContext] WebSocket connecté:', socketId);
    updateConnectionState();
    // Délai pour éviter les conflits avec les effets d'insertion
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

  // Configurer les écouteurs d'événements (une seule fois)
  useEffect(() => {
    console.log('🔌 [SocketContext] Configuration des écouteurs d\'événements');
    
    // Ajouter les écouteurs
    socketService.on('connected', handleConnected);
    socketService.on('disconnected', handleDisconnected);
    socketService.on('reconnecting', handleReconnecting);
    socketService.on('connect_error', handleConnectError);
    socketService.on('max_reconnect_attempts_reached', handleMaxReconnectAttemptsReached);

    // Mettre à jour l'état initial
    updateConnectionState();

    // Nettoyer les écouteurs au démontage
    return () => {
      console.log('🔌 [SocketContext] Nettoyage des écouteurs d\'événements');
      socketService.off('connected', handleConnected);
      socketService.off('disconnected', handleDisconnected);
      socketService.off('reconnecting', handleReconnecting);
      socketService.off('connect_error', handleConnectError);
      socketService.off('max_reconnect_attempts_reached', handleMaxReconnectAttemptsReached);
    };
  }, [
    handleConnected,
    handleDisconnected,
    handleReconnecting,
    handleConnectError,
    handleMaxReconnectAttemptsReached,
    updateConnectionState
  ]);

  // Gérer la connexion automatique basée sur l'authentification (une seule fois dans le contexte)
  useEffect(() => {
    if (isLoggedIn && user?.id && !connectionState.isConnected) {
      console.log('🔌 [SocketContext] Utilisateur connecté, initialisation WebSocket');
      socketService.connect();
    } else if (!isLoggedIn && connectionState.isConnected) {
      console.log('🔌 [SocketContext] Utilisateur déconnecté, fermeture WebSocket');
      socketService.disconnect();
    }
  }, [isLoggedIn, user?.id, connectionState.isConnected]);

  // Fonctions utilitaires
  const connect = useCallback(() => {
    console.log('🔌 [SocketContext] Demande de connexion');
    socketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    console.log('🔌 [SocketContext] Demande de déconnexion');
    socketService.disconnect();
  }, []);

  const forceReconnect = useCallback(() => {
    console.log('🔌 [SocketContext] Demande de reconnexion forcée');
    socketService.forceReconnect();
    setTimeout(() => {
      showNotification('Reconnexion forcée...', 'info', 2000);
    }, 50);
  }, [showNotification]);

  const updateConfig = useCallback((config: {
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
    maxReconnectDelay?: number;
    backoffFactor?: number;
  }) => {
    socketService.updateConfig(config);
    updateConnectionState();
  }, [updateConnectionState]);

  const value = {
    connectionState,
    connect,
    disconnect,
    forceReconnect,
    updateConfig,
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