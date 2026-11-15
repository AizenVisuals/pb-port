# PB Ranked público × PULSE — 15/11/2026

Fontes observadas: https://ranked.pokemonbattlegrounds.com/ (HTMLpúblico preservado emranked-live.html), app.jspúblico preservado emranked-app.js e https://ranked.pokemonbattlegrounds.com/usage?format=6v6 (usage-28days.json do endpoint público). Nenhuma conta/partida de produção usada. A existência dos comandos na página não prova seus fluxos internos.

| Recurso anunciado no PB | PULSE nesta atualização |
| --- | --- |
| Combate real time, Auto/manual, esquiva, defesa, Mega, troca | Motororiginal preservado; evoluções permanentes separadas deMega |
| Formatos3v3/6v6 e outras modalidades online | Treinooffline1–6por lado e campanha; doubles/tag/Pick4 não transplantados |
| Practice vsbot | Treino com nível/golpes legais; avaliação de eficácia/alcance/disponibilidade; sem lerinput do jogador |
| Friendlymatch, friends, rankings, tournaments | Dependem do serviço online; não confundir os botões do original com APIs implementadas noPULSE |
| BattleTower, PBGrid, vote, trophyroom | Ausentes doPULSE; sistemas distintos, não se adicionaram botões vazios |
| Replays/sharevideo | Não implementado noPULSE; não se prometeu replay persistido sem backend |
| Savedteams, MyPokémon, usagestats | Formação/coleção local; metaestudado emrelatório, não herdado automaticamente como balanceamento de campanha |
| Recursosoriginais de batalha/sprites/som | Coleção local previamente auditada, preservada; expansões possuem fonte/créditos. Ember eScratch tinhamadaptadores enganosos e agora têm ações próprias. Novas formas não herdam habilidades de uma espécie arbitrária |

## Uso/meta

`meta-observed.md` registra rankings por uso dos formatos3v3/6v6 na janela pública28dias, com contagens de jogadores/equipes. Uso não é winrate e nenhum deles prova força na campanha com nível5–23. O maior uso observado foiGreninja nos dois formatos; Charizard também tem alto uso maswinrates inferiores a50% nessa amostra. Portanto não converter popularidade emraridade/poder nem ajustar dano com base nisso. Brainlocal usa regras do combate, não listas estáticas de meta.

## Limites

Este comparativo verifica a superfície pública e os recursos do nosso código; não certifica paridade integral do serviço/contas original. Não importar bundleonline por cima da nossa extensão ou conectar oPULSE às contas/partidas de produção para testar.
