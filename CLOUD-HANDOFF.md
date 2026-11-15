# PULSE ARENA — continuidade no Arch Linux

Este arquivo registra o estado deixado pelo Codex Cloud para que outra sessão continue o trabalho sem reconstruir o que já existe.

## Atualização local — 14/11/2026

O controlador `public/pulse/app.js` está implementado. Lobby, equipe, golpes, Mega, coleção, recompensas, invocações e loja estão conectados ao save local e ao motor offline.

- Direção atual confirmada: mobile horizontal; acabamento inspirado na organização de Pokémon Unite; identidade PULSE ARENA grafite/ciano/coral. O usuário esclareceu que a fluidez desejada inclui botões e transições da interface.
- Moedas são usadas no gacha. Repetidos rendem diamantes (10 comum / 30 raro / 100 épico). Diamantes compram Pokémon específicos (60 / 180 / 600) e shinies cosméticos (300). Saves antigos recebem os campos novos sem perder progresso.
- Oito shinies importados com correspondência exata de paleta, créditos e revisão fixada do SpriteCollab. `research/shiny-assets-manifest.json` registra fontes e exclusões. Mega mantém sua aparência original.
- Remotion local em `motion/`, portal renderizado a 960x540/60 fps, 72 frames. O app empacota somente o vídeo de cerca de 240 KB, com opção de pular e respeito a movimento reduzido.
- `npm test`: 26/26. Fluxo Chromium: diária, gacha, reload, importação de fixture de QA, loja, shiny, equipe 6v6, golpes, Mega, pausa e partida completa com rede desativada; recompensa registrada uma vez após reload; nenhum WebSocket/request externo/erro JS.
- APK debug de teste gerado em `artifacts/PULSE-ARENA-debug.apk` e instalado com sucesso no aparelho ADB conectado (modelo M2101K7BI). Não foi iniciado nem inspecionado no aparelho: o usuário disse que vai testar, então não interagir com o celular durante o teste.
- Atenção: após o empacotamento dessa versão de teste, o código recebeu ajuste de espaço da legenda do favorito e retorno nativo na tela inicial. Recompilar antes da entrega final.
- Ainda falta revisão de acabamento com capturas nativas, documentar DESIGN.md a partir do resultado e validar exportação Android via Filesystem/Share. Não afirmar fluidez ou partida nativa testada; evidência completa de combate é do Chromium.
- Main/Render não foram publicados nem alterados remotamente. Trabalho local ainda sem commit/push.

O texto abaixo preserva o handoff original do Cloud e descreve o estado anterior.

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

## Retomada — 14/11/2026, multitoque e verificação

Esta atualização complementa os registros anteriores (que não refletem todas as etapas implementadas).

- Pedido atual: continuar campanha/captura/interface/online e reutilizar o PB original como referência principal em cada sistema. `docs/PB-REFERENCIA-PRINCIPAL.md` registra cobertura e próximos componentes.
- Novo `public/pulse/controls.js`: movimento pertence a um único pointerId; outros dedos acionam golpes, guarda, esquiva, Mega e troca ao pressionar. Click físico não duplica comando; teclado continua funcionando. Cancelamento, perda de captura e blur limpam controles.
- Verificado em Chromium com CDP e dois toques reais emulados: analógico+golpe, analógico+guarda, soltar ação sem parar movimento, dedo secundário ignorado no analógico, cancelamento, novo gesto e ativação por teclado. Não verificado em hardware Android; nenhum aparelho ADB conectado nesta retomada.
- Corrigida redução indevida de equipes da jornada com quatro/cinco membros ao carregar catálogo. Testes cobrem reload e progresso das dez fases com derrota, retomada, recompensa e insígnia únicas.
- Suíte completa: 41/41, evidência em `research/validation/tests-current.txt`.
- APK recompilado com Java 21 e `ANDROID_HOME=/home/bloody/Android/Sdk`: `artifacts/PULSE-ARENA-debug.apk`. Não instalado nem chamado de entrega final.
- `research/validation/campaign-battles.json`: 30 batalhas reais do motor, seed 73, três iniciais e capturas de rota presumidas, ambos os lados automáticos. Amostra de dificuldade, não prova de balanceamento nem de fluxo completo na interface. Há derrotas nos confrontos Rocket/ginásio; ajustar após mais amostras.
- Inventário PB reproduzível: 5.495/5.505 recursos preservados presentes; dez metadados já 404 na coleta anterior. `research/pb-reuse-audit.json` distingue arquivos originais e modificados localmente.
- Firebase CLI exigiu cache isolado em `~/.cache/pulse-firebase-cli` por falha `Cannot find module rc` no cache npx anterior. Login continua pendente de ação do proprietário; nenhum projeto criado nem faturamento ativado. Usuário já escolheu criar projeto exclusivo gratuito. Não solicitar essa escolha de novo.
- O PB provisório público é processo independente em `~/.local/share/pb-selfhost`; não alterar essa cópia ao trabalhar no PULSE. Main/Render permanecem separados.

- Fluxos de captura no Chromium: encontro -> captura -> treinador, consumo exato, reload/retomada, fuga sem consumo e captura em combate. Sorteio controlado e loop retido no perfil isolado de QA; não são mudanças do jogo. Evidência: `research/validation/capture-result.json`.
- Três banners verificados na interface a 844x390: seleção de arte, invocação, pular revelação, fechar resumo, reload e cobrança/contadores independentes. `research/validation/banners-result.json` e capturas `banner-*.png`.

## Firebase autenticado — 14/11/2026

- Autenticação CLI concluída e acesso ao projeto verificado. O proprietário já possuía `pulse-arena-pb` (Pulse Arena); não foi criado projeto duplicado.
- Registrado app web `PULSE ARENA Web`, appId `1:871839787784:web:a6c461778b9bd282c1dabd`. Config pública obtida pela CLI em `public/pulse/firebase-config.json`; `.firebaserc` seleciona o projeto. Não contém tokens de login.
- Nenhum faturamento vinculado nesta operação. Plano atual ainda não verificado. Não confundir autenticação da CLI com login Google funcionando no jogo: provider, SDK, sincronização, regras e amigos seguem como próximas implementações.
- CLI funcional: `npx --cache ~/.cache/pulse-firebase-cli -y firebase-tools@latest`. Não registrar códigos OAuth nem tokens no repositório.

## Login Google integrado — 14/11/2026

- Pedido confirmado: opção 1, conectar Google ao jogo, manter gratuito. Não vincular faturamento.
- Google provider habilitado de verdade via `firebase deploy --only auth`; configuração em `firebase.json`. Redirecionamentos OAuth usam os handlers HTTPS do Firebase. Domínios autorizados lidos de volta: `pulse-arena-pb.firebaseapp.com`, `pulse-arena-pb.web.app`, `localhost`, `127.0.0.1`. O endereço provisório do PB original não é o endereço do PULSE e não foi autorizado para este login.
- App Android registrado: `1:871839787784:android:fd4c76e651117f81c1dabd`, pacote `app.pulsearena.game`. SHA-1 do certificado debug adicionado pela CLI; `android/app/google-services.json` obtido depois inclui clientes OAuth Android e web. Build de distribuição futuro exige cadastrar o certificado de distribuição, não reutilizar o debug.
- SDK Firebase Auth instalado e empacotado em `public/pulse/vendor/account-sdk.js`. Fonte em `scripts/account-sdk-entry.mjs`; regenerar com `npm run account:build`. Empacotamento Android também regenera esse bundle. Sem imports remotos no runtime.
- `public/pulse/account.js` conecta entrada/saída ao perfil. Inicialização sob demanda ao abrir perfil, restauração ao iniciar apenas se houver marcador de sessão anterior. Nenhum save é substituído, enviado ou baixado por login/logout. Marcador não contém token. Credenciais persistem exclusivamente no SDK.
- Android usa `@capacitor-firebase/authentication` com provedor Google nativo (`skipNativeAuth`), troca a credencial pelo Firebase JS Auth e preserva sessão no SDK. Não abrir login Google dentro de WebView.
- Chromium 844x390: perfil, carregamento SDK local, popup real chega a `accounts.google.com`, cancelamento permite nova tentativa, save permanece byte a byte igual; zero erros JS. Evidência `research/validation/account-browser-result.json`. Nenhuma conta real foi autenticada neste teste.
- Suíte completa 44/44; testes de conta também cobrem concorrência, erro, retry e preservação do save. `research/validation/account-tests.txt`.
- Android compilado com plugin e Google Services. Sem dispositivo ADB conectado; entrada real e persistência após fechar no celular ainda exigem verificação do proprietário.
- Login não equivale à sincronização: Firestore/regras/conflitos e amigos seguem como próximas etapas.

## Entrega GitHub de teste autorizada

Usuário pediu subir código/APK para instalar fora de casa. Repositório `AizenVisuals/pb-port` é privado e deve continuar assim. Publicar somente branch `pulse-arena-offline` e release de pré-teste, sem alterar main/Render.

Certificado conferido no APK real com apksigner: SHA-1 `5A:55:45:EF:2B:5B:DA:F2:82:CF:CE:C1:75:6D:B3:DA:D1:B0:D9:72`. Esse certificado foi cadastrado no Firebase; `google-services.json` atualizado contém seu cliente OAuth. A leitura inicial de `~/.android/debug.keystore` apontava outro certificado (7B...), por isso o APK é a evidência usada para a configuração final. Não assumir que o keystore padrão nominal é o usado pelo build.

Versão Android da entrega: versionCode 2, versionName 0.2.0-test.1. Instalar como atualização, preservando dados. Google real no celular ainda precisa do teste do proprietário; build/popup não provam esse fluxo completo.

Entrega publicada e lida de volta pela API GitHub: https://github.com/AizenVisuals/pb-port/releases/tag/pulse-arena-v0.2.0-test.1
Código: `a28c5809d860caf7eb7c2fd89f8c4eb0d4bc8d76`; assets APK e SHA-256 com estado uploaded. APK SHA-256 `61c3ed20f099f8697b8ddcdfe2c41ffbada2793c6cafeb6cd2d725b2fc0462c6`, tamanho 95609131 bytes. Release de pré-teste em repositório privado; instalar autenticado no GitHub. Não houve teste no telefone do proprietário.
