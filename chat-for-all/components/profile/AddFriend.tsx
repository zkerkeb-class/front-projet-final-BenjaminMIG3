import { IconSymbol } from '@/components/shared/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSendFriendRequest } from '@/hooks/useFriendship';
import { userService } from '@/services';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';

// Activer LayoutAnimation sur Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const [isExpanded, setIsExpanded] = useState(false);
  const { sendFriendRequest, loading, error } = useSendFriendRequest();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();

  // Animation pour la rotation de l'icône
  const rotateAnimation = useState(new Animated.Value(0))[0];

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
    
    // Animation de rotation de l'icône
    Animated.timing(rotateAnimation, {
      toValue: isExpanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const rotateInterpolate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const debouncedSearch = useCallback(
    (query: string) => {
      const timeoutId = setTimeout(async () => {
        if (!query.trim()) {
          setSearchResults([]);
          return;
        }

        try {
          setIsSearching(true);
          if (!user?.id) {
            throw new Error(t('auth.pleaseLogin'));
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
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    [user?.id, t, setSearchResults, setIsSearching]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const handleSendRequest = async (receiverId: string) => {
    if (!user?.id) {
      Alert.alert(t('common.error'), t('auth.pleaseLogin'));
      return;
    }

    try {
      await sendFriendRequest(user.id, receiverId);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de la requête:', error);
              Alert.alert(
          t('common.error'),
          error.response?.data?.message || t('friends.errors.sendRequest')
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header rétractable */}
      <TouchableOpacity 
        style={[styles.header, { borderBottomColor: colors.border }]}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <IconSymbol name="person.badge.plus" size={18} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            {t('friends.addFriend')}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <IconSymbol 
            name="chevron.down" 
            size={14} 
            color={colors.text + '99'} 
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Contenu rétractable */}
      {isExpanded && (
        <View style={styles.content}>
          <View style={styles.searchContainer}>
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
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
                  style={[styles.resultItem, { backgroundColor: colors.background }]}
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
                      <IconSymbol name="person.badge.plus" size={18} color="#fff" />
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Pas de styles de carte ici - la section parente s'en charge
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  content: {
    padding: 16,
  },
  searchContainer: {
    marginBottom: 12,
  },
  inputContainer: {
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
    paddingVertical: 12,
    alignItems: 'center',
  },
  resultsContainer: {
    maxHeight: 250,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultDetails: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
  },
  email: {
    fontSize: 13,
    marginTop: 1,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  noResults: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    marginTop: 8,
  },
}); 