import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

interface UsePageFocusOptions {
  onFocus: () => Promise<void>;
  enabled?: boolean;
  dependencies?: any[];
}

/**
 * Hook personnalisé pour gérer le chargement des données à chaque focus de page
 * @param options Options de configuration
 * @param options.onFocus Fonction à exécuter lors du focus
 * @param options.enabled Si le hook doit être actif (par défaut: true)
 * @param options.dependencies Dépendances additionnelles pour le rechargement
 */
export const usePageFocus = ({ 
  onFocus, 
  enabled = true,
  dependencies = []
}: UsePageFocusOptions) => {
  // Référence pour suivre si le composant est monté
  const isMountedRef = useRef(false);
  // Référence pour suivre si le chargement initial a été effectué
  const initialLoadDoneRef = useRef(false);
  // Référence pour suivre si un chargement est en cours
  const isLoadingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadData = async () => {
        // Vérifier si le hook est activé et si le composant est monté
        if (!enabled || !isActive || isLoadingRef.current) return;

        try {
          isLoadingRef.current = true;

          // Si c'est la première fois que le composant est monté
          if (!isMountedRef.current) {
            isMountedRef.current = true;
            initialLoadDoneRef.current = false;
          }

          // Charger les données
          await onFocus();
          initialLoadDoneRef.current = true;

        } catch (error) {
          console.error('[usePageFocus] Erreur lors du chargement:', error);
        } finally {
          if (isActive) {
            isLoadingRef.current = false;
          }
        }
      };

      loadData();

      // Nettoyage lors du démontage
      return () => {
        isActive = false;
        if (!isMountedRef.current) {
          initialLoadDoneRef.current = false;
        }
      };
    }, [enabled, onFocus, ...dependencies])
  );

  // Fonction pour forcer un rechargement
  const forceRefresh = useCallback(async () => {
    if (isLoadingRef.current) return;
    initialLoadDoneRef.current = false;
    await onFocus();
  }, [onFocus]);

  return {
    isInitialLoadDone: initialLoadDoneRef.current,
    isLoading: isLoadingRef.current,
    forceRefresh
  };
}; 