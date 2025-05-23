import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, FlatList, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { FriendRequests } from '../../components/FriendRequests';
import { AddFriend } from '../../components/AddFriend';

export default function RequestsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Ici, vous pouvez ajouter la logique de rafraîchissement des données
      // Par exemple, recharger les requêtes d'amis
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation d'un chargement
    } finally {
      setRefreshing(false);
    }
  }, []);

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