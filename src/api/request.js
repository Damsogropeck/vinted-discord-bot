import fetch from 'node-fetch';
import { fetchCookie } from './auth.js'; // Importation du cookie Puppeteer

export const authorizedRequest = async ({
  method,
  url,
  oldUrl = null,
  data = null,
  cookies = null,
  logs = true
} = {}) => {
  try {
    // Récupération du cookie depuis Puppeteer (sauf si déjà fourni manuellement)
    const authCookie = cookies || await fetchCookie();

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Connection": "keep-alive",
      "Cookie": authCookie
    };

    if (oldUrl) {
      headers["Referer"] = oldUrl;
      headers["Origin"] = "https://www.vinted.fr";
    }

    const options = {
      headers,
      method
    };

    if (method !== 'GET' && method !== 'HEAD') {
      options.body = JSON.stringify(data);
    }

    if (logs) {
      console.log("making authorized request to " + url);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (response.headers.get('Content-Type')?.includes('text/html')) {
      return response;
    }

    return await response.json();
  } catch (error) {
    console.error('Error during authorized request:', error);
    throw error;
  }
};
