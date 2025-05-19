import api from './axiosConfig';

interface User {
  _id: string;
  username: string;
  email: string;
  profilePicture?: string;
}

interface SearchUsersResponse {
  message: string;
  users: User[];
}

interface Friendship {
  sender: string;
  receiver: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt?: Date;
}

interface FriendRequestResponse {
  message: string;
  data: Friendship;
}

class UserService {
  async searchUsersByUsername(username: string): Promise<User[]> {
    try {
      const response = await api.get<SearchUsersResponse>(`/auth/getUserByUsername/${username}`);
      return response.data.users;
    } catch (error) {
      console.error('Erreur lors de la recherche d\'utilisateurs:', error);
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