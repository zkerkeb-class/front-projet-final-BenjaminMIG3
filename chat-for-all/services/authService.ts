import type {
  AuthResponse,
  CleanUser,
  LoginCredentials,
  RawAuthResponse,
  RegisterCredentials,
  RegisterResponse
} from '@/models';
import api from '@/services/axiosConfig';

import AsyncStorage from '@react-native-async-storage/async-storage';

// Service d'authentification
export const authService = {
  // Connexion
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('[authService] Tentative de connexion avec:', { email: credentials.email });
    try {
      console.log('[authService] Envoi de la requête POST vers /auth/login');
      const response = await api.post<RawAuthResponse>('/users/login', credentials);
      console.log('[authService] Réponse brute reçue:', { 
        status: response.status,
        hasToken: !!response.data.token,
        hasUser: !!response.data.user
      });
      
      // Nettoyage des données sensibles et transformation de la structure
      const cleanUser: CleanUser = {
        id: response.data.user._id,
        username: response.data.user.username,
        email: response.data.user.email
      };

      const cleanResponse: AuthResponse = {
        token: response.data.token,
        user: cleanUser
      };

      console.log('[authService] Données nettoyées:', {
        userId: cleanUser.id,
        username: cleanUser.username,
        hasToken: !!cleanResponse.token
      });
      
      // Stockage du token
      console.log('[authService] Stockage du token JWT');
      await AsyncStorage.setItem('auth_token', cleanResponse.token);
      return cleanResponse;
    } catch (error: any) {
      console.error('[authService] Erreur lors de la connexion:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      });
      
      if (error.response) {
        // La requête a été faite et le serveur a répondu avec un code d'état
        // qui est hors de la plage 2xx
        throw new Error(error.response.data?.message || `Erreur serveur: ${error.response.status}`);
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error('[authService] Pas de réponse du serveur:', error.request);
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        console.error('[authService] Erreur de configuration:', error.message);
        throw new Error('Erreur lors de la configuration de la requête');
      }
    }
  },

  // Inscription
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    console.log('[authService] Tentative d\'inscription avec:', { 
      username: credentials.username,
      email: credentials.email 
    });

    try {
      console.log('[authService] Envoi de la requête POST vers /auth/register');
        const response = await api.post<RegisterResponse>('/users/register', {
        username: credentials.username,
        email: credentials.email,
        password: credentials.password
      });

      console.log('[authService] Réponse d\'inscription reçue:', {
        status: response.status,
        message: response.data.message
      });

      // Si l'inscription réussit, on connecte automatiquement l'utilisateur
      console.log('[authService] Tentative de connexion après inscription réussie');
      const loginResponse = await this.login({
        email: credentials.email,
        password: credentials.password
      });

      return loginResponse;
    } catch (error: any) {
      console.error('[authService] Erreur lors de l\'inscription:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      });

      if (error.response) {
        // Erreur de validation (400)
        if (error.response.status === 400) {
          const details = error.response.data.details;
          const validationError = details?.map((detail: any) => detail.message).join(', ');
          throw new Error(validationError || 'Erreur de validation des données');
        }
        // Erreur serveur (500)
        if (error.response.status === 500) {
          throw new Error('Erreur lors de l\'inscription. Veuillez réessayer plus tard.');
        }
        // Autres erreurs
        throw new Error(error.response.data?.message || `Erreur serveur: ${error.response.status}`);
      } else if (error.request) {
        console.error('[authService] Pas de réponse du serveur:', error.request);
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      } else {
        console.error('[authService] Erreur de configuration:', error.message);
        throw new Error('Erreur lors de la configuration de la requête');
      }
    }
  },

  // Déconnexion
  async logout(): Promise<void> {
    try {
      await api.get('/users/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // On supprime toujours le token localement
      await AsyncStorage.removeItem('auth_token');
    }
  },

  // Vérification de l'authentification
  async checkAuth(): Promise<boolean> {
    try {
      console.log('[authService] Vérification de l\'authentification...');
      // Vérification de l'existence du token dans AsyncStorage
      const token = await AsyncStorage.getItem('auth_token');
      
      // Si aucun token n'est trouvé, l'utilisateur n'est pas authentifié
      if (!token || token.trim() === '') {
        console.log('[authService] Aucun token d\'authentification trouvé');
        return false;
      }

      console.log('[authService] Token trouvé, vérification avec le serveur...');
      // Utilisation de /users/profile au lieu de /users/verify
      const response = await api.get('/users/verify');
      console.log('[authService] Réponse de vérification:', response.status);
      return response.status === 200;
    } catch (error: any) {
      console.error('[authService] Erreur lors de la vérification de l\'authentification:', error);
      
      // Ne nettoyer le token que si c'est vraiment une erreur d'authentification (401/403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('[authService] Token invalide, suppression...');
        await AsyncStorage.removeItem('auth_token');
      } else {
        console.log('[authService] Erreur réseau ou serveur, conservation du token pour nouvelle tentative');
      }
      
      return false;
    }
  },

  // Récupération du profil utilisateur
  async getProfile(): Promise<AuthResponse['user']> {
    try {
      console.log('[authService] Récupération du profil utilisateur...');
      const response = await api.get<{ user: AuthResponse['user'] }>('/users/profile');
      console.log('[authService] Réponse du profil reçue:', {
        status: response.status,
        data: response.data
      });
      
      // Extraction des données utilisateur du niveau correct
      const userData = response.data.user;
      
      // Validation des données reçues
      if (!userData || !userData.id || !userData.username || !userData.email) {
        console.error('[authService] Données du profil invalides:', userData);
        throw new Error('Données du profil utilisateur invalides');
      }
      
      console.log('[authService] Profil utilisateur valide récupéré:', {
        id: userData.id,
        username: userData.username,
        email: userData.email
      });
      
      return userData;
    } catch (error: any) {
      console.error('[authService] Erreur lors de la récupération du profil:', error);
      throw new Error('Erreur lors de la récupération du profil');
    }
  }
}; 