import { useTheme } from '@/contexts/ThemeContext';
import { useSocketConnection } from '@/hooks';
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

  const { colors } = useTheme();

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
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <View 
          style={[
            styles.statusIndicator, 
            { backgroundColor: getStatusColor() }
          ]} 
        />
        <Text style={[styles.statusText, { color: colors.text }]}>
          {getStatusText()}
        </Text>
      </View>
      
      {showDetails && (
        <View style={[styles.detailsContainer, { borderTopColor: colors.border }]}>
          <Text style={[styles.detailText, { color: colors.text + '99' }]}>
            Socket ID: {connectionState.socketId || 'N/A'}
          </Text>
          {connectionState.reconnectAttempts > 0 && (
            <Text style={[styles.detailText, { color: colors.text + '99' }]}>
              Tentatives: {connectionState.reconnectAttempts}/{connectionState.maxReconnectAttempts}
            </Text>
          )}
        </View>
      )}
      
      {showReconnectButton && !isConnected && (
        <TouchableOpacity 
          style={[styles.reconnectButton, { backgroundColor: colors.primary }]}
          onPress={forceReconnect}
          disabled={isReconnecting}
        >
          <Text style={styles.reconnectButtonText}>
            {isReconnecting ? 'Reconnexion...' : 'Se reconnecter'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailsContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 4,
  },
  reconnectButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  reconnectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ConnectionStatus; 