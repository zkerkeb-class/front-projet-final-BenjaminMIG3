import { IconSymbol } from '@/components/shared/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface MessageInputProps {
  conversationId: string;
  userId: string;
  onSend: (message: string) => Promise<void>;
  isSending: boolean;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export default function MessageInput({ 
  conversationId, 
  userId, 
  onSend, 
  isSending,
  onTypingStart,
  onTypingStop
}: MessageInputProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isTypingRef = useRef<boolean>(false);



  // Gestionnaire de changement de texte simplifié
  const handleTextChange = useCallback((text: string) => {
    setMessage(text);

    // Gestion du statut de frappe
    if (text.trim().length > 0) {
      // Si l'utilisateur tape et n'était pas déjà en train de taper
      if (!isTypingRef.current) {
        console.log('⌨️ [MessageInput] Commencer à taper');
        if (onTypingStart) {
          onTypingStart();
        }
        isTypingRef.current = true;
      }

      // Réinitialiser le timeout de frappe
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Arrêter automatiquement le statut de frappe après 2 secondes d'inactivité
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          console.log('⌨️ [MessageInput] Arrêter de taper (timeout)');
          if (onTypingStop) {
            onTypingStop();
          }
          isTypingRef.current = false;
        }
      }, 2000);
    } else if (text.trim().length === 0 && isTypingRef.current) {
      // Si le champ est vide et l'utilisateur était en train de taper
      console.log('⌨️ [MessageInput] Arrêter de taper (champ vide)');
      if (onTypingStop) {
        onTypingStop();
      }
      isTypingRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, [onTypingStart, onTypingStop]);

  // Arrêter le statut de frappe lors du démontage
  useEffect(() => {
    return () => {
      if (isTypingRef.current) {
        if (onTypingStop) {
          onTypingStop();
        }
        isTypingRef.current = false;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [onTypingStop]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    
    const messageToSend = message.trim();
    
    // Arrêter le statut de frappe avant d'envoyer
    if (isTypingRef.current) {
      console.log('⌨️ [MessageInput] Arrêter de taper (envoi message)');
      if (onTypingStop) {
        onTypingStop();
      }
      isTypingRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
    
    setMessage('');
    
    try {
      // Utiliser la méthode HTTP standard
      await onSend(messageToSend);
    } catch (error) {
      console.error('❌ [MessageInput] Erreur lors de l\'envoi:', error);
      // En cas d'erreur, remettre le message dans le champ
      setMessage(messageToSend);
    }
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.background,
      borderTopColor: colors.border
    }]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: colors.border
          }]}
          value={message}
          onChangeText={handleTextChange}
          placeholder={t('chat.placeholder')}
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          editable={!isSending}
        />
        

      </View>
      
      <TouchableOpacity
        style={[styles.sendButton, { 
          backgroundColor: message.trim() ? colors.primary : colors.textSecondary 
        }]}
        onPress={handleSend}
        disabled={!message.trim() || isSending}
      >
        <IconSymbol
          name="paperplane"
          size={20}
          color={colors.background}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'flex-end',
    borderTopWidth: 1,
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
  },
  input: {
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    paddingRight: 25, // Espace pour l'indicateur de connexion
  },
  connectionIndicator: {
    position: 'absolute',
    right: 15,
    top: 15,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 