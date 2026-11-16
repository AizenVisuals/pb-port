# PB — trabalho pausado a pedido do usuário

Data:15/11/2026. Não continuar implementação, testes ou publicação até novo pedido.

## O que foi feito no PB

- Quatro personagens finais: Ferunoga, Hawajaku, Kyasupada e Eereon; Mega Absol Z pela transformação do Absol. Mega Marshadow Z foi cancelado pelo usuário, preservando a forma anterior.
- Sprites com ciclos de caminhada separados. Usuário considerou o movimento estranho; refinamento visual ainda pendente.
- Retratos refeitos por recorte das referências, aprovados pelo usuário. Eereon estudado com Umbreon/Espeon/Sylveon. Luz branca do Absol preservada. Exportação128px, sem filtro extra de pixelização.
- Multitoque e gamepad: propriedade do ponteiro por analógico, neutralização em desconexão, padrão L2 defesa/R2 esquiva. Testes com toque via Chromium e DualSense virtual passaram; Bluetooth físico não foi validado.
- Salas privadas3v3/6v6 por código, equipes/pronto, placar e partidas sem ranking. Sem espectadores.
- Planejador de golpes do APK trazido para bots do PB, no cliente e servidor: eficácia, atributos, alcance, recarga e cura. Verificação determinística2500quadros passou.

## Ponto exato da interrupção

Pedido mais recente: MAIS GOLPES PARA ESCOLHER, não aumentar alcance/área; ajustar Eereon em relação ao chão.

Commit08882f7 implementou pools ampliados e compensação visual do hover de Eereon, mas a primeira tentativa de publicar FALHOU: o gerador pegou Ember como pulseBasics:Ember, exclusivo do APK. O deploy restaurou automaticamente a release anterior20261115-ai-portraits. Não afirmar que a ampliação já está pública.

Correção local concluída após esse commit:
- Gerador agora lê research/fan-pack/native-moves.json, extraído do roster do PB original.
- Pools finais válidos no PB: Ferunoga12, Hawajaku14, Kyasupada16, Eereon14. Cada equipe continua escolhendo4; defaults anteriores preservados. Absol já tinha lista ampla.
- Eereon mantém Levitate e imunidade Terra. spriteGroundOffset5 compensa somente desenho, limitado ao z atual para não afundar no nascimento. Física/hitbox não alteradas.
- Release corrigida preparada em /home/bloody/.local/share/pb-selfhost/releases/20261115-move-pools-ground-v2 . Carregamento de quatro kits adicionais e1000passos por personagem passaram no motor dessa release.
- Suíte completa69testes passou antes da última correção do catálogo;4 testes direcionados passaram depois da correção. Não declarar suíte completa repetida após essa correção.
- Correção do catálogo ainda NÃO commitada/publicada. Cópias PB-only em research/pb-paused/snapshot/; não aplicar patch cegamente.

## Estado verificado ao pausar

Branch fan-pack-public; HEAD38bddcba06b351766eda74acf40b83e0436bcd66 contém commits posteriores de PULSE feitos por outro trabalho. Há várias alterações concorrentes no projeto; preservar todas. Não usar git reset/checkout amplo, não incluir alterações PULSE em commit do PB.

Porta3015 não respondeu na conferência. PID registrado698776 já não existe. Tunnel cloudflared188592 continua apontando para3015, mas processo de túnel não prova site funcional. Não reiniciei nem desliguei serviços ao pausar.

DATA_DIR privado: /home/bloody/.local/share/pb-selfhost/data . Backups privados em /home/bloody/.local/share/pb-selfhost/backups . Não copiar perfis/tokens para Git.

## Retomada

1. Ler este arquivo e conferir diff/branch/concorrrência atuais.
2. Revisar e versionar APENAS a correção nativa do catálogo e seus arquivos de dados. Conferir se roster.json recebeu mudanças de outro trabalho antes de tocá-lo.
3. Revalidar release20261115-move-pools-ground-v2, alinhamento visual Eereon e seleção dos novos golpes no navegador.
4. Se autorizado retomar publicação, verificar serviços reais, configurar deploy-local.py para a release-v2 correta, preservar DATA_DIR, fazer backup e iniciar/trocar somente sem partidas ativas. O script ainda aponta para a tentativa anterior falha, não rodar sem revisão.
5. Conferir saúde e fluxo pelo túnel, depois registrar publicação. APK e Render/main fora deste escopo.

Demais funções faltantes: research/pb-controls/PARITY.md. Amigos persistentes, replays, torneios, Tower, estatísticas e modos avançados não foram concluídos. Não tratar telas existentes como funcionalidades de servidor prontas.
