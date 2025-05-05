import puppeteer from 'puppeteer';

export const fetchCookie = async () => {
  try {
    console.log("Launching Puppeteer to fetch Vinted cookie...");

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto("https://www.vinted.fr/how_it_works", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    const cookies = await page.cookies();
    await browser.close();

    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join("; ");
    console.log("✅ Cookie récupéré avec Puppeteer");

    return cookieString;
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des cookies Vinted :", err);
    throw err;
  }
};
