# Structure Modulaire du Projet

Cette structure modulaire est organisée pour une meilleure séparation des responsabilités et une maintenance plus facile.

## Organisation des Modules

```
modules/
├── auth/                 # Module d'authentification
│   ├── components/       # Composants spécifiques à l'authentification
│   ├── hooks/           # Hooks personnalisés pour l'authentification
│   ├── services/        # Services d'authentification
│   └── types/           # Types TypeScript pour l'authentification
│
├── chat/                # Module de chat
│   ├── components/      # Composants spécifiques au chat
│   ├── hooks/          # Hooks personnalisés pour le chat
│   ├── services/       # Services de chat
│   └── types/          # Types TypeScript pour le chat
│
├── profile/             # Module de profil utilisateur
│   ├── components/      # Composants spécifiques au profil
│   ├── hooks/          # Hooks personnalisés pour le profil
│   ├── services/       # Services de profil
│   └── types/          # Types TypeScript pour le profil
│
└── shared/             # Éléments partagés entre les modules
    ├── components/     # Composants réutilisables
    ├── hooks/         # Hooks réutilisables
    ├── services/      # Services partagés
    ├── types/         # Types partagés
    └── ui/            # Composants UI de base
```

## Règles de Nommage

- Les composants : PascalCase (ex: `AuthForm.tsx`)
- Les hooks : camelCase avec préfixe "use" (ex: `useAuth.ts`)
- Les services : camelCase (ex: `authService.ts`)
- Les types : PascalCase (ex: `AuthTypes.ts`)

## Bonnes Pratiques

1. Chaque module doit être autonome et avoir ses propres dépendances
2. Les composants partagés doivent être placés dans le dossier `shared`
3. Éviter les imports circulaires entre les modules
4. Documenter les composants et les fonctions importantes
5. Maintenir une séparation claire entre la logique métier et l'UI 