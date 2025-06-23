import NotificationContainer from '@/components/notification/NotificationContainer';
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export type Notification = {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
};

export type AppEvent = 'friends_updated' | 'conversations_updated' | 'messages_updated';

type NotificationContextType = {
  notifications: Notification[];
  showNotification: (message: string, type: NotificationType, duration?: number) => void;
  hideNotification: (id: string) => void;
  // Système d'événements pour les mises à jour
  subscribeToEvent: (event: AppEvent, callback: () => void) => () => void;
  emitEvent: (event: AppEvent) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification doit être utilisé dans un NotificationProvider');
  }
  return context;
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  
  // Système d'événements
  const eventListenersRef = useRef<Map<AppEvent, Set<() => void>>>(new Map());

  const hideNotification = useCallback((id: string) => {
    // Nettoyer le timeout de cette notification
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
    
    // Utiliser une fonction de mise à jour pour éviter les re-renders inutiles
    setNotifications(prevNotifications => {
      const filtered = prevNotifications.filter(notification => notification.id !== id);
      // Éviter les mises à jour inutiles
      return filtered.length !== prevNotifications.length ? filtered : prevNotifications;
    });
  }, []);

  const showNotification = useCallback((message: string, type: NotificationType, duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification = { id, message, type, duration };
    
    // Utiliser une fonction de mise à jour stable
    setNotifications(prevNotifications => {
      // Limiter le nombre de notifications simultanées
      const updatedNotifications = [...prevNotifications, newNotification];
      return updatedNotifications.length > 5 ? updatedNotifications.slice(-5) : updatedNotifications;
    });
    
    // Créer un timeout individuel pour cette notification
    if (duration && duration > 0) {
      const timeout = setTimeout(() => {
        hideNotification(id);
      }, duration);
      timeoutsRef.current.set(id, timeout);
    }
  }, [hideNotification]);

  // Système d'événements optimisé
  const subscribeToEvent = useCallback((event: AppEvent, callback: () => void) => {
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, new Set());
    }
    eventListenersRef.current.get(event)!.add(callback);
    
    // Retourner une fonction pour se désabonner
    return () => {
      const listeners = eventListenersRef.current.get(event);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          eventListenersRef.current.delete(event);
        }
      }
    };
  }, []);

  const emitEvent = useCallback((event: AppEvent) => {
    const listeners = eventListenersRef.current.get(event);
    if (listeners) {
      // Utiliser requestAnimationFrame pour éviter les conflits avec les effets d'insertion
      requestAnimationFrame(() => {
        listeners.forEach(callback => {
          try {
            callback();
          } catch (error) {
            console.error(`Erreur lors de l'exécution du callback pour l'événement ${event}:`, error);
          }
        });
      });
    }
  }, []);

  // Nettoyage des timeouts lors du démontage du composant
  React.useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
      eventListenersRef.current.clear();
    };
  }, []);

  // Mémoiser la valeur du contexte pour éviter les re-renders inutiles
  const value = React.useMemo(() => ({
    notifications,
    showNotification,
    hideNotification,
    subscribeToEvent,
    emitEvent
  }), [notifications, showNotification, hideNotification, subscribeToEvent, emitEvent]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer 
        notifications={notifications} 
        hideNotification={hideNotification}
      />
    </NotificationContext.Provider>
  );
} 