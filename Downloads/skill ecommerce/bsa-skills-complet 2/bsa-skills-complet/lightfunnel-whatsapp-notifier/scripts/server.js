// ============================================================
// LIGHTFUNNEL → WHATSAPP ORDER NOTIFIER
// Serveur Webhook Node.js/Express
// ============================================================

require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const axios = require("axios");

const app = express();

// Parse raw body pour la vérification HMAC
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const CONFIG = {
  lightfunnel: {
    clientSecret: process.env.LIGHTFUNNEL_CLIENT_SECRET,
  },
  whatsapp: {
    phoneNumberId: process.env.WA_PHONE_NUMBER_ID,
    accessToken: process.env.WA_ACCESS_TOKEN,
    apiVersion: process.env.WA_API_VERSION || "v19.0",
  },
  server: {
    port: process.env.PORT || 3000,
  },
  // Marché cible pour le format du message
  market: process.env.MARKET || "DZ", // DZ, ES, PT
};

// ─────────────────────────────────────────────────────────────
// VÉRIFICATION HMAC (Sécurité Lightfunnel)
// ─────────────────────────────────────────────────────────────
function verifyLightfunnelWebhook(req) {
  // Lightfunnel peut ne pas envoyer de header HMAC selon la config
  const receivedHmac =
    req.headers["lightfunnels-hmac"] ||
    req.headers["x-lightfunnels-hmac-sha256"] ||
    req.headers["x-lightfunnels-signature"] ||
    req.headers["lightfunnels-hmac-sha256"];

  console.log("Headers webhook:", JSON.stringify(req.headers));

  // Si pas de HMAC, on accepte quand meme (Lightfunnel v2 sans HMAC)
  if (!receivedHmac) {
    console.log("⚠️ Pas de HMAC - webhook accepte sans verification");
    return true;
  }

  const computedHmac = crypto
    .createHmac("sha256", CONFIG.lightfunnel.clientSecret)
    .update(req.rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(receivedHmac),
      Buffer.from(computedHmac)
    );
  } catch (e) {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// FORMATAGE DU NUMÉRO DE TÉLÉPHONE
// ─────────────────────────────────────────────────────────────
function formatPhoneNumber(phone, market = "DZ") {
  // Supprimer tous les espaces, tirets, parenthèses
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, "");

  // Supprimer le + si présent
  cleaned = cleaned.replace(/^\+/, "");

  // Si commence par 00, enlever les deux zéros
  if (cleaned.startsWith("00")) {
    cleaned = cleaned.substring(2);
  }

  // Ajouter l'indicatif pays si numéro local
  const countryCodes = { DZ: "213", ES: "34", PT: "351" };
  const countryCode = countryCodes[market] || "213";

  if (!cleaned.startsWith(countryCode)) {
    // Enlever le 0 initial si numéro local algérien (0555...)
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
    cleaned = countryCode + cleaned;
  }

  return cleaned;
}

// ─────────────────────────────────────────────────────────────
// EXTRACTION DES DONNÉES DE COMMANDE
// ─────────────────────────────────────────────────────────────
function extractOrderData(payload) {
  // La vraie structure Lightfunnel wrappe tout dans payload.node
  const order = payload.node || payload;

  const customer = order.customer || {};
  const address = order.shipping_address || order.billing_address || {};
  const items = order.items || order.line_items || [];

  // Nom du client
  const customerName =
    customer.full_name ||
    `${address.first_name || ""} ${address.last_name || ""}`.trim() ||
    "Client";

  // Telephone (plusieurs endroits)
  const phone =
    order.phone ||
    address.phone ||
    (order.client_details && order.client_details.phone) ||
    "";

  // Numero de commande
  const orderNumber = order.name || order._id || order.id || "";

  // Total (Lightfunnel envoie en DZD entier ex: 2350)
  const rawTotal = order.total || order.total_price || 0;
  const totalPrice = rawTotal.toFixed ? rawTotal.toFixed(0) : String(rawTotal);

  // Liste des produits
  const productList = items
    .map((item) => {
      const qty = item.quantity || 1;
      const name = item.title || item.name || "Produit";
      const price = parseFloat(item.price || 0).toFixed(0);
      return `• ${name} x${qty} — ${price} ${order.currency || "DZD"}`;
    })
    .join("\n") || "• Produit commandé";

  return {
    orderId: order.id || order._id || "",
    orderNumber,
    customerName,
    phone,
    email: order.email || address.email || "",
    totalPrice,
    currency: order.currency || "DZD",
    city: address.city || "",
    province: address.state || address.province || "",
    productList,
    itemCount: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
    financialStatus: order.financial_status || "pending",
  };
}

// ─────────────────────────────────────────────────────────────
// TEMPLATES DE MESSAGES WHATSAPP
// ─────────────────────────────────────────────────────────────
function buildWhatsAppMessage(orderData, market = "DZ") {
  const { customerName, orderNumber, productList, totalPrice, currency, city } =
    orderData;

  const templates = {
    // 🇩🇿 Darija Algérienne
    DZ: `✅ *تأكيد طلبيتك*

مرحبا ${customerName}! 🎉

طلبيتك رقم *#${orderNumber}* تأكدت.

🛍️ *المنتجات:*
${productList}

💰 *المبلغ الإجمالي:* ${totalPrice} ${currency}
📍 *المدينة:* ${city || "—"}

سيتصل بيك فريقنا في أقرب وقت لتأكيد الموعد. ⏳

شكرا على ثقتك فينا! 🙏`,

    // 🇫🇷 Français
    FR: `✅ *Confirmation de votre commande*

Bonjour ${customerName} ! 🎉

Votre commande *#${orderNumber}* est bien confirmée.

🛍️ *Articles commandés :*
${productList}

💰 *Total :* ${totalPrice} ${currency}
📍 *Ville :* ${city || "—"}

Notre équipe vous contactera très prochainement pour confirmer la livraison. ⏳

Merci pour votre confiance ! 🙏`,

    // 🇪🇸 Espagnol (marché ES)
    ES: `✅ *Confirmación de tu pedido*

¡Hola ${customerName}! 🎉

Tu pedido *#${orderNumber}* ha sido confirmado.

🛍️ *Productos pedidos:*
${productList}

💰 *Total:* ${totalPrice} ${currency}
📍 *Ciudad:* ${city || "—"}

Nuestro equipo se pondrá en contacto contigo para confirmar la entrega. ⏳

¡Gracias por tu confianza! 🙏`,

    // 🇵🇹 Portugais (marché PT)
    PT: `✅ *Confirmação do seu pedido*

Olá ${customerName}! 🎉

O seu pedido *#${orderNumber}* foi confirmado.

🛍️ *Produtos pedidos:*
${productList}

💰 *Total:* ${totalPrice} ${currency}
📍 *Cidade:* ${city || "—"}

A nossa equipa entrará em contacto consigo para confirmar a entrega. ⏳

Obrigado pela sua confiança! 🙏`,
  };

  return templates[market] || templates["DZ"];
}

// ─────────────────────────────────────────────────────────────
// ENVOI WHATSAPP (Meta Cloud API)
// ─────────────────────────────────────────────────────────────
async function sendWhatsAppMessage(toPhone, message) {
  const url = `https://graph.facebook.com/${CONFIG.whatsapp.apiVersion}/${CONFIG.whatsapp.phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toPhone,
    type: "text",
    text: {
      preview_url: false,
      body: message,
    },
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${CONFIG.whatsapp.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log(
      `✅ WhatsApp envoyé → ${toPhone} | Message ID: ${response.data.messages?.[0]?.id}`
    );
    return { success: true, messageId: response.data.messages?.[0]?.id };
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error(`❌ Erreur WhatsApp → ${toPhone}:`, JSON.stringify(errData));
    return { success: false, error: errData };
  }
}

// ─────────────────────────────────────────────────────────────
// ROUTE PRINCIPALE — WEBHOOK LIGHTFUNNEL
// ─────────────────────────────────────────────────────────────
app.post("/webhooks/lightfunnel", async (req, res) => {
  const startTime = Date.now();

  // 1. Répondre immédiatement à Lightfunnel (éviter timeout)
  res.status(200).json({ received: true });

  // 2. Vérifier authenticité HMAC
  if (!verifyLightfunnelWebhook(req)) {
    console.warn("⚠️ Webhook rejeté : HMAC invalide");
    return;
  }

  const payload = req.body;
  const eventType =
    req.headers["x-lightfunnels-event"] ||
    req.headers["x-lightfunnels-topic"] ||
    req.headers["webhook-type"] ||
    req.body?.event ||
    req.body?.topic ||
    "unknown";

  console.log(`📨 Webhook reçu : ${eventType} | Order: ${payload.order_number || payload.node?.name || payload.id}`);
  console.log("PAYLOAD COMPLET:", JSON.stringify(payload, null, 2));
  console.log("HEADERS:", JSON.stringify(req.headers, null, 2));

  // 3. Traiter les commandes (accepter tous les types d'événements commandes)
  // Lightfunnel envoie: order/confirmed, order/created, order_confirmed, orders/create, etc.
  const ORDER_EVENT_PATTERNS = [
    "order/confirmed",
    "order/created",
    "order_confirmed",
    "orders/create",
    "orders/paid",
    "order.confirmed",
    "order.created",
    "new_order",
    "purchase",
  ];

  const isOrderEvent =
    ORDER_EVENT_PATTERNS.some((p) => eventType.toLowerCase().includes(p.split("/")[0].replace("_", ""))) ||
    eventType === "unknown"; // Si pas d'event header, on traite quand même

  if (!isOrderEvent) {
    console.log(`ℹ️ Événement ignoré : ${eventType}`);
    return;
  }

  console.log(`✅ Événement commande détecté : ${eventType} — traitement en cours...`);

  try {
    // 4. Extraire les données de commande
    const orderData = extractOrderData(payload);

    if (!orderData.phone) {
      console.warn(`⚠️ Pas de numéro de téléphone pour la commande #${orderData.orderNumber}`);
      return;
    }

    // 5. Formater le numéro de téléphone
    const formattedPhone = formatPhoneNumber(orderData.phone, CONFIG.market);

    // 6. Construire le message
    const message = buildWhatsAppMessage(orderData, CONFIG.market);

    // 7. Envoyer le message WhatsApp
    const result = await sendWhatsAppMessage(formattedPhone, message);

    const duration = Date.now() - startTime;
    console.log(
      `📊 Commande #${orderData.orderNumber} | ${formattedPhone} | ${result.success ? "✅ Envoyé" : "❌ Échec"} | ${duration}ms`
    );

    // 8. Optionnel : Logger dans un fichier ou DB
    logOrder({
      timestamp: new Date().toISOString(),
      orderNumber: orderData.orderNumber,
      phone: formattedPhone,
      total: `${orderData.totalPrice} ${orderData.currency}`,
      whatsappSent: result.success,
      messageId: result.messageId || null,
      error: result.error || null,
    });
  } catch (error) {
    console.error("❌ Erreur traitement commande:", error.message);
  }
});

// ─────────────────────────────────────────────────────────────
// LOGGING SIMPLE (JSON file)
// ─────────────────────────────────────────────────────────────
const fs = require("fs");
const LOG_FILE = "./orders-log.jsonl";

function logOrder(data) {
  fs.appendFile(LOG_FILE, JSON.stringify(data) + "\n", (err) => {
    if (err) console.error("Erreur log:", err.message);
  });
}

// ─────────────────────────────────────────────────────────────
// ROUTE HEALTH CHECK
// ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "lightfunnel-whatsapp-notifier",
    market: CONFIG.market,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    config: {
      waPhoneId: CONFIG.whatsapp.phoneNumberId ? "✅ Configuré" : "❌ Manquant",
      waToken: CONFIG.whatsapp.accessToken ? "✅ Configuré" : "❌ Manquant",
      lfSecret: CONFIG.lightfunnel.clientSecret ? "✅ Configuré" : "❌ Manquant",
    },
  });
});

// ─────────────────────────────────────────────────────────────
// ROUTE DEBUG — Voir les derniers webhooks reçus
// ─────────────────────────────────────────────────────────────
const recentWebhooks = [];

app.post("/debug/webhook", (req, res) => {
  const entry = {
    ts: new Date().toISOString(),
    headers: req.headers,
    body: req.body,
  };
  recentWebhooks.unshift(entry);
  if (recentWebhooks.length > 10) recentWebhooks.pop();
  console.log("🔍 Debug webhook:", JSON.stringify(entry, null, 2));
  res.json({ received: true });
});

app.get("/debug/webhooks", (req, res) => {
  res.json({ count: recentWebhooks.length, webhooks: recentWebhooks });
});

// ─────────────────────────────────────────────────────────────
// ROUTE TEST WHATSAPP — Tester le token sans commande réelle
// ─────────────────────────────────────────────────────────────
app.get("/test-whatsapp/:phone", async (req, res) => {
  const phone = req.params.phone;
  const message = `🔧 Test Lightfunnel WhatsApp Notifier\n\nSi tu reçois ce message, le système fonctionne ! ✅\n\nTimestamp: ${new Date().toISOString()}`;

  console.log(`🧪 Test WhatsApp vers ${phone}...`);
  const result = await sendWhatsAppMessage(phone, message);

  res.json({
    phone,
    result,
    config: {
      phoneNumberId: CONFIG.whatsapp.phoneNumberId,
      apiVersion: CONFIG.whatsapp.apiVersion,
      tokenPresent: !!CONFIG.whatsapp.accessToken,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// DÉMARRAGE
// ─────────────────────────────────────────────────────────────
app.listen(CONFIG.server.port, () => {
  console.log(`
🚀 Lightfunnel WhatsApp Notifier démarré
📡 Port         : ${CONFIG.server.port}
🌍 Marché       : ${CONFIG.market}
📱 WA Phone ID  : ${CONFIG.whatsapp.phoneNumberId || "⚠️ NON CONFIGURÉ"}
🔐 Lightfunnel  : ${CONFIG.lightfunnel.clientSecret ? "✅ Secret OK" : "⚠️ NON CONFIGURÉ"}
  `);
});
