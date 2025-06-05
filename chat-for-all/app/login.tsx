import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/modules/shared';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const { colors } = useTheme();
  const { showNotification } = useNotification();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLogin = async () => {
    console.log('[LoginScreen] Début de la tentative de connexion');
    
    // Validation des champs
    if (!email || !password) {
      console.log('[LoginScreen] Validation échouée: champs vides');
      setLocalError('Veuillez remplir tous les champs');
      return;
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('[LoginScreen] Validation échouée: email invalide');
      setLocalError('Veuillez entrer une adresse email valide');
      return;
    }

    console.log('[LoginScreen] Validation réussie, tentative de connexion');
    try {
      setLocalError(null);
      await login(email, password);
      console.log('[LoginScreen] Connexion réussie');
      showNotification('🎉 Bienvenue ! Vous êtes connecté avec succès', 'success');
    } catch (error: any) {
      console.error('[LoginScreen] Erreur de connexion:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Message d'erreur plus détaillé pour l'utilisateur
      let errorMessage = 'Une erreur est survenue lors de la connexion';
      if (error.message.includes('Impossible de se connecter au serveur')) {
        errorMessage = 'Erreur de connexion au serveur. Vérifiez votre connexion internet.';
      } else if (error.message.includes('Erreur serveur')) {
        errorMessage = 'Le serveur rencontre des difficultés. Veuillez réessayer plus tard.';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Email ou mot de passe incorrect.';
      }
      
      setLocalError(errorMessage);
      showNotification(errorMessage, 'error');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
        <View style={[styles.logoContainer, { backgroundColor: colors.primary + '22' }]}>
          <IconSymbol name="bubble.left.and.bubble.right.fill" size={60} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Chat For All</Text>
        <Text style={[styles.subtitle, { color: colors.text + '99' }]}>Connectez-vous à votre compte</Text>

        {localError && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '22' }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.error} style={styles.errorIcon} />
            <Text style={[styles.errorText, { color: colors.error }]}>{localError}</Text>
          </View>
        )}

        <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
          <IconSymbol name="envelope" size={20} color={colors.text + '66'} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Email"
            placeholderTextColor={colors.text + '66'}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setLocalError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!isLoading}
          />
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
          <IconSymbol name="lock" size={20} color={colors.text + '66'} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Mot de passe"
            placeholderTextColor={colors.text + '66'}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setLocalError(null);
            }}
            secureTextEntry
            autoComplete="password"
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity 
          style={[
            styles.button, 
            { backgroundColor: colors.primary },
            isLoading && styles.buttonDisabled
          ]} 
          onPress={handleLogin} 
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <IconSymbol name="arrow.right.circle.fill" size={20} color="#FFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Se connecter</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={[styles.registerText, { color: colors.text + '99' }]}>Pas encore de compte ?</Text>
          <Link href="/register" asChild>
            <TouchableOpacity disabled={isLoading}>
              <Text style={[styles.registerLink, { color: colors.primary }]}>Créer un compte</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 10,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 14,
    marginRight: 4,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 