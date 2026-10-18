#!/bin/sh
# Deploy the game to the VPS: https://japa.45-77-62-61.sslip.io
# Static files only; nginx site /etc/nginx/sites-available/japa serves /var/www/japa.
# Run from Japa_game/. Rebuild characters first if the raw packs changed:
#   python3 -I tools/pack_characters.py assets/characters assets/characters
set -eu
HOST=root@45.77.62.61
node --test >/dev/null
node tools/check_budget.mjs | tail -1
rsync -az --delete --chown=root:root \
  --exclude '*.gltf' --exclude '*.test.js' \
  --exclude 'src/game' --exclude 'src/main.js' --exclude 'src/ui' \
  --exclude 'src/content/events.js' --exclude 'src/content/index.js' \
  index.html src vendor assets "$HOST:/var/www/japa/"
curl -fsS -o /dev/null https://japa.45-77-62-61.sslip.io/ && echo "Deployed: https://japa.45-77-62-61.sslip.io/"
