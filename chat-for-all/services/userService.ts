import type {
  FriendRequestResponse,
  Friendship,
  RawUser,
  SearchUsersResponse
} from '@/models';
import api from '@/services/axiosConfig';

class UserService {

  async searchUsersByUsername(username: string, currentUserId: string): Promise<RawUser[]> {
    try {
      const response = await api.get<SearchUsersResponse>(`/users/getUserByUsername/${username}`);
      return response.data.users;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      console.error('Erreur serveur lors de la recherche d\'utilisateurs:', error);
      throw error;
    }
  }

  async sendFriendRequest(senderId: string, receiverId: string): Promise<Friendship> {
    try {
      const response = await api.post<FriendRequestResponse>('/friendship/send-request', {
        senderId,
        receiverId
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande d\'ami:', error);
      throw error;
    }
  }
}

export default new UserService(); 