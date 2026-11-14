# Contrato do backend local

Este documento especifica a implementação atual, não o backend original.

HTTP: arquivos estáticos sob public; `/api/auth` anuncia convidados; `/api/version` seleciona o motor local; `/api/health` informa prontidão. Arquivos fora de public não são servidos.

WebSocket na raiz, JSON UTF-8, payload máximo de 64 KiB e até 90 mensagens por segundo por conexão.

| Entrada | Saída/efeito |
|---|---|
| hello {name,trainer,token?} | welcome com token, perfil e ladders; perfil persistido |
| queue {format,mode,team,arena?,level?,random?} | queued para esperar PvP; match quando há par ou treino |
| cancel | remove fila e envia unqueued |
| ready {id} | após todos os humanos prontos, go com startIn=1000 |
| input {kind,...} | atribui side no servidor e at ao próximo frame; transmissão em tick |
| surrender | encerra com vencedor oposto, envia end e persiste resultado |
| teams {teams,saved,at} | persiste equipes do perfil |
| profile {name,trainer} | atualiza perfil e responde profile |
| board {format} | placar local ordenado por pontos |
| history | histórico local, sem replay |

Formatos: 3v3 e 6v6. Modos: practice, casual e ranked. A equipe precisa ter exatamente 3/6 espécies distintas reconhecidas pelo motor. Golpes são normalizados pelas opções legais do motor. Somente o servidor define lado, frame, resultado e pontos.

Simulação: 60 passos por segundo, lotes transmitidos a cada 50 ms, até 12 passos por lote para evitar travamento de um ciclo. Inputs futuros são preservados. O cliente avança até upTo com os mesmos comandos e seed. A simulação no servidor decide o vencedor. Hashes recebidos do cliente ainda não acionam recuperação de divergência.

Erros de validação retornam `{t:"error",msg}`. Falha ao carregar assets cancela o início. Espera de carregamento expira em 60 segundos. Falha durante simulação envia cut e não conta resultado. Desconexão humana conta como desistência. Não há retomada de partida, múltiplos processos ou migração de estado em memória.
