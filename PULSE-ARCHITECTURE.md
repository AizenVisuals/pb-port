# PULSE ARENA — arquitetura verificada em 15/11/2026

## Escopo e identidade
PULSE é o RPG Android/WebView Capacitor. PB é a aplicação original de combate e está pausado. Este trabalho não reinicia nem publica o PB da porta3015. A identidade adotada combina a composição de combate do PB com acabamento da Home/Shield. Economia atual preservada; compra dos quatro fãs e ajustes de preços/taxas continuam aguardando decisão do usuário.

## Cliente
- `public/pulse.html`, `pulse/app.js`: navegação, dados de progressão, batalhas de campanha/treino e Arena; resultados de Arena não chamam recompensas locais.
- `progression.js`, `growth.js`, `learnsets.js`, `growth-battle.js`: save local versionado, XP de nocaute compartilhado entre participantes, níveis, evoluções e itens. Evolução permanente usa a cinemática do motor, sem virar Mega. Os atributos do ator são atualizados no KO, não só no próximo combate.
- `battle.js`: adaptador do motor nativo; configura equipe, assets, teclado, renderização e snapshots. `playerSide` permite representar o lado1 sem inverter a ordem canônica da simulação.
- `arena-battle.js`: especialização com relógio e entradas recebidos via WebSocket. Nenhum avanço otimista independente. Mesma semente, times e ordem nos dois clientes. Aguarda confirmação do servidor antes de mostrar resultado; modo online não pausa o oponente.
- `controls.js`: cada ponteiro é dono do controle que pressionou; movimento e golpes simultâneos. `gamepad.js`: padrão Gamepad/DualSense, menus com foco e diálogos respeitados. Testes não substituem controle físico.
- `status-text.js`: traduz frases nativas sem alterar regras. Renderizador usa `hud:true, plates:()=>false`: mantém textos/HP transitório no campo e avisos nativos, sem duplicar placas da HUD.
- `management-ui.js`: formação, parceiro, mochila, TM e campanha. Painéis de item/posição/fase são diálogos contextuais. Nenhuma gaveta de equipe/log cobre o campo de batalha.
- `battle-skin.css`: HUD de48px, tipos, HP, porcentagem, nível, estados e alterações de atributos. Assets vetoriais próprios de botões em `pulse/assets/hud/`. `arena-ui.js`/`arena.css`: rotação, seleção de três, golpes, fila e placar.
- `account.js`/`vendor/account-sdk.js`: Firebase Auth Google, popup web e credencial nativa Android. `online.js`: troca ID Token por sessão do servidor, amigos/rankings/Arena. Credencial de sessão fica fora do save exportável.

## Online e portal
- `pulse-online/server.mjs`: HTTP/API e WebSocket; dados privados fora do Git. Firebase ID Tokens verificados com assinatura RS256/JWKS, projeto, emissor, validade, provedor Google e e-mail verificado.
- `db.mjs`: SQLite, tabelas de contas/perfis/amigos/declínios/rankings/históricos/rotação/configuração; migração aditiva. Vincular Google a um convidado novo preserva sua identidade de servidor, amizades e ranking.
- `arena.mjs`: rotação diária UTC50, quotas12S/22A/8B/8C, seleção3, nível100, FIFO, bot após120s, +20 PvP/+10 bot/derrota até−5, piso0 e ranking separado. Valida espécie, golpes e Mega pelo catálogo. Duas confirmações coincidentes encerram PvP; divergência anula sem recompensa. Desconectar/desistir é WO. Timeout de carregamento60s.
- `site/`: portal com Google, perfil, amigos, rankings e painel administrativo. Sessão é restaurada após F5 por consulta autenticada ao perfil. Sair limpa a sessão. A presença de uma aba não autoriza operações: o servidor exige conta Google com `is_admin` no banco.
- `admin.mjs`: visão de contas/partidas, habilitar Arena e aviso público; alterações auditadas e validadas. Preços/taxas não são editados por esta atualização. Bootstrap administrativo somente local via `admin-user.mjs` ou operação local verificada.
- Limite conhecido do modelo atual: simulação ocorre nos clientes; o servidor ordena comandos/relógio e exige acordo, mas não executa simulação autoritativa anti-trapaça. Conluio entre dois clientes adulterados não está resolvido.
- Desafio de amigo na tela antiga ainda é explicitamente treino contra bot com nome do amigo; Arena é o PvP real. Não descrever o treino como duelo humano.
- A campanha continua local; não há sincronização de save de campanha no portal.

## Execução e publicação
Fonte: `/home/bloody/Projetos/pb-port`. Deploy online: `/home/bloody/.local/share/pulse-online/current`; banco/segredo em `../data`; backups em `../backups`. Porta3016, serviços `pulse-online.service` e `pulse-online-tunnel.service`. Túnel temporário muda se reiniciado.
`deploy.sh` copia código/site e reinicia apenas o serviço online; não apaga contas nem reinicia túnel/PB. `npm run android:build` empacota public, sincroniza Capacitor, compila APK e grava SHA256. Necessita Java21 e SDK Linux instalado. APK debug atual usa mesmo applicationId e chave; não desinstalar nem apagar dados para atualizar.

## Relatório meta fornecido
Relatório externo trata de batalhas por turnos, com percentuais e propostas de novas espécies. Não foi tratado como dado de balanceamento automático do motor em tempo real. Cruzamento factual de lacunas em `research/validation/pulse-080/meta-roster-audit.json`. Esta atualização de fundação não inclui os pacotes de novas espécies/Megas citados pelo relatório. Eles requerem assets, golpes e habilidades próprios; continuam como expansão de conteúdo, não confundir com funções online implementadas.
