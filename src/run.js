import { vintedSearch } from "./bot/search.js";
import { postArticles } from "./bot/post.js";
import { fetchCookie } from "./api/auth.js";

const runSearch = async (client, processedArticleIds, channel, cookieObj) => {
  try {
    process.stdout.write(".");

    const articles = await vintedSearch(channel, cookieObj.value, processedArticleIds);

    if (articles && articles.length > 0) {
      const channelToSend = client.channels.cache.get(channel.channelId);

      if (!channelToSend) {
        console.error(`❌ Canal Discord introuvable : ${channel.channelId}`);
        return;
      }

      process.stdout.write(`\n${channel.channelName} => +${articles.length}`);
      articles.forEach(article => processedArticleIds.add(article.id));

      await postArticles(articles, channelToSend);
    }
  } catch (err) {
    console.error("\n❌ Erreur lors de l'envoi des articles :", err);
  }
};

const runInterval = async (client, processedArticleIds, channel, cookieObj) => {
  try {
    await runSearch(client, processedArticleIds, channel, cookieObj);
    setTimeout(
      () => runInterval(client, processedArticleIds, channel, cookieObj),
      channel.frequency * 1000
    );
  } catch (err) {
    console.error("\n❌ Erreur pendant l'exécution d'une recherche :", err);
  }
};

export const run = async (client, processedArticleIds, mySearches) => {
  let cookieObj = {};
  cookieObj.value = await fetchCookie();

  mySearches.forEach((channel, index) => {
    setTimeout(() => runInterval(client, processedArticleIds, channel, cookieObj), index * 1000);
  });

  setInterval(async () => {
    cookieObj.value = await fetchCookie();
    console.log("♻️ Réduction des articles traités");
    const halfSize = Math.floor(processedArticleIds.size / 2);
    let count = 0;
    for (let id of processedArticleIds) {
      if (count >= halfSize) break;
      processedArticleIds.delete(id);
      count++;
    }
  }, process.env.INTERVAL_TIME * 60 * 60 * 1000);
};
