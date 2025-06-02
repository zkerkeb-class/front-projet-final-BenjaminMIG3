/**
 * Interfaces et types relatifs aux amitiés et demandes d'amis
 */

import { User } from './user';

// Interface pour une amitié
export interface Friendship {
  id?: string;
  _id?: string; // ID MongoDB
  sender: string | User;
  receiver: string | User;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt?: Date | string;
  updatedAt?: Date | string;
  __v?: number; // Version key MongoDB
}

// Interface pour un ami (utilisateur accepté)
export interface Friend {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  isOnline?: boolean;
  lastSeen?: Date | string;
}

// Interface pour la réponse des demandes d'amis
export interface FriendRequestResponse {
  message: string;
  data: Friendship;
}

// Interface pour la réponse de la liste d'amis
export interface FriendsResponse {
  message: string;
  friends: Friend[];
}

// Interface pour la réponse des demandes d'amis en attente
export interface FriendRequestsResponse {
  message: string;
  requests: Friendship[];
}

// Props pour les composants
export interface FriendsListProps {
  friends: Friend[];
  loading?: boolean;
  error?: string | null;
  removeFriend?: (friendId: string) => void;
  onSelectFriend?: (friend: Friend) => void;
} 