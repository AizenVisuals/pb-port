# PULSE ARENA — continuidade em15/11/2026

## Estado atual
Revisão0.8.0-test.1 implementada. Fonte em `/home/bloody/Projetos/pb-port`, branch `fan-pack-public`. Leia `PULSE-ARCHITECTURE.md` para mapa técnico e `research/validation/pulse-080/RESULTS.md` para evidência e limites. Histórico desta revisão em `research/validation/pulse-080/handoff-history.md`.

- Arena cliente/API/runtime concluídos e verificados em dois navegadores, incluindo resultado natural, desistência e fallback bot após120s. Lados canônicos0/1, nível100, ranking separado e nenhuma recompensa/XP/consumo da campanha.
- Menus de mochila/formação/fase agora contextuais; HUD compacta48px na disposição do PB, visual Home/Shield. Textos nativos voltaram a renderizar: hud:true com plates:false. Não regredir para hud:false (isso esconde feedback, não só placas).
- XP/atributos atualizam no KO; evolução permanente completa na mesma batalha. Regras de status permanecem do motor PB; frases traduzidas no ponto nativo de exibição.
- Portal e administração implantados no serviço3016. Google real e painel confirmados pelo usuário; proprietário reconhecido pela correspondência da conta Google real com a conta que administra o Firebase. Sessão do portal persistente após F5 corrigida e testada com fixture.
- APK compilado, assinatura/conteúdo/SHA1 Firebase conferidos; manifesto em research/validation/pulse-080/apk-manifest.json. Sem ADB/aparelho/AVD nesta sessão; não afirmar teste físico.

## Serviços e dados privados
`~/.local/share/pulse-online/current`: cópia do código, serviço `pulse-online.service`, porta3016. `../data` contém banco e segredo, nunca publicar. Backup consistente antes das mudanças em `../backups/2026-11-15-before-arena-portal`. URL pública atual: https://held-creative-penetration-uses.trycloudflare.com/ . O túnel não foi reiniciado; se mudar, atualizar origem do cliente e domínio autorizado no Firebase.

## Limites que continuam explícitos
A campanha não é sincronizada na nuvem. Desafio de amigo antigo continua treino contra bot e é descrito assim; Arena é o PvP humano. Relay não é anti-trapaça autoritativo (ver arquitetura). Os pacotes de expansão do relatório meta não foram adicionados; ver auditoria do catálogo. Economia/taxas e inclusão dos quatro fãs na loja foram adiadas pelo usuário: não mudar por iniciativa própria.

## PB continua pausado
Não reiniciar3015 nem publicar no PB. Preservar alterações pré-existentes de Ferunoga em public/roster.json, public/custom/fan-pack-data.js e scripts/build-fan-pack-data.py, além do JSON native-moves/research/PB-PAUSED. Não foram feitas nesta rodada. O APK usa os assets/dados locais já existentes; essas mudanças do PB permanecem fora do commit desta revisão para continuidade separada.
