/**
 * Interfaces et types relatifs à l'interface utilisateur et à la navigation
 */

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Types pour les toasts
export type ToastType = 'success' | 'error' | 'info';

// Types pour les thèmes
export type ThemeType = 'light' | 'dark' | 'system';

// Interface pour les couleurs du thème
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  notification: string;
  error: string;
  success: string;
  info: string;
  warning: string;
  inputBackground: string;
}

// Interface pour le contexte du thème
export interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (theme: ThemeType) => void;
}

// Type pour les notifications
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  timestamp: Date;
  read?: boolean;
}

// Interface pour le contexte des notifications
export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
}

// Types pour la navigation
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Chat: { id: string; name: string };
}

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>; 