import { IconSymbol } from '@/modules/shared';
import { useTheme } from '@/contexts/ThemeContext';
import { usePageFocus } from '@/hooks/usePageFocus';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AddFriend, FriendRequests } from '@/modules/profile';
import { useFriendRequests } from '../../hooks/useFriendship';
import { useAuth } from '@/contexts/AuthContext';

export default function RequestsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user, isLoggedIn } = useAuth();
  const [showAddFriend, setShowAddFriend] = useState(false);
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

  const handleAddFriend = () => {
    setShowAddFriend(true);
  };

  const renderContent = () => {
    const sections = [];
    
    if (showAddFriend) {
      sections.push({
        key: 'add-friend',
        component: (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <AddFriend />
          </View>
        )
      });
    }

    sections.push({
      key: 'friend-requests',
      component: (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <FriendRequests />
        </View>
      )
    });

    return sections;
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

      <FlatList
        data={renderContent()}
        renderItem={({ item }) => item.component}
        keyExtractor={(item) => item.key}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            progressViewOffset={20}
          />
        }
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