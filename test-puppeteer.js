import puppeteer from 'puppeteer';

const test = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://www.vinted.fr/');
  await page.screenshot({ path: 'vinted.png' });

  console.log('✅ Screenshot saved');
  await browser.close();
};

test();
