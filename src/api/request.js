import fetch from 'node-fetch';

const proxyUrl = "https://corsproxy.io/?";

export const authorizedRequest = async ({
  method,
  url,
  oldUrl = null,
  data = null,
  cookies = null,
  logs = true
} = {}) => {
  try {
    const proxiedUrl = proxyUrl + encodeURIComponent(url);

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Connection": "keep-alive"
    };

    if (cookies) {
      headers["Cookie"] = cookies;
      headers["Referer"] = oldUrl || "https://www.vinted.fr/";
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
      console.log("making a proxied request to " + proxiedUrl);
    }

    let response = await fetch(proxiedUrl, options);

    while ([301, 302, 303, 307, 308].includes(response.status)) {
      const newUrl = response.headers.get('Location');
      console.log(`redirected to ${newUrl}`);
      response = await fetch(proxyUrl + encodeURIComponent(newUrl), options);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (response.headers.get('Content-Type')?.includes('text/html')) {
      return response;
    }

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error during authorized request:', error);
    throw error;
  }
};
