import { useSocket } from '@/contexts/SocketContext';

export interface SocketConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  socketId: string | null;
}

export const useSocketConnection = () => {
  // Utiliser le contexte global au lieu de créer des écouteurs locaux
  return useSocket();
}; 