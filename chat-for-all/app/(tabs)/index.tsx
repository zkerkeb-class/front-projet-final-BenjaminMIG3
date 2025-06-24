import CreateConversationModal from '@/components/chat/CreateConversationModal';
import { IconSymbol } from '@/components/shared/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useConversations } from '@/hooks/useConversations';
import { usePageFocus } from '@/hooks/usePageFocus';

import type { Conversation, MessageReadStats } from '@/models';
import conversationService from '@/services/conversationService';
import { ConversationUtils } from '@/services/conversationUtils';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Platform, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut
} from 'react-native-reanimated';

export default function ChatsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showNotification, subscribeToEvent } = useNotification();
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  
  // La connexion WebSocket est maintenant gérée automatiquement par le SocketContext
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [readStatsMap, setReadStatsMap] = useState<Record<string, MessageReadStats>>({});
  const initialLoadDoneRef = useRef(false);

  // Utiliser le hook useChat avec l'ID de l'utilisateur connecté
  const {
    conversations,
    loading,
    loadConversations,
    createConversation,
    refreshing,
    refreshConversations
  } = useConversations({ 
    userId: user?.id || '', 
    autoLoad: true
  });

  // Fonction unique pour charger les stats de lecture
  const loadReadStats = useCallback(async (conversationId: string) => {
    if (!user?.id) return;
    try {
      console.log('📊 [ChatsScreen] Chargement des stats pour la conversation:', conversationId);
      const stats = await conversationService.getMessageReadStats(conversationId);
      setReadStatsMap(prev => ({
        ...prev,
        [conversationId]: stats
      }));
      console.log('📊 [ChatsScreen] Stats chargées avec succès pour:', conversationId);
    } catch (error) {
      console.error('❌ [ChatsScreen] Erreur lors du chargement des stats:', error);
    }
  }, [user?.id]);

  // Fonction unique pour rafraîchir toutes les données
  const refreshAllData = useCallback(async () => {
    if (!isLoggedIn || !user?.id || refreshing) {
      console.log('🔄 [ChatsScreen] Refresh ignoré - conditions non remplies:', {
        isLoggedIn,
        hasUserId: !!user?.id,
        isRefreshing: refreshing
      });
      return;
    }
    
    console.log('🔄 [ChatsScreen] Début du refresh complet');
    try {
      // Charger les conversations avec la nouvelle fonction
      console.log('🔄 [ChatsScreen] Chargement des conversations');
      await refreshConversations();
      
      // Charger les stats de lecture pour chaque conversation
      const conversationsToUpdate = conversations.length > 0 
        ? conversations 
        : (await conversationService.getConversations(user.id)).conversations;
      
      if (Array.isArray(conversationsToUpdate)) {
        console.log('🔄 [ChatsScreen] Chargement des stats pour', conversationsToUpdate.length, 'conversations');
        await Promise.all(
          conversationsToUpdate.map((conv: Conversation) => loadReadStats(conv._id))
        );
        console.log('🔄 [ChatsScreen] Toutes les stats ont été chargées');
      }
    } catch (error) {
      console.error('❌ [ChatsScreen] Erreur lors du rafraîchissement:', error);
      showNotification(t('chat.refreshError'), 'error');
    }
  }, [isLoggedIn, user?.id, refreshConversations, loadReadStats, conversations, refreshing, showNotification, t]);

  // Utiliser le hook usePageFocus pour gérer le chargement des données
  const { forceRefresh } = usePageFocus({
    onFocus: refreshAllData,
    enabled: isLoggedIn && !!user?.id,
    dependencies: [isLoggedIn, user?.id, refreshing, conversations.length]
  });

  // Gestionnaire de rafraîchissement manuel
  const onRefresh = useCallback(async () => {
    console.log('🔄 [ChatsScreen] Pull-to-refresh déclenché');
    try {
      await refreshAllData();
      console.log('🔄 [ChatsScreen] Pull-to-refresh terminé avec succès');
    } catch (error) {
      console.error('❌ [ChatsScreen] Erreur lors du pull-to-refresh:', error);
    }
  }, [refreshAllData]);

  // Réinitialiser le flag de chargement initial lors de la déconnexion
  useEffect(() => {
    if (!isLoggedIn) {
      initialLoadDoneRef.current = false;
    }
  }, [isLoggedIn]);

  // Écouter les événements de mise à jour des amis pour rafraîchir les conversations
  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;

    const unsubscribe = subscribeToEvent('friends_updated', async () => {
      console.log('🔄 [ChatsScreen] Événement friends_updated reçu, rafraîchissement des conversations');
      try {
        await refreshConversations();
        console.log('🔄 [ChatsScreen] Conversations rafraîchies après mise à jour des amis');
      } catch (error) {
        console.error('❌ [ChatsScreen] Erreur lors du rafraîchissement après mise à jour des amis:', error);
      }
    });

    return unsubscribe;
  }, [isLoggedIn, user?.id, refreshConversations, subscribeToEvent]);

  // Charger les stats de lecture quand les conversations changent
  useEffect(() => {
    if (conversations.length > 0 && user?.id) {
      console.log('🔄 [ChatsScreen] Conversations mises à jour, chargement des stats pour', conversations.length, 'conversations');
      conversations.forEach((conv: Conversation) => {
        if (!readStatsMap[conv._id]) {
          loadReadStats(conv._id);
        }
      });
    }
  }, [conversations, user?.id, loadReadStats, readStatsMap]);

  // Filtrer les conversations en fonction de la recherche
  const filteredConversations = conversations.filter(conv => {
    if (!user?.id) return false;
    const displayName = ConversationUtils.getConversationDisplayName(conv, user.id);
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
              throw new Error(t('auth.pleaseLogin'));
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
      
      // Rafraîchir la liste des conversations pour s'assurer qu'elle est à jour
      console.log('[handleCreateConversation] Rafraîchissement des conversations après création');
      await refreshConversations();
      
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
    
    // Utiliser les stats de lecture pour le compteur
    const readStats = readStatsMap[item._id];
    const hasUnread = readStats?.unreadCount ? readStats.unreadCount > 0 : false;
    const unreadCount = readStats?.unreadCount || 0;

    return (
      <TouchableOpacity 
        style={[styles.conversationItem, { borderBottomColor: colors.border }]}
        onPress={() => openChatDetail(item)}
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
          </View>
          {hasUnread && (
            <Animated.View 
              style={[styles.badge, { backgroundColor: colors.error }]}
              entering={FadeIn.duration(200).springify()}
              exiting={FadeOut.duration(200).springify()}
            >
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </Animated.View>
          )}
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text 
              style={[
                styles.username, 
                { 
                  color: colors.text,
                  fontWeight: hasUnread ? 'bold' : 'normal'
                }
              ]} 
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text style={[styles.date, { color: colors.text }]}>
              {formattedTime}
            </Text>
          </View>
          <Text 
            style={[
              styles.lastMessage, 
              { 
                color: hasUnread ? colors.text : colors.text + '99',
                fontWeight: hasUnread ? '600' : 'normal'
              }
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
        <>
          {(loading || refreshing) && conversations.length === 0 ? (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                {t('chat.loadingConversations')}
              </Text>
            </View>
          ) : conversations.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
              <IconSymbol name="message" size={60} color={colors.text + '40'} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {t('chat.noConversations')}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.text + '80' }]}>
                {t('chat.startConversation')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredConversations}
              renderItem={renderConversation}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={Platform.OS === 'ios' ? colors.primary : undefined}
                  colors={Platform.OS === 'android' ? [colors.primary] : undefined}
                  progressBackgroundColor={Platform.OS === 'android' ? colors.background : undefined}
                  progressViewOffset={20}
                />
              }
            />
          )}
        </>
      )}

      {/* Modal de création de conversation */}
      {isLoggedIn && user && (
        <CreateConversationModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateConversation={handleCreateConversation}
          currentUserId={user?.id || ''}
          existingConversations={conversations}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
  },
});
