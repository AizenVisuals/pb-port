#!/bin/bash
# Túnel Cloudflare (quick tunnel, igual ao do PB self-host) para o pulse-online.
# A URL é efêmera: muda a cada reinício do túnel. Ela fica em logs/tunnel.log.
set -euo pipefail
DEST="/home/bloody/.local/share/pulse-online"
mkdir -p "$DEST/logs"
exec "$DEST/cloudflared" tunnel --no-autoupdate --url http://127.0.0.1:3016 >> "$DEST/logs/tunnel.log" 2>&1
