# Lightfunnel → WhatsApp Notifier

> Automation complète : chaque commande Lightfunnel confirmée → message WhatsApp instantané au client.

---

## 🚀 Démarrage rapide (5 étapes)

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer les variables
```bash
# Copier le fichier exemple
copy .env.example .env

# Ouvrir .env et remplir :
# - LIGHTFUNNEL_CLIENT_SECRET
# - WA_PHONE_NUMBER_ID
# - WA_ACCESS_TOKEN
```

### 3. Démarrer le serveur
```bash
npm run dev    # développement (avec rechargement auto)
npm start      # production
```

### 4. Exposer en local (pour tests)
```bash
# Installer ngrok une fois :
npm install -g ngrok

# Exposer le port 3000 :
ngrok http 3000

# Copier l'URL https://xxx.ngrok.io → l'utiliser dans Lightfunnel
```

### 5. Configurer Lightfunnel
1. Aller dans **Lightfunnel → Settings → Integrations → Webhooks**
2. Ajouter un webhook :
   - **Event** : `order/confirmed`
   - **URL** : `https://ton-url.com/webhooks/lightfunnel`
   - **Version** : `v2`
3. Copier le **Client Secret** → coller dans `.env`

---

## 🧪 Tester sans vraie commande

```bash
# Terminal 1 : démarrer le serveur
npm run dev

# Terminal 2 : simuler une commande
npm test
```

---

## 📁 Structure du projet

```
lightfunnel-whatsapp-notifier/
├── package.json              ← Dépendances Node.js
├── .env.example              ← Template variables d'environnement
├── .env                      ← Tes secrets (NE PAS committer)
├── .gitignore                ← Ignore .env
├── README.md                 ← Ce fichier
├── scripts/
│   ├── server.js             ← Serveur webhook principal
│   └── test-webhook.js       ← Script de test local
└── references/
    ├── message-templates.md  ← Templates WhatsApp multi-langues
    └── meta-api-setup.md     ← Guide configuration Meta API
```

---

## 🔄 Comment ça marche

```
Client commande sur Lightfunnel
         │
         ▼ POST /webhooks/lightfunnel
    [server.js]
         │
         ├─ Vérifie HMAC (sécurité)
         ├─ Extrait : nom, téléphone, produits, total, ville
         ├─ Formate numéro → +213XXXXXXXXX
         ├─ Construit message (Darija/FR/ES/PT)
         │
         ▼ Meta Cloud API
    📱 Client reçoit WhatsApp
         │
         ▼
    orders-log.jsonl (historique local)
```

---

## ⚙️ Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `LIGHTFUNNEL_CLIENT_SECRET` | Secret webhook Lightfunnel | `abc123...` |
| `WA_PHONE_NUMBER_ID` | ID numéro WhatsApp Business | `123456789` |
| `WA_ACCESS_TOKEN` | Token Meta API | `EAAxxxxx` |
| `WA_API_VERSION` | Version API Meta | `v19.0` |
| `MARKET` | Langue du message | `DZ` / `FR` / `ES` / `PT` |
| `PORT` | Port du serveur | `3000` |

---

## 🌐 Hébergement production

| Plateforme | Coût | Facilité |
|-----------|------|----------|
| **Railway.app** | Gratuit → $5/mois | ⭐⭐⭐⭐⭐ |
| **Render.com** | Gratuit (sleep) | ⭐⭐⭐⭐ |
| **Vercel** | Gratuit | ⭐⭐⭐ |
| **VPS Hetzner** | ~€3/mois | ⭐⭐ |

**Recommandé : Railway.app**
```bash
# Installer Railway CLI
npm install -g @railway/cli

# Déployer
railway login
railway init
railway up

# Ajouter les variables d'env dans le dashboard Railway
```

---

## 📊 Logs des commandes

Le fichier `orders-log.jsonl` est créé automatiquement avec chaque commande traitée :
```json
{"timestamp":"2024-01-15T10:30:00Z","orderNumber":"1042","phone":"213555123456","total":"2500 DZD","whatsappSent":true,"messageId":"wamid.xxx"}
```

---

## ❓ Problèmes fréquents

| Problème | Solution |
|---------|----------|
| `HMAC invalide` | Vérifier que `LIGHTFUNNEL_CLIENT_SECRET` est correct |
| `WhatsApp non envoyé` | Vérifier `WA_ACCESS_TOKEN` et `WA_PHONE_NUMBER_ID` |
| `Numéro invalide` | Le client a mis un numéro fixe ou invalide |
| `Token expiré` | Renouveler le token Meta (token permanent recommandé) |
| `131047` | Numéro non enregistré sur WhatsApp |
