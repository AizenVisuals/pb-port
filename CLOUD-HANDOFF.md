# PULSE ARENA — continuidade no Arch Linux

Este arquivo registra o estado deixado pelo Codex Cloud para que outra sessão continue o trabalho sem reconstruir o que já existe.

## Branch e objetivo

- Branch de desenvolvimento: `pulse-arena-offline`
- Base preservada: `main` continua sendo a versão publicada no Render.
- Objetivo da branch: aplicativo Android offline, em orientação horizontal, com batalhas contra bots, coleção e progressão local.
- Identidade aprovada: PULSE ARENA, grafite, branco quente, ciano e coral.

## Implementado

- Motor de batalha executado no navegador/WebView sem servidor, WebSocket ou `@napi-rs/canvas`: `public/pulse/battle.js`.
- Smoke test do combate local: uma partida 3v3 terminou após 4.312 frames, com Mega Marshadow, rede desativada e nenhum acesso externo.
- Progressão local em `public/pulse/progression.js`: equipe, golpes, Mega, favorito, moedas, diária, invocações, pity, desbloqueio direto, recompensas idempotentes e importação/exportação.
- 11 testes específicos de progressão; a suíte completa atual passa com 22 testes.
- Estrutura visual nova em `public/pulse.html`, `public/pulse/style.css`, ícones e assets de marca/lobby.
- Projeto Capacitor Android em `android/`, application id `app.pulsearena.game`, orientação horizontal, lifecycle/back button e build local sem URL remota.
- Documentos de produto e direção visual: `PRODUCT.md` e `DESIGN.md`.

## Pendente prioritário

`public/pulse/app.js` ainda precisa ser implementado. Ele deve integrar a interface pronta com `progression.js` e `battle.js`. O agente de interface do Cloud parou por limite de uso antes de escrever esse controlador. O HTML já referencia esse arquivo e o script de empacotamento recusa deliberadamente gerar um novo APK enquanto ele estiver ausente.

Ao implementar o controlador:

1. carregue `public/roster.json` e configure `createProgression().setCatalog(roster)`;
2. conecte lobby, equipe, coleção, recompensas, invocações e diálogos aos IDs existentes em `pulse.html`;
3. importe `OfflineBattle` somente ao entrar na batalha, para o lobby abrir sem carregar o motor de 8,5 MB;
4. mantenha menus e batalha em horizontal;
5. use `window.PulseNative.setBattleMode(bool)` e os eventos `pulse-native-pause`, `pulse-native-resume` e `pulse-native-back`;
6. preserve o bloqueio de seleção de texto nos controles e as áreas de toque de pelo menos 48 px;
7. faça uma partida completa com rede bloqueada, recarregue a página e confira que a recompensa foi registrada uma única vez.

O APK existente no workspace do Cloud foi um build intermediário anterior a essa verificação e não deve ser distribuído: ele não contém `public/pulse/app.js`. Gere outro somente depois de concluir a integração.

## Preparação no Arch Linux

```bash
git clone https://github.com/AizenVisuals/pb-port.git
cd pb-port
git fetch origin
git switch --track origin/pulse-arena-offline
npm ci
npm test
```

Para o APK, instale Java 21 e o Android SDK (platform 36, build-tools 35.0.0) e configure `ANDROID_HOME` ou `android/local.properties`. Depois:

```bash
npm run android:build
```

O resultado fica em `artifacts/PULSE-ARENA-debug.apk`. Mais detalhes estão em `README-ANDROID.md`.

## Verificações já feitas

- `npm test`: 22/22 passando no Cloud.
- Combate Chromium offline: 3v3 completo, Mega Marshadow, nenhum WebSocket ou request externo.
- Progressão: save, equipe 6v6, chances 70/25/5, pity no décimo pull, duplicatas, diária, desbloqueio direto, corrupção de save e importação/exportação cobertos por testes.

## Arquivos gerados que não vão ao Git

`dist-android/`, `artifacts/`, caches do Gradle, SDK Android, JDK e APKs são reproduzíveis e permanecem ignorados. Nenhum código-fonte ou asset autoral da branch depende deles.
