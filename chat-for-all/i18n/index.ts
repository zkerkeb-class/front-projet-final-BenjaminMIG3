import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Traductions
import translationEN from './locales/en.json';
import translationFR from './locales/fr.json';

const resources = {
  fr: {
    translation: translationFR,
  },  
  en: {
    translation: translationEN,
  },
};

// Détection de la langue sauvegardée
const getStoredLanguage = async () => {
  try {
    const language = await AsyncStorage.getItem('language');
    return language || 'fr'; // Français par défaut
  } catch (error) {
    console.error('Erreur lors de la récupération de la langue:', error);
    return 'fr';
  }
};

// Initialisation
const initI18n = async () => {
  const language = await getStoredLanguage();
  
  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v4' as const,
      resources,
      lng: language,
      fallbackLng: 'fr',
      interpolation: {
        escapeValue: false,
      },
    });
    
  return i18n;
};

// Fonction pour changer la langue
export const changeLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem('language', language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Erreur lors du changement de langue:', error);
  }
};

export { initI18n };
export default i18n; 