import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { FriendsList } from '../../components/FriendsList';
import { AddFriend } from '../../components/AddFriend';
import { useFriends } from '../../hooks/useFriendship';

export default function FriendsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [showAddFriend, setShowAddFriend] = useState(false);
  const { refreshFriends } = useFriends();

  const handleAddFriend = () => {
    setShowAddFriend(true);
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

      <View style={styles.content}>
        {showAddFriend && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <AddFriend />
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <FriendsList />
        </View>
      </View>
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