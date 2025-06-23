/**
 * Hook personnalisé pour la gestion des messages
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Message,
  MessagePagination,
  SendMessageRequest,
  UpdateMessageRequest
} from '../models/message';
import { messageService } from '../services';

interface UseMessagesReturn {
  // État
  messages: Message[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  pagination: MessagePagination | null;
  
  // Actions
  sendMessage: (data: Omit<SendMessageRequest, 'senderId'>) => Promise<void>;
  updateMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  loadMessages: (conversationId: string, page?: number) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  clearMessages: () => void;
  
  // Méthodes utilitaires
  getMessageStatus: (message: Message) => 'sent' | 'delivered' | 'read';
  isMessageReadBy: (message: Message, userId: string) => boolean;
  formatTimestamp: (timestamp: Date | string) => string;
}

interface UseMessagesOptions {
  conversationId?: string;
  userId: string;
  pageSize?: number;
  autoLoad?: boolean;
  realTimeUpdates?: boolean;
}

export const useMessages = (options: UseMessagesOptions): UseMessagesReturn => {
  const { conversationId, userId, pageSize = 50, autoLoad = true, realTimeUpdates = false } = options;
  
  // État local
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [pagination, setPagination] = useState<MessagePagination | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Références pour éviter les re-renders inutiles
  const abortControllerRef = useRef<AbortController | null>(null);
  const conversationIdRef = useRef<string | undefined>(conversationId);

  /**
   * Charge les messages d'une conversation
   */
  const loadMessages = useCallback(async (convId: string, page: number = 1) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await messageService.getMessages(convId, page, pageSize);
      
      if (page === 1) {
        setMessages(response.messages);
      } else {
        setMessages(prev => [...prev, ...response.messages]);
      }
      
      if (response.pagination) {
        setPagination(response.pagination);
        setHasMore(response.pagination.hasMore);
      } else {
        // Fallback si pas de pagination
        setHasMore(response.messages.length === pageSize);
        setPagination({
          page: page,
          limit: pageSize,
          hasMore: response.messages.length === pageSize,
          total: response.messages.length
        });
      }
      
      setCurrentPage(page);
      
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Erreur lors du chargement des messages');
      }
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  /**
   * Charge plus de messages (pagination)
   */
  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !hasMore || loading) return;
    
    await loadMessages(conversationId, currentPage + 1);
  }, [conversationId, hasMore, loading, currentPage, loadMessages]);

  /**
   * Envoie un nouveau message
   */
  const sendMessage = useCallback(async (data: Omit<SendMessageRequest, 'senderId'>) => {
    if (!conversationId) {
      setError('ID de conversation manquant');
      return;
    }

    setError(null);
    
    // Validation côté client
    if (!messageService.validateMessageContent(data.content, data.messageType)) {
      setError('Contenu du message invalide');
      return;
    }
    
    try {
      const messageData: SendMessageRequest = {
        ...data,
        conversationId,
        senderId: userId
      };
      
      console.log('[useMessages] Envoi via HTTP');
      const response = await messageService.sendMessage(messageData);
      
      // Optimisation optimiste : ajouter le message immédiatement
      const newMessage: Message = {
        ...response,
        isOwn: true,
        status: 'sent'
      };
      
      setMessages(prev => [...prev, newMessage]);
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi du message');
    }
  }, [conversationId, userId]);

  /**
   * Met à jour un message existant
   */
  const updateMessage = useCallback(async (messageId: string, content: string) => {
    setError(null);
    
    // Validation côté client
    if (!messageService.validateMessageContent(content)) {
      setError('Contenu du message invalide');
      return;
    }
    
    try {
      const updateData: UpdateMessageRequest = { content, userId };
      const response = await messageService.updateMessage(messageId, updateData);
      
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, ...response } : msg
      ));
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du message');
    }
  }, [userId]);

  /**
   * Supprime un message
   */
  const deleteMessage = useCallback(async (messageId: string) => {
    setError(null);
    
    try {
      await messageService.deleteMessage(messageId, userId);
      
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression du message');
    }
  }, [userId]);

  /**
   * Marque un message comme lu
   */
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      const response = await messageService.markMessageAsRead(messageId, userId);
      
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, ...response } : msg
      ));
      
    } catch (err: any) {
      // Ne pas afficher d'erreur pour le marquage comme lu (non bloquant)
      console.warn('Erreur lors du marquage comme lu:', err);
    }
  }, [userId]);

  /**
   * Vide la liste des messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setHasMore(true);
    setCurrentPage(1);
    setPagination(null);
  }, []);

  /**
   * Méthodes utilitaires
   */
  const getMessageStatus = useCallback((message: Message) => {
    return messageService.getMessageStatus(message, userId);
  }, [userId]);

  const isMessageReadBy = useCallback((message: Message, targetUserId: string) => {
    return messageService.isMessageReadBy(message, targetUserId);
  }, []);

  const formatTimestamp = useCallback((timestamp: Date | string) => {
    return messageService.formatTimestamp(timestamp);
  }, []);

  /**
   * Chargement automatique des messages au changement de conversation
   */
  useEffect(() => {
    if (autoLoad && conversationId && conversationId !== conversationIdRef.current) {
      conversationIdRef.current = conversationId;
      setMessages([]);
      setError(null);  
      setHasMore(true);
      setCurrentPage(1);
      setPagination(null);
      loadMessages(conversationId, 1);
    }
  }, [conversationId, autoLoad, loadMessages]);

  /**
   * Nettoyage lors du démontage du composant
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Marquage automatique des messages comme lus
   */
  useEffect(() => {
    if (realTimeUpdates && messages.length > 0) {
      const unreadMessages = messages.filter(msg => 
        !msg.isOwn && !isMessageReadBy(msg, userId)
      );
      
      if (unreadMessages.length > 0) {
        unreadMessages.forEach(msg => {
          markAsRead(msg._id);
        });
      }
    }
  }, [messages, realTimeUpdates, userId, markAsRead, isMessageReadBy]);

  return {
    // État
    messages,
    loading,
    error,
    hasMore,
    pagination,
    
    // Actions
    sendMessage,
    updateMessage,
    deleteMessage,
    markAsRead,
    loadMessages,
    loadMoreMessages,
    clearMessages,
    
    // Méthodes utilitaires
    getMessageStatus,
    isMessageReadBy,
    formatTimestamp
  };
}; 