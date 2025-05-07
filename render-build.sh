#!/usr/bin/env bash
# 🚫 Stopper le script si une commande échoue
set -o errexit

echo "📦 Installation des dépendances..."
npm install

# 📁 Gestion du cache Puppeteer via Render
echo "🧠 Vérification du cache Puppeteer..."
if [[ ! -d "$PUPPETEER_CACHE_DIR" ]]; then 
  echo "📥 Aucun cache local trouvé, tentative de copie depuis le cache de build..."
  cp -R "$XDG_CACHE_HOME/puppeteer/" "$PUPPETEER_CACHE_DIR" || echo "⚠️ Aucun cache à copier (ceci est normal au 1er déploiement)"
else 
  echo "📤 Stockage du cache Puppeteer vers le cache de build..."
  cp -R "$PUPPETEER_CACHE_DIR" "$XDG_CACHE_HOME/puppeteer/" || echo "⚠️ Impossible de copier le cache, peut-être vide"
fi

echo "✅ Build terminé avec succès"
