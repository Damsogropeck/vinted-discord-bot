import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

let cachedCookies = null;

// Navigation sécurisée avec retry (comme dans search.js)
async function safeGoto(page, url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🌐 [Tentative ${attempt}] Connexion à : ${url}`);
      await page.goto(url, {
        waitUntil: 'domcontentloaded', // plus sûr que networkidle2 sur Render
        timeout: 60000
      });
      return true;
    } catch (err) {
      console.warn(`⚠️ Tentative ${attempt} échouée : ${err.message}`);
      if (attempt === maxRetries) throw err;
      await new Promise(res => setTimeout(res, 2000));
    }
  }
}

export const fetchCookie = async () => {
  if (cachedCookies) return cachedCookies;

  try {
    console.log("🚀 Lancement de Puppeteer avec Stealth pour récupérer les cookies...");

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    const testUrl = "https://www.vinted.fr/catalog?search_text=nike";
    await safeGoto(page, testUrl);

    const cookies = await page.cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join("; ");

    console.log("✅ Cookie récupéré avec Puppeteer + Stealth");

    await browser.close();

    cachedCookies = cookieString;
    return cookieString;
  } catch (err) {
    console.error("❌ Erreur lors de la récupération du cookie Vinted :", err);
    throw err;
  }
};
