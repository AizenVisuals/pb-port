# PULSE ARENA — proposta de jornada, primeira versão

## Confirmado pelo usuário

- PB original é a maior referência, acima de Unite/Champions. Inventariar e reaproveitar assets e comportamento existentes antes de inventar substitutos.
- Campanha por fases, de 1-1 a 1-10 nesta primeira versão; não foi solicitado mundo aberto.
- Líderes de ginásio, Equipe Rocket, treinadores e encontros selvagens com opções de fugir, lutar ou capturar.
- Pelo menos três banners diferentes, loja e função de adicionar amigos.
- Consultar PrismaDex como fonte complementar de sprites/recursos.
- Composição panorâmica aprovada; cenário anterior e botões rejeitados pelo usuário como genéricos. Menus modernos, Pokémon em pixel art; cores grafite/ciano/coral.

## Evidência local, 14/11/2026

PB: public/assets/trainers possui 72 PNGs, assets/npcs 52 PNGs, faces 35 PNGs; audio/sfx 1410 MP3 e audio/music 3 MP3. Contagem de arquivos não comprova integração de todos eles. Batalhas offline e efeitos usados pelo motor já foram testados no trabalho anterior; sistemas novos abaixo não estão implementados.

PrismaDex localizado em /home/bloody/Documents/Pokémon. Assets Android: 1500 PNGs de treinadores e 88 PNGs de insígnias. Manifesto scripts/trainer-badge-import/trainer-manifest.json registra URLs e autoria; não presume licença aberta geral. Sprites de brock, misty, giovanni, rocketgrunt, rocketgruntf, youngster, bugcatcher e lass existem. Retratos de treinador não equivalem às animações direcionais do motor PB.

O roster atual tem 154 entradas e não inclui Geodude/Onix. Propor Brock com equipe canônica implica importar definições, golpes e animações compatíveis; não apenas um PNG de Onix. Esse trabalho precisa ser inventariado antes de prometer a fase pronta.

## Proposta ainda não aprovada em detalhe

Capítulo 1: caminho até a primeira insígnia. Dez fases fixas; encontros selvagens aparecem como acontecimentos internos da fase, não como fases numeradas adicionais. Fluxo: abertura curta -> treinador/objetivo -> encontro opcional quando previsto -> recompensa -> desbloqueio seguinte. Repetição possível com recompensa inicial única e regras contra reroll de encontro/captura por reload.

1-1 primeiro duelo/tutorial; 1-2 treinador de rota; 1-3 primeiro encontro selvagem; 1-4 especialista de insetos; 1-5 recruta Rocket; 1-6 rota com selvagem e treinador; 1-7 confronto Rocket de fechamento do incidente; 1-8 rival; 1-9 preparação do ginásio; 1-10 líder e primeira insígnia. Nomes/biomas/equipes/recompensas não estão definidos.

Banners de invocação propostos: Encontros da Rota (geral), Parceiros de Batalha (seleção temática) e Ecos da Noite (sombrio/fantasma). Pools devem usar as espécies realmente disponíveis; chances, garantia, duplicatas e custo precisam ser explícitos por banner. Sem falso prazo limitado. Definir se garantia é separada por banner antes de implementar.

Loja: moedas para consumíveis de captura; diamantes de duplicatas mantêm compra direcionada e shinies. Captura deve ser uma alternativa funcional ao gacha, sem obrigar gasto para avançar. Regras de HP/status/chances/consumo/fuga/morte ainda precisam de definição.

Amigos: código de treinador, pedidos, aceitar/recusar/remover e consulta à equipe pública. Lista entre aparelhos exige backend e identidade/sincronização; campanha pode continuar offline. PvP, chat, troca e co-op não foram especificados como funções da primeira versão.

Lobby proposto: treinador/favorito e cenário PB coerente; ação principal Continuar jornada com fase atual e próximo objetivo; Arena como modo separado; atalhos Equipe, Coleção, Invocação, Loja e Amigos. Somente destinos funcionais devem ser apresentados como disponíveis.

## Próximo passo

Fechar escopo e regras da jornada antes de redesenhar as telas ou implementar funções. Guardar o motor PB; acrescentar campanha por dados e estado persistente. Entregar primeiro um trecho completo que valide o ciclo, depois preencher 1-1 a 1-10 sem anunciar capítulo completo prematuramente. Trabalho novo ainda é proposta.
