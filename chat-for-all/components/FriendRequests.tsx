import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useFriendRequests } from '../hooks/useFriendship';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  AddFriend: undefined;
  // ... autres routes si nécessaire
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const FriendRequests = () => {
  const { friendRequests, loading, refreshing, error, acceptFriendRequest, rejectFriendRequest, refreshFriendRequests } = useFriendRequests();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <IconSymbol name="exclamationmark.triangle.fill" size={40} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error, marginTop: 12 }]}>{error}</Text>
      </View>
    );
  }

  if (!friendRequests || friendRequests.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <IconSymbol name="person.badge.plus" size={60} color={colors.text + '33'} />
          <Text style={[styles.emptyText, { color: colors.text + '99' }]}>
            {t('friends.noPendingRequests')}
          </Text>
          <Text style={[styles.emptySubText, { color: colors.text + '99', marginTop: 10 }]}>
            {t('friends.noPendingRequestsDescription')}
          </Text>
        </View>
      </View>
    );
  }

  const renderRequest = ({ item }: { item: any }) => {
    // user1 est toujours l'expéditeur selon la structure de la réponse
    const sender = item.user1;
    
    return (
      <View style={[styles.requestItem, { backgroundColor: colors.card }]}>
        <View style={styles.requestInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {sender?.username?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.requestDetails}>
            <Text style={[styles.requestName, { color: colors.text }]}>
              {sender?.username || t('friends.unknownUser')}
            </Text>
            <Text style={[styles.requestStatus, { color: colors.text + '99' }]}>
              {t('friends.pendingRequest')}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
            onPress={() => acceptFriendRequest(sender._id)}
          >
            <IconSymbol name="checkmark" size={16} color={colors.success} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
            onPress={() => rejectFriendRequest(sender._id)}
          >
            <IconSymbol name="xmark" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        {t('friends.friendRequests')}
      </Text>
      <FlatList
        data={friendRequests}
        renderItem={renderRequest}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        scrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshFriendRequests}
            tintColor={Platform.OS === 'ios' ? colors.primary : undefined}
            colors={Platform.OS === 'android' ? [colors.primary] : undefined}
            progressBackgroundColor={Platform.OS === 'android' ? colors.background : undefined}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  centered: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 8,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  requestInfo: {
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  requestDetails: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
  },
  requestStatus: {
    fontSize: 14,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  addFriendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 