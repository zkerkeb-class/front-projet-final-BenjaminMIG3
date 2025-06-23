import { IconSymbol } from '@/components/shared/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface MessageInputProps {
  onSend: (message: string) => Promise<void>;
  isSending: boolean;
}

export default function MessageInput({ onSend, isSending }: MessageInputProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    const messageToSend = message.trim();
    setMessage('');
    await onSend(messageToSend);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextInput
        style={[styles.input, { 
          backgroundColor: colors.card,
          color: colors.text,
          borderColor: colors.border
        }]}
        value={message}
        onChangeText={setMessage}
        placeholder={t('chat.placeholder')}
        placeholderTextColor={colors.textSecondary}
        multiline
        maxLength={1000}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        editable={!isSending}
      />
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
    alignItems: 'center',
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 