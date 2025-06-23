import { IconSymbol } from '@/components/shared/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const { colors } = useTheme();
  const { showNotification } = useNotification();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    if (!username || !email || !password || !confirmPassword) {
      setError(t('auth.fillAllFields'));
      return false;
    }

    if (username.length < 3 || username.length > 30) {
      setError(t('auth.usernameLength'));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('auth.invalidEmail'));
      return false;
    }

    if (password.length < 6) {
      setError(t('auth.passwordLength'));
      return false;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordsDontMatch'));
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    console.log('[RegisterScreen] Début de l\'inscription');
    setError(null);

    if (!validateForm()) {
      console.log('[RegisterScreen] Validation du formulaire échouée');
      return;
    }

    setIsLoading(true);
    try {
      const credentials = {
        username: username.trim(),
        email: email.trim(),
        password: password
      };

      console.log('[RegisterScreen] Tentative d\'inscription avec:', credentials);
      await register(credentials.username, credentials.email, credentials.password);
      console.log('[RegisterScreen] Inscription réussie');
      showNotification(t('auth.registerSuccess'), 'success');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('[RegisterScreen] Erreur lors de l\'inscription:', error);
      
      if (error.response?.status === 400 && error.response?.data?.details) {
        const validationError = error.response.data.details[0]?.message;
        setError(validationError || t('auth.validationError'));
        showNotification(validationError || t('auth.validationError'), 'error');
      } else {
        setError(error.message || t('errors.general'));
        showNotification(error.message || t('errors.general'), 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={[styles.scrollContainer, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <IconSymbol name="person.badge.plus.fill" size={40} color="#fff" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {t('auth.createAccount')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('auth.registerSubtitle')}
          </Text>

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
              <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.error} style={styles.errorIcon} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            </View>
          )}

          <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
            <IconSymbol name="person.fill" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t('auth.username')}
              placeholderTextColor={colors.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
            <IconSymbol name="envelope.fill" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t('auth.email')}
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
            <IconSymbol name="lock.fill" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t('auth.password')}
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
            <IconSymbol name="lock.fill" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t('auth.confirmPassword')}
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.primary },
              isLoading && styles.buttonDisabled
            ]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <IconSymbol name="person.badge.plus.fill" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>
                  {t('auth.register')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>
              {t('auth.alreadyHaveAccount')}
            </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.loginLink, { color: colors.primary }]}>
                  {t('auth.login')}
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
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
    width: 80,
    height: 80,
    borderRadius: 40,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    marginRight: 4,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 