import React, { createContext, useState, useContext, useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types pour notre système d'authentification
type User = {
  id: string;
  username: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
};

// Création du contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé avec un AuthProvider');
  }
  return context;
}

// Provider pour fournir le contexte à l'application
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // Vérification d'un token stocké avec AsyncStorage
        const storedUser = await AsyncStorage.getItem('user');
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Erreur lors de la vérification du statut de connexion:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // Fonction de connexion
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulation d'une requête API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dans une vraie application, vous feriez un appel API ici
      if (email === 'test@example.com' && password === 'password') {
        const userData: User = {
          id: '1',
          username: 'Utilisateur Test',
          email: 'test@example.com'
        };
        
        // Stocker les informations utilisateur
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        // Rediriger vers la page d'accueil
        router.push('/(tabs)');
      } else {
        throw new Error('Identifiants invalides');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction d'inscription
  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulation d'une requête API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dans une vraie application, vous feriez un appel API ici
      const userData: User = {
        id: Date.now().toString(),
        username,
        email
      };
      
      // Stocker les informations utilisateur
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Rediriger vers la page d'accueil
      router.push('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    AsyncStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    isLoading,
    isLoggedIn: !!user,
    login,
    register,
    logout,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 