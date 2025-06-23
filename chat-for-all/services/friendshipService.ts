import type {
  Friend,
  Friendship,
  FriendsResponse
} from '@/models';
import api from './axiosConfig';

class FriendshipService {
  async sendFriendRequest(senderId: string, receiverId: string): Promise<Friendship> {
    try {
      const response = await api.post<{ message: string; data: Friendship }>('friendships/send-request', {
        senderId,
        receiverId
      });
      return response.data.data;
    } catch (error: any) {
      throw error;
    }
  }

  async acceptFriendRequest(senderId: string, receiverId: string): Promise<Friendship> {
    const response = await api.post('friendships/accept-request', { receiverId, senderId });
    return response.data;
  }

  async rejectFriendRequest(receiverId: string, senderId: string): Promise<void> {
    await api.post('friendships/reject-request', { receiverId, senderId });
  }

  async getFriendship(senderId: string, receiverId: string): Promise<Friendship> {
    try {
      const response = await api.get<{ friendship: Friendship; message: string }>(`friendships/get-friendship/${senderId}/${receiverId}`);
      const friendship = response.data.friendship;
      
      // Transformer _id en id si nécessaire (compatibilité MongoDB)
      if ((friendship as any)._id && !friendship.id) {
        friendship.id = (friendship as any)._id;
      }
      
      return friendship;
    } catch (error: any) {
      throw error;
    }
  }

  async removeFriendship(currentUserId: string, friendId: string): Promise<void> {
    try {
      console.log('Suppression de la relation entre:', currentUserId, 'et', friendId);
      
      // D'abord récupérer l'objet friendship
      const friendship = await this.getFriendship(currentUserId, friendId);
      console.log('Friendship trouvée:', friendship);
      
      if (!friendship.id) {
        throw new Error('ID de la friendship introuvable');
      }
      
      // Ensuite supprimer avec l'ID de la friendship
      console.log('Envoi de la requête DELETE vers:', `friendships/${friendship.id}`);
      await api.delete(`friendships/${friendship.id}`);
      console.log('Suppression réussie');
    } catch (error: any) {
      console.error('Erreur lors de la suppression de l\'amitié:', error);
      throw error;
    }
  }

  async getFriendshipStatus(senderId: string, receiverId: string): Promise<string> {
    const response = await api.get(`friendships/get-friendship/${senderId}/${receiverId}`);
    return response.data.status;
  }

  async getFriendRequests(userId: string): Promise<Friendship[]> {
    console.log('📥 [getFriendRequests] Début de la requête avec userId:', userId);
    try {
      const response = await api.get(`friendships/get-friend-requests/${userId}`);
      console.log('📥 [getFriendRequests] Réponse reçue:', response.data);
      console.log('📥 [getFriendRequests] Status:', response.status);
      
      // Vérifier la structure de la réponse
      if (Array.isArray(response.data)) {
        // Si la réponse est directement un tableau
        console.log('📥 [getFriendRequests] Réponse directe en tableau:', response.data.length, 'demandes');
        return response.data;
      } else if (response.data && response.data.friendRequests) {
        // Si la réponse est encapsulée dans un objet
        console.log('📥 [getFriendRequests] Friend requests trouvées:', response.data.friendRequests.length);
        return response.data.friendRequests;
      } else {
        console.warn('📥 [getFriendRequests] Structure de réponse inattendue:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('📥 [getFriendRequests] Erreur:', error);
      console.error('📥 [getFriendRequests] Status:', error.response?.status);
      console.error('📥 [getFriendRequests] Data:', error.response?.data);
      throw error;
    }
  }

  async getFriends(userId: string): Promise<Friend[]> {
    console.log('Récupération des amis pour l\'utilisateur:', userId);
    const response = await api.get<FriendsResponse>(`friendships/get-friends/${userId}`);
    console.log('Réponse de getFriends:', response.data);
    return response.data.friends || [];
  }
}

export default new FriendshipService(); 