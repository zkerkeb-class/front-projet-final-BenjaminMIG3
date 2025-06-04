import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Message } from '@/models/message';
import { MaterialIcons } from '@expo/vector-icons';

interface MessageReadStatusProps {
  message: Message;
  currentUserId: string;
  isLastMessage?: boolean;
}

export const MessageReadStatus: React.FC<MessageReadStatusProps> = ({
  message,
  currentUserId,
  isLastMessage = false
}) => {
  const { colors } = useTheme();

  // Si ce n'est pas le dernier message, ne rien afficher
  if (!isLastMessage) {
    return null;
  }

  // Filtrer les lecteurs (exclure l'expéditeur)
  const readers = message.readBy?.filter(read => {
    const readerId = typeof read.user === 'object' ? (read.user as any)._id : read.user;
    const senderId = typeof message.sender === 'object' ? (message.sender as any)._id : message.sender;
    return readerId !== senderId;
  }) || [];

  // Si le message n'a pas été lu par d'autres personnes que l'expéditeur
  if (readers.length === 0) {
    return (
      <View style={styles.container}>
        <MaterialIcons 
          name="check" 
          size={16} 
          color={colors.text} 
          style={styles.icon}
        />
      </View>
    );
  }

  // Si le message a été lu
  return (
    <View style={styles.container}>
      <MaterialIcons 
        name="done-all" 
        size={16} 
        color={colors.primary} 
        style={styles.icon}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    marginBottom: 2,
  },
  icon: {
    marginLeft: 3,
  }
}); 