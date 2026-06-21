# Guide Configuration — Meta WhatsApp Cloud API

## Étape 1 — Créer l'application Meta

1. Aller sur **developers.facebook.com**
2. Cliquer "Créer une application"
3. Choisir "Business" → "WhatsApp"
4. Renseigner le Business Manager (Big Shopping Algérie → ID: 1419855444827370)

---

## Étape 2 — Configurer WhatsApp Business

1. Dans le dashboard Meta for Developers → **WhatsApp → Configuration**
2. Ajouter un numéro de téléphone WhatsApp Business
3. Valider par SMS ou appel
4. Copier :
   - **Phone Number ID** → `WA_PHONE_NUMBER_ID`
   - **WhatsApp Business Account ID** → `WA_BUSINESS_ACCOUNT_ID`

---

## Étape 3 — Générer le Token d'accès

### Token temporaire (test)
Dans WhatsApp → Configuration → copier le token temporaire (valide 24h)

### Token permanent (production)
1. Créer un "System User" dans Business Manager
2. Assigner les permissions : `whatsapp_business_messaging`
3. Générer un token permanent sans expiration

---

## Étape 4 — Test rapide avec curl

```bash
curl -X POST \
  "https://graph.facebook.com/v19.0/TON_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer TON_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "213555XXXXXX",
    "type": "text",
    "text": {"body": "Test message depuis Lightfunnel Notifier ✅"}
  }'
```

Réponse attendue :
```json
{
  "messaging_product": "whatsapp",
  "contacts": [{"input": "213555XXXXXX", "wa_id": "213555XXXXXX"}],
  "messages": [{"id": "wamid.xxxxx"}]
}
```

---

## Codes d'erreur fréquents

| Code | Signification | Solution |
|------|--------------|----------|
| 131047 | Numéro invalide | Vérifier format E.164 |
| 131026 | Message non livré | Numéro non sur WhatsApp |
| 130429 | Rate limit dépassé | Attendre 1 minute |
| 100 | Token invalide | Renouveler le token |
| 131051 | Template non approuvé | Utiliser message texte libre (session ouverte) |

---

## Alternative rapide : UltraMsg (non officiel)

Pour tester sans délai d'approbation Meta :

```bash
curl -X POST \
  "https://api.ultramsg.com/TON_INSTANCE_ID/messages/chat" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=TON_TOKEN&to=213555XXXXXX&body=Test message"
```

Variables .env pour UltraMsg :
```env
ULTRAMSG_INSTANCE_ID=instance12345
ULTRAMSG_TOKEN=abcdef123456
```

⚠️ UltraMsg utilise une connexion WhatsApp Web non officielle. Risque de ban du numéro en cas d'usage intensif.

---

## Volumes et limites Meta Cloud API

| Tier | Conversations/mois | Condition |
|------|--------------------|-----------|
| Gratuit | 1,000 | Par défaut |
| Payant | Illimité | ~$0.05/conv (DZ) |

Pour Wiki Clic Algeria (volume élevé) → prévoir budget Meta WhatsApp Business.
