import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import type { Friend, FriendRequestsResponse, Friendship } from '@/models';
import friendshipService from '@/services/friendshipService';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

// Fonction pour transformer les données de l'API vers l'interface Friend
const transformToFriend = (rawFriend: any): Friend => {
  // Validation des données essentielles
  if (!rawFriend) {
    throw new Error('Données d\'ami invalides: objet vide');
  }
  
  const id = rawFriend._id || rawFriend.id;
  const username = rawFriend.username;
  
  if (!id) {
    throw new Error('Données d\'ami invalides: ID manquant');
  }
  
  if (!username || typeof username !== 'string' || username.trim() === '') {
    throw new Error('Données d\'ami invalides: nom d\'utilisateur manquant ou invalide');
  }
  
  return {
    id: String(id),
    username: username.trim(),
    email: rawFriend.email || '',
    profilePicture: rawFriend.profilePicture,
    isOnline: Boolean(rawFriend.isOnline),
    lastSeen: rawFriend.lastSeen
  };
};

// Hook pour la gestion des amis
export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { user } = useAuth();
  const { emitEvent } = useNotification();

  const fetchFriends = useCallback(async (isRefreshing = false) => {
    if (!user?.id) {
      console.log('[useFriends] Aucun utilisateur connecté, pas de chargement des amis');
      setError(null);
      setFriends([]);
      return;
    }

    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      console.log('[useFriends] Chargement des amis pour l\'utilisateur:', user.id);
      const response = await friendshipService.getFriends(user.id);
      console.log('[useFriends] Réponse brute de fetchFriends:', response);
      
      // La réponse devrait être directement un tableau de Friend d'après le service
      // Mais on ajoute une sécurité au cas où le format changerait
      let friendsData: any[] = [];
      
      if (Array.isArray(response)) {
        friendsData = response;
      } else {
        console.warn('[useFriends] Format de réponse inattendu pour getFriends:', response);
        // Tenter d'extraire les amis si le format a changé
        const responseAny = response as any;
        if (responseAny?.friends && Array.isArray(responseAny.friends)) {
          friendsData = responseAny.friends;
        } else if (responseAny?.data?.friends && Array.isArray(responseAny.data.friends)) {
          friendsData = responseAny.data.friends;
        }
      }
      
      const friendsList: Friend[] = friendsData
        .filter(item => item && typeof item === 'object') // Filtrer les éléments valides
        .map(item => {
          try {
            return transformToFriend(item);
          } catch (error) {
            console.warn('[useFriends] Erreur lors de la transformation d\'un ami:', error, 'Données:', item);
            return null;
          }
        })
        .filter((friend): friend is Friend => friend !== null);
      
      console.log('[useFriends] Liste des amis traitée:', friendsList);
      setFriends(friendsList);
      setError(null);
      
      // Émettre un événement pour notifier que les amis ont été mis à jour
      emitEvent('friends_updated');
      
    } catch (err) {
      console.error('[useFriends] Erreur détaillée fetchFriends:', err);
      const errorMessage = t('friends.errors.fetchFriends');
      setError(errorMessage);
      setFriends([]); // Réinitialiser la liste en cas d'erreur
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t, user?.id, emitEvent]);

  // Charger automatiquement les amis quand un utilisateur se connecte
  useEffect(() => {
    console.log('[useFriends] Effect déclenché, user?.id:', user?.id);
    if (user?.id) {
      fetchFriends();
    } else {
      // Réinitialiser quand l'utilisateur se déconnecte
      setFriends([]);
      setError(null);
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchFriends, user?.id]);

  const removeFriend = useCallback(async (friendId: string) => {
    if (!user?.id) {
      setError(t('friends.errors.userNotAuthenticated'));
      return;
    }

    try {
      setLoading(true);
      await friendshipService.removeFriendship(user.id, friendId);
      await fetchFriends();
      Alert.alert(t('friends.success'), t('friends.friendRemoved'));
      setError(null);
    } catch (_err) {
      const errorMessage = t('friends.errors.removeFriend');
      setError(errorMessage);
      Alert.alert(t('friends.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchFriends, t, user?.id]);

  return {
    friends,
    loading,
    refreshing,
    error,
    removeFriend,
    refreshFriends: () => fetchFriends(true),
    fetchFriends,
  };
};

// Hook pour la gestion des demandes d'amis
export const useFriendRequests = () => {
  const [friendRequests, setFriendRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { user } = useAuth();
  const { fetchFriends } = useFriends();
  const { emitEvent } = useNotification();

  // Log l'état à chaque changement
  useEffect(() => {
    console.log('🔄 [useFriendRequests] État mis à jour:', {
      friendRequests,
      loading,
      refreshing,
      error,
      requestsLength: friendRequests?.length
    });
  }, [friendRequests, loading, refreshing, error]);

  const fetchFriendRequests = useCallback(async (isRefreshing = false) => {
    console.log('🔄 [fetchFriendRequests] Début de fetchFriendRequests, userId:', user?.id);
    try {
      if (!user?.id) {
        console.warn('🔄 [fetchFriendRequests] Utilisateur non authentifié');
        setError(t('friends.errors.userNotAuthenticated'));
        return;
      }
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      console.log('🔄 [fetchFriendRequests] Appel du service avec userId:', user.id);
      const response = await friendshipService.getFriendRequests(user.id);
      console.log('🔄 [fetchFriendRequests] Réponse du service:', response);
      
      const friendRequestsArray = Array.isArray(response) ? response : 
        ((response as FriendRequestsResponse)?.requests || []);
      console.log('🔄 [fetchFriendRequests] Array final des demandes:', friendRequestsArray);
      
      // Vérifier si les données sont valides avant de les définir
      if (Array.isArray(friendRequestsArray) && friendRequestsArray.length > 0) {
        console.log('🔄 [fetchFriendRequests] Données valides, mise à jour de l\'état');
        setFriendRequests(friendRequestsArray);
      } else {
        console.log('🔄 [fetchFriendRequests] Aucune donnée valide trouvée');
        setFriendRequests([]);
      }
    } catch (err) {
      console.error('❌ [fetchFriendRequests] Erreur capturée:', err);
      if (err instanceof Error && err.message.includes('500')) {
        setError(t('friends.errors.fetchRequests'));
      } else {
        setFriendRequests([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t, user?.id]);

  // Lancer le fetch initial au montage du composant
  useEffect(() => {
    console.log('🔄 [useFriendRequests] Effect de montage déclenché, user?.id:', user?.id);
    if (user?.id) {
      fetchFriendRequests();
    } else {
      console.log('🔄 [useFriendRequests] Pas d\'utilisateur connecté, réinitialisation de l\'état');
      setFriendRequests([]);
      setError(null);
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchFriendRequests, user?.id]);

  const acceptFriendRequest = useCallback(async (senderId: string, receiverId: string) => {
    try {
      setLoading(true);
      await friendshipService.acceptFriendRequest(senderId, receiverId);
      await Promise.all([
        fetchFriendRequests(),
        fetchFriends()
      ]);
      
      // Notifier que les amis ont été mis à jour (pour déclencher un rafraîchissement des conversations)
      console.log('[useFriendRequests] Demande d\'ami acceptée, amis mis à jour');
      emitEvent('friends_updated');
      
      Alert.alert(t('friends.success'), t('friends.requestAccepted'));
      setError(null);
    } catch (_err) {
      const errorMessage = t('friends.errors.acceptRequest');
      setError(errorMessage);
      Alert.alert(t('friends.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchFriendRequests, fetchFriends, t, emitEvent]);

  const rejectFriendRequest = useCallback(async (senderId: string) => {
    if (!user?.id) {
      setError(t('friends.errors.userNotAuthenticated'));
      return;
    }

    try {
      setLoading(true);
      await friendshipService.rejectFriendRequest(user.id, senderId);
      await fetchFriendRequests();
      Alert.alert(t('friends.success'), t('friends.requestDeclined'));
      setError(null);
    } catch (_err) {
      const errorMessage = t('friends.errors.rejectRequest');
      setError(errorMessage);
      Alert.alert(t('friends.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchFriendRequests, t, user?.id]);

  return {
    friendRequests,
    loading,
    refreshing,
    error,
    acceptFriendRequest,
    rejectFriendRequest,
    refreshFriendRequests: () => fetchFriendRequests(true),
  };
};

// Hook pour l'envoi de demandes d'amis
export const useSendFriendRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { fetchFriends } = useFriends();
  const { emitEvent } = useNotification();

  const sendFriendRequest = useCallback(async (senderId: string, receiverId: string) => {
    try {
      setLoading(true);
      await friendshipService.sendFriendRequest(senderId, receiverId);
      
      // Rafraîchir la liste des amis après l'envoi de la demande
      console.log('[useSendFriendRequest] Demande d\'ami envoyée, rafraîchissement des amis');
      await fetchFriends(true);
      
      // Émettre un événement pour notifier que les amis ont été mis à jour
      emitEvent('friends_updated');
      
      Alert.alert(t('friends.success'), t('friends.requestSent'));
      setError(null);
    } catch (_err) {
      const errorMessage = t('friends.errors.sendRequest');
      setError(errorMessage);
      Alert.alert(t('friends.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  }, [t, fetchFriends, emitEvent]);

  return {
    loading,
    error,
    sendFriendRequest,
  };
}; 