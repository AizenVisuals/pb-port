# PB original como base do PULSE ARENA

Pedido do usuário: reaproveitar cada parte disponível do PB original, sem substituir suas batalhas por aproximações. Fonte pública: https://ranked.pokemonbattlegrounds.com/.

## Inventário verificado em 14/11/2026

`node scripts/audit-pb-reuse.mjs` compara o snapshot preservado com os arquivos locais e gera `research/pb-reuse-audit.json`.

- 5.505 recursos enumerados, 5.495 presentes. Dez metadados `baked2/*.json` constavam como 404 na coleta original; folhas de animação alternativas estão no snapshot. Isso não prova cobertura de todo caminho dinâmico.
- Dois arquivos do inventário foram alterados localmente: conferir os hashes no relatório antes de qualquer atualização. Não sobrescrever mudanças do PULSE com downloads.
- Diretórios atuais: 1.842 arquivos de sprites, 455 retratos, 73 arquivos de treinadores, 52 NPCs, 10 efeitos e 1.410 efeitos sonoros. Incluem extensões locais e metadados; estas contagens não significam espécies ou funcionalidades prontas.

## Integração e continuidade

| Parte do PB | Uso no PULSE / próximo trabalho |
|---|---|
| Motor, colisões, dano, tipos, estados, IA, golpes e Mega | Motor PB usado diretamente por `pulse/battle.js`; preservar a implementação. |
| Render, folhas de animação, efeitos e arenas | Render PB usado diretamente; validar cenas e recursos dinâmicos durante as partidas. |
| Sons, música e gritos | `audio.js` do PB ligado às batalhas; controles de menu específicos do PULSE. |
| Controles de batalha | Preservar comandos do motor; multitoque do PULSE usa ponteiro independente por dedo. Mapeamento de controles/gamepad do PB ainda precisa ser integrado ao shell PULSE. |
| Treinadores e aparência | Recursos originais disponíveis; retratos PrismaDex complementam a campanha. Não confundir retrato estático com sprite direcional de batalha. |
| Coleção, equipes e golpes | Seleção do PULSE ligada ao catálogo PB; equipe e aquisição persistem localmente. |
| Configurações, câmera calma e gráficos | Opções do cliente PB são referência para integração; não anunciar todas disponíveis no PULSE. |
| Amigos, salas privadas, ranking e reconexão | Cliente público não inclui o backend original. Implementar serviços próprios e testar; não apontar o PULSE ao serviço original. |
| Replays, histórico, compartilhamento e estatísticas | Código público é referência de integração; ainda precisam de caminhos próprios de persistência/execução no PULSE. |
| Battle Tower, torneios, Grid e outros formatos | Inventariados na interface pública; não implementados no PULSE. Integrar em etapas após fechar a jornada inicial. |

Campanha, escolha de inicial, captura, gacha e loja são a camada de progressão do PULSE. O reaproveitamento do PB deve sustentar essa camada, preservando o save e a identidade visual aprovados.

Os sistemas online dependem de identidade/backend próprios. Os créditos e a origem dos assets permanecem nos manifestos; arquivos baixados não são arte autoral do projeto.
