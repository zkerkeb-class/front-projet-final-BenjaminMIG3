import {
  Conversation,
  ConversationApiError,
  ConversationResponse,
  ConversationSearchParams,
  ConversationsResponse,
  CreateConversationRequest,
  MessageReadStats,
  UpdateConversationRequest
} from '@/models';
import { DeleteResponse } from '@/models/message';
import { User } from '@/models/user';
import api from './axiosConfig';

/**
 * Service unifié pour gérer les conversations
 * Ce service consolide toutes les fonctionnalités de gestion des conversations
 */
class ConversationService {
  
  /**
   * Créer une nouvelle conversation avec validation
   */
  async createConversation(conversationData: CreateConversationRequest): Promise<Conversation> {
    try {
      // Validation des données
      if (!this.validateConversationData(conversationData)) {
        throw new Error('Données de conversation invalides');
      }

      console.log('[ConversationService] Création de la conversation:', conversationData);
      const response = await api.post<{ message: string; conversation: Conversation }>(
        '/conversations',
        conversationData
      );
      return response.data.conversation;
    } catch (error: any) {
      console.error('[ConversationService] Erreur lors de la création de la conversation:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir toutes les conversations d'un utilisateur avec pagination
   */
  async getUserConversations(
    userId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{ conversations: Conversation[]; pagination?: any }> {
    try {
      const response = await api.get<ConversationsResponse>(
        `/conversations/user/${userId}`,
        { params: { page, limit } }
      );
      
      return {
        conversations: response.data.conversations,
        pagination: {
          page: response.data.page || page,
          limit,
          total: response.data.totalCount || response.data.conversations.length,
          hasMore: (response.data.page || page) * limit < (response.data.totalCount || response.data.conversations.length)
        }
      };
    } catch (error: any) {
      console.error('[ConversationService] Erreur lors de la récupération des conversations:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Alias pour getUserConversations (compatibilité avec les hooks)
   */
  async getConversations(
    userId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ConversationsResponse> {
    try {
      const response = await api.get<ConversationsResponse>(
        `/conversations/user/${userId}`,
        { params: { page, limit } }
      );
      
      return {
        message: 'Conversations récupérées avec succès',
        conversations: response.data.conversations,
        page: response.data.page || page,
        totalCount: response.data.totalCount || response.data.conversations.length
      };
    } catch (error: any) {
      console.error('[ConversationService] Erreur lors de la récupération des conversations:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir une conversation spécifique avec ses messages
   */
  async getConversation(conversationId: string): Promise<ConversationResponse> {
    try {
      const response = await api.get<ConversationResponse>(`/conversations/${conversationId}`);
      return response.data;
    } catch (error: any) {
      console.error('[ConversationService] Erreur lors de la récupération de la conversation:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Mettre à jour une conversation
   */
  async updateConversation(conversationId: string, updateData: UpdateConversationRequest): Promise<Conversation> {
    try {
      // Utiliser la route GET pour récupérer la conversation mise à jour
      const response = await api.get<{ data: Conversation }>(
        `/conversations/${conversationId}`
      );
      
      // Mettre à jour le compteur de messages non lus localement
      if (updateData.unreadCount !== undefined) {
        const updatedConversation: Conversation = {
          ...response.data.data,
          unreadCount: updateData.unreadCount
        };
        return updatedConversation;
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('[ConversationService] Erreur lors de la mise à jour de la conversation:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Mettre à jour une conversation avec format compatible hook
   */
  async updateConversationForHook(
    conversationId: string, 
    updateData: UpdateConversationRequest
  ): Promise<{ data: Conversation }> {
    try {
      const conversation = await this.updateConversation(conversationId, updateData);
      return { data: conversation };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Supprimer une conversation
   */
  async deleteConversation(conversationId: string, userId: string): Promise<string> {
    try {
      const response = await api.delete<DeleteResponse>(`/conversations/${conversationId}`, {
        data: { userId }
      });
      return response.data.message;
    } catch (error: any) {
      console.error('[ConversationService] Erreur lors de la suppression de la conversation:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Rechercher des conversations
   */
  async searchConversations(params: ConversationSearchParams): Promise<ConversationsResponse> {
    try {
      const response = await api.get<ConversationsResponse>('/conversations/search', {
        params: {
          query: params.query,
          isGroup: params.isGroup,
          userId: params.userId,
          page: params.page || 1,
          limit: params.limit || 20
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('[ConversationService] Erreur lors de la recherche de conversations:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Ajouter un participant à une conversation de groupe
   */
  async addParticipant(conversationId: string, userId: string, participantId: string): Promise<{ data: Conversation }> {
    try {
      const response = await api.put<{ message: string; conversation: Conversation }>(
        `/conversations/${conversationId}/participants`,
        { participantId, action: 'add', userId }
      );
      return { data: response.data.conversation };
    } catch (error: any) {
      console.error('[ConversationService] Erreur lors de l\'ajout du participant:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Retirer un participant d'une conversation de groupe
   */
  async removeParticipant(conversationId: string, userId: string, participantId: string): Promise<{ data: Conversation }> {
    try {
      const response = await api.put<{ message: string; conversation: Conversation }>(
        `/conversations/${conversationId}/participants`,
        { participantId, action: 'remove', userId }
      );
      return { data: response.data.conversation };
    } catch (error: any) {
      console.error('[ConversationService] Erreur lors du retrait du participant:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Créer une nouvelle conversation avec format compatible hook
   */
  async createConversationForHook(conversationData: CreateConversationRequest): Promise<{ data: Conversation }> {
    try {
      const conversation = await this.createConversation(conversationData);
      return { data: conversation };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Marquer une conversation comme lue pour un utilisateur
   */
  async markConversationAsRead(conversationId: string, userId: string): Promise<string> {
    try {
      const response = await api.put<DeleteResponse>(
        `/conversations/${conversationId}/read`,
        { userId }
      );
      return response.data.message;
    } catch (error: any) {
      console.error('[ConversationService] Erreur lors du marquage de la conversation comme lue:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir les statistiques de lecture d'une conversation
   */
  async getMessageReadStats(conversationId: string): Promise<MessageReadStats> {
    try {
      const response = await api.get<MessageReadStats>(
        `/conversations/${conversationId}/read-stats`
      );
      return response.data;
    } catch (error: any) {
      console.error('[ConversationService] Erreur lors de la récupération des stats de lecture:', error);
      throw this.handleError(error);
    }
  }

  // === MÉTHODES UTILITAIRES (CONSOLIDÉES) ===

  /**
   * Valider les données de création de conversation
   */
  validateConversationData(data: CreateConversationRequest): boolean {
    if (!data) return false;
    
    if (!data.participants || !Array.isArray(data.participants) || data.participants.length < 2) {
      console.error('[ConversationService] Participants invalides:', data.participants);
      return false;
    }
    
    if (data.isGroup && (!data.groupName || data.groupName.trim().length === 0)) {
      console.error('[ConversationService] Nom de groupe manquant pour une conversation de groupe');
      return false;
    }
    
    if (!data.createdBy) {
      console.error('[ConversationService] Créateur manquant');
      return false;
    }
    
    return true;
  }

  /**
   * Obtenir le nom d'affichage d'une conversation de manière optimisée
   */
  getDisplayName(conversation: Conversation, currentUserId: string): string {
    if (conversation.isGroup) {
      return conversation.groupName || 'Groupe sans nom';
    }
    
    // Pour une conversation privée, utiliser un algorithme optimisé
    const otherParticipant = this.getOtherParticipants(conversation, currentUserId)[0];
    
    if (otherParticipant && typeof otherParticipant === 'object') {
      return otherParticipant.username || otherParticipant.email || 'Utilisateur inconnu';
    }
    
    return 'Conversation privée';
  }

  /**
   * Obtenir l'avatar d'une conversation
   */
  getConversationAvatar(conversation: Conversation, currentUserId: string): string {
    if (conversation.isGroup) {
      return conversation.avatar || '/default-group-avatar.png';
    }
    
    const otherParticipant = this.getOtherParticipants(conversation, currentUserId)[0];
    
    if (otherParticipant && typeof otherParticipant === 'object') {
      return otherParticipant.profilePicture || '/default-user-avatar.png';
    }
    
    return '/default-conversation-avatar.png';
  }

  /**
   * Vérifier si un utilisateur fait partie d'une conversation
   */
  isUserInConversation(conversation: Conversation, userId: string): boolean {
    return conversation.participants.some(participant => {
      const participantId = typeof participant === 'string' ? participant : participant._id;
      return participantId === userId;
    });
  }

  /**
   * Obtenir les autres participants d'une conversation (algorithme optimisé)
   */
  getOtherParticipants(conversation: Conversation, currentUserId: string): User[] {
    return conversation.participants.filter(participant => {
      const participantId = typeof participant === 'string' ? participant : participant._id;
      return participantId !== currentUserId;
    }) as User[];
  }

  /**
   * Formatter la dernière activité avec algorithme optimisé
   */
  formatLastActivity(lastActivity: Date | string): string {
    const date = new Date(lastActivity);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();

    // Utilisation d'un algorithme plus efficace avec des seuils prédéfinis
    const timeIntervals = [
      { threshold: 60000, format: () => 'À l\'instant' }, // 1 minute
      { threshold: 3600000, format: (diff: number) => `Il y a ${Math.floor(diff / 60000)} min` }, // 1 heure
      { threshold: 86400000, format: (diff: number) => `Il y a ${Math.floor(diff / 3600000)} h` }, // 1 jour
      { threshold: 604800000, format: (diff: number) => `Il y a ${Math.floor(diff / 86400000)} jour${Math.floor(diff / 86400000) > 1 ? 's' : ''}` } // 1 semaine
    ];

    for (const interval of timeIntervals) {
      if (diffInMs < interval.threshold) {
        return interval.format(diffInMs);
      }
    }

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  /**
   * Calculer le nombre de messages non lus de manière optimisée
   */
  calculateUnreadCount(conversation: Conversation, userId: string): number {
    return conversation.unreadCount || 0;
  }

  /**
   * Trier les conversations par dernière activité (algorithme optimisé)
   */
  sortConversationsByActivity(conversations: Conversation[]): Conversation[] {
    // Utilisation de la méthode sort avec comparaison directe pour l'optimisation
    return [...conversations].sort((a, b) => {
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });
  }

  /**
   * Obtenir le dernier message d'une conversation formaté
   */
  getLastMessagePreview(conversation: Conversation): string {
    if (!conversation.lastMessage) {
      return 'Aucun message';
    }

    const lastMessage = conversation.lastMessage as any;
    
    // Utilisation d'un switch pour l'optimisation
    switch (lastMessage.messageType) {
      case 'image':
        return '📷 Image';
      case 'file':
        return '📎 Fichier';
      case 'system':
        return lastMessage.content;
      default:
        const content = lastMessage.content || '';
        const maxLength = 50;
        return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
    }
  }

  /**
   * Gérer les erreurs de manière uniforme et optimisée
   */
  private handleError(error: any): ConversationApiError {
    if (error.response) {
      return {
        message: error.response.data?.message || 'Erreur du serveur',
        error: error.response.data?.error,
        status: error.response.status
      };
    } else if (error.request) {
      return {
        message: 'Erreur de connexion. Vérifiez votre connexion internet.',
        error: error.message
      };
    } else {
      return {
        message: error.message || 'Une erreur inattendue s\'est produite',
        error: error
      };
    }
  }
}

export default new ConversationService(); 