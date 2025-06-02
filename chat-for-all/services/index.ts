/**
 * Index des services - Point d'entrée unique pour tous les services
 * Cette approche améliore la maintenabilité et évite les imports multiples
 */

// Services principaux (API)
export { authService } from './api/authService';
export { default as conversationService } from './api/conversationService';
export { default as friendshipService } from './api/friendshipService';
export { default as messageService } from './api/messageService';
export { default as userService } from './api/userService';

// Utilitaires
export { ConversationUtils } from './conversationUtils';

// Configuration API
export { default as api } from './api/axiosConfig';

/**
 * Types d'exports groupés pour faciliter l'utilisation
 */
export const Services = {
  message: () => import('./api/messageService').then(m => m.default),
  conversation: () => import('./api/conversationService').then(m => m.default),
  auth: () => import('./api/authService').then(m => m.authService),
  user: () => import('./api/userService').then(m => m.default),
  friendship: () => import('./api/friendshipService').then(m => m.default),
} as const;

/**
 * Fonction utilitaire pour initialiser tous les services si nécessaire
 */
export const initializeServices = async () => {
  try {
    // Initialisation des services si nécessaire
    console.log('[Services] Services initialisés avec succès');
    return true;
  } catch (error) {
    console.error('[Services] Erreur lors de l\'initialisation des services:', error);
    return false;
  }
};

/**
 * Types d'export pour TypeScript
 */
export type {
    ChatApiError,
    DeleteResponse,
    // Types des messages
    Message, MessagePagination, MessagesResponse, SendMessageRequest,
    SendMessageResponse,
    UpdateMessageRequest,
    UpdateMessageResponse
} from '../models/message';

export type {
    // Types des conversations
    Conversation, ConversationApiError, ConversationResponse, ConversationSearchParams, ConversationsResponse,
    CreateConversationRequest,
    CreateConversationResponse,
    UpdateConversationRequest,
    UpdateConversationResponse
} from '../models/conversations';

export type {
    // Types des utilisateurs
    User
} from '../models/user';

