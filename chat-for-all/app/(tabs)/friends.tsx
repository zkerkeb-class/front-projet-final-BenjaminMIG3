import { IconSymbol } from '@/modules/shared';
import { useTheme } from '@/contexts/ThemeContext';
import { usePageFocus } from '@/hooks/usePageFocus';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AddFriend, FriendsList } from '@/modules/profile';
import { useFriends } from '../../hooks/useFriendship';
import { useAuth } from '@/contexts/AuthContext';

export default function FriendsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user, isLoggedIn } = useAuth();
  const [showAddFriend, setShowAddFriend] = useState(false);
  const { friends, loading, error, removeFriend, refreshFriends, refreshing } = useFriends();

  // Utiliser le hook usePageFocus pour gérer le chargement des données
  const { forceRefresh } = usePageFocus({
    onFocus: async () => {
      console.log('🔄 [FriendsScreen] Focus de la page détecté');
      if (refreshing) {
        console.log('🔄 [FriendsScreen] Refresh déjà en cours, on ignore');
        return;
      }
      try {
        console.log('🔄 [FriendsScreen] Début du refresh via focus');
        await refreshFriends();
        console.log('🔄 [FriendsScreen] Refresh via focus terminé');
      } catch (error) {
        console.error('❌ [FriendsScreen] Erreur lors du refresh via focus:', error);
      }
    },
    enabled: isLoggedIn && !!user?.id,
    dependencies: [isLoggedIn, user?.id, refreshing]
  });

  const handleAddFriend = () => {
    setShowAddFriend(true);
  };

  const onRefresh = useCallback(async () => {
    console.log('🔄 [FriendsScreen] Pull-to-refresh déclenché');
    try {
      await refreshFriends();
      console.log('🔄 [FriendsScreen] Pull-to-refresh terminé avec succès');
    } catch (error) {
      console.error('❌ [FriendsScreen] Erreur lors du pull-to-refresh:', error);
    }
  }, [refreshFriends]);

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
            progressViewOffset={20}
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