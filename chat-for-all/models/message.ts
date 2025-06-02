/**
 * Types et interfaces pour les messages
 */

import { User } from './user';

// Interface pour un message lu par un utilisateur
export interface MessageReadBy {
  user: string; // ObjectId de l'utilisateur
  readAt: Date | string;
}

// Interface complète pour un message
export interface Message {
  _id: string;
  conversation: string; // ObjectId de la conversation
  sender: string | User; // ObjectId ou objet User populé
  content: string;
  timestamp: Date | string;
  readBy: MessageReadBy[];
  messageType: 'text' | 'image' | 'file' | 'system';
  edited: boolean;
  editedAt?: Date | string;
  
  // Propriétés calculées côté client
  isOwn?: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

// Interface pour l'envoi d'un message
export interface SendMessageRequest {
  conversationId: string;
  senderId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'system';
}

// Interface pour la mise à jour d'un message
export interface UpdateMessageRequest {
  content: string;
  userId: string;
}

// Interface pour marquer un message comme lu
export interface MarkMessageAsReadRequest {
  userId: string;
}

// Interface pour la réponse des messages
export interface MessagesResponse {
  message: string;
  messages: Message[];
  totalCount?: number;
  page?: number;
}

// Interface pour la réponse d'envoi de message
export interface SendMessageResponse {
  message: string;
  data: Message;
}

// Interface pour la réponse de mise à jour de message
export interface UpdateMessageResponse {
  message: string;
  data: Message;
}

// Interface pour la réponse de suppression
export interface DeleteResponse {
  message: string;
}

// Interface pour la pagination des messages
export interface MessagePagination {
  page: number;
  limit: number;
  hasMore: boolean;
  total: number;
}

// Interface pour les méthodes utilitaires côté client
export interface MessageUtils {
  isReadBy(message: Message, userId: string): boolean;
  formatTimestamp(timestamp: Date | string): string;
  getMessageStatus(message: Message, currentUserId: string): 'sent' | 'delivered' | 'read';
}

// Type pour les erreurs de validation des messages
export interface MessageValidationError {
  field: string;
  message: string;
}

// Type pour les erreurs de l'API
export interface ChatApiError {
  message: string;
  error?: any;
  status?: number;
}