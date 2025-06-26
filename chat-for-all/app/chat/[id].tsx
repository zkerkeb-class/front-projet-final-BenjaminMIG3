import ChatHeader from '@/components/chat/ChatHeader';
import MessageBubble from '@/components/chat/MessageBubble';
import MessageEditModal from '@/components/chat/MessageEditModal';
import MessageInput from '@/components/chat/MessageInput';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';

import type { Message, MessageReadStats } from '@/models';
import conversationService from '@/services/conversationService';
import messageService from '@/services/messageService';
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

  // État pour la modal d'édition
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [messageToEdit, setMessageToEdit] = useState<Message | null>(null);

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
    realTimeUpdates: false
  });

  // Utiliser le hook useConversations pour mettre à jour le compteur
  const { updateConversation } = useConversations({
    userId: user?.id || '',
    autoLoad: false
  });

  // État pour l'envoi de messages
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Ajouter un Set pour suivre les messages déjà traités
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const isMarkingAsReadRef = useRef<boolean>(false);

  // États pour gérer le scroll initial
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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
        // Marquer tous les messages via HTTP
        await Promise.all(newMessageIds.map(messageId => {
          processedMessageIdsRef.current.add(messageId);
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
    [user?.id, markAsRead, id, updateConversation]
  );

  // Charger les messages au montage du composant
  useEffect(() => {
    if (id && user?.id) {
      // Réinitialiser la référence des messages traités pour cette nouvelle conversation
      processedMessageIdsRef.current.clear();
      setTypingUsers(new Set());
      setHasScrolledToBottom(false);
      setIsInitialLoad(true);
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

  // Défiler automatiquement vers le bas - logique améliorée
  useEffect(() => {
    if (messages.length > 0) {
      // Pour le chargement initial, toujours scroller vers le bas
      if (isInitialLoad && !loading) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false }); // Pas d'animation pour le chargement initial
          setHasScrolledToBottom(true);
          setIsInitialLoad(false);
        }, 200); // Délai plus long pour s'assurer que la liste est bien rendue
      }
      // Pour les nouveaux messages, scroller avec animation
      else if (!isInitialLoad && !loading) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }
  }, [messages.length, loading, isInitialLoad]);

  // Scroll additionnel quand la FlatList est complètement montée
  const handleFlatListLayout = useCallback(() => {
    if (messages.length > 0 && !hasScrolledToBottom) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
        setHasScrolledToBottom(true);
      }, 100);
    }
  }, [messages.length, hasScrolledToBottom]);

  // Envoyer un nouveau message
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !user?.id || isSending) return;
    
    setIsSending(true);
    
    try {
      // Envoyer via HTTP
      await sendMessage({
        conversationId: id,
        content: message.trim(),
        messageType: 'text'
      });
      
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
    // Typing events removed with WebSocket
  }, []);

  const handleTypingStop = useCallback(() => {
    // Typing events removed with WebSocket
  }, []);

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

  // Fonction pour gérer l'édition d'un message
  const handleEditMessage = (message: Message) => {
    setMessageToEdit(message);
    setEditModalVisible(true);
  };

  // Fonction pour sauvegarder les modifications
  const handleSaveEditedMessage = async (messageId: string, newContent: string) => {
    if (!user?.id) return;
    
    // Vérifier le délai de 15 minutes côté client aussi
    const messageToEdit = messages.find(msg => msg._id === messageId);
    if (messageToEdit) {
      const messageTime = new Date(messageToEdit.timestamp);
      const currentTime = new Date();
      const timeDifferenceInMinutes = (currentTime.getTime() - messageTime.getTime()) / (1000 * 60);
      
      if (timeDifferenceInMinutes > 15) {
        showNotification(t('chat.editMessage.timeExpired'), 'error');
        throw new Error(t('chat.editMessage.timeExpired'));
      }
    }
    
    try {
      const updatedMessage = await messageService.updateMessage(messageId, {
        content: newContent,
        userId: user.id,
      });
      
      // Mettre à jour le message dans la liste locale
      const updatedMessages = messages.map(msg => 
        msg._id === messageId ? { ...msg, ...updatedMessage } : msg
      );
      
      // Vous pourriez avoir besoin d'une fonction pour mettre à jour les messages dans le hook
      // Pour l'instant, on recharge les messages
      await loadMessages(id);
      
      showNotification(t('chat.editMessage.success'), 'success');
    } catch (error: any) {
      console.error('[ChatDetailScreen] Erreur lors de la mise à jour du message:', error);
      throw error; // Relancer l'erreur pour que la modal puisse la gérer
    }
  };

  // Fonction pour fermer la modal
  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setMessageToEdit(null);
  };

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
        onEditMessage={handleEditMessage}
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
            onLayout={handleFlatListLayout}
            onContentSizeChange={() => {
              // Scroll automatique quand le contenu change de taille
              if (messages.length > 0) {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 50);
              }
            }}
            onEndReached={() => {
              if (hasMore && !loading) {
                loadMoreMessages();
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => (
              <View style={styles.listFooter}>
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

      {/* Modal d'édition de message */}
      <MessageEditModal
        visible={editModalVisible}
        message={messageToEdit}
        onClose={handleCloseEditModal}
        onSave={handleSaveEditedMessage}
      />
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