require('dotenv').config();
const axios = require('axios');

const { WA_PHONE_NUMBER_ID, WA_ACCESS_TOKEN, WA_API_VERSION } = process.env;

console.log('Test connexion Meta WhatsApp API...');
console.log('Phone Number ID :', WA_PHONE_NUMBER_ID);
console.log('Token (debut)   :', WA_ACCESS_TOKEN ? WA_ACCESS_TOKEN.substring(0, 20) + '...' : 'MANQUANT');

async function testConnection() {
  try {
    const url = `https://graph.facebook.com/${WA_API_VERSION || 'v19.0'}/${WA_PHONE_NUMBER_ID}`;
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${WA_ACCESS_TOKEN}` },
      params: { fields: 'display_phone_number,verified_name,quality_rating' }
    });
    console.log('\n=== CONNEXION REUSSIE ===');
    console.log('Numero WhatsApp Business :', res.data.display_phone_number);
    console.log('Nom du compte            :', res.data.verified_name);
    console.log('Qualite du compte        :', res.data.quality_rating);
    console.log('========================\n');
    console.log('OK - Les cles sont valides ! Pret a envoyer des messages.');
  } catch (err) {
    const errData = err.response?.data?.error;
    console.log('\n=== ERREUR CONNEXION ===');
    if (errData) {
      console.log('Code    :', errData.code);
      console.log('Message :', errData.message);
      if (errData.code === 190) {
        console.log('\nSOLUTION : Le token est expire (24h). Retourne sur developers.facebook.com et copie un nouveau token.');
      }
    } else {
      console.log(err.message);
    }
    console.log('========================\n');
  }
}

testConnection();
