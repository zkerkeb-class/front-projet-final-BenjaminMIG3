import { Conversation } from '@/models';
import { Message } from '@/models/message';
import { User } from '@/models/user';

/**
 * Classe utilitaire optimisée pour les conversations
 * Contient uniquement les utilitaires spécialisés qui ne sont pas dans les services principaux
 */
export class ConversationUtils {
  
  /**
   * Générer le nom d'affichage d'une conversation (compatible avec les anciennes implémentations)
   * @deprecated Utiliser conversationService.getDisplayName() à la place
   */
  static getConversationDisplayName(conversation: Conversation, currentUserId: string): string {
    if (conversation.isGroup) {
      return conversation.groupName || 'Groupe sans nom';
    }
    
    const participants = conversation.participants as User[];
    const otherParticipant = participants.find(p => 
      (typeof p === 'object' ? p.id : p) !== currentUserId
    );
    
    if (otherParticipant && typeof otherParticipant === 'object') {
      return otherParticipant.username || otherParticipant.email || 'Utilisateur inconnu';
    }
    
    return 'Conversation privée';
  }

  /**
   * Obtenir l'avatar d'une conversation (compatible avec les anciennes implémentations)
   * @deprecated Utiliser conversationService.getConversationAvatar() à la place
   */
  static getConversationAvatar(conversation: Conversation, currentUserId: string): string | null {
    if (conversation.isGroup) {
      return conversation.avatar || null;
    }
    
    const participants = conversation.participants as User[];
    const otherParticipant = participants.find(p => 
      (typeof p === 'object' ? p.id : p) !== currentUserId
    );
    
    if (otherParticipant && typeof otherParticipant === 'object') {
      return otherParticipant.profilePicture || null;
    }
    
    return null;
  }

  /**
   * Calculer le nombre de messages non lus dans une conversation (version locale)
   * Utilise les messages locaux plutôt que l'API
   */
  static getUnreadCount(messages: Message[], currentUserId: string): number {
    let count = 0;
    
    for (const message of messages) {
      const senderId = typeof message.sender === 'object' ? message.sender.id : message.sender;
      
      // Ne pas compter ses propres messages
      if (senderId === currentUserId) continue;
      
      // Vérifier si le message n'a pas été lu
      const isRead = message.readBy?.some(read => read.user === currentUserId);
      if (!isRead) count++;
    }
    
    return count;
  }

  /**
   * Formater la date d'un message (version compacte)
   * Version courte utilisée dans les listes
   */
  static formatMessageTime(timestamp: Date | string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'À l\'instant';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}min`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else if (diffInDays < 7) {
      return `${diffInDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  }

  /**
   * Formater la date complète d'un message (version étendue)
   */
  static formatFullMessageTime(timestamp: Date | string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  /**
   * Vérifier si un message a été lu par l'utilisateur (version locale)
   * @deprecated Utiliser messageService.isMessageReadBy() à la place
   */
  static isMessageReadBy(message: Message, userId: string): boolean {
    return message.readBy?.some(read => read.user === userId) || false;
  }

  /**
   * Vérifier si un message appartient à l'utilisateur
   */
  static isOwnMessage(message: Message, userId: string): boolean {
    if (typeof message.sender === 'object') {
      return message.sender.id === userId;
    }
    return message.sender === userId;
  }

  /**
   * Obtenir le statut d'un message avec participants complets
   */
  static getMessageStatus(
    message: Message, 
    currentUserId: string, 
    allParticipants: User[]
  ): 'sent' | 'delivered' | 'read' {
    if (!this.isOwnMessage(message, currentUserId)) {
      return 'delivered';
    }

    const otherParticipants = allParticipants.filter(p => p.id !== currentUserId);
    
    if (otherParticipants.length === 0) {
      return 'sent';
    }

    const hasBeenRead = otherParticipants.some(participant => 
      message.readBy?.some(read => read.user === participant.id)
    );

    return hasBeenRead ? 'read' : 'delivered';
  }

  /**
   * Grouper les messages par date (version Map optimisée)
   */
  static groupMessagesByDate(messages: Message[]): Map<string, Message[]> {
    const groups = new Map<string, Message[]>();
    
    for (const message of messages) {
      const date = new Date(message.timestamp);
      const dateKey = date.toDateString();
      
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      
      groups.get(dateKey)!.push(message);
    }
    
    return groups;
  }

  /**
   * Grouper les messages par date (version Object pour compatibilité)
   */
  static groupMessagesByDateObject(messages: Message[]): { [date: string]: Message[] } {
    return messages.reduce((groups, message) => {
      const date = new Date(message.timestamp);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(message);
      return groups;
    }, {} as { [date: string]: Message[] });
  }

  /**
   * Trier les conversations par dernière activité (version locale)
   * @deprecated Utiliser conversationService.sortConversationsByActivity() à la place
   */
  static sortConversationsByActivity(conversations: Conversation[]): Conversation[] {
    return [...conversations].sort((a, b) => {
      const dateA = new Date(a.lastActivity);
      const dateB = new Date(b.lastActivity);
      return dateB.getTime() - dateA.getTime();
    });
  }

  /**
   * Obtenir le dernier message d'une conversation formaté (version locale)
   * @deprecated Utiliser conversationService.getLastMessagePreview() à la place
   */
  static getLastMessagePreview(conversation: Conversation): string {
    if (!conversation.lastMessage) {
      return 'Aucun message';
    }

    const lastMessage = conversation.lastMessage as Message;
    
    if (lastMessage.messageType === 'image') {
      return '📷 Image';
    } else if (lastMessage.messageType === 'file') {
      return '📎 Fichier';
    } else if (lastMessage.messageType === 'system') {
      return lastMessage.content;
    }
    
    const maxLength = 50;
    const content = lastMessage.content || '';
    
    if (content.length > maxLength) {
      return content.substring(0, maxLength) + '...';
    }
    
    return content;
  }

  /**
   * Valider le contenu d'un message (version locale)
   * @deprecated Utiliser messageService.validateMessageContent() à la place
   */
  static validateMessageContent(content: string, messageType: string = 'text'): boolean {
    if (messageType === 'text') {
      return content.trim().length > 0 && content.length <= 2000;
    }
    
    return content.length > 0;
  }

  /**
   * Générer un ID temporaire pour un message optimistique (version locale)
   * @deprecated Utiliser messageService.generateTempMessageId() à la place
   */
  static generateTempMessageId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Filtrer les conversations par critères multiples (utilitaire spécialisé)
   */
  static filterConversations(
    conversations: Conversation[], 
    filters: {
      hasUnread?: boolean;
      isGroup?: boolean;
      participantIds?: string[];
      searchTerm?: string;
    }
  ): Conversation[] {
    return conversations.filter(conversation => {
      // Filtrer par messages non lus
      if (filters.hasUnread !== undefined) {
        const hasUnread = (conversation.unreadCount || 0) > 0;
        if (filters.hasUnread !== hasUnread) return false;
      }

      // Filtrer par type de conversation
      if (filters.isGroup !== undefined) {
        if (filters.isGroup !== conversation.isGroup) return false;
      }

      // Filtrer par participants spécifiques
      if (filters.participantIds && filters.participantIds.length > 0) {
        const conversationParticipantIds = conversation.participants.map(p => 
          typeof p === 'string' ? p : p._id
        );
        const hasAllParticipants = filters.participantIds.every(id => 
          conversationParticipantIds.includes(id)
        );
        if (!hasAllParticipants) return false;
      }

      // Filtrer par terme de recherche
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const nameMatch = conversation.groupName?.toLowerCase().includes(searchLower);
        const participantMatch = conversation.participants.some(p => {
          if (typeof p === 'object') {
            return p.username?.toLowerCase().includes(searchLower) || 
                   p.email?.toLowerCase().includes(searchLower);
          }
          return false;
        });
        
        if (!nameMatch && !participantMatch) return false;
      }

      return true;
    });
  }
} 