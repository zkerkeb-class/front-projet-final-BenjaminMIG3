import { useSocket } from '@/contexts/SocketContext';
import { socketManager } from '@/services/socketService';
import { useCallback, useEffect, useRef } from 'react';

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
  userId: string;
  timestamp: string;
}

interface UseSocketChatOptions {
  conversationId?: string;
  userId?: string;
  onNewMessage?: (data: MessageData) => void;
  onMessageRead?: (data: MessageReadData) => void;
  onUserTyping?: (data: TypingData) => void;
  onUserStoppedTyping?: (data: TypingData) => void;
  onUserStatusChanged?: (data: UserStatusData) => void;
  autoJoinConversation?: boolean;
  autoMarkAsRead?: boolean;
}

interface UseSocketChatReturn {
  // État de connexion
  isConnected: boolean;
  isReconnecting: boolean;
  
  // Actions de chat
  sendMessage: (content: string) => boolean;
  markAsRead: (messageId: string, conversationId?: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  
  // Gestion des événements
  addMessageListener: (callback: (data: MessageData) => void) => () => void;
  addTypingListener: (callback: (data: TypingData) => void) => () => void;
  addUserStatusListener: (callback: (data: UserStatusData) => void) => () => void;
}

/**
 * Hook personnalisé pour gérer les fonctionnalités Socket.IO dans les composants de chat
 */
export const useSocketChat = (options: UseSocketChatOptions = {}): UseSocketChatReturn => {
  const {
    conversationId,
    userId,
    onNewMessage,
    onMessageRead,
    onUserTyping,
    onUserStoppedTyping,
    onUserStatusChanged,
    autoJoinConversation = true,
    autoMarkAsRead = false
  } = options;

  const { isConnected, isReconnecting } = useSocket();
  const currentConversationRef = useRef<string | null>(conversationId || null);

  // Validation des paramètres critiques au montage
  useEffect(() => {
    if (!conversationId) {
      console.warn('⚠️ [useSocketChat] Hook initialisé sans conversationId. Les fonctions de chat ne fonctionneront pas correctement.', {
        providedOptions: options
      });
    }
    if (!userId) {
      console.warn('⚠️ [useSocketChat] Hook initialisé sans userId. Certaines fonctions pourraient ne pas fonctionner correctement.', {
        providedOptions: options
      });
    }
  }, []); // Se déclenche seulement au montage

  // Mettre à jour la référence de conversation
  useEffect(() => {
    currentConversationRef.current = conversationId || null;
  }, [conversationId]);

  // Gestionnaires d'événements
  const handleNewMessage = useCallback((data: MessageData) => {
    // Filtrer les messages pour la conversation courante
    if (currentConversationRef.current && data.conversationId === currentConversationRef.current) {
      if (onNewMessage) {
        onNewMessage(data);
      }
      
      // Marquer automatiquement comme lu si activé et ce n'est pas l'utilisateur actuel
      if (autoMarkAsRead && data.senderId !== userId && document.hasFocus()) {
        socketManager.markAsRead(data.messageId, currentConversationRef.current || undefined);
      }
    }
  }, [onNewMessage, autoMarkAsRead, userId]);

  const handleMessageRead = useCallback((data: MessageReadData) => {
    if (onMessageRead) {
      onMessageRead(data);
    }
  }, [onMessageRead]);

  const handleUserTyping = useCallback((data: TypingData) => {
    // Filtrer pour la conversation courante et exclure l'utilisateur actuel
    if (currentConversationRef.current && 
        data.conversationId === currentConversationRef.current && 
        data.userId !== userId) {
      if (onUserTyping) {
        onUserTyping(data);
      }
    }
  }, [onUserTyping, userId]);

  const handleUserStoppedTyping = useCallback((data: TypingData) => {
    // Filtrer pour la conversation courante et exclure l'utilisateur actuel
    if (currentConversationRef.current && 
        data.conversationId === currentConversationRef.current && 
        data.userId !== userId) {
      if (onUserStoppedTyping) {
        onUserStoppedTyping(data);
      }
    }
  }, [onUserStoppedTyping, userId]);

  const handleUserStatusChanged = useCallback((data: UserStatusData) => {
    if (onUserStatusChanged) {
      onUserStatusChanged(data);
    }
  }, [onUserStatusChanged]);

  // Configurer les écouteurs d'événements
  useEffect(() => {
    console.log('🎧 [useSocketChat] Configuration des écouteurs pour la conversation:', conversationId);

    // Ajouter les écouteurs
    socketManager.on('new_message', handleNewMessage);
    socketManager.on('message_read', handleMessageRead);
    socketManager.on('user_typing', handleUserTyping);
    socketManager.on('user_stopped_typing', handleUserStoppedTyping);
    socketManager.on('user_status_changed', handleUserStatusChanged);

    // Nettoyer les écouteurs au démontage
    return () => {
      console.log('🎧 [useSocketChat] Nettoyage des écouteurs pour la conversation:', conversationId);
      socketManager.off('new_message', handleNewMessage);
      socketManager.off('message_read', handleMessageRead);
      socketManager.off('user_typing', handleUserTyping);
      socketManager.off('user_stopped_typing', handleUserStoppedTyping);
      socketManager.off('user_status_changed', handleUserStatusChanged);
    };
  }, [
    conversationId,
    handleNewMessage,
    handleMessageRead,
    handleUserTyping,
    handleUserStoppedTyping,
    handleUserStatusChanged
  ]);

  // Rejoindre/quitter automatiquement la conversation
  useEffect(() => {
    if (autoJoinConversation && conversationId && isConnected) {
      console.log('🔗 [useSocketChat] Rejoindre automatiquement la conversation:', conversationId);
      socketManager.joinConversation(conversationId);

      return () => {
        console.log('🔗 [useSocketChat] Quitter automatiquement la conversation:', conversationId);
        socketManager.leaveConversation(conversationId);
      };
    }
  }, [conversationId, isConnected, autoJoinConversation]);

  // Actions de chat
  const sendMessage = useCallback((content: string): boolean => {
    if (!conversationId) {
      console.warn('🚨 [useSocketChat] Impossible d\'envoyer - conversationId manquant', {
        conversationIdPassed: conversationId,
        currentConversationRef: currentConversationRef.current,
        hookOptions: options
      });
      return false;
    }
    return socketManager.sendMessage(conversationId, content);
  }, [conversationId, options]);

  const markAsRead = useCallback((messageId: string, providedConversationId?: string) => {
    // Utiliser le conversationId fourni ou celui du hook
    const targetConversationId = providedConversationId || conversationId;
    socketManager.markAsRead(messageId, targetConversationId);
  }, [conversationId]);

  const startTyping = useCallback(() => {
    if (conversationId) {
      socketManager.startTyping(conversationId);
    } else {
      console.debug('🔇 [useSocketChat] startTyping ignoré - conversationId manquant');
    }
  }, [conversationId]);

  const stopTyping = useCallback(() => {
    if (conversationId) {
      socketManager.stopTyping(conversationId);
    } else {
      console.debug('🔇 [useSocketChat] stopTyping ignoré - conversationId manquant');
    }
  }, [conversationId]);

  const joinConversation = useCallback((convId: string) => {
    socketManager.joinConversation(convId);
  }, []);

  const leaveConversation = useCallback((convId: string) => {
    socketManager.leaveConversation(convId);
  }, []);

  // Méthodes pour ajouter des écouteurs dynamiques
  const addMessageListener = useCallback((callback: (data: MessageData) => void) => {
    socketManager.on('new_message', callback);
    return () => socketManager.off('new_message', callback);
  }, []);

  const addTypingListener = useCallback((callback: (data: TypingData) => void) => {
    socketManager.on('user_typing', callback);
    return () => socketManager.off('user_typing', callback);
  }, []);

  const addUserStatusListener = useCallback((callback: (data: UserStatusData) => void) => {
    socketManager.on('user_status_changed', callback);
    return () => socketManager.off('user_status_changed', callback);
  }, []);

  return {
    // État de connexion
    isConnected,
    isReconnecting,
    
    // Actions de chat
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    joinConversation,
    leaveConversation,
    
    // Gestion des événements
    addMessageListener,
    addTypingListener,
    addUserStatusListener
  };
}; 