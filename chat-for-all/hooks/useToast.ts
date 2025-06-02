import type { ToastType } from '@/models';
import { useCallback } from 'react';
import Toast from 'react-native-toast-message';

export const useToast = () => {
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    Toast.show({
      type,
      text1: message,
      position: 'bottom',
      visibilityTime: 3000,
    });
  }, []);

  return { showToast };
}; 