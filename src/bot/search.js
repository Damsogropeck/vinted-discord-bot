import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export const vintedSearch = async (channel, cookie, processedArticleIds) => {
  const url = channel.url;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9'
    });

    // Appliquer les cookies (même si ce n’est pas strictement nécessaire ici)
    if (cookie) {
      await page.setCookie(...cookie.split(';').map(pair => {
        const [name, value] = pair.trim().split('=');
        return { name, value, domain: '.vinted.fr' };
      }));
    }

    console.log(`🔍 Scraping Vinted : ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('a[href*="/items/"]');

    const articles = await page.evaluate(() => {
      const elements = document.querySelectorAll('a[href*="/items/"]');
      const seen = new Set();
      const results = [];

      for (const el of elements) {
        const idMatch = el.href.match(/\/items\/(\d+)/);
        if (!idMatch) continue;
        const id = idMatch[1];
        if (seen.has(id)) continue;
        seen.add(id);

        const title = el.querySelector('h3')?.innerText ?? '';
        const priceText = el.querySelector('[data-testid="price"]')?.innerText ?? '';
        const price = priceText.replace(/[^\d]/g, '') || '0';
        const img = el.querySelector('img')?.src ?? '';
        const sizeMatch = el.innerText.match(/Taille[^:]*: ([^\n]+)/);
        const size = sizeMatch ? sizeMatch[1] : '';

        results.push({
          id,
          title,
          url: el.href,
          size_title: size,
          price: {
            amount: price
          },
          photo: {
            url: img,
            high_resolution: {
              timestamp: Date.now() / 1000
            }
          }
        });
      }

      return results;
    });

    await browser.close();

    // Filtrage (comme dans l’ancien code)
    const blacklist = Array.isArray(channel.titleBlacklist) ? channel.titleBlacklist.map(w => w.toLowerCase()) : [];

    const newArticles = articles.filter(a =>
      !processedArticleIds.has(a.id) &&
      !blacklist.some(word => a.title.toLowerCase().includes(word)) &&
      a.photo && a.photo.high_resolution.timestamp * 1000 > Date.now() - 1000 * 60 * 60 // moins d'1h
    );

    return newArticles;

  } catch (err) {
    console.error("❌ Erreur dans vintedSearch (scraping HTML) :", err);
    return [];
  }
};
