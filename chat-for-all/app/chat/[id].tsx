import ChatHeader from '@/components/chat/ChatHeader';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageInput from '@/components/chat/MessageInput';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useSocketChat } from '@/hooks/useSocketChat';
import type { Message, MessageReadStats } from '@/models';
import conversationService from '@/services/conversationService';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatDetailScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Récupérer les paramètres de la route dynamique
  const id = params.id as string;
  const name = params.name as string;
  
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Utiliser le hook useMessages
  const {
    messages,
    loading,
    error,
    sendMessage,
    loadMessages,
    loadMoreMessages,
    hasMore,
    pagination,
    markAsRead,
    clearMessages,
    addMessage,
    updateMessageReadStatus
  } = useMessages({
    conversationId: id,
    userId: user?.id || '',
    pageSize: 50,
    autoLoad: true,
    realTimeUpdates: false // Désactivé car géré par useSocketChat
  });

  // Utiliser le hook useConversations pour mettre à jour le compteur
  const { updateConversation } = useConversations({
    userId: user?.id || '',
    autoLoad: false
  });

  // État pour l'envoi de messages
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Gestionnaires d'événements WebSocket
  const handleNewSocketMessage = useCallback((data: any) => {
    console.log('📩 [ChatScreen] Nouveau message reçu via WebSocket:', data);
    
    // Convertir les données du WebSocket au format attendu par l'UI
    const newMessage: Message = {
      _id: data.messageId,
      conversation: data.conversationId,
      sender: {
        id: data.senderId,
        _id: data.senderId,
        username: data.senderInfo?.username || 'Utilisateur',
        email: data.senderInfo?.email || ''
      },
      content: data.content,
      timestamp: data.timestamp,
      messageType: 'text',
      isOwn: data.senderId === user?.id,
      status: 'delivered',
      readBy: [],
      edited: false
    };

    // Utiliser la fonction addMessage du hook useMessages
    addMessage(newMessage);

    // Défiler vers le bas pour les nouveaux messages
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [user?.id, addMessage]);

  const handleMessageRead = useCallback((data: any) => {
    console.log('👁️ [ChatScreen] Message marqué comme lu via WebSocket:', data);
    
    // Utiliser la fonction updateMessageReadStatus du hook useMessages
    updateMessageReadStatus(data.messageId, data.userId, data.timestamp);
  }, [updateMessageReadStatus]);

  const handleUserTyping = useCallback((data: any) => {
    console.log('⌨️ [ChatScreen] Utilisateur en train de taper:', data);
    setTypingUsers(prev => new Set([...prev, data.userId]));
  }, []);

  const handleUserStoppedTyping = useCallback((data: any) => {
    console.log('⌨️ [ChatScreen] Utilisateur a arrêté de taper:', data);
    setTypingUsers(prev => {
      const newSet = new Set(prev);
      newSet.delete(data.userId);
      return newSet;
    });
  }, []);

  // Utiliser le hook useSocketChat avec les gestionnaires d'événements
  const {
    isConnected,
    isReconnecting,
    sendMessage: sendSocketMessage,
    markAsRead: markSocketAsRead,
    startTyping,
    stopTyping
  } = useSocketChat({
    conversationId: id,
    userId: user?.id,
    onNewMessage: handleNewSocketMessage,
    onMessageRead: handleMessageRead,
    onUserTyping: handleUserTyping,
    onUserStoppedTyping: handleUserStoppedTyping,
    autoJoinConversation: true,
    autoMarkAsRead: false
  });

  // Ajouter un Set pour suivre les messages déjà traités
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const isMarkingAsReadRef = useRef<boolean>(false);

  // Optimiser la fonction debouncedMarkAsRead
  const debouncedMarkAsRead = useCallback(
    debounce(async (messageIds: string[]) => {
      if (!user?.id || isMarkingAsReadRef.current) return;
      
      // Filtrer les messages déjà traités
      const newMessageIds = messageIds.filter(id => !processedMessageIdsRef.current.has(id));
      if (newMessageIds.length === 0) return;
      
      isMarkingAsReadRef.current = true;
      console.log('[debouncedMarkAsRead] Marquage en masse des messages comme lus:', newMessageIds);
      
      try {
        // Marquer tous les messages via WebSocket ET HTTP
        await Promise.all(newMessageIds.map(messageId => {
          processedMessageIdsRef.current.add(messageId);
          // Marquer via WebSocket pour la synchronisation temps réel (avec conversationId)
          markSocketAsRead(messageId, id);
          // Marquer via HTTP pour la persistance
          return markAsRead(messageId);
        }));
        
        console.log('[debouncedMarkAsRead] Messages marqués comme lus avec succès');
        
        // Mettre à jour le compteur une seule fois après le marquage
        try {
          await updateConversation(id, {
            userId: user.id,
            unreadCount: 0
          });
        } catch (error) {
          console.warn('[debouncedMarkAsRead] Erreur lors de la mise à jour du compteur:', error);
        }
      } catch (error) {
        console.error('[debouncedMarkAsRead] Erreur lors du marquage en masse:', error);
        // Réinitialiser le Set en cas d'erreur pour permettre de réessayer
        newMessageIds.forEach(id => processedMessageIdsRef.current.delete(id));
      } finally {
        isMarkingAsReadRef.current = false;
      }
    }, 1000),
    [user?.id, markAsRead, markSocketAsRead, id, updateConversation]
  );

  // Pas besoin d'état local supplémentaire, on utilise directement les messages du hook

  // Charger les messages au montage du composant
  useEffect(() => {
    if (id && user?.id) {
      // Réinitialiser la référence des messages traités pour cette nouvelle conversation
      processedMessageIdsRef.current.clear();
      setTypingUsers(new Set());
      loadMessages(id);
    }
    
    // Nettoyer les messages au démontage
    return () => {
      clearMessages();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  // Optimiser l'effet de marquage automatique des messages non lus
  useEffect(() => {
    if (!user?.id || messages.length === 0 || isMarkingAsReadRef.current) return;
    
    const unreadMessages = messages.filter((message: Message) => {
      const senderId = typeof message.sender === 'object' 
        ? message.sender._id || message.sender.id 
        : message.sender;
      
      const isUnread = senderId !== user.id && 
             !message.readBy?.some((read: any) => read.user === user.id) &&
             !processedMessageIdsRef.current.has(message._id);

      return isUnread;
    });
    
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((m: Message) => m._id);
      debouncedMarkAsRead(messageIds);
    }
  }, [messages, user?.id, debouncedMarkAsRead]);

  // Nettoyer les références au démontage
  useEffect(() => {
    return () => {
      processedMessageIdsRef.current.clear();
      isMarkingAsReadRef.current = false;
    };
  }, []);

  // Afficher les erreurs via les notifications
  useEffect(() => {
    if (error) {
      showNotification(error, 'error');
    }
  }, [error, showNotification]);

  // Défiler automatiquement vers le bas lorsque de nouveaux messages sont ajoutés
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, loading]);

  // Envoyer un nouveau message
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !user?.id || isSending) return;
    
    setIsSending(true);
    
    try {
      // Essayer d'envoyer via WebSocket en premier pour une meilleure réactivité
      const socketSent = sendSocketMessage(message.trim());
      
      if (!socketSent) {
        // Fallback vers HTTP si WebSocket n'est pas disponible
        console.log('⚠️ [ChatScreen] WebSocket non disponible, utilisation HTTP');
        await sendMessage({
          conversationId: id,
          content: message.trim(),
          messageType: 'text'
        });
      }
      
      showNotification(t('chat.messageSent'), 'success');
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message:', error);
      showNotification(error.message || t('chat.sendError'), 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Gestionnaire pour les événements de frappe
  const handleTypingStart = useCallback(() => {
    startTyping();
  }, [startTyping]);

  const handleTypingStop = useCallback(() => {
    stopTyping();
  }, [stopTyping]);

  // Ajouter l'état pour les stats de lecture
  const [readStats, setReadStats] = useState<MessageReadStats | null>(null);

  // Ajouter la fonction pour charger les stats
  const loadReadStats = useCallback(async () => {
    if (!id || !user?.id) return;
    
    try {
      const stats = await conversationService.getMessageReadStats(id);
      setReadStats(stats);
    } catch (error) {
      console.error('[ChatDetailScreen] Erreur lors du chargement des stats:', error);
    }
  }, [id, user?.id]);

  // Charger les stats au montage et après chaque nouveau message
  useEffect(() => {
    loadReadStats();
  }, [loadReadStats, messages.length]);

  const insets = useSafeAreaInsets();

  // Remplacer le rendu du header
  const renderHeader = () => (
    <ChatHeader
      title={name}
      onInfoPress={() => {
        router.push({
          pathname: '/chat/info/[id]',
          params: { id, name }
        });
      }}
    />
  );

  // Remplacer le rendu du message
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = typeof item.sender === 'object' 
      ? item.sender._id === user?.id || item.sender.id === user?.id
      : item.sender === user?.id;

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        showReadStatus={isOwnMessage}
      />
    );
  };

  // Écran de chargement si pas d'utilisateur
  if (!user) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>
          {t('auth.pleaseLogin')}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      {renderHeader()}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messageList}
            onEndReached={() => {
              if (hasMore && !loading) {
                loadMoreMessages();
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => (
              <View style={styles.listFooter}>
                {/* Indicateur de connexion WebSocket */}
                <View style={styles.connectionStatus}>
                  <View style={[
                    styles.connectionDot,
                    { backgroundColor: isConnected ? '#4CAF50' : (isReconnecting ? '#FF9800' : '#F44336') }
                  ]} />
                  <Text style={[styles.connectionText, { color: colors.textSecondary }]}>
                    {isConnected ? 'Connecté' : (isReconnecting ? 'Reconnexion...' : 'Déconnecté')}
                  </Text>
                </View>
                
                {/* Indicateur de frappe */}
                {typingUsers.size > 0 && (
                  <View style={[styles.typingIndicator, { backgroundColor: colors.card }]}>
                    <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                      {typingUsers.size === 1 
                        ? 'Quelqu\'un est en train d\'écrire...'
                        : `${typingUsers.size} personnes sont en train d'écrire...`
                      }
                    </Text>
                  </View>
                )}
                
                {/* Indicateur de chargement pour plus de messages */}
                {loading && hasMore && (
                  <View style={styles.loadMoreIndicator}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.loadMoreText, { color: colors.textSecondary }]}>
                      Chargement des messages...
                    </Text>
                  </View>
                )}
              </View>
            )}
          />
          
          <MessageInput
            conversationId={id}
            userId={user?.id || ''}
            onSend={handleSendMessage}
            isSending={isSending}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
          />
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  listFooter: {
    paddingBottom: 10,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    opacity: 0.8,
  },
  typingIndicator: {
    margin: 8,
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  loadMoreIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  loadMoreText: {
    marginLeft: 8,
    fontSize: 12,
  },
}); 