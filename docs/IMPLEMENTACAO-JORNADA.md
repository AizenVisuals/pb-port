# Plano de execução PULSE ARENA

Autorizado pelo usuário em 14/11/2026. PB é a referência principal. Preservar saves existentes e o jogo publicado. Não publicar mudanças remotamente sem etapa de entrega explícita.

| Ordem | Entrega | Critério de conclusão | Estado |
|---|---|---|---|
| 1 | Inventário PB/PrismaDex e importação SpriteCollab | Fontes/créditos/hashes; geometria das folhas validada | Inventário e importação executados; geometria validada |
| 2 | 3 iniciais e espécies da rota integradas ao PB | Atributos canônicos, quatro golpes legais, animações completas; batalha funcional por inicial | Três iniciais integrados e simulações completas executadas; espécies restantes e kits de abertura pendentes |
| 3 | Escolha do inicial e migração | Novo treinador começa com um inicial; perfil antigo preservado; seleção persistente | Ver atualização de validação abaixo |
| 4 | Campanha de 1-1 até 1-10 | Fases sequenciais, derrota/repetição, vitórias e recompensas idempotentes, primeira insígnia | Ver atualização de validação abaixo |
| 5 | Encontros e captura | Escolhas lutar/fugir/capturar, consumo de bolas, resultado persistente sem reroll por reload | Ver atualização de validação abaixo |
| 6 | Loja e três banners | Pools reais distintos; chances e garantia por banner; diamantes por duplicatas; shiny sem bônus | Ver atualização de validação abaixo |
| 7 | Login Google e sincronização | Vincular visitante, restaurar save, resolver conflitos; regras de acesso testadas | Depende de projeto Firebase do proprietário |
| 8 | Amigos | Pedir, aceitar, recusar, remover; somente equipe pública; isolamento de dados | Depende da etapa 7 |
| 9 | Interface panorâmica e abertura | Cenário e controles aprovados; jornada central; PB como referência; movimento reduzido | Ver atualização de validação abaixo |
| 10 | Entrega Android | Fluxos completos, testes, APK, captura e verificação nativa; registrar limites | Ver atualização de validação abaixo |

## Ordem dentro de cada etapa

Implementar dados/estado -> ligar comportamento -> ligar interface -> testar falhas e persistência -> registrar evidência. Não apresentar arquivo baixado como Pokémon integrado, nem interface de amigos como serviço social pronto.

## Decisões de implementação adotadas para começar

- Campanha offline como prioridade; rede apenas para conta, sincronização e amigos.
- Três iniciais: Bulbasaur, Charmander e Squirtle. Adicionar somente espécies necessárias ao capítulo antes de expandir o restante do catálogo.
- Primeira rota proposta: Pidgey, Rattata, Caterpie, Weedle, Zubat, Ekans, Koffing; ginásio: Geodude e Onix. Equipes e distribuição por fase precisam de validação de dificuldade.
- Dados da campanha separados do motor; manter efeitos, sons e mecânicas PB existentes.
- Não redefinir ou apagar saves de teste; proteger o perfil existente antes de migrar.
- Campanha começa com equipes pequenas. Arena 3v3/6v6 deve explicar quando faltam parceiros, não fornecer desbloqueios silenciosos.
- Firebase Spark sem faturamento ativado como alvo inicial. Nenhuma credencial ou projeto inventado. Serviços online só são anunciados disponíveis após ativação real.
- Captura e sorteios são locais na campanha pessoal. Não apresentar esse saldo como economia competitiva validada por servidor.

## Inventário e evidências

- `research/campaign/asset-audit.json`: inventário local reproduzível por `node scripts/audit-campaign-assets.mjs`.
- `research/campaign/sprite-import.json`: resultado do importador `python scripts/import-campaign-sprites.py`, revisão SpriteCollab fixada, arquivos, hashes, falhas e validação geométrica.
- `docs/CAMPANHA-PRIMEIRA-VERSAO.md`: escopo confirmado e propostas do capítulo.

## Integração dos iniciais

Bulbasaur, Charmander e Squirtle registrados no motor por `public/custom/starters.js`, com dados em `starters-data.js`. Golpes reaproveitam implementações PB; os kits atuais são avançados e não representam learnsets de nível 5. Estatísticas verificadas no arquivo do Pokémon Showdown, com excerto preservado em `research/campaign/starter-source.txt`. PokeAPI retornou 403 e não forneceu dados nesta etapa. Testes em `test/campaign-starters.test.mjs`. Seleção do inicial na interface, novo perfil e campanha ainda não estão conectados.

## Atualização de validação — retomada 14/11/2026

- Escolha de inicial, migração, dez fases, encontros, captura e três banners já estão conectados ao controlador. Os estados “pendente” do plano inicial não descrevem mais a ausência de implementação.
- 41 testes completos passam. Novo teste percorre os estados de 1-1 a 1-10 com derrota, reload, repetição, recompensas e insígnia. Isso não equivale a jogar todo o capítulo na interface.
- Captura e três banners passaram pelos fluxos descritos em `research/validation/*-result.json`. Multitoque passou com eventos reais de toque emulado no Chromium.
- Balanceamento: 30 batalhas do motor, seed 73, ambos os lados automáticos; resultados em `research/validation/campaign-battles.json`. São uma amostra e mostram pontos difíceis, não um capítulo balanceado. Kits de abertura continuam pendentes de refinamento.
- APK atualizado gerado, sem aparelho ADB conectado para verificação nativa.
- Google/nuvem/amigos dependem da autenticação do proprietário; nenhum projeto Firebase criado nesta retomada.
- Uso sistemático do PB original: `docs/PB-REFERENCIA-PRINCIPAL.md`.
