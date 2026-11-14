# Marshadow — balanceamento inicial v1

Espécie 802, geração VII, Fighting/Ghost, habilidade Technician. Base stats canônicos: HP 90, Attack 125, Defense 80, Sp. Atk 90, Sp. Def 90, Speed 125. Peso 22,2 kg. Fontes: https://pokemondb.net/pokedex/marshadow e https://bulbapedia.bulbagarden.net/wiki/Marshadow . Estratégia consultada como contexto, sem importar seus resultados para este motor: https://www.smogon.com/articles/ubers-spotlight-marshadow .

## Kit e contrapontos

| Golpe | Poder | Cooldown | Papel |
|---|---:|---:|---|
| Spectral Thief | 90 | 8 s | Lunge de sombra, preparação de 24 frames; rouba até 2 estágios positivos totais após causar dano |
| Shadow Sneak | 40 | 5 s | Finalização/mobilidade, fortalecido por Technician |
| Close Combat | 120 | 9 s | Explosão de dano; preserva as reduções de Defense/Sp. Def do golpe existente |
| Ice Punch | 75 | 4 s | Cobertura com animação existente |
| Mach Punch (alternativa) | 40 | 4 s | Pressão curta com Technician |
| Shadow Punch (alternativa) | 60 | 4,5 s | Consistência de acerto com Technician |

Spectral Thief é uma adaptação para combate em tempo real: o original rouba todos os aumentos antes de atacar, mas esta implementação limita o roubo a 2 estágios totais após um acerto que cause dano. Não copia reduções, não ultrapassa +6 e não rouba ao errar ou causar zero de dano. O atacante fica vulnerável durante a preparação e a investida; não ganha invulnerabilidade nesse golpe. A investida tem alcance limitado, preparação e recuperação. As animações e o áudio dos outros golpes reutilizam implementações existentes do motor, com cooldowns próprios.

Sem mega, Z-Move, cura ou setup no conjunto inicial. Atributos não foram inflados. A habilidade Technician é a implementação existente do motor, sem multiplicador adicional duplicado.

## Amostra de balanceamento

`node --expose-gc scripts/balance-marshadow.mjs`

48 duelos 1v1 com bots nível 3, quatro seeds e ambos os lados na mesma arena. 24 vitórias (50%). Lucario: 8/8; Metagross: 2/8; Greninja: 5/8; Gardevoir: 2/8; Togekiss: 0/8; Gengar: 7/8. Dois nomes opcionais da lista não existem com aquelas chaves no roster e foram ignorados; resultados JSON registram somente duelos executados.

Esse pequeno conjunto foi usado como smoke test de balanceamento, não como estimativa estatística de win rate em ranked. PvP, troca de equipes, controle manual, variedade de arenas e aprendizagem dos jogadores podem mudar muito os resultados. Não é possível garantir que um Pokémon seja meta por implementação; o objetivo desta versão é uma opção competitiva com counters claros.

## Assets e integração

Folhas de sprites autoradas do SpriteCollab, oito direções e 36 animações nomeadas, retratos Normal/Determined/Pain. Créditos públicos em /credits.html; proveniência em research/MARSHADOW-ASSETS.md. Não são sprites genéricos de outra espécie.

O módulo public/custom/marshadow.js registra a espécie nos catálogos de render, combate e seleção. O bundle original recebe somente um ponto de extensão no final. Os dados também constam em roster.json para o construtor de equipes. Servidor e cliente carregam o mesmo registro e golpes. Nenhuma espécie existente recebe alterações de atributos ou de golpes.
