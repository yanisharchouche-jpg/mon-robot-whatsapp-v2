---
name: lightfunnel-whatsapp-notifier
description: >
  Automated workflow that listens to Lightfunnel order webhooks and instantly sends
  personalized WhatsApp confirmation messages to customers. Use this skill whenever
  the user wants to: connect Lightfunnel to WhatsApp, send automatic order confirmation
  messages, build a webhook server for COD orders, notify clients after purchase,
  set up post-order WhatsApp automation, or configure Lightfunnel webhooks. Also triggers
  on: "commande lightfunnel", "message whatsapp automatique", "notification client commande",
  "webhook lightfunnel whatsapp", "confirmation commande SMS/WhatsApp", or any request
  combining order management and customer messaging.
---

# 📦 Lightfunnel → WhatsApp Order Notifier

Workflow complet : dès qu'une commande est confirmée sur Lightfunnel, un message WhatsApp personnalisé est automatiquement envoyé au client — sans intervention manuelle.

---

## 🏗️ Architecture du Système

```
Lightfunnel (Commande confirmée)
        │
        ▼ Webhook POST (order/confirmed)
┌───────────────────┐
│  Webhook Server   │  ← Node.js / Express (toi ou hébergement externe)
│  (ton serveur)    │
└───────────────────┘
        │
        ▼ Vérifie HMAC + extrait données
┌───────────────────┐
│  Message Builder  │  ← Formate le message WhatsApp (Darija / FR / AR)
└───────────────────┘
        │
        ▼ API Call
┌───────────────────┐
│  WhatsApp Cloud   │  ← Meta Business API (officiel) ou alternative
│  API (Meta)       │
└───────────────────┘
        │
        ▼
  📱 Client reçoit le message
```

---

## ⚡ Étapes de Mise en Place

### ÉTAPE 1 — Choisir l'API WhatsApp

Deux options selon la situation :

| Option | Pour qui | Coût | Délai activation |
|--------|----------|------|-----------------|
| **Meta Cloud API** (officiel) | Volume élevé, pro | Gratuit jusqu'à 1000 conv/mois | 1-3 jours |
| **Twilio WhatsApp API** | Démarrage rapide | Payant par message | Immédiat (sandbox) |
| **UltraMsg / WaAPI** | Test rapide (non officiel) | ~$15/mois | Immédiat |

> **Recommandation Badr** : Meta Cloud API pour la production (gratuit + fiable). UltraMsg pour tester vite.

---

### ÉTAPE 2 — Variables d'Environnement

Crée un fichier `.env` :

```env
# === LIGHTFUNNEL ===
LIGHTFUNNEL_CLIENT_SECRET=ton_client_secret_lightfunnel

# === WHATSAPP META CLOUD API ===
WA_PHONE_NUMBER_ID=123456789012345
WA_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
WA_API_VERSION=v19.0

# === SERVEUR ===
PORT=3000
NODE_ENV=production
```

---

### ÉTAPE 3 — Installer les dépendances

```bash
npm init -y
npm install express axios crypto dotenv
```

---

### ÉTAPE 4 — Créer le Serveur Webhook

> 📄 Voir le fichier complet : `scripts/server.js`

Points clés du serveur :
- Vérifie l'authenticité du webhook via **HMAC-SHA256** (sécurité Lightfunnel)
- Extrait les données clés : `nom client`, `téléphone`, `produits`, `total`, `numéro commande`
- Formate le numéro de téléphone au format international (+213 pour l'Algérie)
- Envoie le message WhatsApp via l'API Meta
- Log les succès et erreurs

---

### ÉTAPE 5 — Configurer Lightfunnel

1. Aller dans **Lightfunnel → Settings → Integrations → Webhooks**
2. Créer un nouveau webhook :
   - **Event** : `order/confirmed` ← *Important : pas order/created*
   - **URL** : `https://ton-domaine.com/webhooks/lightfunnel`
   - **Version** : `v2`
3. Copier le `Client Secret` → mettre dans `.env`

> ⚠️ Utilise `order/confirmed` et non `order/created` pour avoir les upsells/downsells inclus

---

### ÉTAPE 6 — Templates de Messages WhatsApp

> 📄 Voir les templates complets : `references/message-templates.md`

**3 templates disponibles :**
- 🇩🇿 **Darija (Algérien)** — marché principal
- 🇫🇷 **Français** — secondaire
- 🇸🇦 **Arabe formel** — optionnel

---

### ÉTAPE 7 — Hébergement

Options recommandées :

| Plateforme | Coût | Setup |
|-----------|------|-------|
| **Railway.app** | Gratuit → $5/mois | 5 min |
| **Render.com** | Gratuit (sleep) | 5 min |
| **VPS (Hetzner)** | ~€3/mois | 20 min |
| **Vercel (serverless)** | Gratuit | 10 min |

---

## 🔄 Flux de Données Lightfunnel

Payload reçu sur `order/confirmed` :

```json
{
  "id": "ord_abc123",
  "order_number": "1042",
  "financial_status": "pending",
  "total_price": "2500.00",
  "currency": "DZD",
  "customer": {
    "first_name": "Mohamed",
    "last_name": "Amrani",
    "phone": "0555123456",
    "email": "client@example.com"
  },
  "line_items": [
    {
      "title": "Lunettes Photochromiques AIRFIT",
      "quantity": 1,
      "price": "2500.00"
    }
  ],
  "shipping_address": {
    "city": "Alger",
    "province": "Alger"
  }
}
```

---

## ✅ Checklist de Déploiement

- [ ] `.env` configuré avec toutes les variables
- [ ] Webhook enregistré sur Lightfunnel (event: `order/confirmed`)
- [ ] Serveur déployé sur URL publique HTTPS
- [ ] Test webhook Lightfunnel → vérifier logs
- [ ] Template WhatsApp validé (si Meta Cloud API)
- [ ] Test commande réelle → WhatsApp reçu ✓

---

## 📁 Fichiers de Référence

| Fichier | Contenu |
|---------|---------|
| `scripts/server.js` | Serveur webhook complet (Node.js/Express) |
| `references/message-templates.md` | Templates WhatsApp Darija / FR / AR |
| `references/meta-api-setup.md` | Guide configuration Meta Cloud API |

Commence par lire `scripts/server.js` pour le code du serveur, puis `references/message-templates.md` pour les messages.
