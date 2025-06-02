import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AddFriend } from '../../components/AddFriend';
import { FriendsList } from '../../components/FriendsList';
import { useFriends } from '../../hooks/useFriendship';

export default function FriendsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [showAddFriend, setShowAddFriend] = useState(false);
  const { friends, loading, error, removeFriend, refreshFriends } = useFriends();
  const [refreshing, setRefreshing] = useState(false);
  const isFirstFocus = useRef(true);

  // Rafraîchir la liste des amis uniquement lors de la première fois que la page devient active
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        refreshFriends();
        isFirstFocus.current = false;
      }
    }, [refreshFriends])
  );

  const handleAddFriend = () => {
    setShowAddFriend(true);
  };

  const onRefresh = async () => {
    if (refreshing) return; // Éviter les appels multiples pendant le refresh
    setRefreshing(true);
    try {
      await refreshFriends();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('navigation.friends')}
        </Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAddFriend}
        >
          <IconSymbol name="person.badge.plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Platform.OS === 'ios' ? colors.primary : undefined}
            colors={Platform.OS === 'android' ? [colors.primary] : undefined}
            progressBackgroundColor={Platform.OS === 'android' ? colors.background : undefined}
          />
        }
      >
        {showAddFriend && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <AddFriend />
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <FriendsList 
            friends={friends}
            loading={loading}
            error={error}
            removeFriend={removeFriend}
          />
        </View>
      </ScrollView>
    </View>
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
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 8,
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
}); 