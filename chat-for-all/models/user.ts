/**
 * Interfaces et types relatifs aux utilisateurs
 */

// Interface principale pour un utilisateur
export interface User {
  id: string;
  _id?: string; // ID MongoDB optionnel
  username: string;
  email: string;
  profilePicture?: string;
}

// Interface pour un utilisateur brut venant de l'API (avec _id MongoDB)
export interface RawUser {
  _id: string;
  username: string;
  email: string;
  password?: string;
  profilePicture?: string;
  __v?: number;
}

// Interface pour les données utilisateur nettoyées (sans mot de passe)
export interface CleanUser {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
}

// Interface pour la recherche d'utilisateurs
export interface SearchUsersResponse {
  message: string;
  users: RawUser[];
} 