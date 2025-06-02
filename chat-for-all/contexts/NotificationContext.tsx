import { IconSymbol } from '@/components/ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { Animated, ColorValue, Dimensions, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

type Notification = {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
};

type NotificationContextType = {
  notifications: Notification[];
  showNotification: (message: string, type: NotificationType, duration?: number) => void;
  hideNotification: (id: string) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification doit être utilisé avec un NotificationProvider');
  }
  return context;
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, type: NotificationType, duration = 4000) => {
    const id = Date.now().toString();
    const newNotification = { id, message, type, duration };
    
    setNotifications(prevNotifications => [...prevNotifications, newNotification]);
    
    // Supprimer automatiquement la notification après la durée spécifiée
    if (duration > 0) {
      setTimeout(() => {
        hideNotification(id);
      }, duration);
    }
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  }, []);

  const value = {
    notifications,
    showNotification,
    hideNotification
  };

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

// Composant qui affiche les notifications
function NotificationContainer({ 
  notifications, 
  hideNotification 
}: { 
  notifications: Notification[], 
  hideNotification: (id: string) => void 
}) {
  return (
    <View style={styles.container}>
      {notifications.map(notification => (
        <NotificationItem 
          key={notification.id}
          notification={notification}
          onClose={() => hideNotification(notification.id)}
        />
      ))}
    </View>
  );
}

function NotificationItem({ 
  notification, 
  onClose 
}: { 
  notification: Notification, 
  onClose: () => void 
}) {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const bounceAnim = React.useRef(new Animated.Value(0)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    // Animation d'entrée sophistiquée
    Animated.sequence([
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Petit bounce pour attirer l'attention
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Animation de la barre de progression
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: notification.duration || 4000,
      useNativeDriver: false,
    }).start();
  }, []);

  const getGradientColors = () => {
    switch (notification.type) {
      case 'success':
        return ['#4ade80', '#22c55e', '#16a34a'];
      case 'error':
        return ['#f87171', '#ef4444', '#dc2626'];
      case 'warning':
        return ['#fbbf24', '#f59e0b', '#d97706'];
      case 'info':
      default:
        return ['#60a5fa', '#3b82f6', '#2563eb'];
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return 'checkmark.circle.fill';
      case 'error':
        return 'xmark.circle.fill';
      case 'warning':
        return 'exclamationmark.triangle.fill';
      case 'info':
      default:
        return 'info.circle.fill';
    }
  };

  const getIconBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'rgba(34, 197, 94, 0.2)';
      case 'error':
        return 'rgba(239, 68, 68, 0.2)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.2)';
      case 'info':
      default:
        return 'rgba(59, 130, 246, 0.2)';
    }
  };

  const handleClose = () => {
    // Animation de sortie
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  return (
    <Animated.View 
      style={[
        styles.notificationWrapper,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
            { 
              translateY: bounceAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -5]
              })
            }
          ],
          opacity: opacityAnim,
        }
      ]}
    >
      <LinearGradient
        colors={getGradientColors() as [ColorValue, ColorValue, ColorValue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.notification}
      >
        {/* Overlay glassmorphique */}
        <View style={styles.glassOverlay} />
        
        {/* Contenu principal */}
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: getIconBackgroundColor() }]}>
            <IconSymbol name={getIcon()} color="#fff" size={28} />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.message}>{notification.message}</Text>
          </View>
          
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <View style={styles.closeButtonBackground}>
              <IconSymbol name="xmark" color="#fff" size={16} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <Animated.View 
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['100%', '0%']
                })
              }
            ]}
          />
        </View>

        {/* Effets lumineux pour success */}
        {notification.type === 'success' && (
          <View style={styles.sparkleContainer}>
            <Animated.View 
              style={[
                styles.sparkle,
                styles.sparkle1,
                {
                  opacity: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1]
                  })
                }
              ]}
            />
            <Animated.View 
              style={[
                styles.sparkle,
                styles.sparkle2,
                {
                  opacity: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.8]
                  })
                }
              ]}
            />
            <Animated.View 
              style={[
                styles.sparkle,
                styles.sparkle3,
                {
                  opacity: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.6]
                  })
                }
              ]}
            />
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const { width: screenWidth } = Dimensions.get('window');
const notificationWidth = screenWidth > 500 ? 400 : screenWidth - 32;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? (StatusBar.currentHeight || 44) + 10 : 60,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: 16,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  notificationWrapper: {
    width: notificationWidth,
    marginVertical: 8,
  },
  notification: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonBackground: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  sparkleContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  sparkle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  sparkle1: {
    top: 15,
    right: 25,
  },
  sparkle2: {
    top: 35,
    right: 45,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sparkle3: {
    top: 25,
    right: 35,
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
}); 