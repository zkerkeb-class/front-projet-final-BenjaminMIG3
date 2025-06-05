import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/modules/shared';
import { IconSymbol } from '@/modules/shared';

interface ChatHeaderProps {
  title: string;
  onInfoPress?: () => void;
  showBackButton?: boolean;
}

export default function ChatHeader({
  title,
  onInfoPress,
  showBackButton = true,
}: ChatHeaderProps) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showBackButton && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            name="chevron.left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      )}

      <ThemedText style={styles.title} numberOfLines={1}>
        {title}
      </ThemedText>

      {onInfoPress && (
        <TouchableOpacity
          style={styles.infoButton}
          onPress={onInfoPress}
        >
          <IconSymbol
            name="info.circle"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoButton: {
    marginLeft: 8,
    padding: 4,
  },
}); 