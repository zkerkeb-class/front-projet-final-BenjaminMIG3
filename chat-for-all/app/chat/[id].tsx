import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotification } from '@/contexts/NotificationContext';
import Animated, { FadeIn } from 'react-native-reanimated';

// Types pour les messages
type Message = {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: string;
};

export default function ChatDetailScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Récupérer les paramètres de la route dynamique
  const id = params.id as string;
  const username = params.username as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);

  // Charger les messages simulés
  useEffect(() => {
    const loadMessages = async () => {
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Messages simulés
      const dummyMessages: Message[] = [
        {
          id: '1',
          text: 'Bonjour ! Comment vas-tu ?',
          sender: 'other',
          timestamp: '10:30'
        },
        {
          id: '2',
          text: 'Ça va bien, merci ! Et toi ?',
          sender: 'user',
          timestamp: '10:31'
        },
        {
          id: '3',
          text: 'Très bien aussi. Tu es disponible pour une réunion demain ?',
          sender: 'other',
          timestamp: '10:32'
        },
        {
          id: '4',
          text: 'Oui, je suis libre demain après-midi. Quelle heure te convient ?',
          sender: 'user',
          timestamp: '10:34'
        },
        {
          id: '5',
          text: 'Est-ce que 14h te va ?',
          sender: 'other',
          timestamp: '10:35'
        }
      ];
      
      setMessages(dummyMessages);
      setIsLoading(false);
    };
    
    loadMessages();
  }, []);

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
      id: Date.now().toString(),
      text: newMessage.trim(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
    setIsSending(false);
    
    // Simuler une réponse après un délai
    setTimeout(() => {
      const responseMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: 'D\'accord, merci pour ton message !',
        sender: 'other',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, responseMsg]);
    }, 2000);
  };

  // Rendu d'un message
  const renderMessage = ({ item }: { item: Message }) => (
    <Animated.View 
      style={[
        styles.messageContainer,
        item.sender === 'user' ? styles.userMessageContainer : styles.otherMessageContainer
      ]}
      entering={FadeIn.duration(300)}
    >
      <View 
        style={[
          styles.messageBubble,
          item.sender === 'user' 
            ? [styles.userMessage, { backgroundColor: colors.primary }]
            : [styles.otherMessage, { backgroundColor: colors.card }]
        ]}
      >
        <Text 
          style={[
            styles.messageText,
            { color: item.sender === 'user' ? '#ffffff' : colors.text }
          ]}
        >
          {item.text}
        </Text>
        <Text 
          style={[
            styles.timestamp,
            { color: item.sender === 'user' ? 'rgba(255,255,255,0.7)' : colors.text + '77' }
          ]}
        >
          {item.timestamp}
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
          <Text style={styles.avatarText}>{typeof username === 'string' ? username.charAt(0) : 'U'}</Text>
        </View>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {username || 'Chat'}
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
        {renderHeader()}
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              {t('chat.loading')}
            </Text>
          </View>
        ) : (
          <View style={styles.chatContainer}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={item => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
            />
            
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
              style={styles.keyboardAvoidingContainer}
            >
              <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                  placeholder={t('chat.typeMessage')}
                  placeholderTextColor={colors.text + '66'}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity 
                  style={[
                    styles.sendButton, 
                    { backgroundColor: colors.primary },
                    !newMessage.trim() && styles.disabledButton
                  ]}
                  onPress={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <IconSymbol name="paperplane.fill" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        )}
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
  input: {
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