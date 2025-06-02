import { CreateConversationModal } from '@/components/CreateConversationModal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useConversations } from '@/hooks/useConversations';
import type { Conversation } from '@/models';
import { ConversationUtils } from '@/services/conversationUtils';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Platform, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ChatsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Utiliser le hook useChat avec l'ID de l'utilisateur connecté
  const {
    conversations,
    loading,
    error,
    loadConversations,
    createConversation
    } = useConversations({ userId: user?.id || '' });

  // Filtrer les conversations en fonction de la recherche
  const filteredConversations = conversations.filter(conv => {
    if (!user?.id) return false;
    const displayName = ConversationUtils.getConversationDisplayName(conv, user.id);
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const onRefresh = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      await loadConversations(user?.id || '');
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
      showNotification(t('chat.refreshError'), 'error');
    }
  }, [isLoggedIn, loadConversations, t, showNotification]);

  // Ouvrir le détail d'une conversation
  const openChatDetail = (conversation: Conversation) => {
    if (!user?.id) return;
    
    try {
      const displayName = ConversationUtils.getConversationDisplayName(conversation, user.id);
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: conversation._id,
          name: displayName
        }
      });
    } catch (error) {
      console.error('Erreur de navigation:', error);
      showNotification(t('chat.navigationError'), 'error');
    }
  };

  // Créer une nouvelle conversation
  const handleCreateConversation = async (participantIds: string[], groupName?: string) => {
    if (!user?.id) {
      throw new Error(t('auth.userNotAuthenticated'));
    }

    try {
      // Inclure l'utilisateur actuel dans les participants pour le calcul
      const totalParticipants = [user.id, ...participantIds];
      const isGroup = totalParticipants.length > 2;
      
      const conversationData = {
        participants: totalParticipants,
        isGroup,
        createdBy: user.id,
        ...(isGroup && groupName && { groupName })
      };
      
      console.log('[handleCreateConversation] Données envoyées:', conversationData);
      const newConversation = await createConversation(conversationData);
      
      // Naviguer vers la nouvelle conversation
      const displayName = ConversationUtils.getConversationDisplayName(newConversation as Conversation, user.id);
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: newConversation?._id || '',
          name: displayName
        }
      });
    } catch (error: any) {
      console.error('Erreur lors de la création de la conversation:', error);
      throw new Error(error.message || t('chat.conversationCreateError'));
    }
  };

  // Ouvrir le modal de création
  const handleNewChat = () => {
    if (!isLoggedIn) {
      showNotification(t('auth.pleaseLogin'), 'error');
      router.push('/login');
      return;
    }
    setShowCreateModal(true);
  };

  // Rendu d'une conversation
  const renderConversation = ({ item }: { item: Conversation }) => {
    if (!user?.id) return null;
    
    const displayName = ConversationUtils.getConversationDisplayName(item, user.id);
    const lastMessagePreview = ConversationUtils.getLastMessagePreview(item);
    const formattedTime = item.lastMessage 
      ? ConversationUtils.formatMessageTime((item.lastMessage as any).timestamp)
      : ConversationUtils.formatMessageTime(item.lastActivity);

    return (
      <TouchableOpacity 
        style={[styles.conversationItem, { borderBottomColor: colors.border }]}
        onPress={() => openChatDetail(item)}
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
          </View>
          {(item.unreadCount ?? 0) > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.date, { color: colors.text }]}>
              {formattedTime}
            </Text>
          </View>
          <Text 
            style={[
              styles.lastMessage, 
              { color: (item.unreadCount ?? 0) > 0 ? colors.text : colors.text + '99' }
            ]} 
            numberOfLines={1}
          >
            {lastMessagePreview}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Affichage minimal pendant le chargement de l'authentification
  if (authLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Interface principale simplifiée
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* En-tête avec titre et bouton nouveau chat */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('navigation.chats')}
        </Text>
        {isLoggedIn && (
          <TouchableOpacity 
            style={[styles.newChatButton, { backgroundColor: colors.primary }]}
            onPress={handleNewChat}
          >
            <IconSymbol name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Barre de recherche */}
      {isLoggedIn && (
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.background }]}>
            <IconSymbol name="magnifyingglass" size={20} color={colors.text + '99'} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('chat.searchPlaceholder')}
              placeholderTextColor={colors.text + '99'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      )}

      {/* Liste des conversations */}
      {isLoggedIn && (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item._id}
          style={styles.conversationsList}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={onRefresh}
              tintColor={Platform.OS === 'ios' ? colors.primary : undefined}
              colors={Platform.OS === 'android' ? [colors.primary] : undefined}
              progressBackgroundColor={Platform.OS === 'android' ? colors.background : undefined}
            />
          }
        />
      )}

      {/* Modal de création de conversation */}
      {isLoggedIn && user && (
        <CreateConversationModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateConversation={handleCreateConversation}
          currentUserId={user.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  date: {
    fontSize: 12,
    opacity: 0.7,
  },
  lastMessage: {
    fontSize: 14,
    opacity: 0.8,
  },
});
