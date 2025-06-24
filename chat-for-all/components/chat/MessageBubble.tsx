import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Message } from '@/models';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
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
  const { user } = useAuth();
  const { t } = useTranslation();
  const messageDate = new Date(message.timestamp);

  // Obtenir le nom de l'expéditeur
  const getSenderName = () => {
    if (isOwnMessage) {
      return t('common.me');
    }
    
    if (typeof message.sender === 'object' && message.sender) {
      return message.sender.username || message.sender.email || t('common.unknownUser');
    }
    
    return t('common.unknownUser');
  };

  const senderName = getSenderName();

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
    ]}>
      {/* Nom de l'expéditeur et heure pour les autres */}
      {!isOwnMessage && (
        <View style={styles.senderHeader}>
          <Text style={[styles.senderName, { color: colors.textSecondary }]}>
            {senderName}
          </Text>
          <View style={{ width: 4 }} />
          <Text style={[styles.senderTimestamp, { color: colors.textSecondary }]}>
            {format(messageDate, 'HH:mm', { locale: fr })}
          </Text>
        </View>
      )}
      
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
      
      <View style={[
        styles.footer,
        isOwnMessage ? styles.ownFooter : styles.otherFooter
      ]}>
        {isOwnMessage && (
          <>
            <Text style={[styles.senderLabel, { color: colors.textSecondary }]}>
              {t('common.me')}
            </Text>
            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
              {format(messageDate, 'HH:mm', { locale: fr })}
            </Text>
          </>
        )}
        
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
  senderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '500',
  },
  senderTimestamp: {
    fontSize: 11,
    opacity: 0.8,
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
  ownFooter: {
    justifyContent: 'flex-end',
  },
  otherFooter: {
    justifyContent: 'flex-start',
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 6,
  },
  timestamp: {
    fontSize: 12,
  },
  readStatus: {
    marginLeft: 4,
  },
}); 