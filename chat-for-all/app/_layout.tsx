import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext';
import { initI18n } from '@/i18n';

// Composant pour la protection des routes
function RootLayoutNav() {
  const { isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      const inAuthGroup = segments[0] === '(tabs)';
      const isChatRoute = segments[0] === 'chat';

      if (isLoggedIn && !inAuthGroup && !isChatRoute) {
        // Rediriger vers l'écran principal si l'utilisateur est connecté
        // mais n'est pas dans (tabs) et n'est pas sur une route de chat.
        router.push('/(tabs)');
      } else if (!isLoggedIn && (inAuthGroup || isChatRoute)) {
        // Rediriger vers la connexion si l'utilisateur n'est pas connecté
        // mais essaie d'accéder à une route protégée (tabs ou chat).
        router.push('/login');
      }
    }
  }, [isLoggedIn, segments, isLoading, router]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen 
        name="chat/[id]" 
        options={{ 
          headerShown: false,
          presentation: 'card',
          animation: 'slide_from_right'
        }} 
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [i18nInitialized, setI18nInitialized] = useState(false);

  // Initialiser i18n
  useEffect(() => {
    const init = async () => {
      await initI18n();
      setI18nInitialized(true);
    };
    init();
  }, []);

  // Gérer l'état de l'application
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // Actions à effectuer quand l'app revient au premier plan
    }
  };

  if (!loaded || !i18nInitialized) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <AuthProvider>
      <CustomThemeProvider>
        <NotificationProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <RootLayoutNav />
            <StatusBar style="auto" />
          </ThemeProvider>
        </NotificationProvider>
      </CustomThemeProvider>
    </AuthProvider>
  );
}
