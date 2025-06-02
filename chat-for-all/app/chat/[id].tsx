import { IconSymbol } from '@/components/ui/IconSymbol';
import { useNotification } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { Message, User } from '@/models';
import { ConversationUtils } from '@/services/conversationUtils';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function ChatDetailScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Récupérer les paramètres de la route dynamique
  const id = params.id as string;
  const name = params.name as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);

  // Utilisateur simulé pour les messages
  const currentUser: User = { id: 'current', username: 'Moi', email: 'me@example.com' };
  const otherUser: User = { id: 'other', username: name || 'Utilisateur', email: 'other@example.com' };

  // Charger les messages simulés
  useEffect(() => {
    const loadMessages = async () => {
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Initialiser avec un tableau vide - plus de messages simulés
      setMessages([]);
      setIsLoading(false);
    };
    
    loadMessages();
  }, [id]);

  // Défiler automatiquement vers le bas lorsque de nouveaux messages sont ajoutés
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages, isLoading]);

  // Envoyer un nouveau message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setIsSending(true);
    
    // Simuler un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newMsg: Message = {
      _id: Date.now().toString(),
      conversation: id,
      sender: currentUser,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      readBy: [],
      messageType: 'text',
      edited: false,
      isOwn: true
    };
    
    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
    setIsSending(false);
    
    // Plus de simulation de réponse automatique
  };

  // Rendu d'un message
  const renderMessage = ({ item }: { item: Message }) => (
    <Animated.View 
      style={[
        styles.messageContainer,
        item.isOwn ? styles.userMessageContainer : styles.otherMessageContainer
      ]}
      entering={FadeIn.duration(300)}
    >
      <View 
        style={[
          styles.messageBubble,
          item.isOwn 
            ? [styles.userMessage, { backgroundColor: colors.primary }]
            : [styles.otherMessage, { backgroundColor: colors.card }]
        ]}
      >
        <Text 
          style={[
            styles.messageText,
            { color: item.isOwn ? '#ffffff' : colors.text }
          ]}
        >
          {item.content}
        </Text>
        <Text 
          style={[
            styles.timestamp,
            { color: item.isOwn ? 'rgba(255,255,255,0.7)' : colors.text + '77' }
          ]}
        >
          {ConversationUtils.formatMessageTime(item.timestamp)}
        </Text>
      </View>
    </Animated.View>
  );

  // Header de la conversation
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.card }]}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => {
          // Utiliser navigation.goBack pour une meilleure gestion de la navigation
          router.back();
        }}
      >
        <IconSymbol name="chevron.left" size={24} color={colors.primary} />
      </TouchableOpacity>
      
      <View style={styles.headerInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{typeof name === 'string' ? name.charAt(0) : 'U'}</Text>
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {name || 'Chat'}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.infoButton}
        onPress={() => showNotification(t('chat.profileInfo'), 'info')}
      >
        <IconSymbol name="info.circle" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

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
          />
        )}
        
        {/* Zone de saisie */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={[styles.inputContainer, { backgroundColor: colors.card }]}
        >
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]}
              placeholder={t('chat.placeholder')}
              placeholderTextColor={colors.text + '66'}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              numberOfLines={1}
              maxLength={2000}
              editable={!isSending}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                { 
                  backgroundColor: newMessage.trim() ? colors.primary : colors.text + '33',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)', // Utiliser colors.border serait mieux
  },
  backButton: {
    padding: 5,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center', // Pour centrer si pas d'autres boutons
    marginHorizontal: 10, // Espace pour les boutons de chaque côté
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
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 10,
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 18,
  },
  userMessage: {
    borderTopRightRadius: 5,
  },
  otherMessage: {
    borderTopLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right', // Les timestamps à droite dans la bulle
  },
  keyboardAvoidingContainer: {
    // Pas de style spécifique ici, géré par KAV
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)', // Utiliser colors.border
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120, // Limiter la hauteur pour le multiline
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1, // Optionnel : pour mieux voir le champ
    borderColor: 'rgba(0,0,0,0.1)', // Utiliser colors.border
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
}); 