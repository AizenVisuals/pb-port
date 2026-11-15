# Personagens convidados para o PB

Escopo final: somente PB de combate no servidor público. Sem alterações no APK, main ou Render. Mega Marshadow Z foi um engano corrigido pelo usuário; Marshadow e sua Mega existente permanecem iguais.

## Personagens jogáveis

| Personagem | Tipos | Papel | Atributos base HP/Atk/Def/SpA/SpD/Spe | Habilidade |
|---|---|---|---|---|
| Ferunoga | Fogo/Sombrio | Ataque especial e cobertura | 88/72/85/117/85/83 | Blaze |
| Hawajaku | Planta/Voador | Drenagem e pressão aérea | 85/75/82/105/103/80 | Overgrow |
| Kyasupada | Água/Aço | Ataque físico e preparação | 76/108/90/70/82/104 | Torrent |
| Eereon | Fantasma | Status, sustentação e ataque especial | 95/60/75/105/110/80 | Levitate |
| Mega Absol Z | Sombrio/Fantasma | Cortes e alta velocidade, baixa defesa | 65/154/60/75/60/151 | Sharpness |

Os quatro convidados têm fichas propostas para PB, sem alegação de atributos canônicos da criadora. Mega Absol Z mantém os dados oficiais. Os três iniciais são de E/ (@Loca_ruchem), conforme confirmação do usuário; Eereon é de Harlequinwaffles. Ver RESEARCH.md para fontes e limites.

Nesta entrega entram as formas finais. Os estágios anteriores são referências de identidade das linhas, não personagens adicionais já implementados. Cada final tem quatro golpes com a implementação original do golpe homônimo no PB. Nenhum golpe foi apenas renomeado para imitar outro.

## Arte e integração

Cinco atlas gerados por ImageGen nativo a partir das referências, com 8 direções e 4 poses, convertidos em animações de duração compatível com o motor. Cada personagem usa duas poses de repouso e duas de ataque. Após a correção da rigidez apontada pelo usuário, Walk usa um ciclo separado em oito direções: quatro poses por direção nos quadrúpedes e bípedes, seis na serpente. Referências de movimento: Absol, Umbreon, Arbok, Blaziken e Gallade. As outras sequências ainda reaproveitam poses de repouso/ataque; não são 41 animações desenhadas independentemente. Manifesto e prompts em art-manifest.json e art/.

As sprites são adaptações novas; as folhas de referência e a autoria dos conceitos não devem ser confundidas com a autoria das sprites geradas. Não reutilizar rascunhos rejeitados de outros projetos.

Mega Absol Z usa a seleção de Absol e a mecânica Mega existente: uma transformação, sem cura, preservando golpes escolhidos. O registro megaAbility precisa ser Sharpness, pois o motor cria uma espécie de batalha intermediária a partir do catálogo.

## Publicação

scripts/package-pb-fan.mjs aplica somente este pacote a uma release do PB original; não copia a interface ou progressão PULSE. Dados de jogadores ficam fora da release e do Git. Troca do processo somente sem jogadores/partidas, mantendo túnel e release anterior.
