import { Client, GatewayIntentBits } from 'discord.js';
import fs from 'fs';
import dotenv from 'dotenv';
import './keepalive.js'; // serveur keepalive pour Render

import { run } from "./src/run.js";
import { registerCommands, handleCommands } from "./src/commands.js";

dotenv.config();

// Charger les recherches Vinted au démarrage
let mySearches = [];
try {
  mySearches = JSON.parse(fs.readFileSync('./config/channels.json', 'utf8'));
} catch (e) {
  console.warn("⚠️ Aucun fichier channels.json ou format invalide, démarrage sans recherche.");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

let processedArticleIds = new Set();

// Connexion du bot
client.login(process.env.BOT_TOKEN);

// Au démarrage du bot
client.on("ready", async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
  registerCommands(client);
  run(client, processedArticleIds, mySearches);
});

// Gestion des interactions
client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    try {
      // Recharge le fichier channels.json à chaque commande
      const freshSearches = JSON.parse(fs.readFileSync('./config/channels.json', 'utf8'));
      handleCommands(interaction, freshSearches);
    } catch (err) {
      console.error("❌ Erreur de rechargement de channels.json :", err);
      await interaction.reply({ content: "Erreur : impossible de lire les recherches sauvegardées.", ephemeral: true });
    }
  } else {
    console.log('📭 Interaction inconnue reçue');
  }
});
