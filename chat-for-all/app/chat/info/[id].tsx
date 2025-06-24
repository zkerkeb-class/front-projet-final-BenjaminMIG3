import AddParticipantModal from '@/components/chat/AddParticipantModal';
import { IconSymbol } from '@/components/shared/ui/IconSymbol';
import { ThemedText } from '@/components/shared/ui/ThemedText';
import { ThemedView } from '@/components/shared/ui/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useConversations } from '@/hooks/useConversations';
import type { Conversation, User } from '@/models';
import conversationService from '@/services/conversationService';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

interface ConversationDetails extends Conversation {
  participantDetails: User[];
}

export default function ConversationInfoScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const id = params.id as string;
  const name = params.name as string;
  
  const [conversation, setConversation] = useState<ConversationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  
  const { deleteConversation } = useConversations({
    userId: user?.id || '',
    autoLoad: false
  });

  // Charger les détails de la conversation
  const loadConversationDetails = useCallback(async () => {
    if (!id || !user?.id) return;
    
    setLoading(true);
    try {
      const response = await conversationService.getConversation(id);
      const conv = response.conversation;
      
      // Récupérer les détails des participants
      const participantDetails = Array.isArray(conv.participants) 
        ? conv.participants.filter((p: any): p is User => typeof p === 'object')
        : [];
      
      setConversation({
        ...conv,
        participantDetails
      });
    } catch (error: any) {
      console.error('Erreur lors du chargement des détails:', error);
      showNotification(error.message || t('conversation.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, user?.id, showNotification, t]);

  useEffect(() => {
    loadConversationDetails();
  }, [loadConversationDetails]);

  // Quitter la conversation
  const handleLeaveConversation = useCallback(() => {
    if (!conversation || !user?.id) return;

    Alert.alert(
      t('conversation.leaveTitle'),
      conversation.isGroup 
        ? t('conversation.leaveGroupMessage')
        : t('conversation.leaveMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('conversation.leave'),
          style: 'destructive',
          onPress: async () => {
            try {
                             if (conversation.isGroup) {
                 // Pour un groupe, retirer l'utilisateur des participants
                 const updatedParticipants = conversation.participants
                   .map(p => typeof p === 'string' ? p : p._id || p.id)
                   .filter((p): p is string => p !== undefined && p !== user.id);
                
                await conversationService.updateConversation(conversation._id, {
                  participants: updatedParticipants,
                  userId: user.id
                });
              } else {
                // Pour une conversation privée, supprimer complètement
                await deleteConversation(conversation._id);
              }
              
              showNotification(
                conversation.isGroup 
                  ? t('conversation.leftGroup')
                  : t('conversation.conversationDeleted'), 
                'success'
              );
              
              // Retourner à l'écran principal
              router.replace('/(tabs)');
            } catch (error: any) {
              console.error('Erreur lors de la suppression:', error);
              showNotification(error.message || t('conversation.deleteError'), 'error');
            }
          }
        }
      ]
    );
  }, [conversation, user?.id, deleteConversation, showNotification, t, router]);

  // Rendre un participant
  const renderParticipant = ({ item }: { item: User }) => (
    <View style={[styles.participantItem, { borderBottomColor: colors.border }]}>
      <View style={styles.participantInfo}>
        {item.profilePicture ? (
          <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
            <ThemedText style={styles.avatarText}>
              {item.username?.charAt(0).toUpperCase() || '?'}
            </ThemedText>
          </View>
        )}
        <View style={styles.participantDetails}>
          <ThemedText style={styles.participantName}>
            {item.username}
            {(item._id || item.id) === user?.id && ` (${t('common.you')})`}
          </ThemedText>
          {item.email && (
            <ThemedText style={[styles.participantEmail, { color: colors.textSecondary }]}>
              {item.email}
            </ThemedText>
          )}
        </View>
      </View>
    </View>
  );

  // Ajouter un participant à la conversation
  const handleParticipantAdded = useCallback((newParticipant: User) => {
    if (!conversation) return;
    
    setConversation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        participantDetails: [...prev.participantDetails, newParticipant]
      };
    });
    
    // Recharger les détails pour avoir les données à jour
    loadConversationDetails();
  }, [conversation, loadConversationDetails]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: t('conversation.info'),
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>
            {t('conversation.loadingInfo')}
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!conversation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: t('conversation.info'),
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={colors.error} />
          <ThemedText style={[styles.errorText, { color: colors.error }]}>
            {t('conversation.notFound')}
          </ThemedText>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <ThemedText style={[styles.buttonText, { color: colors.background }]}>
              {t('common.goBack')}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: t('conversation.info'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={styles.content}>
        {/* Informations de base */}
        <ThemedView style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.conversationHeader}>
            <View style={[styles.conversationAvatar, { backgroundColor: colors.primary }]}>
              <ThemedText style={styles.conversationAvatarText}>
                {conversation.isGroup ? '👥' : '💬'}
              </ThemedText>
            </View>
            <View style={styles.conversationInfo}>
              <ThemedText style={styles.conversationTitle}>
                {conversation.isGroup ? conversation.groupName : name}
              </ThemedText>
              <ThemedText style={[styles.conversationType, { color: colors.textSecondary }]}>
                {conversation.isGroup 
                  ? t('conversation.groupConversation')
                  : t('conversation.privateConversation')
                }
              </ThemedText>
            </View>
          </View>
        </ThemedView>

                {/* Participants */}
        <ThemedView style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>
              {t('conversation.participants')} ({conversation.participantDetails.length})
            </ThemedText>
            {conversation.isGroup && (
              <TouchableOpacity
                style={[styles.addParticipantButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowAddParticipantModal(true)}
              >
                <IconSymbol name="plus" size={16} color={colors.background} />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={conversation.participantDetails}
            renderItem={renderParticipant}
            keyExtractor={(item) => item._id || item.id}
            scrollEnabled={false}
          />
        </ThemedView>

        {/* Informations de la conversation */}
        <ThemedView style={[styles.section, { backgroundColor: colors.card }]}>
          <ThemedText style={styles.sectionTitle}>
            {t('conversation.details')}
          </ThemedText>
          
          <View style={styles.detailItem}>
            <IconSymbol name="calendar" size={20} color={colors.textSecondary} />
            <View style={styles.detailText}>
              <ThemedText style={styles.detailLabel}>
                {t('conversation.createdAt')}
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.textSecondary }]}>
                {new Date(conversation.createdAt).toLocaleDateString()}
              </ThemedText>
            </View>
          </View>

          <View style={styles.detailItem}>
            <IconSymbol name="clock" size={20} color={colors.textSecondary} />
            <View style={styles.detailText}>
              <ThemedText style={styles.detailLabel}>
                {t('conversation.lastActivity')}
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.textSecondary }]}>
                {new Date(conversation.lastActivity).toLocaleString()}
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Actions */}
        <ThemedView style={[styles.section, { backgroundColor: colors.card }]}>
          <ThemedText style={styles.sectionTitle}>
            {t('conversation.actions')}
          </ThemedText>
          
          <TouchableOpacity
            style={[styles.actionItem, styles.dangerAction]}
            onPress={handleLeaveConversation}
          >
            <IconSymbol 
              name={conversation.isGroup ? "person.badge.minus" : "trash"} 
              size={20} 
              color={colors.error} 
            />
            <ThemedText style={[styles.actionText, { color: colors.error }]}>
              {conversation.isGroup 
                ? t('conversation.leaveGroup')
                : t('conversation.deleteConversation')
              }
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>

      {/* Modal d'ajout de participant */}
      <AddParticipantModal
        visible={showAddParticipantModal}
        onClose={() => setShowAddParticipantModal(false)}
        conversationId={conversation._id}
        currentParticipants={conversation.participantDetails}
        onParticipantAdded={handleParticipantAdded}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginVertical: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addParticipantButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  conversationAvatarText: {
    fontSize: 24,
    color: 'white',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  conversationType: {
    fontSize: 14,
  },
  participantItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  participantEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailText: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  dangerAction: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  actionText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 