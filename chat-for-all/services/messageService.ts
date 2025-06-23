import {
  ChatApiError,
  DeleteResponse,
  Message,
  MessagePagination,
  MessagesResponse,
  SendMessageRequest,
  SendMessageResponse,
  UpdateMessageRequest,
  UpdateMessageResponse
} from '@/models/message';
import api from '@/services/axiosConfig';

/**
 * Service unifié pour gérer les messages
 * Ce service consolide toutes les fonctionnalités de gestion des messages
 */
class MessageService {

  /**
   * Envoyer un nouveau message
   */
  async sendMessage(messageData: SendMessageRequest): Promise<Message> {
    try {
      if (!this.validateMessageContent(messageData.content, messageData.messageType)) {
        throw new Error('Contenu du message invalide');
      }

      const response = await api.post<SendMessageResponse>('/messages', messageData);
      return response.data.data;
    } catch (error: any) {
      console.error('[MessageService] Erreur lors de l\'envoi du message:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir les messages d'une conversation avec pagination optimisée
   */
  async getMessages(
    conversationId: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<{ messages: Message[]; pagination?: MessagePagination }> {
    try {
      const response = await api.get<MessagesResponse>(
        `/messages/${conversationId}`,
        { params: { page, limit } }
      );
      
      const pagination: MessagePagination = {
        page: response.data.page || page,
        limit,
        total: response.data.totalCount || response.data.messages.length,
        hasMore: (response.data.page || page) * limit < (response.data.totalCount || response.data.messages.length)
      };

      return {
        messages: response.data.messages,
        pagination
      };
    } catch (error: any) {
      console.error('[MessageService] Erreur lors de la récupération des messages:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Mettre à jour un message
   */
  async updateMessage(messageId: string, updateData: UpdateMessageRequest): Promise<Message> {
    try {
      if (!this.validateMessageContent(updateData.content || '')) {
        throw new Error('Contenu du message invalide');
      }

      const response = await api.put<UpdateMessageResponse>(`/messages/${messageId}`, updateData);
      return response.data.data;
    } catch (error: any) {
      console.error('[MessageService] Erreur lors de la mise à jour du message:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Supprimer un message
   */
  async deleteMessage(messageId: string, userId: string): Promise<string> {
    try {
      const response = await api.delete<DeleteResponse>(`/messages/${messageId}`, {
        data: { userId }
      });
      return response.data.message;
    } catch (error: any) {
      console.error('[MessageService] Erreur lors de la suppression du message:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Marquer un message comme lu
   */
  async markMessageAsRead(messageId: string, userId: string): Promise<Message> {
    try {
      const response = await api.patch<{ message: string; data: Message }>(
        `/messages/${messageId}/read`
      );
      return response.data.data;
    } catch (error: any) {
      console.error('[MessageService] Erreur lors du marquage du message comme lu:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Marquer tous les messages d'une conversation comme lus
   */
  async markAllMessagesAsRead(conversationId: string, userId: string): Promise<string> {
    try {
      const response = await api.put<DeleteResponse>(
        `/messages/conversation/${conversationId}/read-all`
      );
      return response.data.message;
    } catch (error: any) {
      console.error('[MessageService] Erreur lors du marquage de tous les messages comme lus:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtenir le nombre de messages non lus dans une conversation
   */
  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    try {
      const response = await api.get<{ count: number }>(
        `/messages/conversation/${conversationId}/unread-count`,
        { params: { userId } }
      );
      return response.data.count;
    } catch (error: any) {
      console.error('[MessageService] Erreur lors de la récupération du nombre de messages non lus:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Rechercher des messages dans une conversation
   */
  async searchMessages(
    conversationId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ messages: Message[]; pagination?: MessagePagination }> {
    try {
      const response = await api.get<MessagesResponse>(
        `/messages/conversation/${conversationId}/search`,
        { params: { q: searchTerm, page, limit } }
      );
      
      const pagination: MessagePagination = {
        page: response.data.page || page,
        limit,
        total: response.data.totalCount || response.data.messages.length,
        hasMore: (response.data.page || page) * limit < (response.data.totalCount || response.data.messages.length)
      };

      return {
        messages: response.data.messages,
        pagination
      };
    } catch (error: any) {
      console.error('[MessageService] Erreur lors de la recherche de messages:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Télécharger un fichier joint à un message
   */
  async downloadAttachment(messageId: string, fileId: string): Promise<string> {
    try {
      const response = await api.get<{ downloadUrl: string }>(
        `/messages/${messageId}/attachments/${fileId}/download`
      );
      return response.data.downloadUrl;
    } catch (error: any) {
      console.error('[MessageService] Erreur lors du téléchargement de la pièce jointe:', error);
      throw this.handleError(error);
    }
  }

  // === MÉTHODES UTILITAIRES (CONSOLIDÉES) ===

  /**
   * Vérifier si un message a été lu par un utilisateur
   */
  isMessageReadBy(message: Message, userId: string): boolean {
    return message.readBy?.some(read => read.user === userId) || false;
  }

  /**
   * Formater l'horodatage d'un message de manière optimisée
   */
  formatTimestamp(timestamp: Date | string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();

    // Utilisation d'une approche plus efficace algorithmiquement
    const intervals = [
      { label: 'À l\'instant', threshold: 60000 }, // 1 minute
      { label: 'min', threshold: 3600000, unit: 60000 }, // 1 heure
      { label: 'h', threshold: 86400000, unit: 3600000 }, // 1 jour
      { label: 'j', threshold: 604800000, unit: 86400000 } // 1 semaine
    ];

    for (const interval of intervals) {
      if (diffInMs < interval.threshold) {
        if (interval.label === 'À l\'instant') return interval.label;
        const value = Math.floor(diffInMs / interval.unit!);
        return `Il y a ${value} ${interval.label}`;
      }
    }

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  /**
   * Détermine le statut d'un message de manière optimisée
   */
  getMessageStatus(message: Message, currentUserId: string): 'sent' | 'delivered' | 'read' {
    const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
    
    if (senderId !== currentUserId) {
      return 'delivered';
    }

    // Algorithme optimisé pour déterminer le statut
    const readByCount = message.readBy?.length || 0;
    
    if (readByCount > 1) { // > 1 car l'expéditeur est automatiquement dans readBy
      return 'read';
    } else if (readByCount === 1) {
      return 'delivered';
    }
    
    return 'sent';
  }

  /**
   * Valider le contenu d'un message avec validation optimisée
   */
  validateMessageContent(content: string, messageType: string = 'text'): boolean {
    if (!content) return false;
    
    switch (messageType) {
      case 'text':
        const trimmedContent = content.trim();
        return trimmedContent.length > 0 && trimmedContent.length <= 2000;
      case 'image':
      case 'file':
        return content.length > 0;
      default:
        return true;
    }
  }

  /**
   * Générer un ID temporaire optimisé pour les messages
   */
  generateTempMessageId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Grouper les messages par date de manière efficace
   */
  groupMessagesByDate(messages: Message[]): Map<string, Message[]> {
    const groups = new Map<string, Message[]>();
    
    for (const message of messages) {
      const dateKey = new Date(message.timestamp).toDateString();
      
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      
      groups.get(dateKey)!.push(message);
    }
    
    return groups;
  }

  /**
   * Gérer les erreurs de manière uniforme et optimisée
   */
  private handleError(error: any): ChatApiError {
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

export default new MessageService(); 