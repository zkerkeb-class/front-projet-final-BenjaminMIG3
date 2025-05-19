import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useFriends } from '../hooks/useFriendship';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export const FriendsList = () => {
  const { friends, loading, refreshing, error, removeFriend, refreshFriends } = useFriends();
  const { colors } = useTheme();
  const { t } = useTranslation();

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
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      </View>
    );
  }

  if (friends.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <IconSymbol name="person.2" size={60} color={colors.text + '33'} />
          <Text style={[styles.emptyText, { color: colors.text + '99' }]}>
            {t('friends.noFriends')}
          </Text>
          <Text style={[styles.emptySubText, { color: colors.text + '99', marginTop: 10 }]}>
            {t('friends.noFriendsDescription')}
          </Text>
        </View>
      </View>
    );
  }

  const renderFriend = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.friendItem, { backgroundColor: colors.card }]}
      onPress={() => {/* Navigation vers le profil ou le chat */}}
    >
      <View style={styles.friendInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{item.username?.charAt(0) || '?'}</Text>
        </View>
        <View style={styles.friendDetails}>
          <Text style={[styles.friendName, { color: colors.text }]}>
            {item.username || t('friends.unknownUser')}
          </Text>
          <Text style={[styles.friendStatus, { color: colors.text + '99' }]}>
            {t('friends.online')}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
          onPress={() => {/* Navigation vers le chat */}}
        >
          <IconSymbol name="message.fill" size={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
          onPress={() => removeFriend(item._id)}
        >
          <IconSymbol name="trash.fill" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        {t('friends.myFriends')}
      </Text>
      <FlatList
        data={friends}
        renderItem={renderFriend}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        scrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshFriends}
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 8,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
  },
  friendStatus: {
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
}); 