/**
 * Types et interfaces pour les conversations
 */

import { Message } from './message';
import { User } from './user';

// Interface pour une conversation
export interface Conversation {
  _id: string;
  participants: string[] | User[]; // ObjectIds ou objets User populés
  lastMessage?: string | Message; // ObjectId ou objet Message populé
  lastActivity: Date | string;
  isGroup: boolean;
  groupName?: string;
  createdBy: string | User; // ObjectId ou objet User populé
  updatedAt: Date | string;
  createdAt: Date | string;
  
  // Propriétés calculées côté client
  name?: string; // Nom affiché de la conversation
  avatar?: string; // Avatar de la conversation
  unreadCount?: number; // Nombre de messages non lus
}

// Interface pour la création d'une conversation
export interface CreateConversationRequest {
  participants: string[]; // Array d'ObjectIds des participants
  isGroup?: boolean;
  groupName?: string;
  createdBy: string; // ID de l'utilisateur qui crée la conversation
}

// Interface pour la mise à jour d'une conversation
export interface UpdateConversationRequest {
  groupName?: string;
  participants?: string[];
  userId: string; // ID de l'utilisateur qui modifie
  unreadCount?: number; // Nombre de messages non lus
}

// Interface pour la réponse des conversations
export interface ConversationsResponse {
  message: string;
  conversations: Conversation[];
  totalCount?: number;
  page?: number;
}

// Interface pour la réponse d'une conversation unique
export interface ConversationResponse {
  message: string;
  conversation: Conversation;
  messages?: Message[];
}

// Interface pour la réponse de création de conversation
export interface CreateConversationResponse {
  message: string;
  data: Conversation;
}

// Interface pour la réponse de mise à jour de conversation
export interface UpdateConversationResponse {
  message: string;
  data: Conversation;
}

// Interface pour la pagination des conversations
export interface ConversationPagination {
  page: number;
  limit: number;
  hasMore: boolean;
  total: number;
}

// Interface pour la recherche de conversations
export interface ConversationSearchParams {
  query?: string;
  isGroup?: boolean;
  userId: string;
  page?: number;
  limit?: number;
}

// Interface pour les paramètres de filtrage des conversations
export interface ConversationFilters {
  hasUnread?: boolean;
  isGroup?: boolean;
  participantId?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
}

// Type pour les erreurs de l'API des conversations
export interface ConversationApiError {
  message: string;
  error?: any;
  status?: number;
}

// Interface pour les méthodes utilitaires côté client
export interface ConversationUtils {
  getDisplayName(conversation: Conversation, currentUserId: string): string;
  getConversationAvatar(conversation: Conversation, currentUserId: string): string;
  isUserInConversation(conversation: Conversation, userId: string): boolean;
  getOtherParticipants(conversation: Conversation, currentUserId: string): User[];
  formatLastActivity(lastActivity: Date | string): string;
}

export interface MessageReadStats {
  unreadCount: number;
  conversationId: string;
  isGroup: boolean;
  groupName: string | null;
  lastUpdate: string;
} 