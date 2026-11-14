# Investigação e reconstrução

## Skills usadas

- Reverse Engineer Anything: https://github.com/morluto/rea — skill em `/workspace/.agents/skills/reverse-engineer-anything/SKILL.md`.
- Impeccable: https://github.com/pbakaus/impeccable — skill em `/workspace/.agents/skills/impeccable/SKILL.md`.

Os repositórios estão em `/workspace/.agents/skill-sources/`; commits em `skill-versions.json`. Foram instaladas instruções no workspace, sem alterar a configuração global do Codex ou registrar um MCP indisponível nesta sessão. REA foi realmente executado pela CLI `rea-agents`; não é só uma referência metodológica.

## Evidência REA

Comando executado a partir de `/workspace`:

```sh
npx -y rea-agents@latest analyze-javascript-application /workspace/pb-port/public \
  --source-path app.js --source-path roster.js --source-path controls.js \
  --detail summary --evidence_output /workspace/pb-port/research/rea-client-evidence.json \
  --format json > /workspace/pb-port/research/rea-client-summary.json
```

Evidence principal: `ev_f6fb2dda2f5a0f292ed60b275fb7314b15f8df36a5b512a25c146fa86b351f19`.

SHA-256 do app.js analisado: `84e6657f8ec20f9bcca89dcc94caf9c389483bb31353df640e791e0d9bba9a10`.

O cliente foi analisado antes das alterações locais e antes da conclusão do inventário de assets. A Evidence preserva a identidade daquele snapshot, não da pasta final.

**Cobertura:** três arquivos selecionados, três parsings sem falha; 16 arquivos inventariados fora do escopo na ocasião. Grafo semântico parcial, com teto de 20.000 nós por arquivo atingido e 13.835 unknowns registrados. Não se concluiu ausência de recursos a partir dessa cobertura.

`rea-client-evidence.json` mantém o bundle completo (~41 MB). `rea-client-summary.json` preserva resumo e limitações; `rea-observed-endpoints.json` é uma extração mecânica das observações de endpoints, com IDs e localizações, do mesmo Evidence.

## Observações

1. **REA, estática:** o cliente contém chamadas fetch para `/api/version`, `/api/auth`, `/api/usage`, arquivos de roster e URLs parametrizadas de replay/player. Há construção de WebSocket com protocolo e host da página. Esses são fatos de sintaxe; não provam comportamento do servidor remoto.
2. **Inspeção de código pelo shell:** app.js processa `welcome`, `match`, `go`, `tick`, `end`; comandos incluem `hello`, `queue`, `ready`, `input`, `cancel`, `surrender`, `teams` e `board`. Em `tick`, inputs são agrupados pelo campo `at`; `upTo` limita o avanço local. Fontes originais preservadas em `original-app.js`.
3. **Inspeção de código pelo shell:** engine.bundle.js exporta `createBattle`, `stepRanked`, `makeHeadless`, `stateHash`, `loadRankedAssets`, `loadTrainers` e `loadArena`. Isso permitiu implementar um adaptador Node, preservando o motor em vez de inventar regras aproximadas.
4. **Inventário de arquivos:** 5.505 recursos enumerados, 5.495 locais. Dez metadados baked retornaram 404; as animações de fallback correspondentes foram baixadas. O inventário não demonstra completude de todo caminho dinâmico de renderização.
5. **Execução local:** testes simularam partidas completas 3v3/6v6, compararam o hash após 600 frames com a mesma seed, e exercitaram HTTP/WebSocket, fila, comando atribuído ao lado correto, desistência e resultado ranked. Veja `tests.txt`. Isso observa nosso port, não o serviço original.
6. **Impeccable:** contexto carregado; escolhida preservação do visual existente e correções limitadas de disponibilidade, acessibilidade e estado de erro. Detector das alterações iniciais retornou `[]`, em `impeccable-detect.json`. O resultado não é uma auditoria visual do jogo inteiro.

## Inferências e escolhas de implementação

- O protocolo visível permite um servidor independente com o mesmo motor e inputs por frame. A compatibilidade implementada foi corroborada pelos testes locais.
- Node + canvas nativo foi escolhido para simular o motor de navegador no servidor. Os acessos de imagem/fetch desse adaptador são restritos à pasta public; ele não chama a origem em runtime.
- Persistência JSON, fila em memória e token de perfil são escolhas deste port, não fatos recuperados do backend original.
- Desconexão conta como desistência nesta versão; a documentação original descreve comportamento diferente.

## Questões ainda abertas

- Compatibilidade visual e determinismo entre navegadores e canvas nativo não foram observados nesta sessão.
- Backend original, matchmaking, escalabilidade, prevenção de fraude e detalhes de todos os modos não foram recuperados.
- Recursos dinâmicos raros podem exigir novos assets; o manifesto não substitui testes de cenas.
- Render/browser QA não executado: a ferramenta `cua_repl.js` não está disponível. Não foi instalado outro navegador para contornar esse limite.

## Checklist da solicitação

| Parte | Estado |
|---|---|
| Baixar e usar REA/Impeccable | Concluído no workspace; REA CLI e detector executados |
| Encontrar documentação | Concluído: ajuda pública e docs/MECHANICS.md |
| Baixar assets públicos | Inventário concluído para recursos enumerados; caminhos dinâmicos seguem em aberto |
| Recriar backend ausente | Primeira versão funcional para treino/PvP 3v3/6v6 |
| Port de todos os modos | Parcial; limites explícitos no README |
| Validar render no navegador | Pendente por indisponibilidade da ferramenta |
