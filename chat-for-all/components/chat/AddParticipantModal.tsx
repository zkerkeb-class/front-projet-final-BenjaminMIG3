import { IconSymbol } from '@/components/shared/ui/IconSymbol';
import { ThemedText } from '@/components/shared/ui/ThemedText';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useFriends } from '@/hooks';
import type { Friend, User } from '@/models';
import conversationService from '@/services/conversationService';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    SafeAreaView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface AddParticipantModalProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string;
  currentParticipants: User[];
  onParticipantAdded: (participant: User) => void;
}

export default function AddParticipantModal({
  visible,
  onClose,
  conversationId,
  currentParticipants,
  onParticipantAdded
}: AddParticipantModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<Friend | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const {
    friends,
    loading: friendsLoading,
    fetchFriends
  } = useFriends();

  // Filtrer les amis qui ne sont pas déjà dans la conversation
  const availableFriends = friends.filter((friend: Friend) => 
    !currentParticipants.some(participant => 
      (participant._id || participant.id) === friend.id
    )
  );

  // Filtrer selon la recherche
  const filteredFriends = availableFriends.filter((friend: Friend) =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Ajouter un participant à la conversation
  const handleAddParticipant = useCallback(async () => {
    if (!selectedUser || !user?.id || isAdding) return;

    setIsAdding(true);
    try {
      await conversationService.addParticipant(
        conversationId,
        user.id,
        selectedUser.id
      );

      showNotification(
        t('conversation.participantAdded', { username: selectedUser.username }),
        'success'
      );

      // Convertir Friend vers User pour la callback
      const userParticipant: User = {
        id: selectedUser.id,
        username: selectedUser.username,
        email: selectedUser.email,
        profilePicture: selectedUser.profilePicture
      };
      onParticipantAdded(userParticipant);
      setSelectedUser(null);
      setSearchQuery('');
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du participant:', error);
      showNotification(
        error.message || t('conversation.addParticipantError'),
        'error'
      );
    } finally {
      setIsAdding(false);
    }
  }, [selectedUser, user?.id, conversationId, isAdding, showNotification, t, onParticipantAdded, onClose]);

  // Réinitialiser l'état quand la modal se ferme
  useEffect(() => {
    if (!visible) {
      setSelectedUser(null);
      setSearchQuery('');
    }
  }, [visible]);

  // Rendre un ami disponible
  const renderFriend = ({ item }: { item: Friend }) => {
    const isSelected = selectedUser?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.friendItem,
          { borderBottomColor: colors.border },
          isSelected && { backgroundColor: colors.card }
        ]}
        onPress={() => setSelectedUser(isSelected ? null : item)}
      >
        <View style={styles.friendInfo}>
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <ThemedText style={styles.avatarText}>
                {item.username?.charAt(0).toUpperCase() || '?'}
              </ThemedText>
            </View>
          )}
          <View style={styles.friendDetails}>
            <ThemedText style={styles.friendName}>
              {item.username}
            </ThemedText>
            <ThemedText style={[styles.friendEmail, { color: colors.textSecondary }]}>
              {item.email}
            </ThemedText>
          </View>
        </View>
        {isSelected && (
          <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <ThemedText style={[styles.cancelText, { color: colors.primary }]}>
              {t('common.cancel')}
            </ThemedText>
          </TouchableOpacity>
          
          <ThemedText style={styles.title}>
            {t('conversation.addParticipant')}
          </ThemedText>
          
          <TouchableOpacity
            style={[
              styles.addButton,
              (!selectedUser || isAdding) && styles.addButtonDisabled
            ]}
            onPress={handleAddParticipant}
            disabled={!selectedUser || isAdding}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <ThemedText style={[
                styles.addText,
                { color: selectedUser ? colors.background : colors.textSecondary }
              ]}>
                {t('conversation.add')}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* Barre de recherche */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('friends.searchUsers')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Liste des amis */}
        <View style={styles.content}>
          {friendsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={styles.loadingText}>
                {t('chat.loadingFriends')}
              </ThemedText>
            </View>
          ) : availableFriends.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol name="person.3" size={48} color={colors.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('conversation.noAvailableFriends')}
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                {t('conversation.allFriendsInConversation')}
              </ThemedText>
            </View>
          ) : filteredFriends.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol name="magnifyingglass" size={48} color={colors.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('friends.noUsersFound')}
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                {t('friends.searchHint', { query: searchQuery })}
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={filteredFriends}
              renderItem={renderFriend}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.friendsList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  addText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    paddingVertical: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  friendsList: {
    paddingHorizontal: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 14,
  },
}); 