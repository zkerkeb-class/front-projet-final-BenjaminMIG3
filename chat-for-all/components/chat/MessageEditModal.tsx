import { useTheme } from '@/contexts/ThemeContext';
import { Message } from '@/models';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface MessageEditModalProps {
  visible: boolean;
  message: Message | null;
  onClose: () => void;
  onSave: (messageId: string, newContent: string) => Promise<void>;
}

export default function MessageEditModal({
  visible,
  message,
  onClose,
  onSave,
}: MessageEditModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [editedContent, setEditedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (message && visible) {
      setEditedContent(message.content);
    }
  }, [message, visible]);

  const handleSave = async () => {
    if (!message || !editedContent.trim()) {
      Alert.alert(
        t('errors.validation'),
        t('chat.editMessage.emptyContent'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    if (editedContent.trim() === message.content.trim()) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      await onSave(message._id, editedContent.trim());
      onClose();
    } catch (error) {
      console.error('[MessageEditModal] Erreur lors de la sauvegarde:', error);
      Alert.alert(
        t('errors.error'),
        t('chat.editMessage.saveError'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (editedContent !== message?.content) {
      Alert.alert(
        t('chat.editMessage.unsavedChanges'),
        t('chat.editMessage.unsavedChangesMessage'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('chat.editMessage.discard'),
            style: 'destructive',
            onPress: onClose,
          },
        ]
      );
    } else {
      onClose();
    }
  };

  if (!message) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleCancel} disabled={isLoading}>
            <Text style={[styles.cancelButton, { color: colors.primary }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('chat.editMessage.title')}
          </Text>
          <TouchableOpacity 
            onPress={handleSave} 
            disabled={isLoading || !editedContent.trim()}
            style={[
              styles.saveButton,
              {
                backgroundColor: isLoading || !editedContent.trim() 
                  ? colors.border 
                  : colors.primary
              }
            ]}
          >
            <Text style={[
              styles.saveButtonText,
              { 
                color: isLoading || !editedContent.trim() 
                  ? colors.textSecondary 
                  : colors.background 
              }
            ]}>
              {isLoading ? t('common.saving') : t('common.save')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={editedContent}
            onChangeText={setEditedContent}
            multiline
            autoFocus
            placeholder={t('chat.editMessage.placeholder')}
            placeholderTextColor={colors.textSecondary}
            editable={!isLoading}
            maxLength={1000}
          />
          <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
            {editedContent.length}/1000
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  cancelButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
}); 