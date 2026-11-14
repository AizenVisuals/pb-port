# Revisão estática dos efeitos e crash de Surf

## Falha confirmada

Render registrou segmentation faults em 14/11/2026 às 13:15:08 e 13:15:30 UTC. Reprodução local com Lapras usando Surf encerrou Node com status 139 perto do frame 216. O último método nativo foi drawImage, chamado por Rm0 durante o desenho do Pokémon sobre a onda.

O loader J9a adiciona getContext a imagens. O wrapper JavaScript de drawImage em @napi-rs/canvas 0.1.100 considera um objeto com getContext e dimensões como canvas e altera seu protótipo para CanvasElement. Uma Image nativa não pode sofrer essa conversão: o método nativo recebe um objeto com tipo interno incompatível e pode derrubar o processo.

Correção no adaptador: imagens nativas seguem diretamente para o drawImage nativo preservado antes da instalação do wrapper; os demais objetos continuam usando o wrapper existente. Motor e animações do cliente não foram alterados. O getter de src da imagem também foi preservado.

## Revisão solicitada: outros golpes sem teste individual em partidas

Análise sintática AST do bundle local com Acorn: 838 objetos com nome e run; 346 definições contêm operações de desenho/afterimage selecionadas. Há variantes e nomes repetidos; os números não representam 838 golpes únicos. Resultado completo: move-render-audit.json. Localizações são offsets de caracteres no bundle atual. Isso não é Evidence REA nem observação de execução dessas variantes.

Candidatos diretos encontrados para actor.draw: Surf, Dragon Claw, Muddy Water, Double Team, Nihil Light, Judgment, Spacial Rend e Doom Desire. Desenho direto de imagens foi encontrado em definições de Leaf Storm, Spacial Rend, Rock Slide e Surf. Outros golpes usam afterimage e o renderizador compartilhado. Essas ocorrências demonstram caminhos potencialmente afetados, não crashes confirmados em cada golpe. A correção de identidade cobre qualquer Image nativa que chegue a drawImage.

A biblioteca contém apenas esse ponto de Object.setPrototypeOf no wrapper de desenho examinado. O bundle não contém Object.setPrototypeOf. As duas chamadas createPattern examinadas usam canvases de terreno, sem essa conversão de identidade. Não foi identificado um segundo mecanismo equivalente nessa busca; isso não prova ausência de outros bugs nativos.

## Outras incompatibilidades do adaptador

O bundle referencia HTMLCanvasElement no carregamento de sprites transformados; OffscreenCanvas em máscaras de efeitos e Path2D em desenho de cenário. Esses globais não existiam no adaptador. Foram mapeados para as implementações nativas correspondentes. O primeiro pode impedir o carregamento de determinadas espécies; os demais podem interromper efeitos/cenários em ramos específicos. Não são alegados crashes nativos confirmados.

## Verificação

- Surf reproduzido antes da correção: SIGSEGV/status 139.
- A mesma reprodução, após a correção: partida completa com 15 usos de Surf sem crash.
- Teste específico desenha uma Image nativa com getContext adicionado e verifica que seu protótipo permanece intacto e os pixels são copiados.
- Oito testes de regressão passaram, incluindo simulações, HTTP e WebSocket.
- Os outros golpes foram revisados estaticamente, conforme solicitado; não foram exercitados um a um em partidas.

Limites: análise estática não garante segurança de memória da biblioteca nativa nem cobre todas as combinações de espécies, variantes, cenários e efeitos simultâneos.
