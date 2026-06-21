# Templates Messages WhatsApp — Lightfunnel Order Notifier

## Vue d'ensemble

Ces templates sont conçus pour le marché COD (Cash On Delivery) Algérie, Espagne et Portugal.
Ils sont adaptés au ton direct et chaleureux qui convertit dans chaque marché.

---

## 🇩🇿 Template Darija (Algérie) — Principal

### Version Standard (COD)
```
✅ *تأكيد طلبيتك*

مرحبا {{NOM_CLIENT}}! 🎉

طلبيتك رقم *#{{NUMERO_COMMANDE}}* تأكدت.

🛍️ *المنتجات:*
{{LISTE_PRODUITS}}

💰 *المبلغ الإجمالي:* {{TOTAL}} {{DEVISE}}
📍 *المدينة:* {{VILLE}}

سيتصل بيك فريقنا في أقرب وقت لتأكيد الموعد. ⏳

شكرا على ثقتك فينا! 🙏
```

### Version avec délai de livraison
```
✅ *طلبيتك وصلت!*

يا {{NOM_CLIENT}}، مزيان! 🎉

*#{{NUMERO_COMMANDE}}* — تأكدت

🛍️ {{LISTE_PRODUITS}}

💰 *الإجمالي:* {{TOTAL}} دج
📍 *الولاية:* {{VILLE}}
🚚 *التسليم:* 3-5 أيام عمل

راك تدفع عند الاستلام 💵

سنتصل بيك قريباً! 📞
```

### Version Urgence / Promotion
```
🔥 *تأكيد طلبيتك الخاصة!*

{{NOM_CLIENT}} 

طلبيتك رقم *#{{NUMERO_COMMANDE}}* تأكدت ✅

{{LISTE_PRODUITS}}

💰 *{{TOTAL}} دج* — تدفع عند الاستلام
📦 يتم التحضير الآن...

نتصل بيك قريباً 📞
```

---

## 🇫🇷 Template Français — Secondaire

### Version Standard
```
✅ *Confirmation de votre commande*

Bonjour {{NOM_CLIENT}} ! 🎉

Votre commande *#{{NUMERO_COMMANDE}}* est bien confirmée.

🛍️ *Articles commandés :*
{{LISTE_PRODUITS}}

💰 *Total :* {{TOTAL}} {{DEVISE}}
📍 *Ville :* {{VILLE}}

Notre équipe vous contactera très prochainement pour confirmer la livraison. ⏳

Merci pour votre confiance ! 🙏
```

### Version COD courte
```
✅ Commande *#{{NUMERO_COMMANDE}}* confirmée !

Bonjour {{NOM_CLIENT}} 👋

{{LISTE_PRODUITS}}
💰 Total : *{{TOTAL}} {{DEVISE}}* (paiement à la livraison)

On vous rappelle sous peu pour confirmer l'adresse 📞
```

---

## 🇪🇸 Template Espagnol (FulfillPro España)

### Version Standard
```
✅ *Confirmación de tu pedido*

¡Hola {{NOM_CLIENT}}! 🎉

Tu pedido *#{{NUMERO_COMMANDE}}* ha sido confirmado.

🛍️ *Productos pedidos:*
{{LISTE_PRODUITS}}

💰 *Total:* {{TOTAL}} {{DEVISE}}
📍 *Ciudad:* {{VILLE}}

Nuestro equipo se pondrá en contacto contigo para confirmar la entrega. ⏳

¡Gracias por tu confianza! 🙏
```

---

## 🇵🇹 Template Portugais (FulfillPro Portugal)

### Version Standard
```
✅ *Confirmação do seu pedido*

Olá {{NOM_CLIENT}}! 🎉

O seu pedido *#{{NUMERO_COMMANDE}}* foi confirmado.

🛍️ *Produtos pedidos:*
{{LISTE_PRODUITS}}

💰 *Total:* {{TOTAL}} {{DEVISE}}
📍 *Cidade:* {{VILLE}}

A nossa equipa entrará em contacto consigo para confirmar a entrega. ⏳

Obrigado pela sua confiança! 🙏
```

---

## 📋 Variables Disponibles

| Variable | Description | Exemple |
|----------|-------------|---------|
| `{{NOM_CLIENT}}` | Prénom + Nom du client | Mohamed Amrani |
| `{{NUMERO_COMMANDE}}` | Numéro de commande LF | 1042 |
| `{{LISTE_PRODUITS}}` | Liste formatée des produits | • Lunettes x1 — 2500 DZD |
| `{{TOTAL}}` | Montant total | 2500 |
| `{{DEVISE}}` | Monnaie | DZD / EUR |
| `{{VILLE}}` | Ville de livraison | Alger |
| `{{WILAYA}}` | Wilaya (Algérie) | Alger |

---

## 🎯 Bonnes Pratiques

### Timing d'envoi
- Envoyer sur `order/confirmed` (pas `order/created`) → avoir les upsells inclus
- Délai max acceptable : < 30 secondes après la commande

### Format des messages
- Toujours inclure le numéro de commande (référence pour le client)
- Mentionner le montant total (rassure le client COD)
- Ajouter la ville (confirmation que la livraison est bien ciblée)
- Ne pas mettre de liens dans le premier message (risque ban WhatsApp)

### Numéros de téléphone
- Algérie : 0555... → 213555...
- Espagne : 6xx... → 346xx...
- Portugal : 9xx... → 3519xx...

### Limites WhatsApp
- Messages "business-initiated" : nécessitent un template approuvé si le client n'a pas écrit en 24h
- Pour COD, le client vient de commander → fenêtre de 24h ouverte (session utilisateur)
- Max 4096 caractères par message
