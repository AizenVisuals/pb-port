# PB — port com servidor próprio

Primeira versão executável do cliente público de PB Ranked com backend Node independente. O servidor original não é usado para contas nem partidas. Código do backend reconstruído nesta pasta; cliente, motor e recursos preservam sua origem.

## Rodar

Requer Node 24.22.1 ou compatível com as dependências.

```sh
cd /workspace/pb-port
npm ci
npm start
```

Abra `http://localhost:3000`. Digite seu nome, monte uma equipe completa e escolha **Practice vs bot**. Para PvP, use dois navegadores/perfis distintos, com nomes distintos, e procure partida no mesmo modo e formato. Uma única sessão de navegador por perfil evita duas abas controlando a mesma conta.

`PORT=3001 npm start` muda a porta. `DATA_DIR=/caminho npm start` muda a pasta de perfis. Por padrão, perfis, equipes, resultados e placar ficam em `data/players.json`. O token fica no navegador: limpar o armazenamento remove o acesso ao perfil. Não há recuperação de conta ou OAuth nesta versão.

## Implementado

- Cliente e motor de combate públicos servidos localmente, incluindo recursos visuais e áudio enumerados.
- Backend próprio com simulação autoritativa no Node, usando adaptador de canvas nativo.
- Treino contra bot, dificuldades 1–5, equipes 3v3 e 6v6.
- Fila PvP nos modos ranked e casual, confirmação de carregamento e transmissão dos comandos por frame.
- Controle manual, ataques, esquiva, guarda, troca, megaevolução pelo motor existente.
- Perfis locais, equipes salvas, ranking e histórico de resultados persistidos.
- Validação de equipes, identidade do lado atribuída pelo servidor, limite de mensagens e isolamento dos arquivos servidos.

## Limites desta versão

- Não é um port integral de todos os modos. Salas por convite, torneios, doubles/tag/pick4, torre, loja, conquistas, cartas de jogador, replays e retomada de partida após desconexão não estão implementados. Os principais atalhos desses modos estão ocultos; recursos secundários podem responder que ainda não estão disponíveis.
- A desconexão encerra a partida como desistência. Isso difere do original, que mantém a equipe lutando.
- A fila PvP espera outro jogador; não preenche com bot. Para jogar sozinho, use treino.
- O token identifica o perfil local. Não houve endurecimento para operação pública em escala, conta federada ou recuperação de conta.
- A análise REA foi estática e parcial; não equivale a conhecer o backend original.
- Testes HTTP/WebSocket e simulação estão disponíveis. Não foi possível validar o render no navegador nesta sessão: a ferramenta de navegador do ambiente não está disponível.
- Assets não encontrados continuam registrados no inventário. Não foram inventados sprites nem declarada completude de todas as cenas dinâmicas.

## Docker

```sh
docker build -t pb-port .
docker run --rm -p 3000:3000 -v pb-port-data:/data pb-port
```

O runtime usa somente os arquivos locais. O script de download é uma etapa separada e só precisa da origem para atualizar recursos.

## Verificar e atualizar os assets

```sh
npm test
python scripts/download-assets.py --max-mb 150 --workers 6
```

Veja [inventário](research/ASSETS.md), [manifesto com hashes](research/assets-manifest.json), [mecânicas](docs/MECHANICS.md) e [investigação REA](research/FINDINGS.md).

Os recursos baixados continuam sendo de seus respectivos autores. O download e este backend não estabelecem uma nova licença sobre o jogo ou Pokémon. A origem de cada recurso enumerado está no manifesto; arquivos originais alterados estão preservados em `research/original-*`.
