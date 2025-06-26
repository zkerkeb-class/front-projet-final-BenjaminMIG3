/**
 * Index des hooks - Point d'entrée unique pour tous les hooks personnalisés
 */

// Hooks de base
export { useColorScheme } from './useColorScheme';
export { useColorScheme as useColorSchemeWeb } from './useColorScheme.web';
export { usePageFocus } from './usePageFocus';
export { useThemeColor } from './useThemeColor';
export { useToast } from './useToast';

// Hooks métier
export { useConversations } from './useConversations';
export { useFriendRequests, useFriends, useSendFriendRequest } from './useFriendship';
export { useMessages } from './useMessages';

// Hooks de notifications
export { usePushNotifications } from './usePushNotifications';
export type { UsePushNotificationsReturn } from './usePushNotifications';



