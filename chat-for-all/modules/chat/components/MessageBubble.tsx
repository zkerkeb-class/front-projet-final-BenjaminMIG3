import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Message } from '@/models';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import MessageReadStatus from './MessageReadStatus';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showReadStatus: boolean;
}

export default function MessageBubble({
  message,
  isOwnMessage,
  showReadStatus,
}: MessageBubbleProps) {
  const { colors } = useTheme();
  const messageDate = new Date(message.timestamp);

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
    ]}>
      <View style={[
        styles.bubble,
        {
          backgroundColor: isOwnMessage ? colors.primary : colors.card,
          borderColor: isOwnMessage ? colors.primary : colors.border,
        }
      ]}>
        <Text style={[
          styles.messageText,
          { color: isOwnMessage ? colors.background : colors.text }
        ]}>
          {message.content}
        </Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
          {format(messageDate, 'HH:mm', { locale: fr })}
        </Text>
        
        {isOwnMessage && showReadStatus && (
          <View style={styles.readStatus}>
            <MessageReadStatus
              message={message}
              currentUserId={typeof message.sender === 'object' ? message.sender.id : message.sender}
              isLastMessage={true}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  readStatus: {
    marginLeft: 4,
  },
}); 