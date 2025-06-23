import { PushNotificationData, pushNotificationService } from '@/services';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';

export interface UsePushNotificationsReturn {
  expoPushToken: string | null;
  isInitialized: boolean;
  sendLocalNotification: (notification: PushNotificationData) => Promise<void>;
  sendPushNotification: (expoPushToken: string, notification: PushNotificationData) => Promise<void>;
  scheduleLocalNotification: (
    notification: PushNotificationData,
    trigger: Notifications.NotificationTriggerInput
  ) => Promise<void>;
  cancelAllScheduledNotifications: () => Promise<void>;
  setBadgeCount: (count: number) => Promise<void>;
  getScheduledNotifications: () => Promise<Notifications.NotificationRequest[]>;
}

export interface NotificationTranslations {
  default: string;
  messages: string;
  friends: string;
}

/**
 * Hook personnalisé pour gérer les notifications push
 * Fournit une interface simple pour utiliser le service de notifications
 */
export const usePushNotifications = (translations?: NotificationTranslations): UsePushNotificationsReturn => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialisation du service
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        await pushNotificationService.initialize(translations);
        const token = pushNotificationService.getExpoPushToken();
        setExpoPushToken(token);
        setIsInitialized(true);
        console.log('[usePushNotifications] Service initialisé avec succès');
      } catch (error) {
        console.error('[usePushNotifications] Erreur lors de l\'initialisation:', error);
        setIsInitialized(false);
      }
    };

    initializeNotifications();
  }, [translations]);

  // Fonctions wrapper pour le service
  const sendLocalNotification = useCallback(async (notification: PushNotificationData) => {
    try {
      await pushNotificationService.sendLocalNotification(notification);
    } catch (error) {
      console.error('[usePushNotifications] Erreur lors de l\'envoi de la notification locale:', error);
      throw error;
    }
  }, []);

  const sendPushNotification = useCallback(async (expoPushToken: string, notification: PushNotificationData) => {
    try {
      await pushNotificationService.sendPushNotification(expoPushToken, notification);
    } catch (error) {
      console.error('[usePushNotifications] Erreur lors de l\'envoi de la notification push:', error);
      throw error;
    }
  }, []);

  const scheduleLocalNotification = useCallback(async (
    notification: PushNotificationData,
    trigger: Notifications.NotificationTriggerInput
  ) => {
    try {
      await pushNotificationService.scheduleLocalNotification(notification, trigger);
    } catch (error) {
      console.error('[usePushNotifications] Erreur lors de la programmation de la notification:', error);
      throw error;
    }
  }, []);

  const cancelAllScheduledNotifications = useCallback(async () => {
    try {
      await pushNotificationService.cancelAllScheduledNotifications();
    } catch (error) {
      console.error('[usePushNotifications] Erreur lors de l\'annulation des notifications:', error);
      throw error;
    }
  }, []);

  const setBadgeCount = useCallback(async (count: number) => {
    try {
      await pushNotificationService.setBadgeCount(count);
    } catch (error) {
      console.error('[usePushNotifications] Erreur lors de la mise à jour du badge:', error);
      throw error;
    }
  }, []);

  const getScheduledNotifications = useCallback(async () => {
    try {
      return await pushNotificationService.getScheduledNotifications();
    } catch (error) {
      console.error('[usePushNotifications] Erreur lors de la récupération des notifications:', error);
      return [];
    }
  }, []);

  return {
    expoPushToken,
    isInitialized,
    sendLocalNotification,
    sendPushNotification,
    scheduleLocalNotification,
    cancelAllScheduledNotifications,
    setBadgeCount,
    getScheduledNotifications,
  };
}; 