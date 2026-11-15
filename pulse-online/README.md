# PULSE ARENA online0.2

Servidor Node/SQLite de contas Google/convidado, perfis, amigos, ranking, Arena diária e portal administrativo. Sem dependências externas em produção; os testes WebSocket usam o `ws` do projeto principal. Leia também `../PULSE-ARCHITECTURE.md` e a evidência em `../research/validation/pulse-080/RESULTS.md`.

## Rodar e verificar

```bash
DATA_DIR=/caminho/privado PORT=3016 node pulse-online/server.mjs
node --test pulse-online/test/*.test.mjs
```

Node22+ com `node:sqlite`. `DATA_DIR` contém banco e segredo de sessão; nunca publicar ou copiar para APK/Git. `deploy.sh` copia somente fonte/site para `~/.local/share/pulse-online/current`, preserva `../data` e reinicia apenas `pulse-online.service`. O túnel e o PB3015 não são reiniciados. O deploy copia SDK e config públicos de `../public/pulse/` para o portal.

Serviços: `systemctl --user status pulse-online.service pulse-online-tunnel.service`. API local3016. Portal e API públicos atuais em https://held-creative-penetration-uses.trycloudflare.com/ . É um quick tunnel: depende do PC/internet ligados e muda se reiniciado. A nova origem também precisa constar nos domínios autorizados do Firebase.

## Conta e administração

`POST /api/auth/guest` cria uma sessão; `POST /api/auth/google` troca Firebase ID Token RS256 verificado por sessão de90 dias. Checa assinatura, projeto, emissor, validade, provedor Google e e-mail verificado. Bearer de convidado no login Google vincula a identidade nova à conta existente; conta Google que já existe é recuperada sem fusão destrutiva. `GET/PUT /api/profile` consulta/atualiza o perfil.

O portal `/` tem login Google, perfil, amigos, placares e admin. Mantém a sessão após F5 e valida o perfil ao restaurar; Sair limpa a sessão. O progresso da campanha permanece local no APK. O portal não sincroniza saves.

Admin exige `provider=google` e `is_admin=1` no banco, checados em cada requisição; não existe senha administrativa padrão nem autoelevação do primeiro visitante. Bootstrap local:

```bash
DATA_DIR=/caminho/privado node pulse-online/admin-user.mjs USER_ID grant
# Para revogar: substituir grant por revoke.
```

- `GET /api/admin/overview`: contagens, contas recentes e auditoria, sem e-mails/tokens.
- `GET/PUT /api/admin/settings`: `arena_enabled` booleano e `announcement` texto até240 caracteres. Toda alteração auditada em transação.
- `GET /api/settings`: apenas essas configurações públicas.
- Não altera preços, taxas de gacha nem inventário; decisões de economia continuam com o usuário.

## Amigos e ranqueado

`GET /api/friends`, `POST /api/friends/request {nick}`, `POST /api/friends/respond {user_id,accept}`, `DELETE /api/friends/:id`, `POST /api/friends/heartbeat`. Convite7 dias, recusa24h, presença5min. Apelidos não são únicos; empate usa presença mais recente.

`GET /api/rankings/me|ladder|history`, `POST /api/rankings/match {result,vs_bot,opponent_id?}`. Mesmas faixas de pontos do PB: Iniciante0, Poké90, Super220, Ultra390, Master600 e Campeão top10% dos600+. O cliente traduz os nomes de exibição; identificadores do protocolo preservados. Vitória bot+5 (0 no Master+), sem alterar streak; resultado retorna standing atualizado. Temporada mensal UTC.

O desafio de amigo da tela antiga é treino contra bot com nome do amigo e está identificado assim. O PvP humano implementado nesta atualização é a Arena.

## Arena

- `GET /api/arena/rotation`:50 Pokémon diários UTC, quotas12S/22A/8B/8C, rotação persistida.
- `POST /api/arena/queue {team}`:3 diferentes da rotação,4 golpes por parceiro (ou todos os disponíveis quando há menos de4), Mega elegível opcional. Catálogo valida movimentos e Mega no servidor.
- `GET /api/arena/queue`: fila/partida; consultar a cada2s. FIFO; após120s fornece bot. Sem heartbeat30s não casa; fila abandonada expira10min. `DELETE` sai/cancela partida ainda não iniciada.
- `GET /api/arena/me|ladder|history`: placar exclusivo da Arena. Vitória humana+20, bot+10, derrota até−5 com piso0; temporada mensal. Não paga moedas/XP de campanha.
- `POST /api/arena/result`: idempotente; PvP exige relatos coincidentes. Divergência anula sem pontos. Bot usa confirmação do único jogador.

### WebSocket /api/arena/ws

Autentique com `{t:'hello',token}` nos primeiros10s (credencial nunca na URL). Depois de carregar os assets, envie `{t:'ready',match_id}`; carregamento expira em60s. Receba `go`, depois `tick {upTo,inputs}`. Entradas aceitas: move/switch/mega/manual/steer/dodge/guard/autoatk/autoguard; o servidor atribui `side` e frame `at`. Ambos simulam os mesmos frames, semente e times em ordem canônica. `result {winner}` aguarda acordo; `end` devolve delta e standing. Desistência ou desconexão durante a partida é WO. Apenas um socket por conta.90 mensagens/s e limite de inputs pendentes.

Limite de confiança: o servidor ordena entradas/relógio e confirma resultados, mas não simula o motor. Dois clientes adulterados em conluio ainda podem falsificar resultados. Não é uma implementação de anti-trapaça autoritativa.

## QA de navegador

Disponibilize `public/` num servidor local3012. Os roteiros criam bancos e contas temporários e nunca usam dados do serviço público. Instale/aponte Playwright Core e um Chromium compatível:

```bash
PULSE_PLAYWRIGHT_MODULE=/caminho/node_modules/playwright-core \
PULSE_CHROMIUM=/caminho/chromium \
node scripts/qa-pulse-arena.mjs
```

Outros roteiros: `qa-pulse-arena-bot.mjs`, `qa-pulse-arena-app.mjs`, `qa-pulse-portal.mjs`. `PULSE_WEB_URL` substitui a origem3012. Relógio acelerado e JWKS de fixture são injetados apenas em servidores temporários de teste. O teste do portal simula o provedor; login Google real foi validado separadamente pelo usuário.
