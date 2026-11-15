# PB original versus servidor próprio

Fonte consultada em2026-11-15: https://ranked.pokemonbattlegrounds.com/ . A presença no menu comprova a interface, não o funcionamento interno do serviço original.

| Recurso | Situação local |
|---|---|
| PvP3v3/6v6, treino, equipes salvas, ranking e histórico | Já existem; histórico sem replay |
| Salas privadas por código, equipe e pronto, revanche sem ranking | Implementadas nesta atualização; sem espectadores |
| Toque simultâneo e controle PlayStation | Correções e testes automatizados; Bluetooth físico ainda não validado |
| Amigos e convites individuais | Pendentes |
| Replays e exportação de vídeo | Pendentes no servidor |
| Torneios e chaveamento | Pendentes |
| Battle Tower e Tickets | Backend/progressão pendentes; botões permanecem ocultos |
| PB Grid e votação | Pendentes |
| Estatísticas de uso, domínio por Pokémon, troféus e cosméticos | Backend persistente pendente |
| Doubles, Tag, Pick4, Royale e espectadores | Protocolo e simulação multijogador pendentes |
| Login de terceiros e sincronização entre aparelhos | Servidor usa perfil local por token; não equivale ao login original |

Não habilitar botões apenas porque o cliente tem a tela. Cada função precisa de protocolo próprio, persistência quando aplicável e teste do fluxo completo. Não transportar contas, ranking ou dados privados do serviço original.
