import type { Notification } from '@/contexts/NotificationContext';
import React from 'react';
import { Dimensions, Platform, StatusBar, StyleSheet, View } from 'react-native';
import NotificationItem from './NotificationItem';


interface NotificationContainerProps {
  notifications: Notification[];
  hideNotification: (id: string) => void;
}

export default function NotificationContainer({ 
  notifications, 
  hideNotification 
}: NotificationContainerProps) {
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
});
