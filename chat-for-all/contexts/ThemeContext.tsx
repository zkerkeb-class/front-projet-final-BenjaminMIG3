import type { ThemeColors, ThemeContextType, ThemeType } from '@/models';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

// Définition des couleurs par thème
const lightColors: ThemeColors = {
  primary: '#0a7ea4',
  secondary: '#687076',
  background: '#fff',
  card: '#fff',
  text: '#11181C',
  textSecondary: '#687076',
  border: 'rgba(0,0,0,0.1)',
  notification: '#f39c12',
  error: '#e74c3c',
  success: '#2ecc71',
  info: '#3498db',
  warning: '#f39c12',
  inputBackground: '#f5f5f5',
};

const darkColors: ThemeColors = {
  primary: '#0a7ea4',
  secondary: '#9BA1A6',
  background: '#151718',
  card: '#1c1c1e',
  text: '#ECEDEE',
  textSecondary: '#9BA1A6',
  border: 'rgba(255,255,255,0.1)',
  notification: '#f39c12',
  error: '#e74c3c',
  success: '#2ecc71',
  info: '#3498db',
  warning: '#f39c12',
  inputBackground: '#2c2c2e',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme doit être utilisé avec un ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useNativeColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Chargement du thème depuis le stockage au démarrage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme') as ThemeType | null;
        if (savedTheme) {
          setThemeState(savedTheme);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du thème:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
  }, []);

  // Enregistrer le thème quand il change
  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du thème:', error);
    }
  };

  // Déterminer si c'est sombre en fonction du thème choisi
  const isDark = 
    theme === 'dark' || 
    (theme === 'system' && systemColorScheme === 'dark');

  // Choisir les couleurs en fonction du thème
  const colors = isDark ? darkColors : lightColors;

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook pour utiliser une couleur spécifique du thème
export function useThemeColor(colorName: keyof ThemeColors) {
  const { colors } = useTheme();
  return colors[colorName];
} 