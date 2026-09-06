# Guide de contribution

Pour lancer le site en local, aucune étape de build n'est requise : il suffit d'utiliser un serveur statique à la racine du projet, par exemple avec `npx serve .`. Les identifiants Supabase nécessaires au fonctionnement du frontend sont déjà préconfigurés dans `assets/js/config.js`.

Le serveur MCP (`mcp-server/`) permet à un commerce de connecter son compte à Claude afin de gérer ses boutons de vérification et son profil en langage naturel. Il peut s'utiliser via un connecteur distant sur claude.ai ou en local (`node mcp-server/index.js`) en renseignant la variable `AMALGAMG3_API_KEY`.