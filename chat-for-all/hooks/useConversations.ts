/**
 * Hook personnalisé pour la gestion des conversations
 */

import {
  Conversation,
  ConversationFilters,
  ConversationPagination,
  ConversationResponse,
  ConversationSearchParams,
  ConversationsResponse,
  CreateConversationRequest,
  UpdateConversationRequest
} from '@/models';
import conversationService from '@/services/conversationService';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseConversationsReturn {
  // État
  conversations: Conversation[];
  currentConversation: Conversation | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  pagination: ConversationPagination | null;
  
  // Actions principales
  loadConversations: (userId: string, page?: number, isRefreshing?: boolean) => Promise<void>;
  loadMoreConversations: () => Promise<void>;
  createConversation: (data: CreateConversationRequest) => Promise<Conversation | null>;
  updateConversation: (conversationId: string, data: UpdateConversationRequest) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  clearConversations: () => void;
  
  // Actions de recherche et filtrage
  searchConversations: (params: ConversationSearchParams) => Promise<void>;
  filterConversations: (filters: ConversationFilters) => Conversation[];
  
  // Gestion des participants
  addParticipant: (conversationId: string, participantId: string) => Promise<void>;
  removeParticipant: (conversationId: string, participantId: string) => Promise<void>;
  
  // Méthodes utilitaires
  getDisplayName: (conversation: Conversation) => string;
  getConversationAvatar: (conversation: Conversation) => string;
  isUserInConversation: (conversation: Conversation, userId: string) => boolean;
  formatLastActivity: (lastActivity: Date | string) => string;
  calculateUnreadCount: (conversation: Conversation) => number;
}

interface UseConversationsOptions {
  userId: string;
  pageSize?: number;
  autoLoad?: boolean;
  realTimeUpdates?: boolean;
}

export const useConversations = (options: UseConversationsOptions): UseConversationsReturn => {
  const { userId, pageSize = 20, autoLoad = true, realTimeUpdates = false } = options;
  
  // État local
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [pagination, setPagination] = useState<ConversationPagination | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Références pour éviter les re-renders inutiles
  const abortControllerRef = useRef<AbortController | null>(null);
  const userIdRef = useRef<string>(userId);

  /**
   * Charge les conversations de l'utilisateur
   */
  const loadConversations = useCallback(async (targetUserId: string, page: number = 1, isRefreshing = false) => {
    if (loading && !isRefreshing) return;
    
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      console.log('[useConversations] Chargement des conversations pour l\'utilisateur:', targetUserId);
      
      const response: ConversationsResponse = await conversationService.getConversations(targetUserId, page, pageSize);
      
      if (!response.conversations) {
        throw new Error('Réponse invalide du serveur');
      }
      
      console.log('[useConversations] Conversations chargées avec succès:', response.conversations.length);
      
      if (page === 1) {
        setConversations(response.conversations);
      } else {
        setConversations(prev => [...prev, ...response.conversations]);
      }
      
      setPagination({
        page: page,
        limit: pageSize,
        hasMore: response.conversations.length === pageSize,
        total: response.totalCount || response.conversations.length
      });
      
      setHasMore(response.conversations.length === pageSize);
      setCurrentPage(page);
      
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[useConversations] Erreur lors du chargement des conversations:', err);
        setError(err.message || 'Erreur lors du chargement des conversations');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, pageSize]);

  /**
   * Charge plus de conversations (pagination)
   */
  const loadMoreConversations = useCallback(async () => {
    if (!hasMore || loading) return;
    
    await loadConversations(userId, currentPage + 1);
  }, [hasMore, loading, currentPage, loadConversations, userId]);

  /**
   * Crée une nouvelle conversation
   */
  const createConversation = useCallback(async (data: CreateConversationRequest): Promise<Conversation | null> => {
    setError(null);
    setLoading(true);
    
    try {
      console.log('[useConversations] Tentative de création de conversation:', data);
      
      // Validation des données
      if (!data.participants || data.participants.length < 2) {
        throw new Error('Au moins deux participants sont requis');
      }
      
      if (data.isGroup && (!data.groupName || data.groupName.trim().length === 0)) {
        throw new Error('Un nom de groupe est requis pour une conversation de groupe');
      }
      
      const response = await conversationService.createConversation(data);
      
      console.log('[useConversations] Conversation créée avec succès:', response);
      
      // Ajouter la nouvelle conversation en tête de liste
      setConversations(prev => [response, ...prev]);
      
      return response;
      
    } catch (err: any) {
      console.error('[useConversations] Erreur lors de la création de la conversation:', err);
      const errorMessage = err.message || 'Erreur lors de la création de la conversation';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Met à jour une conversation existante
   */
  const updateConversation = useCallback(async (conversationId: string, data: UpdateConversationRequest) => {
    setError(null);
    
    try {
      const response = await conversationService.updateConversation(conversationId, data);
      
      setConversations(prev => prev.map(conv => 
        conv._id === conversationId ? { ...conv, ...response } : conv
      ));
      
      // Mettre à jour la conversation courante si c'est celle-ci
      if (currentConversation && currentConversation._id === conversationId) {
        setCurrentConversation(prev => prev ? { ...prev, ...response } : null);
      }
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour de la conversation');
    }
  }, [currentConversation]);

  /**
   * Supprime une conversation
   */
  const deleteConversation = useCallback(async (conversationId: string) => {
    setError(null);
    
    try {
      await conversationService.deleteConversation(conversationId, userId);
      
      setConversations(prev => prev.filter(conv => conv._id !== conversationId));
      
      // Désélectionner la conversation si c'est celle qui est supprimée
      if (currentConversation && currentConversation._id === conversationId) {
        setCurrentConversation(null);
      }
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression de la conversation');
    }
  }, [currentConversation, userId]);

  /**
   * Sélectionne une conversation et charge ses détails
   */
  const selectConversation = useCallback(async (conversationId: string) => {
    setError(null);
    
    try {
      // Chercher d'abord dans les conversations déjà chargées
      const existingConversation = conversations.find(conv => conv._id === conversationId);
      
      if (existingConversation) {
        setCurrentConversation(existingConversation);
      } else {
        // Charger la conversation depuis l'API
        const response: ConversationResponse = await conversationService.getConversation(conversationId);
        setCurrentConversation(response.conversation);
      }
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sélection de la conversation');
    }
  }, [conversations]);

  /**
   * Recherche des conversations
   */
  const searchConversations = useCallback(async (params: ConversationSearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: ConversationsResponse = await conversationService.searchConversations(params);
      setConversations(response.conversations);
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la recherche de conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Filtre les conversations localement
   */
  const filterConversations = useCallback((filters: ConversationFilters): Conversation[] => {
    return conversations.filter(conversation => {
      // Filtre par messages non lus
      if (filters.hasUnread !== undefined) {
        const hasUnread = (conversation.unreadCount || 0) > 0;
        if (filters.hasUnread !== hasUnread) return false;
      }
      
      // Filtre par type de conversation (groupe ou privée)
      if (filters.isGroup !== undefined && conversation.isGroup !== filters.isGroup) {
        return false;
      }
      
      // Filtre par participant spécifique
      if (filters.participantId) {
        const hasParticipant = conversationService.isUserInConversation(conversation, filters.participantId);
        if (!hasParticipant) return false;
      }
      
      // Filtre par date
      if (filters.dateFrom) {
        const conversationDate = new Date(conversation.lastActivity);
        const fromDate = new Date(filters.dateFrom);
        if (conversationDate < fromDate) return false;
      }
      
      if (filters.dateTo) {
        const conversationDate = new Date(conversation.lastActivity);
        const toDate = new Date(filters.dateTo);
        if (conversationDate > toDate) return false;
      }
      
      return true;
    });
  }, [conversations]);

  /**
   * Ajoute un participant à une conversation de groupe
   */
  const addParticipant = useCallback(async (conversationId: string, participantId: string) => {
    setError(null);
    
    try {
      const response = await conversationService.addParticipant(conversationId, userId, participantId);
      
      setConversations(prev => prev.map(conv => 
        conv._id === conversationId ? { ...conv, ...response.data } : conv
      ));
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout du participant');
    }
  }, [userId]);

  /**
   * Retire un participant d'une conversation de groupe
   */
  const removeParticipant = useCallback(async (conversationId: string, participantId: string) => {
    setError(null);
    
    try {
      const response = await conversationService.removeParticipant(conversationId, userId, participantId);
      
      setConversations(prev => prev.map(conv => 
        conv._id === conversationId ? { ...conv, ...response.data } : conv
      ));
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression du participant');
    }
  }, [userId]);

  /**
   * Vide la liste des conversations
   */
  const clearConversations = useCallback(() => {
    setConversations([]);
    setCurrentConversation(null);
    setError(null);
    setHasMore(true);
    setCurrentPage(1);
    setPagination(null);
  }, []);

  /**
   * Méthodes utilitaires
   */
  const getDisplayName = useCallback((conversation: Conversation) => {
    return conversationService.getDisplayName(conversation, userId);
  }, [userId]);

  const getConversationAvatar = useCallback((conversation: Conversation) => {
    return conversationService.getConversationAvatar(conversation, userId);
  }, [userId]);

  const isUserInConversation = useCallback((conversation: Conversation, targetUserId: string) => {
    return conversationService.isUserInConversation(conversation, targetUserId);
  }, []);

  const formatLastActivity = useCallback((lastActivity: Date | string) => {
    return conversationService.formatLastActivity(lastActivity);
  }, []);

  const calculateUnreadCount = useCallback((conversation: Conversation) => {
    return conversationService.calculateUnreadCount(conversation, userId);
  }, [userId]);

  /**
   * Chargement automatique des conversations au changement d'utilisateur
   */
  useEffect(() => {
    console.log('[useConversations] useEffect autoLoad triggered:', { 
      autoLoad, 
      userId, 
      userIdRefCurrent: userIdRef.current,
      hasConversations: conversations.length > 0 
    });
    
    if (autoLoad && userId) {
      // Vérifier si c'est la première fois ou si l'utilisateur a changé
      const isFirstLoad = !userIdRef.current || userIdRef.current === '';
      const isUserChanged = userIdRef.current && userId !== userIdRef.current;
      
      if (isFirstLoad || isUserChanged) {
        console.log('[useConversations] Déclenchement du chargement automatique:', { isFirstLoad, isUserChanged });
        userIdRef.current = userId;
        
        // Si c'est un changement d'utilisateur, vider les conversations existantes
        if (isUserChanged) {
          clearConversations();
        }
        
        // Charger seulement si pas déjà de conversations ou si l'utilisateur a changé
        if (conversations.length === 0 || isUserChanged) {
          loadConversations(userId, 1);
        }
      }
    }
  }, [userId, autoLoad, conversations.length, loadConversations, clearConversations]);

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

  return {
    // État
    conversations,
    currentConversation,
    loading,
    refreshing,
    error,
    hasMore,
    pagination,
    
    // Actions principales
    loadConversations,
    loadMoreConversations,
    createConversation,
    updateConversation,
    deleteConversation,
    selectConversation,
    clearConversations,
    
    // Actions de recherche et filtrage
    searchConversations,
    filterConversations,
    
    // Gestion des participants
    addParticipant,
    removeParticipant,
    
    // Méthodes utilitaires
    getDisplayName,
    getConversationAvatar,
    isUserInConversation,
    formatLastActivity,
    calculateUnreadCount
  };
}; 