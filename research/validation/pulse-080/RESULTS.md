# Evidências da revisão PULSE0.8 — 15/11/2026

- Suíte principal:149 testes passaram (`node --test test/*.test.mjs`).
- Servidor:27 testes passaram, incluindo isolamento de admin, login com assinatura RS256 de fixture, autorização revogável, configuração, auditoria e vínculo de convidado.
- XP/status após a correção de render:11 testes passaram; nocaute real atualiza atributos/nível e completa evolução no mesmo combate.
- Chromium, dois contextos independentes: lados0/1, Lv100, entradas de ambos, mesmos estados em dezenas de frames comuns; partida natural concluída e +20/0 confirmados. Teste separado de desistência também passou.
- Fallback bot: relógio controlado no servidor de teste confirma ausência antes120s/presença depois120s; partida natural termina e dá+10 na vitória, ranking da campanha preservado.
- Multitoque via eventos de toque Chromium: analógico permanece ativo ao pressionar/soltar golpe e guarda com outro dedo; para somente quando seu próprio dedo solta. Gamepad3 testes de mapeamento padrão/DualSense passam. Sem controle físico nesta sessão.
- UI844×390: mochila abre janela, equipa berry; formação abre ações e fecha ao ir ao parceiro; campanha abre preparação de fase; Arena carrega50, seleciona3, entra/sai da fila e abre ranking. Sem erros de página observados. HUD também conferida800×360 e1280×576.
- Render nativo: Toxic aplicado pelo motor e frase `FOI GRAVEMENTE ENVENENADO!` capturada efetivamente em fillText do canvas, não somente presente no estado. Captura `../apk-native-poison-feedback.png`.
- Portal: fixture Google assinada no teste abre administração; F5 restaura sessão; sair +F5 permanece desconectado. Entrada Google REAL e abertura do painel confirmadas pelo usuário no portal público. Correção de F5 posterior testada no navegador com fixture.
- APK0.8.0-test.1 compilado com Java21/SDK36. Assinatura v2 verificada; arquivos essenciais presentes e sem banco/segredo de servidor no ZIP. Verificar hash final anexado à release.
- Sem aparelho ADB disponível e sem AVD instalado: não houve execução física do APK nem teste Bluetooth real. A compilação não substitui esse teste.

As verificações aceleradas de PvP/bot usam clock injetado apenas no servidor de teste; o serviço real continua com120s e relógio real.

- Fluxo Arena pelo app completo também passou: seleção/fila/PvP/resultados/retorno, com comparação de XP/inventário/moedas antes/depois.
- SHA1 do APK conferido contra os certificados registrados no aplicativo Android do Firebase: corresponde.
