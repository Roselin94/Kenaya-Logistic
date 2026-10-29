# Guide de Déploiement Cloud — KENAYA LOGISTIC SaaS
**Architecture Déployée : Frontend sur Vercel + Backend API sur Render + Base MySQL Cloud**

Ce guide vous donne toutes les étapes pas à pas pour mettre en ligne l'application en quelques minutes afin de la présenter à votre client.

---

## 1. Vue d'Ensemble de l'Architecture de Production

```
+---------------------------------------+
|   CLIENTS / UTILISATEURS / DIRECTRICE  |
+---------------------------------------+
                   │
                   ▼
  +───────────────────────────────────+
  |    FRONTEND (React + Vite + SPA)  |  --> Hébergé sur VERCEL
  |    https://kenaya-logistic.vercel.app |
  +───────────────────────────────────+
                   │ (Appels REST HTTPS / Bearer JWT)
                   ▼
  +───────────────────────────────────+
  |    BACKEND (Express.js API REST)   |  --> Hébergé sur RENDER
  |    https://kenaya-api.onrender.com |
  +───────────────────────────────────+
                   │ (Pool MySQL TCP / SSL)
                   ▼
  +───────────────────────────────────+
  |    BASE DE DONNÉES MYSQL CLOUD    |  --> TiDB Cloud, Aiven ou Clever Cloud
  |    15 Tables, RBAC & Flotte Autos  |
  +───────────────────────────────────+
```

---

## 2. Étape 1 : Héberger la Base de Données MySQL (Gratuit)

Pour que Render puisse se connecter à une base de données en ligne, créez une base MySQL gérée gratuite sur l'un de ces services :

- **Option recommandée 1 : TiDB Cloud (Serverless)** : [tidbcloud.com](https://tidbcloud.com) (Gratuit à vie, compatible MySQL 8.0).
- **Option 2 : Aiven** : [aiven.io](https://aiven.io) (Offre d'essai / free tier MySQL).
- **Option 3 : Clever Cloud** : [clever-cloud.com](https://www.clever-cloud.com) (MySQL gratuit).

### Import des Données :
Une fois votre base Cloud créée, importez simplement le fichier SQL complet généré avec toutes les données réelles et les comptes utilisateurs :
📁 **Fichier SQL prêt :** `backend/src/db/dump_kenaya_logistics.sql`

*(Vous pouvez l'importer via la console SQL en ligne du fournisseur, phpMyAdmin ou DBeaver).*

---

## 3. Étape 2 : Déployer le Backend sur RENDER

1. Rendez-vous sur **[dashboard.render.com](https://dashboard.render.com)** et connectez-vous avec votre compte GitHub.
2. Cliquez sur **New +** > **Web Service**.
3. Sélectionnez le dépôt GitHub de votre projet.
4. Remplissez les paramètres :
   - **Name :** `kenaya-logistics-api`
   - **Root Directory :** `backend`
   - **Environment :** `Node`
   - **Build Command :** `npm install`
   - **Start Command :** `node src/server.js`
   - **Plan :** `Free`
5. Ajoutez les **Variables d'Environnement** (*Environment Variables*) :
   | Clé | Valeur Exemple | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Mode production Express |
   | `PORT` | `10000` | Port d'écoute Render |
   | `JWT_SECRET` | `Kenaya_Secret_Token_Congo_2026_RN1!` | Clé de signature des sessions |
   | `DB_HOST` | `gateway01.eu-central-1.prod.aws.tidbcloud.com` | Hôte MySQL Cloud |
   | `DB_PORT` | `4000` *(ou 3306)* | Port de votre base |
   | `DB_USER` | `votre_utilisateur` | Utilisateur MySQL Cloud |
   | `DB_PASSWORD` | `votre_mot_de_passe` | Mot de passe |
   | `DB_NAME` | `kenaya_logistics` | Nom de la base |

6. Cliquez sur **Create Web Service**. Une fois déployé, notez votre URL Render :
   👉 `https://kenaya-logistics-api.onrender.com`

---

## 4. Étape 3 : Déployer le Frontend sur VERCEL

1. Rendez-vous sur **[vercel.com](https://vercel.com)** et connectez-vous avec GitHub.
2. Cliquez sur **Add New...** > **Project**.
3. Importez votre dépôt GitHub.
4. Dans les paramètres de configuration du projet :
   - **Root Directory :** Cliquez sur *Edit* et sélectionnez le dossier `frontend`.
   - **Framework Preset :** `Vite` (détecté automatiquement).
   - **Build Command :** `npm run build`
   - **Output Directory :** `dist`
5. Dans la section **Environment Variables** :
   - **Name :** `VITE_API_URL`
   - **Value :** `https://kenaya-logistics-api.onrender.com/api` *(remplacez par votre URL Render obtenue à l'étape 2 suivie de `/api`)*.
6. Cliquez sur **Deploy**.

Grâce au fichier `frontend/vercel.json` déjà préparé, le routage React SPA (Deep Linking, rafraîchissement des pages F5) fonctionne sans aucune erreur 404.

---

## 5. Comptes de Démonstration pour la Présentation Client

| Profil | Email | Mot de passe | Description de démonstration |
|---|---|---|---|
| 👑 **Directrice Générale** | `admin@kenayalogistic.cg` | `Admin2026!` | Accès total, supervision, finances & contrôle des utilisateurs |
| ✍️ **Secrétaire de Direction** | `secretaire1@kenayalogistic.cg` | `Secretaire2026!` | Fiches clients, marchandises, expéditions & contrats de location |
| 💰 **Comptable** | `compta@kenayalogistic.cg` | `Compta2026!` | Encaissements, dépenses d'exploitation, factures & bilans FCFA |
| 🔧 **Admin Technique** | `tech@kenayalogistic.cg` | `Tech2026!` | Flotte 4x4, entretiens, contrôles techniques & suivi GPS |

---

## 6. Vérification du Déploiement

- Tester l'URL de santé de l'API : `https://kenaya-logistics-api.onrender.com/api/health`
- Tester la recherche de suivi sans compte : `https://votre-app.vercel.app/public-tracking`
- Tester la connexion avec le compte Directrice Générale.

