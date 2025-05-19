declare module 'react-native-toast-message' {
  export interface ToastProps {
    type?: 'success' | 'error' | 'info';
    text1?: string;
    text2?: string;
    position?: 'top' | 'bottom';
    visibilityTime?: number;
  }

  const Toast: {
    show(props: ToastProps): void;
    hide(): void;
  };

  export default Toast;
} 