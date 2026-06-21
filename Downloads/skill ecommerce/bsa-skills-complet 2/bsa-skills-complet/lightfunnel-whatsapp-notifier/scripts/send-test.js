require('dotenv').config();
const axios = require('axios');

const { WA_PHONE_NUMBER_ID, WA_ACCESS_TOKEN, WA_API_VERSION } = process.env;
const TO_NUMBER = process.argv[2];

if (!TO_NUMBER) {
  console.log('Usage: node scripts/send-test.js NUMERO');
  process.exit(1);
}

async function sendTestMessage() {
  const url = `https://graph.facebook.com/${WA_API_VERSION || 'v19.0'}/${WA_PHONE_NUMBER_ID}/messages`;

  const message = `✅ Test Lightfunnel WhatsApp Notifier - dzhomedeco

Si tu recois ce message, l'automation est prete ! 🎉

Chaque commande confirmee sur Lightfunnel enverra automatiquement un message comme celui-ci a tes clients.

🚀 Systeme operationnel !`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: TO_NUMBER,
    type: 'text',
    text: { preview_url: false, body: message }
  };

  console.log('Envoi vers :', TO_NUMBER);
  console.log('Depuis Phone ID :', WA_PHONE_NUMBER_ID);

  try {
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('\n=== MESSAGE ENVOYE ===');
    console.log('Message ID:', res.data.messages?.[0]?.id);
    console.log('Statut    : SUCCES');
    console.log('Verifie ton WhatsApp !');
  } catch (err) {
    const errData = err.response?.data;
    console.log('\n=== ERREUR DETAILLEE ===');
    console.log(JSON.stringify(errData, null, 2));
  }
}

sendTestMessage();
