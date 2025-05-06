import { SlashCommandBuilder, EmbedBuilder } from '@discordjs/builders';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.resolve(__dirname, '../../config/channels.json');

export const data = new SlashCommandBuilder()
  .setName('new_search')
  .setDescription('Start receiving notifications for this Vinted channel.')
  .addStringOption(option =>
    option.setName('name')
      .setDescription('The name of your new search.')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('url')
      .setDescription('The URL of the Vinted product page.')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('banned_keywords')
      .setDescription('Keywords to ban from result titles (comma-separated).')
      .setRequired(false))
  .addStringOption(option =>
    option.setName('frequency')
      .setDescription('Frequency of search in seconds (default 10s).')
      .setRequired(false));

const validateUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const route = urlObj.pathname.split('/').pop();

    if (route !== 'catalog') return 'invalid-url-with-example';
    if (!urlObj.search || urlObj.searchParams.toString().length === 0) return 'must-have-query-params';

    return true;
  } catch (error) {
    return 'invalid-url';
  }
};

export const execute = async (interaction) => {
  await interaction.deferReply({ ephemeral: true });

  const url = interaction.options.getString('url');
  const banned_keywords = interaction.options.getString('banned_keywords')
    ? interaction.options.getString('banned_keywords').split(',').map(k => k.trim())
    : [];
  const frequency = Number(interaction.options.getString('frequency') || 10);
  const name = interaction.options.getString('name');
  const channelId = interaction.channelId;

  const validation = validateUrl(url);
  if (validation !== true) {
    await interaction.followUp({ content: validation });
    return;
  }

  try {
    let searches = [];

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      try {
        searches = JSON.parse(content);
        if (!Array.isArray(searches)) {
          throw new Error("Invalid JSON format (not an array)");
        }
      } catch {
        searches = [];
      }
    }

    if (searches.some(search => search.channelName === name)) {
      await interaction.followUp({ content: `❌ A search with the name "${name}" already exists.` });
      return;
    }

    searches.push({
      channelId,
      channelName: name,
      url,
      frequency,
      titleBlacklist: banned_keywords
    });

    fs.writeFileSync(filePath, JSON.stringify(searches, null, 2));

    const embed = new EmbedBuilder()
      .setTitle("✅ Search saved!")
      .setDescription(`Monitoring for **${name}** has been registered and will start at next cycle.`)
      .setColor(0x00FF00);

    await interaction.followUp({ embeds: [embed] });

  } catch (err) {
    console.error("❌ Error in new_search command:", err);
    await interaction.followUp({ content: "There was an error saving the search." });
  }
};
