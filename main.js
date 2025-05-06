import { Client, GatewayIntentBits } from 'discord.js';
import fs from 'fs';
import dotenv from 'dotenv';
import './keepalive.js'; // ✅ ajoute le serveur pour Render

import { run } from "./src/run.js";
import { registerCommands, handleCommands } from "./src/commands.js";

dotenv.config();

// Charger les recherches Vinted
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

// Lancement du bot
client.on("ready", async () => {
  console.log(`✅ Bot connecté : ${client.user.tag}`);
  registerCommands(client);
  run(client, processedArticleIds, mySearches);
});

// Gestion des commandes
client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    handleCommands(interaction, mySearches);
  } else {
    console.log('📭 Interaction inconnue reçue');
  }
});
