import { AddFriend } from '@/components/profile/AddFriend';
import { FriendRequests } from '@/components/profile/FriendRequests';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePageFocus } from '@/hooks/usePageFocus';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFriendRequests } from '../../hooks/useFriendship';

export default function RequestsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user, isLoggedIn } = useAuth();
  const { refreshFriendRequests, refreshing } = useFriendRequests();

  // Utiliser le hook usePageFocus pour gérer le chargement des données
  const { forceRefresh } = usePageFocus({
    onFocus: async () => {
      console.log('🔄 [RequestsScreen] Focus de la page détecté');
      if (refreshing) {
        console.log('🔄 [RequestsScreen] Refresh déjà en cours, on ignore');
        return;
      }
      try {
        console.log('🔄 [RequestsScreen] Début du refresh via focus');
        await refreshFriendRequests();
        console.log('🔄 [RequestsScreen] Refresh via focus terminé');
      } catch (error) {
        console.error('❌ [RequestsScreen] Erreur lors du refresh via focus:', error);
      }
    },
    enabled: isLoggedIn && !!user?.id,
    dependencies: [isLoggedIn, user?.id, refreshing]
  });

  const onRefresh = useCallback(async () => {
    console.log('🔄 [RequestsScreen] Pull-to-refresh déclenché');
    try {
      await refreshFriendRequests();
      console.log('🔄 [RequestsScreen] Pull-to-refresh terminé avec succès');
    } catch (error) {
      console.error('❌ [RequestsScreen] Erreur lors du pull-to-refresh:', error);
    }
  }, [refreshFriendRequests]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('friends.friendRequests')}
        </Text>
      </View>

      <FlatList
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        data={[{ key: 'addFriend' }, { key: 'requests' }]}
        renderItem={({ item }) => {
          if (item.key === 'addFriend') {
            return (
              <View style={[styles.section, { backgroundColor: colors.card }]}>
                <AddFriend />
              </View>
            );
          }
          return (
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <FriendRequests />
            </View>
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
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