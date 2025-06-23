import { useSocketConnection } from '@/hooks';
import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ConnectionStatusProps {
  showDetails?: boolean;
  showReconnectButton?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  showDetails = false, 
  showReconnectButton = true 
}) => {
  const { 
    connectionState, 
    forceReconnect, 
    isConnected, 
    isReconnecting 
  } = useSocketConnection();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  // Déterminer la couleur du statut
  const getStatusColor = () => {
    if (isConnected) return '#4CAF50'; // Vert
    if (isReconnecting) return '#FF9800'; // Orange
    return '#F44336'; // Rouge
  };

  // Déterminer le texte du statut
  const getStatusText = () => {
    if (isConnected) return 'Connecté';
    if (isReconnecting) return `Reconnexion... (${connectionState.reconnectAttempts}/${connectionState.maxReconnectAttempts})`;
    return 'Déconnecté';
  };

  // Ne pas afficher si connecté et pas de détails demandés
  if (isConnected && !showDetails) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.statusContainer}>
        <View 
          style={[
            styles.statusIndicator, 
            { backgroundColor: getStatusColor() }
          ]} 
        />
        <Text style={[styles.statusText, { color: textColor }]}>
          {getStatusText()}
        </Text>
      </View>
      
      {showDetails && (
        <View style={styles.detailsContainer}>
          <Text style={[styles.detailText, { color: textColor }]}>
            Socket ID: {connectionState.socketId || 'N/A'}
          </Text>
          {connectionState.reconnectAttempts > 0 && (
            <Text style={[styles.detailText, { color: textColor }]}>
              Tentatives: {connectionState.reconnectAttempts}/{connectionState.maxReconnectAttempts}
            </Text>
          )}
        </View>
      )}
      
      {showReconnectButton && !isConnected && (
        <TouchableOpacity 
          style={[styles.reconnectButton, { borderColor: tintColor }]}
          onPress={forceReconnect}
          disabled={isReconnecting}
        >
          <Text style={[styles.reconnectButtonText, { color: tintColor }]}>
            {isReconnecting ? 'Reconnexion...' : 'Reconnecter'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    margin: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailsContainer: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  detailText: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  reconnectButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  reconnectButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ConnectionStatus; 