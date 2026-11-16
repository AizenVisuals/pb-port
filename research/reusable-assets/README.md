# reusable-assets — proveniência e staging

Pesquisa de 15/11/2026 para o redesign de layout do PULSE ARENA.
O ícone de disco Tabler abaixo está integrado às TMs. Os demais assets desta pasta continuam sem integração; revisar licença e proveniência antes de usá-los. Relatório completo:
`~/workspace/pulse-arena-game-design-research.md` (na VM do Kage).

## Conteúdo

### Ícone de disco para TMs
- Integrado em `public/pulse/assets/ui-tm-disc.svg` para diferenciar itens TM dos tickets de TM.
- Fonte: Tabler Icons, `icons/outline/disc.svg`, commit `4581ad20d8d13e24f6c3be75caaea1c4ad6c4b35`.
- Licença MIT; texto completo arquivado em `LICENSE-tabler-icons.txt`.
- SHA-256 do SVG integrado: `bdcb3982318f62cb5252e765497eb987a0336b2692b86e19e1885464cdba9905`.
- Alteração local: traço dourado `#c88834` para o acento dos itens no inventário.

### eeveeexpo/biggusweeabus/type-icons-686/ (3 PNGs, 64x558 cada)
Type icons estilo Sword/Shield por BiggusWeeabus (EeveeExpo recurso 686, 26/05/2021).
3 versões: Sw/Sh, Pokémon Masters, TCG (ordem postada na página; confirmar qual é qual
pelo glifo ao integrar). 18 tipos + `???` + Shadow. Créditos: VentZX (originais),
Lichenprincess (polimento + Masters/TCG), Persephone (Shadow).
Uso: pílulas de tipo nos botões de golpe e nos cards.
Fonte: https://eeveeexpo.com/resources/686/

### eeveeexpo/biggusweeabus/pokedex-type-icons-696/ (2 PNGs)
Type icons estilo Pokédex Sw/Sh por BiggusWeeabus (recurso 696, 02/06/2021).
`069ZslW.png` 96x608, `W0QoyAS.png` 100x608 (19 fileiras x 32px, nomes por extenso).
Uso: coluna de tipos nos cards da coleção/loja.
Fonte: https://eeveeexpo.com/resources/696/

### pokesprite/ (MIT — ver LICENSE-pokesprite.md)
Mega Stones clássicas (Gen 6/7) do PokéSprite (msikma/pokesprite).
- `items-mega-stone/`: 47 PNGs 32x32 (abomasite … venusaurite, incl. charizardite-x/y,
  mewtwonite-x/y). Rayquaza não tem pedra, por isso são 47 e não 48.
- `items-outline-mega-stone/`: as mesmas 47 com contorno branco estilo Sw/Sh (preferida).
Uso: botão MEGA, pedras na mochila/loja, tela de evolução.
ATENÇÃO: as pedras NOVAS do Legends: Z-A (Clefablite, Victreebelite, Starminite,
Dragoninite, Meganiumite, Emboarite, Scraftinite, Floettite, Zygardite, Falinksite,
Magearnite…) NÃO estão aqui — só no ZIP da TSR (ver abaixo).

## NÃO baixado — baixar manualmente no navegador (Cloudflare bloqueia curl, 403)

The Spriters Resource — baixar pelo botão Download de cada página:
- SwSh Item Icons (460 KB, 661x1702): https://www.spriters-resource.com/nintendo_switch/pokemonswordshield/asset/123706/
- SwSh Ribbons and Marks (1,29 MB, 1033x1696): https://www.spriters-resource.com/nintendo_switch/pokemonswordshield/asset/123711/
- SwSh Pokémon Icons (829 KB, 691x4579): https://www.spriters-resource.com/nintendo_switch/pokemonswordshield/asset/123710/
- SwSh Player Icons (4,45 MB, 1800x3085): https://www.spriters-resource.com/nintendo_switch/pokemonswordshield/asset/123708/
- Z-A Item Icons — 394 arquivos, INCLUI AS 92 MEGA STONES (ZIP 7,28 MB): https://www.spriters-resource.com/nintendo_switch/pokemonlegendsza/asset/497783/
  (pedras novas do Z-A: item_2559 Clefablite … item_2646 Magearnite)
- Z-A Rogue Mega Pokémon UI — HUD de Mega selvagem (ZIP 17,09 MB, 298 arquivos):
  https://www.spriters-resource.com/nintendo_switch/pokemonlegendsza/asset/497785/

EeveeExpo — SwSh Styled Platinum Battle Interface (recurso 624, referência de layout
dos botões de batalha): https://eeveeexpo.com/resources/624/
(Outros recursos do mesmo autor: 696 acima; Il1dan's Type Icons — thread 3635;
NPB's Battle UI — recurso 1240; Fakemon Festival Pack — recurso 654.)

## Licenças
- PokéSprite: MIT (LICENSE-pokesprite.md).
- EeveeExpo 686/696/624: fan-made, creditar os autores.
- Spriters Resource: rips dos jogos Nintendo/Game Freak — mesma natureza de IP dos
  demais assets do projeto.
