# Mecânicas — referência pública

Fonte primária: painel **How battles work** de https://ranked.pokemonbattlegrounds.com/, consultado em 14/11/2026. O HTML obtido está em `research/original-index.html`. Os parâmetros abaixo documentam a ajuda pública, não observação experimental de cada efeito.

- Combate em tempo real. Auto controla deslocamento e ataques; no modo manual, o jogador dirige e chama os golpes.
- Quatro golpes, com cooldown individual e alcance. Uma chamada aguarda o ataque em execução terminar.
- Esquiva manual: dash na direção de movimento, a cada 1,5 segundo.
- Guarda: janela de 0,5 segundo; interceptar reduz o dano em 65%. Em manual, acertar libera nova guarda; errar exige 3 segundos. Auto espera 3 segundos em ambos os casos.
- Cura: 30% da vida máxima, duas vezes por Pokémon por batalha. Aumentos de atributos: duas utilizações por permanência em campo, reiniciando ao trocar.
- Protect começa em 7 segundos de espera, adicionando 3 por uso; trocar reinicia a espera.
- Uma megaevolução/Battle Bond por batalha.
- Limite de 4 minutos no 3v3 e 7 minutos no 6v6. No último quarto, o dano aumenta progressivamente até 4×. Ao acabar o tempo, vence a equipe com mais vida restante.
- Dano físico usa Attack/Defense; especial usa Sp. Atk/Sp. Def. STAB: 1,5×. Crítico: chance de 1/20, multiplicador de 1,5×.
- Speed altera deslocamento e chance de esquiva automática, aproximadamente Speed/260; não reduz cooldown.
- Acerto depende de trajetória, posição e esquiva. Golpes explicitamente inevitáveis sempre acertam. Evasão cria decoys.
- Aumentos de atributos persistem até a troca; +1 corresponde a 1,5×, +2 a 2×.
- Clima dura 15 segundos. Chuva fortalece Água e enfraquece Fogo; sol inverte. Areia e granizo causam dano a cada 3 segundos.
- Burn causa dano a cada 3 segundos e reduz dano físico pela metade. Poison/Toxic causam dano periódico, crescente no Toxic. Paralysis reduz deslocamento aproximadamente pela metade e impede 1/5 dos golpes. Sleep dura de 2,5 a 5 segundos.

O port reutiliza o motor público para essas regras. Não reconstruímos uma fórmula aproximada de dano. Detalhes não explicitados na ajuda devem ser verificados no motor e por testes específicos antes de documentá-los como fatos.
