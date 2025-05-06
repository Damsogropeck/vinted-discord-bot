import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

let cachedCookies = null;

export const fetchCookie = async () => {
  if (cachedCookies) return cachedCookies;

  try {
    console.log("🚀 Lancement de Puppeteer avec le plugin Stealth...");

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.goto("https://www.vinted.fr/catalog?search_text=nike", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

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
