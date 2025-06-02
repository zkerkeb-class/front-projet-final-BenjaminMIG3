# Modèles et Interfaces TypeScript

Ce dossier contient toutes les interfaces et types TypeScript utilisés dans l'application, organisés par domaine métier pour une meilleure maintenabilité.

## Structure

### 📁 `user.ts`
Interfaces relatives aux utilisateurs :
- `User` - Interface principale pour un utilisateur
- `RawUser` - Utilisateur brut venant de l'API (avec _id MongoDB)
- `CleanUser` - Données utilisateur nettoyées (sans mot de passe)
- `SearchUsersResponse` - Réponse de recherche d'utilisateurs

### 📁 `auth.ts`
Interfaces relatives à l'authentification :
- `LoginCredentials` - Identifiants de connexion
- `RegisterCredentials` - Identifiants d'inscription
- `RawAuthResponse` - Réponse brute de l'API d'authentification
- `AuthResponse` - Réponse d'authentification nettoyée
- `RegisterResponse` - Réponse d'inscription
- `AuthContextType` - Type pour le contexte d'authentification
- `JwtPayload` - Interface pour le payload JWT

### 📁 `friendship.ts`
Interfaces relatives aux amitiés et demandes d'amis :
- `Friendship` - Interface pour une amitié
- `Friend` - Interface pour un ami (utilisateur accepté)
- `FriendRequestResponse` - Réponse des demandes d'amis
- `FriendsResponse` - Réponse de la liste d'amis
- `FriendRequestsResponse` - Réponse des demandes d'amis en attente
- `FriendsListProps` - Props pour les composants de liste d'amis

### 📁 `chat.ts`
Interfaces relatives aux conversations et messages :
- `Message` - Interface pour un message
- `Conversation` - Interface pour une conversation
- `ConversationsResponse` - Réponse des conversations
- `MessagesResponse` - Réponse des messages

### 📁 `ui.ts`
Interfaces relatives à l'interface utilisateur et à la navigation :
- `ToastType` - Types pour les toasts
- `ThemeType` - Types pour les thèmes
- `ThemeColors` - Interface pour les couleurs du thème
- `ThemeContextType` - Interface pour le contexte du thème
- `Notification` - Type pour les notifications
- `NotificationContextType` - Interface pour le contexte des notifications
- `RootStackParamList` - Types pour la navigation
- `NavigationProp` - Type pour les propriétés de navigation

### 📁 `index.ts`
Point d'entrée centralisé qui exporte toutes les interfaces.

## Utilisation

Pour importer des interfaces dans vos composants :

```typescript
// Import spécifique
import type { User, Message } from '@/models';

// Import multiple
import type { 
  AuthResponse, 
  LoginCredentials, 
  Friend 
} from '@/models';
```

## Bonnes Pratiques

1. **Organisation par domaine** : Chaque fichier regroupe les interfaces d'un domaine métier spécifique
2. **Nommage cohérent** : Utilisez des noms explicites et cohérents
3. **Documentation** : Ajoutez des commentaires pour les interfaces complexes
4. **Réutilisabilité** : Évitez la duplication en réutilisant les interfaces existantes
5. **Import centralisé** : Utilisez le fichier `index.ts` pour tous les imports

## Migration

Les interfaces ont été migrées depuis les fichiers suivants :
- `services/api/authService.ts`
- `services/api/userService.ts`
- `services/api/friendshipService.ts`
- `contexts/AuthContext.tsx`
- `contexts/ThemeContext.tsx`
- `components/FriendsList.tsx`
- `hooks/useToast.ts`
- Pages de l'application

Cette organisation améliore la maintenabilité, évite la duplication de code et facilite la réutilisation des types dans toute l'application.

# Modèles de données

Ce dossier contient toutes les interfaces TypeScript utilisées dans l'application pour typer les données.

## Structure des modèles

### Authentification (`auth.ts`)
- **LoginRequest** : Données requises pour la connexion
- **LoginResponse** : Réponse de l'API lors de la connexion
- **RegisterRequest** : Données requises pour l'inscription
- **RegisterResponse** : Réponse de l'API lors de l'inscription

### Utilisateur (`user.ts`)
- **User** : Interface principale pour un utilisateur (avec `id`)
- **RawUser** : Utilisateur brut venant de l'API MongoDB (avec `_id`)
- **CleanUser** : Données utilisateur nettoyées (sans mot de passe)
- **SearchUsersResponse** : Réponse de recherche d'utilisateurs

### Chat (`chat.ts`) - **NOUVEAU**
#### Interfaces principales
- **Message** : Structure d'un message
  - `_id` : ID unique du message
  - `conversation` : ID de la conversation
  - `sender` : ID ou objet User de l'expéditeur
  - `content` : Contenu du message
  - `timestamp` : Date d'envoi
  - `readBy` : Liste des utilisateurs ayant lu le message
  - `messageType` : Type de message ('text', 'image', 'file', 'system')
  - `edited` : Booléen indiquant si le message a été modifié

- **Conversation** : Structure d'une conversation
  - `_id` : ID unique de la conversation
  - `participants` : Liste des participants
  - `lastMessage` : Dernier message envoyé
  - `lastActivity` : Dernière activité
  - `isGroup` : Booléen pour les conversations de groupe
  - `groupName` : Nom du groupe (si applicable)
  - `createdBy` : Créateur de la conversation

#### Interfaces de requête
- **CreateConversationRequest** : Données pour créer une conversation
- **SendMessageRequest** : Données pour envoyer un message
- **UpdateMessageRequest** : Données pour modifier un message
- **MarkMessageAsReadRequest** : Données pour marquer un message comme lu

#### Interfaces de réponse
- **ConversationsResponse** : Réponse avec liste de conversations
- **ConversationResponse** : Réponse avec une conversation et ses messages
- **MessagesResponse** : Réponse avec liste de messages
- **SendMessageResponse** : Réponse après envoi de message
- **UpdateMessageResponse** : Réponse après modification de message
- **DeleteResponse** : Réponse après suppression

### Amitié (`friendship.ts`)
- **FriendshipRequest** : Données pour une demande d'amitié
- **FriendshipResponse** : Réponse de l'API pour les amitiés

### Interface utilisateur (`ui.ts`)
- **Theme** : Configuration du thème
- **NavigationState** : État de navigation

## Services API

### ConversationService (`services/api/conversationService.ts`)
Service pour gérer les conversations avec les méthodes :
- `createConversation(data)` : Créer une nouvelle conversation
- `getUserConversations(userId)` : Récupérer les conversations d'un utilisateur
- `getConversation(conversationId)` : Récupérer une conversation spécifique
- `deleteConversation(conversationId)` : Supprimer une conversation
- `addParticipant()` / `removeParticipant()` : Gérer les participants
- `updateConversation()` : Mettre à jour une conversation
- `markConversationAsRead()` : Marquer comme lue

### MessageService (`services/api/messageService.ts`)
Service pour gérer les messages avec les méthodes :
- `sendMessage(data)` : Envoyer un message
- `getMessages(conversationId, page, limit)` : Récupérer les messages avec pagination
- `updateMessage(messageId, data)` : Modifier un message
- `deleteMessage(messageId, userId)` : Supprimer un message
- `markMessageAsRead()` : Marquer un message comme lu
- `markAllMessagesAsRead()` : Marquer tous les messages comme lus
- `getUnreadCount()` : Obtenir le nombre de messages non lus
- `searchMessages()` : Rechercher des messages

## Hook personnalisé

### useChat (`hooks/useChat.ts`)
Hook React personnalisé pour gérer l'état du chat :

```typescript
const {
  conversations,
  currentConversation,
  messages,
  loadingConversations,
  loadingMessages,
  conversationError,
  messageError,
  hasMoreMessages,
  loadUserConversations,
  createConversation,
  selectConversation,
  loadMoreMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  markMessageAsRead,
  markAllMessagesAsRead,
  deleteConversation,
  resetChatState,
} = useChat(userId);
```

## Utilitaires

### ConversationUtils (`services/conversationUtils.ts`)
Classe utilitaire avec des méthodes statiques pour :
- **Affichage** :
  - `getConversationDisplayName()` : Obtenir le nom d'affichage d'une conversation
  - `getConversationAvatar()` : Obtenir l'avatar d'une conversation
  - `getLastMessagePreview()` : Obtenir un aperçu du dernier message

- **Statut et lecture** :
  - `getUnreadCount()` : Calculer les messages non lus
  - `isMessageReadBy()` : Vérifier si un message a été lu
  - `isOwnMessage()` : Vérifier si un message appartient à l'utilisateur
  - `getMessageStatus()` : Obtenir le statut d'un message

- **Formatage** :
  - `formatMessageTime()` : Formater la date d'un message (relative)
  - `formatFullMessageTime()` : Formater la date complète
  - `groupMessagesByDate()` : Grouper les messages par date

- **Tri et validation** :
  - `sortConversationsByActivity()` : Trier les conversations par activité
  - `validateMessageContent()` : Valider le contenu d'un message
  - `generateTempMessageId()` : Générer un ID temporaire

## Exemple d'utilisation

```typescript
import { useChat } from '../hooks/useChat';
import { ConversationUtils } from '../services/conversationUtils';
import { useAuth } from '../contexts/AuthContext';

function ChatScreen() {
  const { user } = useAuth();
  const {
    conversations,
    currentConversation,
    messages,
    sendMessage,
    selectConversation
  } = useChat(user?.id || '');

  const handleSendMessage = async (content: string) => {
    if (currentConversation && user) {
      await sendMessage({
        conversationId: currentConversation._id,
        senderId: user.id,
        content,
        messageType: 'text'
      });
    }
  };

  return (
    <View>
      {conversations.map(conv => (
        <TouchableOpacity 
          key={conv._id}
          onPress={() => selectConversation(conv._id)}
        >
          <Text>
            {ConversationUtils.getConversationDisplayName(conv, user?.id || '')}
          </Text>
          <Text>
            {ConversationUtils.getLastMessagePreview(conv)}
          </Text>
        </TouchableOpacity>
      ))}
      
      {messages.map(message => (
        <View key={message._id}>
          <Text>{message.content}</Text>
          <Text>
            {ConversationUtils.formatMessageTime(message.timestamp)}
          </Text>
        </View>
      ))}
    </View>
  );
}
```

## Structure backend attendue

Les modèles sont conçus pour fonctionner avec un backend MongoDB utilisant Mongoose avec la structure suivante :

### Routes attendues
- **POST** `/api/conversations` - Créer une conversation
- **GET** `/api/conversations/user/:userId` - Récupérer les conversations d'un utilisateur
- **GET** `/api/conversations/:conversationId` - Récupérer une conversation
- **DELETE** `/api/conversations/:conversationId` - Supprimer une conversation
- **POST** `/api/messages` - Envoyer un message
- **GET** `/api/messages/:conversationId` - Récupérer les messages
- **PUT** `/api/messages/:messageId` - Modifier un message
- **DELETE** `/api/messages/:messageId` - Supprimer un message
- **PUT** `/api/messages/:messageId/read` - Marquer comme lu

### Validation
- Les messages texte sont limités à 2000 caractères
- Une conversation doit avoir au minimum 2 participants
- Une conversation de groupe peut avoir jusqu'à 50 participants
- Les ObjectIds MongoDB sont utilisés pour les références

## Optimisations implémentées

1. **Pagination** : Les messages sont chargés par pages de 50
2. **État optimistique** : Les messages sont ajoutés immédiatement à l'interface
3. **Cache intelligent** : Évite les rechargements inutiles
4. **Gestion d'erreurs** : Système unifié de gestion des erreurs
5. **Performance** : Utilisation de useCallback et useRef pour éviter les re-rendus 