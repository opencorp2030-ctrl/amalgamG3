# amalgamG3

Une carte d'identité numérique vérifiée pour le commerce : les particuliers créent un compte,
scannent leur pièce d'identité et un selfie, puis se font vérifier manuellement par un
administrateur. Une fois vérifiés, ils disposent d'une carte (QR code, badge RFID/NFC, Apple/Google
Wallet) que les commerces peuvent scanner pour confirmer identité et âge — sans jamais voir la
pièce d'identité elle-même.

Les commerces peuvent aussi ajouter un bouton "Vérifier mon âge" sur leur propre site ou leur app,
configurable pour ne demander que les informations dont ils ont réellement besoin (nom, date de
naissance exacte, nationalité, date d'expiration du document, photo — chacune optionnelle), avec
consentement explicite affiché à chaque vérification.

Site en production : https://amalgam.candygate.eu

## Fonctionnalités

- **Comptes particuliers** : inscription, scan de document d'identité (passeport TD3, carte
  d'identité TD1/TD2) avec lecture OCR de la MRZ et vérification des clés de contrôle
  (`assets/js/mrz.js`), selfie avec détection de vivacité (rotation de tête), validation manuelle
  par un administrateur.
- **Carte numérique** : QR code personnel, ajout à Apple Wallet / Google Wallet, association à un
  badge RFID/NFC.
- **Comptes commerces** : scanner (caméra QR, RFID USB, NFC) pour vérifier un client en caisse,
  seuil d'âge minimum configurable, journal des vérifications.
- **Boutons de vérification embarquables** (`merchant-widgets.html`, `verify.html`) : un commerce
  génère un bouton HTML à coller sur son propre site/app, avec un flux desktop (QR à scanner) ou
  mobile (vérification directe), et des champs demandés configurables par bouton.
- **Panneau admin** (`admin.html`) : validation des comptes en attente, comparaison faciale
  automatique document/selfie, association de badges, statistiques, personnalisation des cartes
  Wallet.
- **Connecteur MCP pour Claude** (`mcp-server/`, onglet "IA & MCP") : un commerce peut connecter son
  compte à Claude (lien de connecteur distant ou serveur MCP local) pour créer/lister/modifier ses
  boutons de vérification et son profil en langage naturel.

## Stack

- Frontend : HTML/CSS/JS statique, sans framework ni étape de build (charte inspirée du DSFR,
  identité propre à amalgamG3).
- Backend : Supabase (Postgres + Auth + Storage + Edge Functions) — les appels aux fonctions se
  font directement depuis le navigateur avec la clé anonyme (`assets/js/config.js`), l'accès aux
  données étant contrôlé par Row Level Security côté Supabase.
- Hébergement du site statique : Hostinger.

## Structure

```
index.html, login.html, signup.html, forgot-password.html, reset-password.html   pages publiques
dashboard.html                                                                    espace particulier
scan.html                                                                         scan mobile (document + selfie)
merchant.html, merchant-profile.html, merchant-widgets.html, merchant-ai.html     espace commerce
verify.html                                                                       widget de vérification embarquable
admin.html                                                                        panneau admin
legal.html                                                                        mentions légales / confidentialité / accessibilité
assets/css/style.css, assets/js/config.js, assets/js/mrz.js, assets/img/         assets partagés
mcp-server/                                                                       serveur MCP (Claude ↔ compte commerce)
```

## Développement local

Le site n'a pas d'étape de build : servir le dossier avec n'importe quel serveur statique, par
exemple :

```bash
npx serve .
```

Les identifiants Supabase (URL + clé anonyme) sont dans `assets/js/config.js` — cette clé est
prévue pour être publique, l'accès aux données est imposé par les policies RLS et les Edge
Functions côté Supabase, pas par le secret de la clé.

## Remerciements

Merci à tous les contributeurs qui participent à l'amélioration et au développement d'amalgamG3 !

## Mentions légales

Le contenu de `legal.html` contient des champs à compléter (identité de l'éditeur, SIRET, contact)
avant une mise en production définitive — voir les marqueurs "à compléter" dans le fichier.
