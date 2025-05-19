import { useState, useCallback, useEffect } from 'react';
import friendshipService from '../services/api/friendshipService';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

interface Friendship {
  _id: string;
  sender: {
    _id: string;
    username: string;
  };
  receiver: {
    _id: string;
    username: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
}

interface FriendRequestsResponse {
  friendRequests: Friendship[];
}

// Hook pour la gestion des amis
export const useFriends = () => {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { user } = useAuth();

  const fetchFriends = useCallback(async (isRefreshing = false) => {
    if (!user?.id) {
      setError(t('friends.errors.userNotAuthenticated'));
      return;
    }

    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const friendsList = await friendshipService.getFriends(user.id);
      setFriends(friendsList);
      setError(null);
    } catch (err) {
      const errorMessage = t('friends.errors.fetchFriends');
      setError(errorMessage);
      console.error('Erreur fetchFriends:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t, user?.id]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    try {
      setLoading(true);
      await friendshipService.removeFriendship(friendshipId);
      await fetchFriends();
      Alert.alert(t('friends.success'), t('friends.friendRemoved'));
      setError(null);
    } catch (err) {
      const errorMessage = t('friends.errors.removeFriend');
      setError(errorMessage);
      Alert.alert(t('friends.error'), errorMessage);
      console.error('Erreur removeFriend:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFriends, t]);

  return {
    friends,
    loading,
    refreshing,
    error,
    removeFriend,
    refreshFriends: () => fetchFriends(true),
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

  const fetchFriendRequests = useCallback(async (isRefreshing = false) => {
    try {
      if (!user?.id) {
        setError(t('friends.errors.userNotAuthenticated'));
        return;
      }
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const response = await friendshipService.getFriendRequests(user.id);
      const friendRequestsArray = Array.isArray(response) ? response : 
        ((response as FriendRequestsResponse)?.friendRequests || []);
      setFriendRequests(friendRequestsArray);
    } catch (err) {
      if (err instanceof Error && err.message.includes('500')) {
        setError(t('friends.errors.fetchRequests'));
        console.error('Erreur fetchFriendRequests:', err);
      } else {
        setFriendRequests([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t, user?.id]);

  useEffect(() => {
    fetchFriendRequests();
  }, [fetchFriendRequests]);

  const acceptFriendRequest = useCallback(async (senderId: string) => {
    try {
      setLoading(true);
      await friendshipService.acceptFriendRequest(senderId);
      await fetchFriendRequests();
      Alert.alert(t('friends.success'), t('friends.requestAccepted'));
      setError(null);
    } catch (err) {
      const errorMessage = t('friends.errors.acceptRequest');
      setError(errorMessage);
      Alert.alert(t('friends.error'), errorMessage);
      console.error('Erreur acceptFriendRequest:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFriendRequests, t]);

  const rejectFriendRequest = useCallback(async (senderId: string) => {
    try {
      setLoading(true);
      await friendshipService.rejectFriendRequest(senderId);
      await fetchFriendRequests();
      Alert.alert(t('friends.success'), t('friends.requestDeclined'));
      setError(null);
    } catch (err) {
      const errorMessage = t('friends.errors.rejectRequest');
      setError(errorMessage);
      Alert.alert(t('friends.error'), errorMessage);
      console.error('Erreur rejectFriendRequest:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFriendRequests, t]);

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

  const sendFriendRequest = useCallback(async (senderId: string, receiverId: string) => {
    try {
      setLoading(true);
      await friendshipService.sendFriendRequest(senderId, receiverId);
      Alert.alert(t('friends.success'), t('friends.requestSent'));
      setError(null);
    } catch (err) {
      const errorMessage = t('friends.errors.sendRequest');
      setError(errorMessage);
      Alert.alert(t('friends.error'), errorMessage);
      console.error('Erreur sendFriendRequest:', err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  return {
    loading,
    error,
    sendFriendRequest,
  };
}; 