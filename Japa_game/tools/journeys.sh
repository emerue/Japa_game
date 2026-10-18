#!/bin/sh
# Show who visited the game and what they did, newest visitor first.
# Usage (from Japa_game/): sh tools/journeys.sh [days]   (default: last 7 days)
# Reads /var/log/nginx/japa-track.log on the VPS, written by the /t location in the japa nginx site.
set -eu
ssh root@45.77.62.61 'cat /var/log/nginx/japa-track.log.1 /var/log/nginx/japa-track.log 2>/dev/null; zcat /var/log/nginx/japa-track.log.*.gz 2>/dev/null' \
  | sort | node tools/journeys.mjs "${1:-7}"
