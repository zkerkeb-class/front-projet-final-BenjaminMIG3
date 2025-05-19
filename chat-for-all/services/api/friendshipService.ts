import api from './axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface JwtPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

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

class FriendshipService {
  private async getCurrentUserId(): Promise<string> {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (!token) {
        throw new Error('Token d\'authentification non trouvé');
      }

      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
        if (!decodedToken.userId) {
          throw new Error('Token invalide: userId manquant');
        }
        return decodedToken.userId;
      } catch (decodeError) {
        console.error('Erreur lors du décodage du token:', decodeError);
        throw new Error('Token invalide');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
      throw new Error('Impossible de récupérer l\'ID de l\'utilisateur');
    }
  }

  async sendFriendRequest(senderId: string, receiverId: string): Promise<Friendship> {
    try {
      const response = await api.post<{ message: string; data: Friendship }>('friendship/send-request', {
        senderId,
        receiverId
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de la demande d\'ami:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  async acceptFriendRequest(senderId: string): Promise<Friendship> {
    const response = await api.post('friendship/accept-request', { senderId });
    return response.data;
  }

  async rejectFriendRequest(senderId: string): Promise<void> {
    await api.post('friendship/reject-request', { senderId });
  }

  async removeFriendship(friendshipId: string): Promise<void> {
    await api.delete(`friendship/${friendshipId}`);
  }

  async getFriendshipStatus(senderId: string, receiverId: string): Promise<string> {
    const response = await api.get(`friendship/get-friendship/${senderId}/${receiverId}`);
    return response.data.status;
  }

  async getFriendRequests(userId: string): Promise<Friendship[]> {
    const response = await api.get(`friendship/get-friend-requests/${userId}`);
    console.log('Réponse brute du backend:', response.data);
    return response.data.friendRequests;
  }

  async getFriends(userId: string): Promise<Friendship[]> {
    const response = await api.get(`friendship/get-friends/${userId}`);
    return response.data.friendships || [];
  }
}

export default new FriendshipService(); 