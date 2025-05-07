import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

// 🔧 Nettoyage automatique d'une URL Vinted
function cleanVintedUrl(originalUrl) {
  const allowedParams = [
    'search_text', 'catalog[]', 'price_from', 'price_to', 'currency',
    'size_ids[]', 'brand_ids[]', 'status_ids[]', 'color_ids[]',
    'patterns_ids[]', 'material_ids[]'
  ];
  try {
    const url = new URL(originalUrl);
    const cleanedParams = new URLSearchParams();
    for (const [key, value] of url.searchParams.entries()) {
      if (allowedParams.includes(key)) {
        cleanedParams.append(key, value);
      }
    }
    return `${url.origin}${url.pathname}?${cleanedParams.toString()}`;
  } catch (err) {
    console.warn("⚠️ URL invalide, utilisation telle quelle :", originalUrl);
    return originalUrl;
  }
}

// 🧠 Navigation avec retry
async function safeGoto(page, url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 [Tentative ${attempt}] Navigation vers : ${url}`);
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      return true;
    } catch (err) {
      console.warn(`⚠️ Échec tentative ${attempt}: ${err.message}`);
      if (attempt === maxRetries) throw err;
      await new Promise(res => setTimeout(res, 2000));
    }
  }
}

export const vintedSearch = async (channel, cookie, processedArticleIds) => {
  const rawUrl = channel.url;
  const cleanedUrl = cleanVintedUrl(rawUrl);

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9'
    });

    // Appliquer les cookies
    if (cookie) {
      await page.setCookie(...cookie.split(';').map(pair => {
        const [name, value] = pair.trim().split('=');
        return { name, value, domain: '.vinted.fr' };
      }));
    }

    await safeGoto(page, cleanedUrl);

    console.log("⏳ Attente de la grille des articles...");
    try {
      await page.waitForSelector('a[href*="/items/"]', { timeout: 20000 });
    } catch (err) {
      console.warn("⚠️ Aucun article visible dans les 20s — probablement une page vide.");
      await browser.close();
      return [];
    }

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
          price: { amount: price },
          photo: {
            url: img,
            high_resolution: { timestamp: Date.now() / 1000 }
          }
        });
      }

      return results;
    });

    await browser.close();

    // 🎯 Filtrage des articles valides
    const blacklist = Array.isArray(channel.titleBlacklist) ? channel.titleBlacklist.map(w => w.toLowerCase()) : [];
    const newArticles = articles.filter(a =>
      !processedArticleIds.has(a.id) &&
      !blacklist.some(word => a.title.toLowerCase().includes(word)) &&
      a.photo && a.photo.high_resolution.timestamp * 1000 > Date.now() - 1000 * 60 * 60
    );

    return newArticles;

  } catch (err) {
    console.error("❌ Erreur dans vintedSearch (scraping HTML) :", err);
    return [];
  }
};
