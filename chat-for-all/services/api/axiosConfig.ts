import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Déterminer l'URL de base en fonction de l'environnement
const getBaseUrl = () => {
  // En développement, utiliser l'adresse IP de la machine
  if (__DEV__) {
    return 'http://192.168.1.179:3000/api'; // Remplacez par votre IP:
    // return 'http://localhost:3000/api';
  }
  // En production, utiliser l'URL de production
  // return 'http://192.168.1.179:3000/api';
  return 'http://localhost:3000/api';
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
      // Utiliser jwt_token au lieu de auth_token
      const token = await AsyncStorage.getItem('jwt_token');
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

    if (error.response?.status === 401) {
      // Token expiré ou invalide
      console.log('[axiosConfig] Token invalide ou expiré, déconnexion...');
      await AsyncStorage.removeItem('jwt_token');
      // Vous pouvez ajouter ici la logique de redirection vers la page de connexion
    }
    return Promise.reject(error);
  }
);

export default api; 