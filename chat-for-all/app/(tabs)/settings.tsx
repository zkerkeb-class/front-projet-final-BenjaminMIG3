import { IconSymbol, type IconSymbolName } from '@/components/shared/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';

import { changeLanguage } from '@/i18n';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const { colors, theme, setTheme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const { logout, user } = useAuth();
  const { showNotification } = useNotification();


  // État pour les notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Changer le thème
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    showNotification(
      t(`settings.${newTheme}ThemeSelected`), 
      'success'
    );
  };

  // Changer la langue
  const handleLanguageChange = async (lang: string) => {
    await changeLanguage(lang);
    showNotification(
      t('settings.languageChanged'), 
      'success'
    );
  };

  // Déconnexion
  const handleLogout = () => {
    logout();
    showNotification(
      t('auth.loggedOut'),
      'info'
    );
  };

  // Gestion des notifications
  const handleNotificationsToggle = (value: boolean) => {
    setNotificationsEnabled(value);
    showNotification(
      value ? t('settings.notificationsEnabled') : t('settings.notificationsDisabled'),
      'info'
    );
  };

  // Test des notifications
  const testNotifications = () => {
    if (!notificationsEnabled) {
      showNotification(t('settings.notificationsDisabledWarning'), 'warning');
      return;
    }
    
    showNotification(t('settings.testSuccessMessage'), 'success');
    
    setTimeout(() => {
      showNotification(t('settings.testWarningMessage'), 'warning');
    }, 1000);
    
    setTimeout(() => {
      showNotification(t('settings.testInfoMessage'), 'info');
    }, 2000);
    
    setTimeout(() => {
      showNotification(t('settings.testErrorMessage'), 'error');
    }, 3000);
  };

  // Rendu d'une section
  const renderSection = (title: string, icon: IconSymbolName) => (
    <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
      <IconSymbol name={icon} size={22} color={colors.primary} />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {title}
      </Text>
    </View>
  );

  // Rendu d'un item de paramètre
  const renderSettingItem = ({ 
    icon, 
    label, 
    value, 
    onPress,
    showArrow = true,
    right = null
  }: { 
    icon: IconSymbolName, 
    label: string, 
    value?: string,
    onPress?: () => void,
    showArrow?: boolean,
    right?: React.ReactNode
  }) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingIconContainer}>
        <IconSymbol name={icon} size={20} color={colors.text} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          {label}
        </Text>
        {value && (
          <Text style={[styles.settingValue, { color: colors.text + '99' }]}>
            {value}
          </Text>
        )}
      </View>
      {right || (showArrow && (
        <IconSymbol name="chevron.right" size={18} color={colors.text + '66'} />
      ))}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('navigation.settings')}
        </Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {/* Profil */}
        {renderSection(t('navigation.profile'), 'person.crop.circle')}
        
        <View style={[styles.profileContainer, { backgroundColor: colors.primary + '22', borderBottomColor: colors.border }]}>
          <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.profileAvatarText}>{user?.username?.charAt(0) || 'U'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user?.username || 'Chargement...'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.text + '99' }]}>
              {user?.email || 'Chargement du profil...'}
            </Text>
          </View>
        </View>

        {/* Apparence */}
        {renderSection(t('settings.appearance'), 'paintbrush')}
        
        <View style={[styles.themeContainer, { backgroundColor: colors.card }]}>
          <TouchableOpacity 
            style={[
              styles.themeOption, 
              theme === 'light' && { backgroundColor: colors.primary + '22' }
            ]}
            onPress={() => handleThemeChange('light')}
          >
            <View style={[styles.themeIcon, { backgroundColor: '#f5f5f5' }]}>
              <IconSymbol name="sun.max.fill" size={24} color="#F39C12" />
            </View>
            <Text style={[styles.themeLabel, { color: colors.text }]}>
              {t('settings.lightMode')}
            </Text>
            {theme === 'light' && (
              <View style={[styles.themeSelected, { backgroundColor: colors.primary }]}>
                <IconSymbol name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.themeOption, 
              theme === 'dark' && { backgroundColor: colors.primary + '22' }
            ]}
            onPress={() => handleThemeChange('dark')}
          >
            <View style={[styles.themeIcon, { backgroundColor: '#121212' }]}>
              <IconSymbol name="moon.fill" size={24} color="#A569BD" />
            </View>
            <Text style={[styles.themeLabel, { color: colors.text }]}>
              {t('settings.darkMode')}
            </Text>
            {theme === 'dark' && (
              <View style={[styles.themeSelected, { backgroundColor: colors.primary }]}>
                <IconSymbol name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.themeOption, 
              theme === 'system' && { backgroundColor: colors.primary + '22' }
            ]}
            onPress={() => handleThemeChange('system')}
          >
            <View style={[styles.themeIcon, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
              <IconSymbol 
                name={isDark ? 'moon.stars.fill' : 'sun.max.fill'} 
                size={24} 
                color={isDark ? '#A569BD' : '#F39C12'} 
              />
            </View>
            <Text style={[styles.themeLabel, { color: colors.text }]}>
              {t('settings.systemTheme')}
            </Text>
            {theme === 'system' && (
              <View style={[styles.themeSelected, { backgroundColor: colors.primary }]}>
                <IconSymbol name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Langue */}
        {renderSection(t('settings.language'), 'globe')}
        
        <View style={[styles.languageContainer, { backgroundColor: colors.card }]}>
          <TouchableOpacity 
            style={[
              styles.languageOption, 
              i18n.language === 'fr' && { backgroundColor: colors.primary + '22' }
            ]}
            onPress={() => handleLanguageChange('fr')}
          >
            <Text style={styles.languageFlag}>🇫🇷</Text>
            <Text style={[styles.languageLabel, { color: colors.text }]}>
              Français
            </Text>
            {i18n.language === 'fr' && (
              <View style={[styles.languageSelected, { backgroundColor: colors.primary }]}>
                <IconSymbol name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.languageOption, 
              i18n.language === 'en' && { backgroundColor: colors.primary + '22' }
            ]}
            onPress={() => handleLanguageChange('en')}
          >
            <Text style={styles.languageFlag}>🇬🇧</Text>
            <Text style={[styles.languageLabel, { color: colors.text }]}>
              English
            </Text>
            {i18n.language === 'en' && (
              <View style={[styles.languageSelected, { backgroundColor: colors.primary }]}>
                <IconSymbol name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Autres paramètres */}
        {renderSection(t('settings.other'), 'gear')}
        
        {renderSettingItem({ 
          icon: 'bell', 
          label: t('settings.notifications'),
          right: (
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: '#767577', true: colors.primary + '88' }}
              thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
            />
          ),
          showArrow: false
        })}
        
        {renderSettingItem({ 
          icon: 'lock', 
          label: t('settings.privacy')
        })}
        
        {renderSettingItem({ 
          icon: 'questionmark.circle', 
          label: t('settings.help')
        })}
        
        {renderSettingItem({ 
          icon: 'info.circle', 
          label: t('settings.about'),
          value: 'v1.0.0'
        })}
        
        {renderSettingItem({ 
          icon: 'sparkles', 
          label: t('settings.testNotifications'),
          onPress: testNotifications
        })}

        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.error }]}
          onPress={handleLogout}
        >
          <IconSymbol name="arrow.right.square" size={20} color="#fff" />
          <Text style={styles.logoutText}>
            {t('auth.logout')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    marginTop: 2,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileAvatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
  },
  themeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  themeOption: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    width: '30%',
  },
  themeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  themeSelected: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  languageOption: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    width: '45%',
    flexDirection: 'row',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 10,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageSelected: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 40,
    padding: 15,
    borderRadius: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },

}); 