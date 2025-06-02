/**
 * Interfaces et types relatifs à l'authentification
 */

import { CleanUser, RawUser } from './user';

// Interface pour les identifiants de connexion
export interface LoginCredentials {
  email: string;
  password: string;
}

// Interface pour les identifiants d'inscription
export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

// Interface pour la réponse brute de l'API d'authentification
export interface RawAuthResponse {
  token: string;
  user: RawUser;
}

// Interface pour la réponse d'authentification nettoyée
export interface AuthResponse {
  token: string;
  user: CleanUser;
}

// Interface pour la réponse d'inscription
export interface RegisterResponse {
  message: string;
  details?: any;
}

// Type pour le contexte d'authentification
export interface AuthContextType {
  user: CleanUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

// Interface pour le payload JWT
export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
} 