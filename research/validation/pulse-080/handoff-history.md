# PULSE ARENA — revisão iniciada15/11/2026

Escopo autorizado: APK/PULSE, PB pausado. Preservar mudanças pré-existentes sem commit, fonte online e dados privados. Usuário adiou economia e inclusão de Ferunoga/Hawajaku/Kyasupada/Eereon na loja. Não mexer em preços/taxas/Marshadow sem a decisão posterior.

## Estado entendido

WebView landscape Capacitor. public/pulse.html + public/pulse/app.js, progression.js, growth/growth-battle.js, management-ui.js, battle.js, controls/gamepad, style.css+rpg.css. Motor compartilhado public/engine.bundle.js com extensões PULSE. APK anteriores0.5/0.6/0.7 relatados pelo usuário; verificar release real antes de publicar nova. PB atual separado, não reiniciar3015.

Campanhas1/2 e vinte fases, gacha base forms, tickets/pity/evolução/XP por KO já existiam. Online em pulse-online (SQLite/auth Google e convidado, amigos/ranking, Arena parcial WS). public/pulse/online.js tem cliente login/amigos/ranking, mas NÃO liga a Arena ao runtime. Desafios de amigo existentes em app.js ainda iniciam um bot com nome do amigo, não PvP real: não tratar como funcionalidade PvP pronta.

Textos fornecidos: anexos Meta Pokémon Novembro2026 e Online fundação. Relatório meta é material de planejamento, não fonte numérica verificada nesta revisão. Listas de ausências/roster e números competitivos devem ser rechecados antes de importar espécies/balancear; não copiar o meta por turnos cegamente para tempo real.

## Correções deste trabalho

1. applyEarnedLevel em growth-battle.js: KO XP agora atualiza nível, atributos e HP do ator em campo imediatamente. Preserva HP perdido, ação, cooldown, boosts; não revive caído. Antes o save subia, mas o ator ficava no nível antigo. Três testes (incluindo KO real e abertura do contador de evolução5s) passaram.
2. status-text.js traduz feedback NATIVO do motor. Mesmas regras/duração/imunidades; não aplica novo status. battle.js usa wrapper de b.text e remove campos duplicados de snapshot.
3. Layout: HUDs superiores, quatro golpes no rodapé, controles secundários em painéis de Equipe/Registro. Bancada aparece quando jogador precisa escolher substituto. Fonte de UI preservada, sem novas artes. Capturas provisórias em research/validation/apk-battle-*.png. Refino e validação final ainda em andamento.
4. pulse-online/ws.mjs: handshake de fechamento remoto respondido e socket finalizado; onClose passa a notificar uma única vez também em fechamento iniciado no servidor. Corrigiu conexões penduradas nos testes.
5. Teste Arena corrigido: derrota partindo de0 tem delta real0, não -5; placar mantém piso0. Implementação já fazia isso corretamente. Streak de POST/rankings/match atualmente recebe before.streak, e teste retorno standing pós-update passou.

## Evidência

- npm test:147 passaram após primeira rodada de correções (antes de acrescentar terceiro teste de nível e último ajuste da posição do botão pausa).
- node --test test/pulse-live-level.test.mjs:3 passaram.
- node --test pulse-online/test/*.test.mjs:24 passaram após correção de WS/teste delta.
- Chromium844x390: batalha real carregou; botões de golpe e painel bancada renderizados; erros de página não observados. Captura inicial era do loading; foi repetida esperando golpes, não usar primeira captura como evidência.
- Sem teste em aparelho físico nem APK novo gerado nesta revisão. Sem login Google real nesta revisão.

## Ainda fazer

- Verificar layout final em844x390,800x360 e1280x720, pausa, troca forçada, captura/evolução/painelRegistro, multitoque/gamepad. Revisar fila do log: não deixar avisos antigos aparentarem evento atual; painel secundário não deve cobrir campo por padrão.
- Testar evolução completa durante luta, persistência ao fechar e golpes recém-aprendidos; XP já aplicado deve continuar exatamente uma vez.
- Arena: terminar cliente/API+UI, simulação com mesmos teams/seed/input frames para os dois lados e identidade do jogador local. O runtime OfflineBattle ainda fixa side0. Não fingir PvP renomeando bots. Rotação50/dia, LV100, fila2min fallbackbot, placar separado; backend tem parte implementada e testada. Checar fontes atuais antes de editar, porque havia trabalho parcial pré-existente.
- Admin/site Google ainda faltam. Não expor configuração administrativa sem autorização e autenticação verificada.
- Tier names em inglês vindos de standing.tier_name ainda podem sobrepor rótulos locais em português.
- Roster do relatório meta precisa conferência; expansão futura deve manter fontes, golpes/habilidades reais e sprites prontos.
- Build/QA Android e publicação somente após validação do conjunto. Não afirmar pronto nem sobrescrever releases existentes.

Última edição: botão pausa movido do header para toolbar para ficar estável e clicável. Ainda precisa de nova captura e teste após essa edição.

## Correção explícita do usuário após as capturas

Painéis flutuantes devem ser aplicados às interfaces de MENUS, não ao combate. Usuário rejeitou a bancada sobre o mapa. Removidos botões Equipe/Registro e comportamento de gaveta de batalha. Bancada voltou a ser faixa fixa na segunda linha dos controles, fora da arena; log de narração fica oculto, feedback transitório nativo sobre Pokémon continua. Não reintroduzir popups/drawers de equipe/histórico no campo. Capturas anteriores com bancada flutuante estão rejeitadas; nova captura ainda necessária.

### Correção de composição da batalha — 15/11
Usuário esclareceu: janelas flutuantes pertencem aos menus do jogo, não ao combate. Reservas e comandos ficam na faixa inferior fixa; placas de HP e relógio agora ficam em faixa superior própria, fora da arena. Removidos acessos flutuantes de equipe/log no combate. Captura local 844×390 em research/validation/apk-battle-revised-844.png; verificada com batalha carregada. Sem APK novo nem alteração no PB público.

### HUD PB solicitada por referência visual — 15/11 (substitui composição anterior)
O usuário enviou duas capturas do PB: manter posições e informações, modernizar somente visual para PULSE. Implementado em pulse.html/app.js/rpg.css: equipe 2 colunas esquerda, Auto/Manual topo esquerdo, direcional embaixo esquerdo; campo central com HUD dos dois lados/relógio; quatro golpes verticais direita e guarda/esquiva embaixo direita. Mega/evolução e captura separados dos quatro slots. Tipos PT-BR, HP absoluto/percentual, nível, status/stages, equipe restante, treinador e último golpe breve. Feedback nativo sobre Pokémon preservado; nenhuma gaveta de equipe/log cobrindo campo. Pausa topo direito existente.
Validação local Playwright: 844×390, 800×360, 1280×576; asserts geométricos HUD/campo/reservas/golpes/ações sem interseção; pausa/continuar aprovado. Capturas research/validation/pb-hud-844.png, pb-hud-800.png, pb-hud-1280.png. Testes de progressão ao vivo 4/4; Gamepad 3/3 (simulados; sem controle físico). Não gerado/deployado APK novo. Esta entrega é HUD local, não conclusão da Arena/online/admin. A conferência desta rodada usou equipe inicial de um Pokémon, não validou uma batalha real 6×6.

### Acabamento da HUD — Home + Shield (15/11)
Pedido: composição PB preservada, acabamento mais bonito com cores Shield e identidade Home. Criado public/pulse/battle-skin.css, carregado depois dos estilos antigos, e assets vetoriais próprios public/pulse/assets/hud/move-shell.svg e action-shell.svg. Branco quente, grafite, vermelho #e60032; golpes com moldura inclinada, insígnia de tipo, potência destacada e barra de recarga. Equipe clara com seleção vermelha; botões guarda/esquiva redesenhados, feedback de pressão e redução de movimento respeitada. Não adicionou dependência nem raster desnecessário para geometria. A empacotadora Android copia a pasta public inteira, incluindo novos arquivos; APK ainda não gerado nesta rodada. QA três resoluções + pausa/continuar em /tmp/pulse-shield-hud.log; capturas pb-hud-844/800/1280.png atualizadas. Referência visual adicional Nintendo: https://www.nintendo.com/jp/topics/article/0a1e266a-0770-46ba-bd49-8e4ab22f9667 .

### Compactação da faixa superior — 15/11
Usuário rejeitou a altura ocupada pelas placas claras. Aplicados playbooks Impeccable layout, distill e polish. Vital strip reduzido de82 para48px (800×360 antes74, agora48), mantendo retratos28/25px, nome/nível/percentual, tipos e estados, barra HP e valor/equipe. Nome do treinador e último golpe realocados para o espaço superior já existente, sem painel/mapa adicional. HTML agrupa tipos/status/stages em plate-meta; app continua atualizando os mesmos IDs. Screenshot pb-hud-844.png atualizada. QA local três resoluções com asserts de não sobreposição + pausa/continuar: /tmp/pulse-compact-hud.log. Detector layout antes/depois [] (não substitui verificação visual). Não gerou APK.
