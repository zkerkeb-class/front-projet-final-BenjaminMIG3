import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

// Type pour les demandes d'amis
type FriendRequest = {
  id: string;
  username: string;
  time: string;
};

export default function RequestsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState<FriendRequest[]>([
    {
      id: '1',
      username: 'Sophie Mercier',
      time: 'il y a 2h',
    },
    {
      id: '2',
      username: 'Paul Durant',
      time: 'il y a 1j',
    },
  ]);

  // Accepter une demande d'ami
  const handleAccept = async (request: FriendRequest) => {
    setIsLoading(true);
    // Simuler un délai d'API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Supprimer la demande de la liste
    setRequests(current => current.filter(r => r.id !== request.id));
    
    // Afficher une notification
    showNotification(
      `${t('friends.requestAccepted')} ${request.username}`, 
      'success'
    );
    setIsLoading(false);
  };

  // Refuser une demande d'ami
  const handleDecline = async (request: FriendRequest) => {
    setIsLoading(true);
    // Simuler un délai d'API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Supprimer la demande de la liste
    setRequests(current => current.filter(r => r.id !== request.id));
    
    // Afficher une notification
    showNotification(
      `${t('friends.requestDeclined')} ${request.username}`, 
      'info'
    );
    setIsLoading(false);
  };

  // Rendu d'une demande d'ami
  const renderRequest = ({ item }: { item: FriendRequest }) => (
    <Animated.View 
      style={[styles.requestItem, { borderBottomColor: colors.border }]}
      layout={Layout.springify()}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{item.username.charAt(0)}</Text>
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={[styles.username, { color: colors.text }]}>
          {item.username}
        </Text>
        <Text style={[styles.timeText, { color: colors.text + '99' }]}>
          {item.time}
        </Text>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.acceptButton, { backgroundColor: colors.success }]}
          onPress={() => handleAccept(item)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <IconSymbol name="checkmark" size={16} color="#fff" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.declineButton, { backgroundColor: colors.error }]}
          onPress={() => handleDecline(item)}
          disabled={isLoading}
        >
          <IconSymbol name="xmark" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('navigation.requests')}
        </Text>
      </View>
      
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="person.badge.plus" size={60} color={colors.text + '33'} />
          <Text style={[styles.emptyText, { color: colors.text + '99' }]}>
            {t('friends.noRequests')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={item => item.id}
          style={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    marginRight: 5,
  },
  declineButton: {},
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
}); 