#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
# npm run build # décommente si tu as besoin de builder du TypeScript ou du front

# Gérer le cache Puppeteer via Render
if [[ ! -d $PUPPETEER_CACHE_DIR ]]; then 
  echo "...Copying Puppeteer Cache from Build Cache" 
  cp -R $XDG_CACHE_HOME/puppeteer/ $PUPPETEER_CACHE_DIR
else 
  echo "...Storing Puppeteer Cache in Build Cache" 
  cp -R $PUPPETEER_CACHE_DIR $XDG_CACHE_HOME
fi
