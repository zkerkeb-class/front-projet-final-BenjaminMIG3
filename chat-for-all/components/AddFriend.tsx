import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import debounce from 'lodash/debounce';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSendFriendRequest } from '../hooks/useFriendship';
import userService from '../services/api/userService';

interface User {
  _id: string;
  username: string;
  email: string;
  profilePicture?: string;
}

export const AddFriend = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { sendFriendRequest, loading, error } = useSendFriendRequest();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setIsSearching(true);
        if (!user?.id) {
          throw new Error(t('friends.errors.userNotAuthenticated'));
        }
        const users = await userService.searchUsersByUsername(query, user.id);
        // Filtrer l'utilisateur actuel des résultats
        const filteredUsers = users.filter(u => u._id !== user.id);
        setSearchResults(filteredUsers);
      } catch (err: any) {
        // Ne pas logger les erreurs 404 car c'est un cas normal
        if (err?.response?.status !== 404) {
          console.error('Erreur lors de la recherche:', err);
        }
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [user?.id, t]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  const handleSendRequest = async (receiverId: string) => {
    if (!user?.id) {
      Alert.alert(t('friends.error'), t('friends.errors.userNotAuthenticated'));
      return;
    }

    try {
      await sendFriendRequest(user.id, receiverId);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de la requête:', error);
      Alert.alert(
        t('friends.error'),
        error.response?.data?.message || t('friends.errors.sendRequest')
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        {t('friends.addFriend')}
      </Text>
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.inputContainer, { borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={16} color={colors.text + '99'} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={t('friends.searchUsers')}
            placeholderTextColor={colors.text + '66'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              style={styles.clearButton}
            >
              <IconSymbol name="xmark.circle.fill" size={16} color={colors.text + '99'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          {searchResults.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={[styles.resultItem, { backgroundColor: colors.card }]}
              onPress={() => handleSendRequest(item._id)}
            >
              <View style={styles.resultInfo}>
                <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.resultDetails}>
                  <Text style={[styles.username, { color: colors.text }]}>{item.username}</Text>
                  <Text style={[styles.email, { color: colors.text + '99' }]}>{item.email}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={() => handleSendRequest(item._id)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <IconSymbol name="person.badge.plus" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {searchQuery.length > 0 && !isSearching && searchResults.length === 0 && (
        <Text style={[styles.noResults, { color: colors.text + '99' }]}>
          {t('friends.noUsersFound')}
        </Text>
      )}

      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    height: 40,
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  resultsContainer: {
    maxHeight: 300,
    marginTop: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  resultInfo: {
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
  resultDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  email: {
    fontSize: 14,
    marginTop: 2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  noResults: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    marginTop: 8,
  },
}); 