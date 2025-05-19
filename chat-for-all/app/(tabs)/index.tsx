import { StyleSheet, View, Text, TouchableOpacity, FlatList, TextInput, RefreshControl, Platform } from 'react-native';
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';

// Type pour les conversations
type Conversation = {
  id: string;
  username: string;
  lastMessage: string;
  date: string;
  unread: number;
};

export default function ChatsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Données de conversations simulées
  const conversations: Conversation[] = [
    {
      id: '1',
      username: 'Alice Martin',
      lastMessage: 'On se voit demain ?',
      date: '10:30',
      unread: 2,
    },
    {
      id: '2',
      username: 'Thomas Dupont',
      lastMessage: 'J\'ai envoyé le document par email',
      date: 'Hier',
      unread: 0,
    },
    {
      id: '3',
      username: 'Marie Leroy',
      lastMessage: 'Merci pour ton aide',
      date: 'Hier',
      unread: 1,
    },
    {
      id: '4',
      username: 'Groupe Projet',
      lastMessage: 'Lucas: On fait une réunion lundi',
      date: '18/05',
      unread: 0,
    },
  ];

  // Filtrer les conversations en fonction de la recherche
  const filteredConversations = conversations.filter(conv => 
    conv.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // TODO: Implémenter le rafraîchissement des conversations
      // await refreshConversations();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation d'un appel API
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
      showNotification(t('chat.refreshError'), 'error');
    } finally {
      setRefreshing(false);
    }
  }, [t, showNotification]);

  // Ouvrir le détail d'une conversation
  const openChatDetail = (conversation: Conversation) => {
    try {
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: conversation.id,
          username: conversation.username
        }
      });
    } catch (error) {
      console.error('Erreur de navigation:', error);
      showNotification(t('chat.navigationError'), 'error');
    }
  };

  // Rendu d'une conversation
  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity 
      style={[styles.conversationItem, { borderBottomColor: colors.border }]}
      onPress={() => openChatDetail(item)}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{item.username.charAt(0)}</Text>
        </View>
        {item.unread > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.error }]}>
            <Text style={styles.badgeText}>{item.unread}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
            {item.username}
          </Text>
          <Text style={[styles.date, { color: colors.text }]}>
            {item.date}
          </Text>
        </View>
        <Text 
          style={[
            styles.lastMessage, 
            { color: item.unread > 0 ? colors.text : colors.text + '99' }
          ]} 
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Créer une nouvelle conversation
  const handleNewChat = () => {
    // Dans une vraie application, on ouvrirait un modal ou une page pour sélectionner un contact
    console.log('Création d\'une nouvelle conversation');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('navigation.chats')}
        </Text>
        <TouchableOpacity 
          style={[styles.newChatButton, { backgroundColor: colors.primary }]}
          onPress={handleNewChat}
        >
          <IconSymbol name="square.and.pencil" size={20} color="#fff" />
        </TouchableOpacity>
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
      
      {filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="bubble.left.and.bubble.right" size={60} color={colors.text + '33'} />
          <Text style={[styles.emptyText, { color: colors.text + '99' }]}>
            {t('chat.empty')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={item => item.id}
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Platform.OS === 'ios' ? colors.primary : undefined}
              colors={Platform.OS === 'android' ? [colors.primary] : undefined}
              progressBackgroundColor={Platform.OS === 'android' ? colors.background : undefined}
            />
          }
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
  newChatButton: {
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
  conversationItem: {
    flexDirection: 'row',
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
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  date: {
    fontSize: 14,
    color: '#999',
  },
  lastMessage: {
    fontSize: 14,
    marginRight: 30,
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
});
