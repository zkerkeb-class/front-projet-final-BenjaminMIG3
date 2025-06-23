import type { AuthContextType, User } from '@/models';
import { authService } from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

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
        const isAuthenticated = await authService.checkAuth();
        if (isAuthenticated) {
          const userProfile = await authService.getProfile();
          setUser(userProfile);
        }
      } catch (err) {
        console.error('Erreur lors de la vérification du statut de connexion:', err);
        // En cas d'erreur, on nettoie le stockage
        await AsyncStorage.removeItem('jwt_token');
        setUser(null);
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
      const response = await authService.login({ email, password });
      setUser(response.user);
      
      // Rediriger vers la page d'accueil
      router.push('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la connexion');
      throw err; // Propager l'erreur pour la gestion dans le composant
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction d'inscription
  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.register({ username, email, password });
      setUser(response.user);
      
      // Rediriger vers la page d'accueil
      router.push('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'inscription');
      throw err; // Propager l'erreur pour la gestion dans le composant
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    } finally {
      setUser(null);
      router.push('/login');
    }
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