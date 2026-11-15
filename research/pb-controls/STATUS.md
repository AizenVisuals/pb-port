# Controles, retratos e salas privadas

Publicado na release20261115-controls-portraits-rooms; túnel e DATA_DIR preservados. Backup privado e release anterior disponíveis. APK/main/Render não alterados.

- Cinco retratos de rosto40x40, gerados por ImageGen nativo e convertidos para a resolução do jogo. Fontes em public/assets/fx/fan-pack/*-portrait.png; montagem de inspeção portraits.png.
- Analógicos por toque mantêm um pointerId exclusivo. Arena não assume toque do pad. Pointer cancel/lost capture e perda de foco encerram a direção. Touch-action none nos controles evita pan/zoom do navegador.
- Gamepad: zona morta0.2; desconexão envia direção neutra; analógico ativa modo manual; L2 defesa/R2 esquiva/L3 troca selecionada no mapeamento padrão. Bindings personalizados existentes preservados.
- Salas privadas3v3/6v6: criar/entrar pelo código ou link, anfitrião escolhe formato/arena, equipes validadas, ambos prontos, batalha sem pontos de ranking e placar de revanche. Sem espectadores nesta versão. Salas em memória, perfis no DATA_DIR.

Verificação:68 testes Node passaram, incluindo partida real entre dois clientes em sala, autorização do anfitrião, sala cheia e ausência de alteração no ranking. Chromium: criar/entrar pela UI sem erros; CDP com dois toques reais de navegador mantém direção durante golpe e após soltar o segundo dedo. Gamepad virtual DualSense: analógico+quatro botões, símbolos PS, neutralização ao desconectar. Controle PS5 físico/Bluetooth não foi testado.

Publicação: saúde pública OK; hashes dos quatro arquivos de controles e cinco retratos conferidos pelo túnel. Paridade restante descrita em PARITY.md. Não considerar equivalência completa com o serviço original.
