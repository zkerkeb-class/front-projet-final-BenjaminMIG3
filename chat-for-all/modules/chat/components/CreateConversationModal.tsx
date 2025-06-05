import { useNotification } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/modules/shared';
import { useFriends } from '@/hooks/useFriendship';
import type { Friend } from '@/models';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface CreateConversationModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateConversation: (participantIds: string[], groupName?: string) => Promise<void>;
  currentUserId: string;
}

export default function CreateConversationModal({
  visible,
  onClose,
  onCreateConversation,
  currentUserId
}: CreateConversationModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { friends, loading } = useFriends();
  
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Fonction pour normaliser les chaînes de recherche (gestion des accents)
  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Supprimer les diacritiques (accents)
  };

  // Filtrer les amis selon la recherche
  const filteredFriends = friends.filter(friend => {
    // Vérification de sécurité pour éviter les erreurs si username est undefined
    if (!friend || !friend.username) {
      return false;
    }
    
    // Recherche insensible à la casse et trim des espaces
    const searchTerm = normalizeString(searchQuery);
    const username = normalizeString(friend.username);
    const email = normalizeString(friend.email || '');
    
    // Si pas de terme de recherche, afficher tous les amis
    if (!searchTerm) {
      return true;
    }
    
    // Recherche par nom d'utilisateur ou email (avec gestion des accents)
    return username.includes(searchTerm) || email.includes(searchTerm);
  });

  // Basculer la sélection d'un ami
  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
  };

  // Créer la conversation
  const handleCreateConversation = async () => {
    if (selectedFriends.length === 0) {
      showNotification(t('chat.selectAtLeastOneFriend'), 'error');
      return;
    }

    if (selectedFriends.length > 49) {
      showNotification(t('chat.tooManyParticipants'), 'error');
      return;
    }

    setIsCreating(true);
    try {
      // Passer seulement les amis sélectionnés, l'utilisateur actuel sera ajouté dans le parent
      await onCreateConversation(selectedFriends, groupName);
      
      // Réinitialiser et fermer
      setSelectedFriends([]);
      setGroupName('');
      setSearchQuery('');
      onClose();
      
      showNotification(t('chat.conversationCreated'), 'success');
    } catch (error: any) {
      console.error('Erreur lors de la création de la conversation:', error);
      showNotification(error.message || t('chat.conversationCreateError'), 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Fermer et réinitialiser
  const handleClose = () => {
    setSelectedFriends([]);
    setGroupName('');
    setSearchQuery('');
    onClose();
  };

  // Rendu d'un ami
  const renderFriend = ({ item }: { item: Friend }) => {
    const isSelected = selectedFriends.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.friendItem,
          { backgroundColor: colors.card },
          isSelected && { backgroundColor: colors.primary + '20' }
        ]}
        onPress={() => toggleFriendSelection(item.id)}
      >
        <View style={styles.friendInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {item.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.friendName, { color: colors.text }]}>
            {item.username}
          </Text>
        </View>
        
        <View style={[
          styles.checkbox,
          { borderColor: colors.primary },
          isSelected && { backgroundColor: colors.primary }
        ]}>
          {isSelected && (
            <IconSymbol name="checkmark" size={16} color="#fff" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* En-tête */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={[styles.cancelButton, { color: colors.primary }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.title, { color: colors.text }]}>
            {t('chat.newConversation')}
          </Text>
          
          <TouchableOpacity
            onPress={handleCreateConversation}
            disabled={selectedFriends.length === 0 || isCreating}
            style={[
              styles.createButton,
              { opacity: selectedFriends.length === 0 || isCreating ? 0.5 : 1 }
            ]}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.createButtonText, { color: colors.primary }]}>
                {t('common.create')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Compteur de sélection */}
        {selectedFriends.length > 0 && (
          <View style={[styles.selectionCounter, { backgroundColor: colors.card }]}>
            <Text style={[styles.selectionText, { color: colors.text }]}>
              {t('chat.selectedParticipants', { count: selectedFriends.length })}
            </Text>
          </View>
        )}

        {/* Nom de groupe (si plus de 2 participants) */}
        {selectedFriends.length > 1 && (
          <View style={[styles.groupNameContainer, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.groupNameInput, { color: colors.text, borderColor: colors.border }]}
              placeholder={t('chat.groupNamePlaceholder')}
              placeholderTextColor={colors.text + '99'}
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
            />
          </View>
        )}

        {/* Barre de recherche */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.background }]}>
            <IconSymbol name="magnifyingglass" size={20} color={colors.text + '99'} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('friends.searchUsers')}
              placeholderTextColor={colors.text + '99'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Liste des amis */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              {t('friends.loadingFriends')}
            </Text>
          </View>
        ) : filteredFriends.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="person.2" size={60} color={colors.text + '33'} />
            <Text style={[styles.emptyText, { color: colors.text + '99' }]}>
              {searchQuery ? t('friends.noUsersFound') : t('friends.noFriends')}
            </Text>
            {searchQuery ? (
              <Text style={[styles.emptySubText, { color: colors.text + '99' }]}>
                {t('friends.searchHint', { query: searchQuery })}
              </Text>
            ) : (
              <Text style={[styles.emptySubText, { color: colors.text + '99' }]}>
                {t('friends.noFriendsDescription')}
              </Text>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredFriends}
            renderItem={renderFriend}
            keyExtractor={(item) => item.id}
            style={styles.friendsList}
            contentContainerStyle={styles.friendsListContent}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  cancelButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  createButton: {
    minWidth: 60,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectionCounter: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  groupNameContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  groupNameInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '500',
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  friendsList: {
    flex: 1,
  },
  friendsListContent: {
    paddingBottom: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 10,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 