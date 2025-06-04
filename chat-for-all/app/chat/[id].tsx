import { IconSymbol } from '@/components/ui/IconSymbol';
import { MessageReadStatus } from '@/components/MessageReadStatus';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useMessages } from '@/hooks/useMessages';
import { useConversations } from '@/hooks/useConversations';
import type { Message, MessageReadStats } from '@/models';
import { ConversationUtils } from '@/services/conversationUtils';
import conversationService from '@/services/api/conversationService';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { debounce } from 'lodash';

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

  // Utiliser le hook useMessages pour la gestion des messages
  const {
    messages,
    loading: isLoading,
    error,
    sendMessage,
    loadMessages,
    markAsRead,
    clearMessages
  } = useMessages({
    conversationId: id,
    userId: user?.id || '',
    pageSize: 50,
    autoLoad: false,
    realTimeUpdates: true
  });

  // Utiliser le hook useConversations pour mettre à jour le compteur
  const { updateConversation } = useConversations({
    userId: user?.id || '',
    autoLoad: false
  });

  // État pour l'envoi de messages
  const [isSending, setIsSending] = useState(false);

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
        // Marquer tous les messages en une seule fois
        await Promise.all(newMessageIds.map(messageId => {
          processedMessageIdsRef.current.add(messageId);
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
          // Ne pas propager l'erreur car le marquage des messages a réussi
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
    
    const unreadMessages = messages.filter(message => {
      const senderId = typeof message.sender === 'object' 
        ? message.sender._id || message.sender.id 
        : message.sender;
      
      const isUnread = senderId !== user.id && 
             !message.readBy?.some(read => read.user === user.id) &&
             !processedMessageIdsRef.current.has(message._id);

      return isUnread;
    });
    
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(m => m._id);
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
    if (messages.length > 0 && !isLoading) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isLoading]);

  // Envoyer un nouveau message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id || isSending) return;
    
    setIsSending(true);
    
    try {
      await sendMessage({
        conversationId: id,
        content: newMessage.trim(),
        messageType: 'text'
      });
      
      setNewMessage('');
      showNotification(t('chat.messageSent'), 'success');
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message:', error);
      showNotification(error.message || t('chat.sendError'), 'error');
    } finally {
      setIsSending(false);
    }
  };

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

  // Rendu d'un message
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const senderId = typeof item.sender === 'object' ? item.sender._id || item.sender.id : item.sender;
    const senderName = typeof item.sender === 'object' ? item.sender.username : 'Utilisateur';
    const isOwn = senderId === user?.id;
    const isLastMessage = index === messages.length - 1;
    
    return (
      <Animated.View 
        style={[
          styles.messageContainer,
          isOwn ? styles.userMessageContainer : styles.otherMessageContainer
        ]}
        entering={FadeIn.duration(300)}
      >
        <View style={styles.messageWrapper}>
          <View 
            style={[
              styles.messageBubble,
              isOwn 
                ? [styles.userMessage, { 
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.3,
                    elevation: 3,
                  }]
                : [styles.otherMessage, { 
                    backgroundColor: colors.card,
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    elevation: 2,
                  }]
            ]}
          >
            {!isOwn && (
              <Text style={[styles.senderName, { color: colors.text }]}>
                {senderName}
              </Text>
            )}
            <Text 
              style={[
                styles.messageText,
                { 
                  color: isOwn ? '#ffffff' : colors.text,
                  fontWeight: '500'
                }
              ]}
            >
              {item.content}
            </Text>
            <Text 
              style={[
                styles.timestamp,
                { 
                  color: isOwn ? 'rgba(255,255,255,0.9)' : colors.text + '99',
                  fontSize: 12,
                  fontWeight: '500'
                }
              ]}
            >
              {ConversationUtils.formatMessageTime(item.timestamp)}
            </Text>
          </View>
          {isOwn && (
            <View style={[
              styles.readStatusContainer,
              isOwn ? styles.userReadStatus : styles.otherReadStatus
            ]}>
              <MessageReadStatus
                message={item}
                currentUserId={user?.id || ''}
                isLastMessage={isLastMessage}
              />
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  // Header de la conversation
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <IconSymbol name="chevron.left" size={24} color={colors.primary} />
      </TouchableOpacity>
      
      <View style={styles.headerInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{typeof name === 'string' ? name.charAt(0) : 'U'}</Text>
        </View>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {name || 'Chat'}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.infoButton}
        onPress={() => showNotification(t('chat.profileInfo'), 'info')}
      >
        <IconSymbol name="info.circle" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

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
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        
        {/* Header */}
        {renderHeader()}
        
        {/* Messages */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              {t('chat.loading')}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item._id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            inverted={false}
          />
        )}
        
        {/* Zone de saisie */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}
        >
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.background, 
                color: colors.text,
                borderColor: colors.border
              }]}
              placeholder={t('chat.placeholder')}
              placeholderTextColor={colors.text + '66'}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              numberOfLines={1}
              maxLength={2000}
              editable={!isSending}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                { 
                  backgroundColor: newMessage.trim() && !isSending ? colors.primary : colors.text + '33',
                  opacity: isSending ? 0.6 : 1
                }
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <IconSymbol name="arrow.up" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 10,
    flexGrow: 1,
  },
  messageWrapper: {
    position: 'relative',
    maxWidth: '85%',
  },
  messageContainer: {
    marginVertical: 6,
    paddingHorizontal: 4,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  userMessage: {
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 20,
  },
  otherMessage: {
    borderTopLeftRadius: 4,
    borderBottomRightRadius: 20,
  },
  senderName: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '600',
    opacity: 0.9,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  readStatusContainer: {
    position: 'absolute',
    bottom: -12,
    right: -8,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  userReadStatus: {
    right: -8,
  },
  otherReadStatus: {
    right: -8,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  }
}); 