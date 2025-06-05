import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useMessages } from '@/hooks/useMessages';
import { useConversations } from '@/hooks/useConversations';
import type { Message, MessageReadStats } from '@/models';
import conversationService from '@/services/api/conversationService';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { debounce } from 'lodash';
import { ChatHeader, MessageBubble, MessageInput } from '@/modules/chat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatDetailScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { user } = useAuth();
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
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !user?.id || isSending) return;
    
    setIsSending(true);
    
    try {
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
        // TODO: Implémenter la navigation vers les détails de la conversation
        console.log('Info pressed');
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
      
      {isLoading ? (
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
              // TODO: Implémenter le chargement des messages plus anciens
              console.log('End reached');
            }}
            onEndReachedThreshold={0.5}
          />
          
          <MessageInput
            onSend={handleSendMessage}
            isSending={isSending}
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
}); 