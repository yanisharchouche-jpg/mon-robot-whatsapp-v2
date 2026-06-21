// ============================================================
// SCRIPT DE TEST WEBHOOK — Simule une commande Lightfunnel
// Usage : node scripts/test-webhook.js
// ============================================================

require("dotenv").config();
const crypto = require("crypto");
const http = require("http");

const SERVER_URL = process.env.TEST_SERVER_URL || "http://localhost:3000";
const CLIENT_SECRET = process.env.LIGHTFUNNEL_CLIENT_SECRET || "test_secret";

// Payload simulé d'une commande Lightfunnel
const fakeOrder = {
  id: "ord_test_001",
  order_number: "1042",
  financial_status: "pending",
  total_price: "2500.00",
  currency: "DZD",
  customer: {
    first_name: "Mohamed",
    last_name: "Amrani",
    phone: "0555123456",
    email: "test@example.com",
  },
  line_items: [
    {
      title: "Lunettes Photochromiques AIRFIT",
      quantity: 1,
      price: "2500.00",
    },
  ],
  shipping_address: {
    city: "Alger",
    province: "Alger",
  },
};

const body = JSON.stringify(fakeOrder);

// Générer le HMAC comme Lightfunnel le ferait
const hmac = crypto
  .createHmac("sha256", CLIENT_SECRET)
  .update(body)
  .digest("hex");

const url = new URL("/webhooks/lightfunnel", SERVER_URL);

const options = {
  hostname: url.hostname,
  port: url.port || 3000,
  path: url.pathname,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
    "lightfunnels-hmac": hmac,
    "x-lightfunnels-event": "order/confirmed",
  },
};

console.log("🧪 Envoi d'une commande test...");
console.log(`📡 Serveur : ${SERVER_URL}`);
console.log(`🔐 HMAC : ${hmac.substring(0, 20)}...`);
console.log(`📦 Commande : #${fakeOrder.order_number} — ${fakeOrder.customer.first_name} ${fakeOrder.customer.last_name}`);
console.log(`📱 Téléphone : ${fakeOrder.customer.phone}`);
console.log("---");

const req = http.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    console.log(`✅ Réponse serveur : ${res.statusCode}`);
    console.log(`📄 Body : ${data}`);
    console.log("---");
    console.log("Vérifie les logs du serveur pour voir si le WhatsApp a été envoyé !");
  });
});

req.on("error", (err) => {
  console.error(`❌ Erreur : ${err.message}`);
  console.error("⚠️  Le serveur est-il démarré ? Lance : npm run dev");
});

req.write(body);
req.end();
