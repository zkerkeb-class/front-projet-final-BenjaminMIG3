# Services - Architecture Refactorisée

## 🎯 Problème Résolu

Ce dossier contenait des **fichiers dupliqués** avec des fonctionnalités redondantes qui créaient :
- Des incohérences dans le code
- Une maintenance difficile
- Des risques d'erreurs
- Une performance sous-optimale

## ✅ Solution Implémentée

### Structure Unifiée

```
services/
├── api/                          # Services principaux (API)
│   ├── messageService.ts         # Service unifié pour les messages
│   ├── conversationService.ts    # Service unifié pour les conversations
│   ├── authService.ts            # Service d'authentification
│   ├── userService.ts            # Service utilisateur
│   ├── friendshipService.ts      # Service d'amitié
│   └── axiosConfig.ts            # Configuration Axios
├── conversationUtils.ts          # Utilitaires spécialisés uniquement
├── index.ts                      # Point d'entrée unifié
└── README.md                     # Cette documentation
```

### Fichiers Supprimés

- ❌ `services/messageService.ts` (dupliqué)
- ❌ `services/conversationService.ts` (dupliqué)

## 🚀 Améliorations Apportées

### 1. Services Unifiés

#### MessageService (`services/api/messageService.ts`)
- **Consolidation** des fonctionnalités des deux messageService
- **Optimisation algorithmique** des méthodes utilitaires
- **Validation** intégrée des données
- **Gestion d'erreurs** unifiée
- **Utilisation d'Axios** avec parameters optimisés

#### ConversationService (`services/api/conversationService.ts`)
- **Fusion** des fonctionnalités des deux conversationService
- **Validation** des données de conversation
- **Pagination** améliorée
- **Algorithmes optimisés** pour le formatage des dates
- **Méthodes utilitaires** intégrées

### 2. Utilitaires Spécialisés

#### ConversationUtils (`services/conversationUtils.ts`)
- **Déduplication** des fonctions
- **Marquage @deprecated** des méthodes dupliquées
- **Ajout** de nouvelles fonctionnalités spécialisées :
  - `filterConversations()` - Filtrage avancé
  - `groupMessagesByDate()` - Version Map optimisée
  - **Compatibilité** maintenue avec les anciennes API

### 3. Point d'Entrée Unifié

#### Index (`services/index.ts`)
- **Export central** de tous les services
- **Import lazy** pour l'optimisation
- **Types TypeScript** exportés
- **Fonction d'initialisation** des services

## 📊 Optimisations Algorithmiques

### Formatage des Dates
```typescript
// AVANT: Calculs répétés
const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

// APRÈS: Seuils prédéfinis et boucle optimisée
const intervals = [
  { label: 'À l\'instant', threshold: 60000 },
  { label: 'min', threshold: 3600000, unit: 60000 }
];
```

### Groupement des Messages
```typescript
// AVANT: Array.reduce() avec création d'objets
return messages.reduce((groups, message) => { ... }, {});

// APRÈS: Map() pour de meilleures performances
const groups = new Map<string, Message[]>();
for (const message of messages) { ... }
```

### Requêtes HTTP
```typescript
// AVANT: Construction manuelle d'URL
const url = `${baseUrl}/messages?page=${page}&limit=${limit}`;

// APRÈS: Utilisation des paramètres Axios
const response = await api.get('/messages', { params: { page, limit } });
```

## 🔧 Utilisation

### Import Simplifié

```typescript
// Import de services individuels
import { messageService, conversationService } from '@/services';

// Import de tous les services
import * as Services from '@/services';

// Import avec lazy loading
const { message } = Services.Services;
const messageServiceInstance = await message();
```

### Utilisation des Services

```typescript
// Messages
const messages = await messageService.getMessages(conversationId, 1, 20);
const isValid = messageService.validateMessageContent(content);

// Conversations
const conversations = await conversationService.getUserConversations(userId);
const displayName = conversationService.getDisplayName(conversation, userId);

// Utilitaires spécialisés
const filtered = ConversationUtils.filterConversations(conversations, {
  hasUnread: true,
  isGroup: false
});
```

## 🎯 Avantages de la Refactorisation

1. **Performance** : Algorithmes optimisés, moins de calculs redondants
2. **Maintenabilité** : Une seule source de vérité par fonctionnalité
3. **Lisibilité** : Code plus clair et mieux organisé
4. **Évolutivité** : Structure modulaire facilement extensible
5. **Fiabilité** : Moins de bugs grâce à la déduplication
6. **TypeScript** : Meilleur support avec types centralisés

## 🔄 Migration

Les anciens imports continuent de fonctionner grâce au système de compatibilité :

```typescript
// Ancien code (toujours fonctionnel)
import ConversationService from '@/services/conversationService';

// Nouveau code (recommandé)
import { conversationService } from '@/services';
```

## 📝 Notes de Développement

- Les méthodes marquées `@deprecated` seront supprimées dans une version future
- Utiliser les services API principaux plutôt que les utilitaires pour les opérations CRUD
- Les utilitaires sont destinés aux calculs locaux et fonctions spécialisées
- Toujours préférer les imports depuis `@/services` pour bénéficier du lazy loading 