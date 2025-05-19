import { StyleSheet, View, Text, TouchableOpacity, FlatList, TextInput } from 'react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';

// Type pour les amis
type Friend = {
  id: string;
  username: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
};

export default function FriendsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');

  // Données d'amis simulées
  const friends: Friend[] = [
    {
      id: '1',
      username: 'Alice Martin',
      status: 'online',
    },
    {
      id: '2',
      username: 'Thomas Dupont',
      status: 'away',
      lastSeen: '1h',
    },
    {
      id: '3',
      username: 'Marie Leroy',
      status: 'offline',
      lastSeen: 'Hier',
    },
    {
      id: '4',
      username: 'Lucas Bernard',
      status: 'online',
    },
    {
      id: '5',
      username: 'Sophie Moreau',
      status: 'online',
    },
    {
      id: '6',
      username: 'Gabriel Petit',
      status: 'offline',
      lastSeen: '2 jours',
    },
    {
      id: '7',
      username: 'Emma Dubois',
      status: 'away',
      lastSeen: '30m',
    },
    {
      id: '8',
      username: 'Hugo Lambert',
      status: 'online',
    },
    {
      id: '9',
      username: 'Camille Roux',
      status: 'offline',
      lastSeen: 'La semaine dernière',
    },
    {
      id: '10',
      username: 'Léa Fournier',
      status: 'away',
      lastSeen: '15m',
    },
  ];

  // Filtrer les amis en fonction de la recherche
  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Obtenir la couleur du statut
  const getStatusColor = (status: Friend['status']) => {
    switch (status) {
      case 'online':
        return colors.success;
      case 'away':
        return colors.warning;
      case 'offline':
        return '#999';
      default:
        return '#999';
    }
  };

  // Action pour démarrer une conversation
  const startConversation = (friend: Friend) => {
    try {
      showNotification(`${t('chat.startingConversation')} ${friend.username}`, 'info');
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: friend.id,
          username: friend.username
        }
      });
    } catch (error) {
      console.error('Erreur de navigation:', error);
      showNotification(t('chat.navigationError'), 'error');
    }
  };

  // Voir le profil d'un ami
  const viewFriendProfile = (friend: Friend) => {
    showNotification(`${t('friends.viewingProfile')} ${friend.username}`, 'info');
    // Ici, vous pourriez naviguer vers une page de profil
  };

  // Rendu d'un ami
  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity 
      style={[styles.friendItem, { borderBottomColor: colors.border }]}
      onPress={() => viewFriendProfile(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{item.username.charAt(0)}</Text>
        </View>
        <View 
          style={[
            styles.statusIndicator, 
            { backgroundColor: getStatusColor(item.status) }
          ]} 
        />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={[styles.username, { color: colors.text }]}>
          {item.username}
        </Text>
        <Text style={[styles.statusText, { color: colors.text + '99' }]}>
          {item.status === 'online' 
            ? t('friends.online') 
            : item.status === 'away'
              ? `${t('friends.away')} · ${t('friends.lastSeen')} ${item.lastSeen}`
              : `${t('friends.offline')} · ${t('friends.lastSeen')} ${item.lastSeen}`
          }
        </Text>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
          onPress={() => startConversation(item)}
        >
          <IconSymbol name="message.fill" size={16} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.card, marginLeft: 10 }]}
          onPress={() => viewFriendProfile(item)}
        >
          <IconSymbol name="info.circle.fill" size={16} color={colors.text + '77'} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Action pour ajouter un ami
  const handleAddFriend = () => {
    showNotification(t('friends.addFriendRequest'), 'info');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('navigation.friends')}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: colors.card }]}
            onPress={() => router.push('/requests')}
          >
            <IconSymbol name="bell.fill" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddFriend}
          >
            <IconSymbol name="person.badge.plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.background }]}>
          <IconSymbol name="magnifyingglass" size={16} color={colors.text + '99'} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('chat.search')}
            placeholderTextColor={colors.text + '66'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={16} color={colors.text + '99'} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {filteredFriends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="person.2" size={60} color={colors.text + '33'} />
          <Text style={[styles.emptyText, { color: colors.text + '99' }]}>
            {searchQuery.length > 0 
              ? t('friends.noFriendsFound') 
              : t('friends.noFriends')
            }
          </Text>
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.emptyButtonText}>{t('general.clearSearch')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          renderItem={renderFriend}
          keyExtractor={item => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          contentContainerStyle={styles.listContent}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    height: 40,
  },
  list: {
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
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
  statusIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
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
  statusText: {
    fontSize: 14,
  },
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
}); 