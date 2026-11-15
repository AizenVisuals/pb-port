#!/bin/bash
# Deploy do pulse-online: copia a fonte para o diretório de deploy e reinicia o serviço.
# O banco (data/pulse-online.db) e o segredo (data/secret) vivem fora de `current/`,
# então o deploy nunca apaga contas nem invalida sessões.
set -euo pipefail
SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="/home/bloody/.local/share/pulse-online"
mkdir -p "$DEST/current" "$DEST/data" "$DEST/logs"
cp "$SRC/server.mjs" "$SRC/db.mjs" "$SRC/auth.mjs" "$SRC/validate.mjs" "$SRC/config.mjs" "$SRC/ranks.mjs" "$SRC/arena.mjs" "$SRC/ws.mjs" "$SRC/admin.mjs" "$SRC/admin-user.mjs" "$SRC/package.json" "$SRC/README.md" "$DEST/current/"
mkdir -p "$DEST/current/site"
cp "$SRC/site/index.html" "$SRC/site/portal.js" "$SRC/site/portal.css" "$DEST/current/site/"
cp "$SRC/../public/pulse/vendor/account-sdk.js" "$DEST/current/site/account-sdk.js"
cp "$SRC/../public/pulse/firebase-config.json" "$DEST/current/site/firebase-config.json"
cp "$SRC/arena-pool.json" "$DEST/current/arena-pool.json"
rm -rf "$DEST/current/test"
cp -r "$SRC/test" "$DEST/current/test"
cp "$SRC/tunnel.sh" "$DEST/tunnel.sh"
chmod +x "$DEST/tunnel.sh"
if [ ! -x "$DEST/cloudflared" ]; then
  cp /home/bloody/.local/share/pb-selfhost/cloudflared "$DEST/cloudflared"
  chmod +x "$DEST/cloudflared"
fi
echo "deploy: $SRC -> $DEST/current"
if systemctl --user list-unit-files pulse-online.service >/dev/null 2>&1; then
  systemctl --user daemon-reload
  systemctl --user restart pulse-online.service
  echo "serviço pulse-online reiniciado"
else
  echo "serviço ainda não instalado — rode: systemctl --user enable --now pulse-online.service"
fi
