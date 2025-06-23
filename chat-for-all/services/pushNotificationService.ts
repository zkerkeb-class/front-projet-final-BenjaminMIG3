import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  badge?: number;
  channelId?: string;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private expoPushToken: string | null = null;
  private foregroundSubscription: { remove: () => void } | null = null;
  private responseSubscription: { remove: () => void } | null = null;

  private constructor() {}

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Initialise le service de notifications
   */
  public async initialize(translations?: {
    default: string;
    messages: string;
    friends: string;
  }): Promise<void> {
    try {
      console.log('Initialisation du service de notifications push...');
      
      // Vérifier les permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Permissions de notifications non accordées');
        return;
      }

      // Obtenir le token Expo
      if (Device.isDevice) {
        this.expoPushToken = (await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })).data;
        console.log('Token Expo obtenu:', this.expoPushToken);
      }

      // Configurer les canaux Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels(translations);
      }

      // Configurer les listeners
      this.setupNotificationListeners();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des notifications:', error);
    }
  }

  /**
   * Configure les canaux de notifications pour Android
   */
  private async setupAndroidChannels(translations?: {
    default: string;
    messages: string;
    friends: string;
  }): Promise<void> {
    const defaultTranslations = {
      default: 'Messages',
      messages: 'Messages de chat',
      friends: 'Demandes d\'amis'
    };

    const t = translations || defaultTranslations;

    await Notifications.setNotificationChannelAsync('default', {
      name: t.default,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('messages', {
      name: t.messages,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('friends', {
      name: t.friends,
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });
  }

  /**
   * Configure les listeners de notifications
   */
  private setupNotificationListeners(): void {
    // Listener pour les notifications reçues quand l'app est en premier plan
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification reçue en premier plan:', notification);
      // Ici vous pouvez gérer l'affichage d'une notification locale
    });

    // Listener pour les notifications cliquées
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification cliquée:', response);
      // Ici vous pouvez naviguer vers l'écran approprié
      this.handleNotificationResponse(response);
    });

    // Stockage des subscriptions pour nettoyage ultérieur
    this.foregroundSubscription = foregroundSubscription;
    this.responseSubscription = responseSubscription;
  }

  /**
   * Gère la réponse aux notifications
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data;
    
    if (data?.type === 'message' && data?.conversationId) {
      // Naviguer vers la conversation
      // Vous devrez implémenter la navigation ici
      console.log('Navigation vers la conversation:', data.conversationId);
    } else if (data?.type === 'friend_request') {
      // Naviguer vers les demandes d'amis
      console.log('Navigation vers les demandes d\'amis');
    }
  }

  /**
   * Envoie une notification locale
   */
  public async sendLocalNotification(notification: PushNotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound ? 'default' : undefined,
          badge: notification.badge,
        },
        trigger: null, // Notification immédiate
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification locale:', error);
    }
  }

  /**
   * Envoie une notification locale programmée
   */
  public async scheduleLocalNotification(
    notification: PushNotificationData,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound ? 'default' : undefined,
          badge: notification.badge,
        },
        trigger,
      });
    } catch (error) {
      console.error('Erreur lors de la programmation de la notification:', error);
    }
  }

  /**
   * Obtient le token push Expo
   */
  public getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Envoie une notification push via le serveur Expo
   */
  public async sendPushNotification(
    expoPushToken: string,
    notification: PushNotificationData
  ): Promise<void> {
    try {
      const message = {
        to: expoPushToken,
        sound: notification.sound ? 'default' : undefined,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        badge: notification.badge,
        channelId: notification.channelId || 'default',
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      console.log('Notification push envoyée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification push:', error);
      throw error;
    }
  }

  /**
   * Annule toutes les notifications programmées
   */
  public async cancelAllScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Toutes les notifications programmées ont été annulées');
    } catch (error) {
      console.error('Erreur lors de l\'annulation des notifications:', error);
    }
  }

  /**
   * Obtient les notifications programmées
   */
  public async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications programmées:', error);
      return [];
    }
  }

  /**
   * Met à jour le badge de l'application
   */
  public async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du badge:', error);
    }
  }
}

// Export de l'instance singleton
export const pushNotificationService = PushNotificationService.getInstance(); 