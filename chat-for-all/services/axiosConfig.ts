import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';

// Déterminer l'URL de base en fonction de l'environnement
const getBaseUrl = () => {
  if (__DEV__) {
    // Pour l'émulateur Android
    if (Platform.OS === 'android') {
      return 'https://chatforall.online/api'
    }
    // Pour l'émulateur iOS ou appareil physique
    // return 'http://192.168.1.179:3000/api'; // Remplacez par l'IP de votre machine si nécessaire
    return 'https://chatforall.online/api'
    // ;
  }
  // En production
  return 'https://chatforall.online/api'; // URL de production avec HTTPS
  // return 'http://localhost:3000/api';
};

// Configuration de l'instance axios
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour les requêtes
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('[axiosConfig] Erreur lors de la récupération du token:', error);
      return Promise.reject(error);
    }
  },
  (error: AxiosError) => {
    console.error('[axiosConfig] Erreur dans l\'intercepteur de requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('[axiosConfig] Requête réussie:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status
    });
    return response;
  },
  async (error: AxiosError) => {
    console.error('[axiosConfig] Erreur de réponse:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    });

    // Ne supprimer le token que pour des erreurs 401 sur des routes d'authentification
    if (error.response?.status === 401 && error.config?.url?.includes('/users/profile')) {
      console.log('[axiosConfig] Token invalide ou expiré lors de la vérification, déconnexion...');
      await AsyncStorage.removeItem('auth_token');
      // Ajouter ici la logique de redirection vers la page de connexion
    }
    return Promise.reject(error);
  }
);

export default api;