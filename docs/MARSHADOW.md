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


## Mega Marshadow fan-made e expansão v2

Mega Marshadow é uma forma ORIGINAL DESTE SERVIDOR, inspirada na referência visual fornecida pelo usuário, não uma espécie/formato oficial da franquia. Escolha Mega Evolve no seletor de gimmick para Marshadow e use o botão na batalha. Apenas uma Mega por batalha, preservando quatro golpes selecionados e sem restaurar HP.

Atributos base da Mega: HP 90, Attack 145, Defense 95, Sp. Atk 135, Sp. Def 110, Speed 125 (700 total). Technician permanece a única habilidade; Speed e HP não aumentam. O ganho especial abre builds com Hex sem duplicar o bônus de Technician, que não se aplica a Hex (65), Fire Punch (75) ou Drain Punch (75).

O pool foi ampliado para 28 golpes. Novos: Fire Punch, Thunder Punch, Drain Punch, Hex, Will-O-Wisp, Poison Jab, Stone Edge, Rock Slide, Knock Off, Shadow Ball, Focus Blast, Iron Head, Force Palm, Low Kick, Brick Break, Shadow Claw, Acrobatics, Protect, Substitute, Agility, Toxic e Bulk Up. Só quatro ficam ativos na equipe. Hex consta do learnset oficial de Sword/Shield (TM77); o motor PB utiliza seu multiplicador adaptado para status. Mach Punch, herdado da v1, é explicitamente rotulado como adaptação do servidor porque não consta dos learnsets Gen7/8 consultados. Veja research/MARSHADOW-LEARNSET.md.

Cooldowns conservadores de cobertura: socos elementais 4s, Drain Punch 7s, Hex 8s, Will-O-Wisp 7s, Stone Edge 6s, Focus Blast 8s e Bulk Up 15s. Bulk Up aumenta Attack/Defense em um estágio e herda o limite de duas utilizações por permanência do motor. Drain Punch cura em função do dano e NÃO herda limite de duas curas; seu cooldown maior é intencional. Protect, Substitute e Agility preservam regras existentes do motor.

O visual descartado de uma camada de chamas sobre o corpo normal não foi publicado. A versão final usa sprites completos gerados para repouso e ataque, em oito direções, com rosto integrado ao capuz, olhos laranja, marcas vermelhas, braços e prolongamentos de chama verde/amarelo. As duas sequências são adaptadas aos tempos dos estados do motor e usam âncoras próprias; não são 36 novas animações desenhadas à mão. Em dano, carga e movimento, o motor reutiliza poses e transformações dessas sequências; em Faint o sprite esmaece. Créditos e proveniência estão em /credits.html e research/MEGA-MARSHADOW-ART.json.

Amostra inicial Mega vs outras Megas: 23 vitórias em 48 duelos de bots nível 3, quatro seeds e ambos os lados. Charizard 3/8, Gardevoir 3/8, Metagross 1/8, Blastoise 5/8, Venusaur 4/8, Gengar 7/8. Isso é um smoke test de equilíbrio, não uma estimativa de ranked. JSON completo em research/marshadow-mega-balance.json. O mesmo pool de quatro golpes iniciais foi usado em todos os confrontos; não se avaliou cada combinação dos 28 golpes.

### Carregamento dos sprites

A Mega é entregue em folhas pré-processadas em `public/baked2/0802mega/`, com metadados de offsets próprios e células 64×64. O runtime carrega esses PNGs diretamente. `node scripts/bake-mega-marshadow.mjs` reproduz o pré-processamento a partir dos atlases gerados; não é necessário gerar as folhas na inicialização de cada servidor. Isso reduz as alocações transitórias de imagens durante o carregamento.
