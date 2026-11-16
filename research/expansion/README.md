# Expansão nacional — 15/11/2026

## Fontes e destino
- Acervo completo clonado: `/home/bloody/Projetos/SpriteCollab` (clone raso, todos os arquivos atuais; histórico anterior não baixado).
- Revisão confirmada: `12c53e6a1b84378a3545fce42e6a9b27c64fd189`.
- Projeto: `/home/bloody/Projetos/pb-port`. Alterações apenas locais, sem commit/push/release/instalação nesta rodada.
- 676 novas espécies canônicas; catálogo passou de 296 para 972 entradas (inclui as formas/customizados anteriormente existentes; não significa 972 números únicos da National Dex).
- Originais completos de animação, offsets, sombras, retrato Normal e créditos. Assets locais em public/assets; dados novos em public/custom/expansion-data.js, pulse/expansion-learnsets.js e pulse/expansion-rules.js.
- Atributos/tipos/pesos e learnsets do PrismaDex; habilidades preferenciais da cópia de Pokémon Showdown já existente. Somente golpes já implementados no PB, aprendidos por nível ou TM no mesmo version group. Sem inventar golpes por semelhança de tipo.
- Habilidades ligadas ao adaptador nativo de habilidades do PB. Isso reaproveita os efeitos que o PB implementa; não implementa automaticamente habilidades exclusivas ainda ausentes do motor.

## Aquisição e evolução
- Novo banner `national` / Horizontes Pokémon, selecionável no seletor de invocação. 500 formas base/estágio único reconhecidas no catálogo nacional.
- Três banners anteriores conservam seus pools/raridades; novas raridades só se aplicam às espécies adicionadas. Lendários UR; míticos SSS. Sem mudança nas taxas, moedas ou preços.
- 280 regras canônicas de evolução incondicional por nível reconhecidas (inclui regras já existentes); regras anteriores prevalecem. Pedras existentes reutilizadas para métodos exatos compatíveis.
- Amizade, horário, gênero, troca, movimentos exigidos, condições regionais e ramificações não foram transformados em níveis inventados: listados em evolution-review.json. Nem toda espécie final cadastrada já tem um caminho de obtenção implementado.
- 67 candidatos não entraram: 59 sem sprite/retrato canônico e 8 sem golpe de nível implementado na versão selecionada. Ver import-report.json.

## Preservação e verificação
- SHA256 semântico das 296 definições anteriores comparado: nenhuma alterada pelo importador. Baseline registrado em baseline-species.json.
- Trabalho simultâneo do muse.ai em missões/UI/progressão preservado. Hooks pequenos e aditivos; não regenerar app.js/growth.js/progression.js a partir do Git.
- Arquivos/learnsets/animações essenciais de todas as 676 espécies conferidos por teste.
- Motor reconhece todas as 676 e resolve seus golpes. Carregamento real das animações de 24 amostras e batalha Riolu × Larvitar, 600 frames no Chromium: runtime-result.json.
- Teste preexistente do Ferunoga exige que o bot use Flamethrower contra Charizard; falha também com a expansão desativada em memória. Não alterado, pois PB permanece pausado. Logs da reprodução em validation-logs/.
- APK já instalado anteriormente não foi atualizado nesta rodada; as alterações estão no código local para a próxima compilação.

## Scripts
- `scripts/expand-pulse-species.py`: importação aditiva/reexecutável. Usa clone local e revisão fixada; deve ser executado com o clone na revisão indicada.
- `scripts/build-pulse-expansion-rules.py`: gera regras nacionais com condições estritas.
- `scripts/integrate-pulse-expansion.py`: hooks pontuais; recusa âncoras alteradas por edição concorrente.
- `scripts/qa-pulse-expansion.cjs`: motor no Chromium (caminhos locais de Playwright/Chromium).
- `test/pulse-expansion.test.mjs`: valida catálogo, arquivos, golpes, banner e regras.

## Suíte final
```
ℹ tests 172
ℹ pass 171
ℹ fail 1
```
Única falha: expectativa de uso de Flamethrower pelo bot Ferunoga, reproduzida com EXPANSION_SPECIES esvaziado apenas em memória (sem alterar arquivos). Nova expansão e banners aprovados. Testes rodaram sobre checkout em edição simultânea pelo muse.ai; não constitui release congelada.
