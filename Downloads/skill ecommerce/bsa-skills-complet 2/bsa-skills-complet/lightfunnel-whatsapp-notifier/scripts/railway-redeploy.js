/**
 * Script pour forcer un redéploiement Railway via l'API GraphQL
 * Usage: node scripts/railway-redeploy.js VOTRE_TOKEN_RAILWAY
 */

const https = require("https");

const RAILWAY_TOKEN = process.argv[2];
const SERVICE_ID = "7833bb4e-2c55-4b60-9a5c-bd98571a1f32"; // depuis l'URL Railway
const PROJECT_ID = "424747dd-4e09-4cf6-9cb8-131482a596b6"; // depuis l'URL Railway

if (!RAILWAY_TOKEN) {
  console.log("Usage: node scripts/railway-redeploy.js VOTRE_TOKEN_RAILWAY");
  console.log("");
  console.log("Comment obtenir votre token Railway :");
  console.log("1. Allez sur https://railway.com/account/tokens");
  console.log("2. Cliquez 'Create Token'");
  console.log("3. Copiez le token et relancez ce script");
  process.exit(1);
}

// 1. D'abord on cherche le dernier deployment ID
const query = `
  query {
    service(id: "${SERVICE_ID}") {
      id
      name
      deployments(first: 1) {
        edges {
          node {
            id
            status
            createdAt
          }
        }
      }
    }
  }
`;

const body = JSON.stringify({ query });

const options = {
  hostname: "backboard.railway.com",
  path: "/graphql/v2",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${RAILWAY_TOKEN}`,
    "Content-Length": Buffer.byteLength(body),
  },
};

console.log("🔍 Recherche du dernier déploiement Railway...");

const req = https.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.errors) {
        console.error("❌ Erreur API:", JSON.stringify(parsed.errors, null, 2));
        return;
      }

      const deployments = parsed.data?.service?.deployments?.edges;
      if (!deployments || deployments.length === 0) {
        console.log("❌ Aucun déploiement trouvé");
        return;
      }

      const latestDeployment = deployments[0].node;
      console.log(`✅ Dernier déploiement: ${latestDeployment.id}`);
      console.log(`   Statut: ${latestDeployment.status}`);
      console.log(`   Créé: ${latestDeployment.createdAt}`);
      console.log("");

      // 2. Redéployer
      triggerRedeploy(RAILWAY_TOKEN, latestDeployment.id);
    } catch (e) {
      console.error("❌ Erreur parsing:", e.message, data);
    }
  });
});

req.on("error", (err) => console.error("❌ Erreur réseau:", err.message));
req.write(body);
req.end();

function triggerRedeploy(token, deploymentId) {
  const mutation = `
    mutation {
      deploymentRedeploy(id: "${deploymentId}") {
        id
        status
      }
    }
  `;

  const body = JSON.stringify({ query: mutation });
  const opts = {
    hostname: "backboard.railway.com",
    path: "/graphql/v2",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Length": Buffer.byteLength(body),
    },
  };

  console.log("🚀 Déclenchement du redéploiement...");

  const req2 = https.request(opts, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.errors) {
          console.error("❌ Erreur redeploy:", JSON.stringify(parsed.errors, null, 2));
          return;
        }
        console.log("✅ Redéploiement déclenché !");
        console.log("   Nouveau statut:", parsed.data?.deploymentRedeploy?.status);
        console.log("");
        console.log("⏳ Attendez 2-3 minutes puis retentez la vérification Meta.");
      } catch (e) {
        console.error("❌ Erreur:", e.message, data);
      }
    });
  });

  req2.on("error", (err) => console.error("❌ Erreur:", err.message));
  req2.write(body);
  req2.end();
}
