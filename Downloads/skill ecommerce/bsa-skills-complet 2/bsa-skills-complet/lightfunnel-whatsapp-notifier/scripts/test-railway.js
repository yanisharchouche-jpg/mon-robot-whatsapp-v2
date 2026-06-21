require('dotenv').config();
const crypto = require('crypto');
const https = require('https');

const CLIENT_SECRET = process.env.LIGHTFUNNEL_CLIENT_SECRET;
const SERVER_URL = process.argv[2] || 'https://lightfunnel-whatsapp-notifier-production.up.railway.app';

// Commande test realiste
const fakeOrder = {
  id: "ord_test_railway_001",
  order_number: "1043",
  financial_status: "pending",
  total_price: "3500.00",
  currency: "DZD",
  customer: {
    first_name: "Ahmed",
    last_name: "Benali",
    phone: "0560013500",   // numero de test
    email: "ahmed@test.com"
  },
  line_items: [
    { title: "Produit Test dzhomedeco", quantity: 2, price: "1750.00" }
  ],
  shipping_address: { city: "Oran", province: "Oran" }
};

const body = JSON.stringify(fakeOrder);
const hmac = crypto.createHmac('sha256', CLIENT_SECRET).update(body).digest('hex');
const url = new URL('/webhooks/lightfunnel', SERVER_URL);

const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'lightfunnels-hmac': hmac,
    'x-lightfunnels-event': 'order/confirmed'
  }
};

console.log('Test Railway - Simulation commande Lightfunnel');
console.log('Serveur :', SERVER_URL);
console.log('Client  :', fakeOrder.customer.first_name, fakeOrder.customer.last_name);
console.log('Tel     :', fakeOrder.customer.phone);
console.log('Total   :', fakeOrder.total_price, fakeOrder.currency);
console.log('---');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('SUCCES - Webhook recu par Railway :', data);
      console.log('WhatsApp va etre envoye au client dans quelques secondes...');
    } else {
      console.log('Statut :', res.statusCode, data);
    }
  });
});

req.on('error', (err) => console.error('Erreur :', err.message));
req.write(body);
req.end();
