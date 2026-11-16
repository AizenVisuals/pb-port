# Auditoria de golpes ausentes do pool PULSE

Gerada em 2026-11-15T22:11:17.669Z.

## Resultado

- Espécies no roster: 296.
- Espécies comparadas na versão registrada: 252.
- Espécies sem referência comparável: 44.
- Combinações espécie/golpe aprendíveis na PokeAPI mas ausentes do pool: 4984.
- Combinações do pool fora do grupo PokeAPI selecionado: 2980.
- Golpes do roster sem definição de runtime: 0.

“Ausente do pool” significa que a espécie pode aprender o golpe naquele grupo de versão segundo a PokeAPI, mas o golpe não está no pool local daquela espécie. É uma lista de candidatos para curadoria, não recomendação de adicionar tudo: inclui golpes de status, egg, tutor e máquina. O PULSE usa pools deliberadamente menores.

## Fontes e método

- PokeAPI `/pokemon/{slug}/moves`, filtrada pelo grupo já anotado em `public/pulse/learnsets.js`.
- Pokémon Showdown pode ser usado como segunda revisão manual; não foi mesclado automaticamente para evitar misturar versões.
- Mapeamento local: `16` = ORAS; `20` = Sword/Shield; `23` = Brilliant Diamond/Shining Pearl.
- Formas regionais usam a entrada específica quando há slug correspondente. Fallback para forma base é marcado `formMatch: false` no JSON.
- Pokémon fan-made e formas sem lista de golpes no grupo selecionado são reportados sem comparação, nunca como ausências confirmadas.

## Espécies sem comparação

- **Sandslash (Alola)** (`sandslashA`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Ninetales (Alola)** (`ninetalesA`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Excadrill** (`excadrillM8I`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Zoroark** (`zoroark`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Eelektross** (`eelektross`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Haxorus** (`haxorusI`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Mienshao** (`mienshaoM`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Golurk** (`golurk`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Bisharp** (`bisharp`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Hydreigon** (`hydreigon`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Chesnaught** (`chesnaughtM8N`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Greninja** (`greninja`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Talonflame** (`talonflame`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Floette (Eternal)** (`floette`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Malamar** (`malamar`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Sylveon** (`sylveon`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Hawlucha** (`hawlucha`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Goodra** (`goodra`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Noivern** (`noivern`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Ribombee** (`ribombee`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Lycanroc** (`lycanrocM`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Comfey** (`comfey`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Kommo-o** (`kommooM`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Rillaboom** (`rillaboomL`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Inteleon** (`inteleonM8`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Corviknight** (`corviknightM`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Dragapult** (`dragapultL`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Kingambit** (`kingambitJJ`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Scream Tail** (`screamTail`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Brute Bonnet** (`bruteBonnet`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Flutter Mane** (`flutterMane`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Slither Wing** (`slitherWing`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Sandy Shocks** (`sandyShocks`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Iron Bundle** (`ironBundle`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Iron Hands** (`ironHands`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Iron Jugulis** (`ironJugulis`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Iron Moth** (`ironMoth`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Iron Thorns** (`ironThorns`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Roaring Moon** (`roaringMoon`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Iron Valiant** (`ironValiant`) — no-pokeapi-moves-for-version-group; brilliant-diamond-shining-pearl
- **Ferunoga** (`ferunoga`) — no-learnset
- **Hawajaku** (`hawajaku`) — no-learnset
- **Kyasupada** (`kyasupada`) — no-learnset
- **Eereon** (`eereon`) — no-learnset

## Lista completa por espécie

### Venusaur (venusaur)

Referência: Brilliant Diamond/Shining Pearl · venusaur · forma base usada. Pool 46; PokeAPI 49.

- attract
- bulldoze
- endure
- false swipe
- flash
- grass knot
- growth
- light screen
- poison powder
- roar
- safeguard
- strength
- swagger
- sweet scent
- work up
- worry seed

### Charizard (charizard)

Referência: Brilliant Diamond/Shining Pearl · charizard · forma base usada. Pool 75; PokeAPI 55.

- attract
- bulldoze
- endure
- false swipe
- fling
- inferno
- roar
- rock tomb
- scary face
- smokescreen
- strength
- swagger
- work up

### Blastoise (blastoise)

Referência: Brilliant Diamond/Shining Pearl · blastoise · forma base usada. Pool 71; PokeAPI 53.

- attract
- brine
- bulldoze
- endure
- false swipe
- fling
- roar
- rock tomb
- strength
- swagger
- work up

### Pidgeot (pidgeot)

Referência: ORAS · pidgeot · forma base usada. Pool 34; PokeAPI 42.

- attract
- confide
- feather dance
- frustration
- gust
- hidden power
- return
- round
- sand attack
- secret power
- snore
- swagger
- thief
- twister
- uproar
- whirlwind

### Pikachu (pikachu)

Referência: Brilliant Diamond/Shining Pearl · pikachu · forma base usada. Pool 48; PokeAPI 44.

- attract
- charge beam
- charm
- endure
- flash
- fling
- grass knot
- light screen
- nuzzle
- play nice
- slam
- spark
- strength
- swagger
- sweet kiss
- thief
- thunder shock
- volt switch

### Nidoqueen (nidoqueenAG)

Referência: Sword/Shield · nidoqueen · forma base usada. Pool 78; PokeAPI 81.

- attract
- beat up
- bulldoze
- charm
- endure
- flatter
- fling
- fury swipes
- helping hand
- mega kick
- mega punch
- rock blast
- rock tomb
- round
- sand tomb
- scorching sands
- snore
- stealth rock
- stomping tantrum
- taunt
- thief
- uproar
- venom drench
- venoshock

### Nidoking (nidoking)

Referência: Sword/Shield · nidoking · forma base usada. Pool 77; PokeAPI 81.

- attract
- beat up
- bulldoze
- endure
- flatter
- fling
- helping hand
- mega kick
- mega punch
- peck
- rock blast
- rock tomb
- round
- sand tomb
- scorching sands
- smart strike
- snore
- stealth rock
- stomping tantrum
- taunt
- thief
- uproar
- venom drench
- venoshock

### Clefable (clefable)

Referência: Brilliant Diamond/Shining Pearl · clefable · forma base usada. Pool 71; PokeAPI 69.

- after you
- attract
- charge beam
- charm
- copycat
- defense curl
- disarming voice
- dream eater
- encore
- endure
- flash
- fling
- grass knot
- gravity
- healing wish
- life dew
- light screen
- minimize
- pound
- psych up
- recycle
- safeguard
- stealth rock
- stored power
- strength
- swagger
- sweet kiss
- work up

### Dugtrio (dugtrio)

Referência: Brilliant Diamond/Shining Pearl · dugtrio · forma base usada. Pool 41; PokeAPI 39.

- astonish
- attract
- bulldoze
- endure
- fissure
- mud slap
- rock tomb
- sand attack
- sand tomb
- stealth rock
- swagger
- thief
- work up

### Persian (persian)

Referência: Brilliant Diamond/Shining Pearl · persian · forma base usada. Pool 59; PokeAPI 48.

- assurance
- attract
- dream eater
- endure
- fake out
- flash
- fury swipes
- psych up
- roar
- screech
- swagger
- switcheroo
- taunt
- thief
- torment
- work up

### Arcanine (arcanine)

Referência: Brilliant Diamond/Shining Pearl · arcanine · forma base usada. Pool 54; PokeAPI 45.

- attract
- bulldoze
- burn up
- endure
- helping hand
- howl
- reversal
- roar
- safeguard
- snarl
- strength
- swagger
- thief

### Alakazam (alakazam)

Referência: Sword/Shield · alakazam · forma base usada. Pool 48; PokeAPI 65.

- ally switch
- attract
- confusion
- disable
- encore
- endure
- expanding force
- fling
- grass knot
- guard swap
- imprison
- kinesis
- light screen
- magic room
- mega kick
- mega punch
- power swap
- psybeam
- psychic terrain
- role play
- round
- safeguard
- skill swap
- snore
- speed swap
- stored power
- taunt
- thief
- trick
- trick room
- wonder room

### Tentacruel (tentacruelH)

Referência: Brilliant Diamond/Shining Pearl · tentacruel · forma base usada. Pool 51; PokeAPI 41.

- acid
- acid armor
- attract
- brine
- bubble beam
- endure
- reflect type
- safeguard
- screech
- swagger
- thief
- wrap

### Golem (golemAG)

Referência: Brilliant Diamond/Shining Pearl · golem · forma base usada. Pool 51; PokeAPI 43.

- attract
- bulldoze
- defense curl
- endure
- fling
- harden
- roar
- rock blast
- rock polish
- rock throw
- rock tomb
- smack down
- stealth rock
- strength
- swagger

### Dodrio (dodrio)

Referência: Brilliant Diamond/Shining Pearl · dodrio · forma base usada. Pool 41; PokeAPI 38.

- acupressure
- attract
- double hit
- endeavor
- endure
- leer
- peck
- pluck
- swagger
- taunt
- thief
- thrash
- torment
- uproar
- wing attack
- work up

### Muk (mukH)

Referência: Brilliant Diamond/Shining Pearl · muk · forma base usada. Pool 54; PokeAPI 52.

- acid armor
- attract
- belch
- disable
- endure
- fling
- memento
- minimize
- mud slap
- poison gas
- pound
- rock tomb
- screech
- sludge
- smog
- strength
- swagger
- taunt
- thief
- torment
- venom drench

### Gengar (gengar)

Referência: Brilliant Diamond/Shining Pearl · gengar · forma base usada. Pool 62; PokeAPI 56.

- attract
- destiny bond
- dream eater
- endure
- fling
- mean look
- night shade
- psych up
- reflect type
- skill swap
- spite
- strength
- swagger
- taunt
- thief
- torment
- trick room

### Exeggutor (exeggutor)

Referência: Brilliant Diamond/Shining Pearl · exeggutor · forma base usada. Pool 44; PokeAPI 46.

- absorb
- attract
- bulldoze
- confusion
- dream eater
- endure
- flash
- grass knot
- light screen
- mega drain
- psych up
- skill swap
- stomp
- strength
- swagger
- thief
- trick room
- uproar
- worry seed

### Weezing (weezingH)

Referência: Brilliant Diamond/Shining Pearl · weezing · forma base usada. Pool 35; PokeAPI 44.

- assurance
- attract
- belch
- clear smog
- destiny bond
- double hit
- endure
- flash
- haze
- memento
- poison gas
- sludge
- smog
- smokescreen
- swagger
- taunt
- thief
- torment

### Rhydon (rhydon)

Referência: Brilliant Diamond/Shining Pearl · rhydon · forma base usada. Pool 80; PokeAPI 59.

- attract
- bulldoze
- endure
- fling
- horn drill
- roar
- rock blast
- rock polish
- rock tomb
- scary face
- smack down
- stealth rock
- stomp
- strength
- swagger
- thief

### Scyther (scyther)

Referência: Brilliant Diamond/Shining Pearl · scyther · forma base usada. Pool 50; PokeAPI 44.

- attract
- baton pass
- defog
- double hit
- endure
- false swipe
- laser focus
- light screen
- quick guard
- reversal
- safeguard
- swagger
- thief

### Tauros (tauros)

Referência: Brilliant Diamond/Shining Pearl · tauros · forma base usada. Pool 53; PokeAPI 44.

- assurance
- attract
- bulldoze
- endure
- rock tomb
- scary face
- strength
- swagger
- thrash
- work up

### Lapras (lapras)

Referência: Brilliant Diamond/Shining Pearl · lapras · forma base usada. Pool 58; PokeAPI 52.

- attract
- brine
- bulldoze
- dream eater
- endure
- fissure
- horn drill
- life dew
- mist
- roar
- safeguard
- sheer cold
- strength
- swagger
- tickle

### Jolteon (jolteon)

Referência: Brilliant Diamond/Shining Pearl · jolteon · forma base usada. Pool 46; PokeAPI 50.

- attract
- baby doll eyes
- baton pass
- charge beam
- charm
- copycat
- covet
- endure
- flash
- helping hand
- last resort
- light screen
- roar
- sand attack
- strength
- swagger
- thunder shock
- volt switch
- work up

### Aerodactyl (aerodactylM8)

Referência: Sword/Shield · aerodactyl · forma base usada. Pool 55; PokeAPI 60.

- assurance
- attract
- brutal swing
- bulldoze
- endure
- meteor beam
- roar
- rock blast
- rock tomb
- round
- scary face
- snore
- stealth rock
- taunt
- thief
- whirlwind
- wide guard

### Snorlax (snorlax)

Referência: Brilliant Diamond/Shining Pearl · snorlax · forma base usada. Pool 73; PokeAPI 70.

- after you
- attract
- belch
- belly drum
- block
- bulldoze
- charm
- covet
- defense curl
- endure
- fissure
- flail
- fling
- gastro acid
- last resort
- power up punch
- recycle
- rock tomb
- screech
- snore
- stockpile
- strength
- swagger
- swallow
- whirlwind
- work up
- yawn

### Dragonite (dragoniteL)

Referência: Brilliant Diamond/Shining Pearl · dragonite · forma base usada. Pool 80; PokeAPI 65.

- attract
- bulldoze
- defog
- dragon tail
- endure
- fling
- light screen
- roar
- rock tomb
- safeguard
- slam
- strength
- swagger
- twister
- wrap

### Typhlosion (typhlosion)

Referência: Brilliant Diamond/Shining Pearl · typhlosion · forma base usada. Pool 67; PokeAPI 51.

- attract
- bulldoze
- burn up
- defense curl
- endure
- fling
- inferno
- roar
- rock tomb
- smokescreen
- strength
- swagger
- work up

### Feraligatr (feraligatrD)

Referência: Brilliant Diamond/Shining Pearl · feraligatr · forma base usada. Pool 67; PokeAPI 59.

- attract
- bulldoze
- endure
- flail
- fling
- mud slap
- roar
- rock tomb
- scary face
- screech
- strength
- swagger
- thrash
- work up

### Crobat (crobat)

Referência: Sword/Shield · crobat · forma base usada. Pool 49; PokeAPI 55.

- absorb
- air cutter
- assurance
- astonish
- attract
- endure
- haze
- mean look
- quick guard
- round
- screech
- snore
- taunt
- thief
- uproar
- venom drench
- venoshock

### Ampharos (ampharos)

Referência: Brilliant Diamond/Shining Pearl · ampharos · forma base usada. Pool 49; PokeAPI 47.

- attract
- bulldoze
- charge
- charge beam
- cotton guard
- cotton spore
- endure
- flash
- fling
- light screen
- magnetic flux
- safeguard
- strength
- swagger
- thunder shock
- volt switch
- zap cannon

### Espeon (espeon)

Referência: Brilliant Diamond/Shining Pearl · espeon · forma base usada. Pool 44; PokeAPI 50.

- attract
- baby doll eyes
- baton pass
- charm
- confusion
- copycat
- covet
- dream eater
- endure
- flash
- grass knot
- helping hand
- last resort
- light screen
- power swap
- psybeam
- psych up
- sand attack
- skill swap
- swagger
- trick room
- work up

### Umbreon (umbreon)

Referência: Brilliant Diamond/Shining Pearl · umbreon · forma base usada. Pool 45; PokeAPI 51.

- assurance
- attract
- baby doll eyes
- baton pass
- charm
- copycat
- covet
- dream eater
- endure
- flash
- guard swap
- helping hand
- last resort
- mean look
- psych up
- sand attack
- screech
- snarl
- swagger
- taunt
- thief
- torment
- work up

### Steelix (steelixD)

Referência: Sword/Shield · steelix · forma base usada. Pool 51; PokeAPI 65.

- attract
- bind
- breaking swipe
- brutal swing
- bulldoze
- endure
- meteor beam
- rock blast
- rock polish
- rock throw
- rock tomb
- round
- sand tomb
- scary face
- scorching sands
- screech
- slam
- smack down
- snore
- stealth rock
- steel beam
- steel roller
- stomping tantrum
- taunt

### Scizor (scizorJJ)

Referência: Brilliant Diamond/Shining Pearl · scizor · forma base usada. Pool 56; PokeAPI 46.

- attract
- defog
- double hit
- endure
- false swipe
- fling
- laser focus
- light screen
- safeguard
- strength
- swagger
- thief

### Heracross (heracross)

Referência: Brilliant Diamond/Shining Pearl · heracross · forma base usada. Pool 55; PokeAPI 53.

- attract
- bulldoze
- endure
- false swipe
- flail
- fling
- harden
- revenge
- rock blast
- rock tomb
- strength
- swagger
- thief
- thrash
- work up

### Skarmory (skarmory)

Referência: Brilliant Diamond/Shining Pearl · skarmory · forma base usada. Pool 53; PokeAPI 54.

- air cutter
- assurance
- attract
- defog
- endure
- flash
- guard swap
- peck
- pluck
- roar
- rock tomb
- sand attack
- stealth rock
- swagger
- taunt
- thief
- torment
- whirlwind

### Houndoom (houndoomSP)

Referência: Brilliant Diamond/Shining Pearl · houndoom · forma base usada. Pool 48; PokeAPI 43.

- attract
- beat up
- dream eater
- endure
- howl
- inferno
- roar
- smog
- snarl
- strength
- swagger
- taunt
- thief
- torment

### Kingdra (kingdraD)

Referência: Brilliant Diamond/Shining Pearl · kingdra · forma base usada. Pool 44; PokeAPI 36.

- attract
- brine
- bubble beam
- endure
- laser focus
- smokescreen
- swagger
- twister
- yawn

### Tyranitar (tyranitar)

Referência: Brilliant Diamond/Shining Pearl · tyranitar · forma base usada. Pool 82; PokeAPI 65.

- attract
- bulldoze
- endure
- fling
- roar
- rock polish
- rock throw
- rock tomb
- scary face
- screech
- snarl
- stealth rock
- stomping tantrum
- strength
- swagger
- taunt
- thrash
- torment

### Sceptile (sceptile)

Referência: Brilliant Diamond/Shining Pearl · sceptile · forma base usada. Pool 63; PokeAPI 59.

- assurance
- attract
- bulldoze
- detect
- dual chop
- endeavor
- endure
- false swipe
- flash
- fling
- grass knot
- leafage
- low sweep
- mega drain
- pound
- quick guard
- roar
- rock tomb
- safeguard
- screech
- slam
- strength
- swagger
- work up

### Blaziken (blazikenNM)

Referência: Brilliant Diamond/Shining Pearl · blaziken · forma base usada. Pool 73; PokeAPI 59.

- attract
- bulldoze
- detect
- endure
- feather dance
- fling
- low sweep
- reversal
- roar
- rock tomb
- sand attack
- strength
- swagger
- work up

### Swampert (swampertNM)

Referência: Brilliant Diamond/Shining Pearl · swampert · forma base usada. Pool 69; PokeAPI 52.

- attract
- bulldoze
- endeavor
- endure
- fling
- roar
- rock throw
- rock tomb
- screech
- stealth rock
- strength
- swagger
- work up

### Mightyena (mightyenaH)

Referência: Brilliant Diamond/Shining Pearl · mightyena · forma base usada. Pool 38; PokeAPI 42.

- assurance
- attract
- endure
- howl
- mud slap
- roar
- sand attack
- scary face
- snarl
- strength
- swagger
- taunt
- thief
- torment
- yawn

### Ludicolo (ludicoloNM)

Referência: Brilliant Diamond/Shining Pearl · ludicolo · forma base usada. Pool 59; PokeAPI 51.

- absorb
- astonish
- attract
- bubble beam
- endure
- fake out
- flail
- flash
- fling
- fury swipes
- grass knot
- mega drain
- mist
- nature power
- strength
- swagger
- teeter dance
- thief

### Shiftry (shiftryNM)

Referência: Brilliant Diamond/Shining Pearl · shiftry · forma base usada. Pool 69; PokeAPI 60.

- absorb
- air cutter
- astonish
- attract
- defog
- endure
- fake out
- false swipe
- flash
- fling
- grass knot
- growth
- harden
- leaf tornado
- low sweep
- mega drain
- nature power
- psych up
- rock tomb
- snarl
- strength
- swagger
- thief
- torment
- whirlwind

### Swellow (swellow)

Referência: ORAS · swellow · forma base usada. Pool 29; PokeAPI 41.

- attract
- confide
- echoed voice
- endeavor
- frustration
- hidden power
- peck
- pluck
- quick guard
- return
- round
- secret power
- snore
- swagger
- thief

### Pelipper (pelipperNM)

Referência: Brilliant Diamond/Shining Pearl · pelipper · forma base usada. Pool 51; PokeAPI 45.

- attract
- brine
- defog
- endure
- fling
- mist
- pluck
- soak
- stockpile
- swagger
- swallow
- thief

### Gardevoir (gardevoir)

Referência: Brilliant Diamond/Shining Pearl · gardevoir · forma base usada. Pool 47; PokeAPI 53.

- attract
- charge beam
- charm
- confusion
- disarming voice
- dream eater
- endure
- flash
- fling
- grass knot
- heal pulse
- healing wish
- life dew
- light screen
- misty terrain
- psybeam
- psych up
- recycle
- safeguard
- skill swap
- swagger
- taunt
- thief
- torment
- trick room
- wish

### Breloom (breloomNM)

Referência: Brilliant Diamond/Shining Pearl · breloom · forma base usada. Pool 57; PokeAPI 55.

- absorb
- attract
- endure
- false swipe
- flash
- fling
- grass knot
- growth
- low sweep
- mega drain
- mind reader
- poison powder
- rock tomb
- safeguard
- strength
- stun spore
- swagger
- work up
- worry seed

### Slaking (slakingNM)

Referência: Brilliant Diamond/Shining Pearl · slaking · forma base usada. Pool 74; PokeAPI 59.

- attract
- bulldoze
- covet
- encore
- endure
- flail
- fling
- fury swipes
- low sweep
- reversal
- roar
- rock tomb
- strength
- swagger
- taunt
- uproar
- work up
- yawn

### Ninjask (ninjaskAP)

Referência: Sword/Shield · ninjask · forma base usada. Pool 35; PokeAPI 45.

- absorb
- baton pass
- bug bite
- endure
- false swipe
- fury swipes
- mind reader
- mud slap
- round
- sand attack
- screech
- skitter smack
- snore
- thief
- uproar

### Shedinja (shedinjaNM)

Referência: Sword/Shield · shedinja · forma base usada. Pool 34; PokeAPI 42.

- absorb
- ally switch
- endure
- false swipe
- fury swipes
- grudge
- mind reader
- mud slap
- round
- sand attack
- skitter smack
- snore
- spite
- thief
- trick

### Exploud (exploudNM)

Referência: Sword/Shield · exploud · forma base usada. Pool 53; PokeAPI 63.

- astonish
- attract
- bulldoze
- echoed voice
- endure
- fake tears
- fling
- howl
- mega kick
- mega punch
- pound
- roar
- rock tomb
- round
- screech
- snore
- stomp
- stomping tantrum
- taunt
- terrain pulse
- uproar
- work up

### Aggron (aggron)

Referência: Sword/Shield · aggron · forma base usada. Pool 78; PokeAPI 83.

- attract
- brutal swing
- bulldoze
- endure
- fling
- mega kick
- mega punch
- meteor beam
- reversal
- roar
- rock blast
- rock tomb
- round
- sand tomb
- scary face
- screech
- smart strike
- snore
- stealth rock
- steel beam
- steel roller
- stomping tantrum
- taunt
- uproar

### Manectric (manectric)

Referência: Sword/Shield · manectric · forma base usada. Pool 38; PokeAPI 47.

- attract
- charge
- eerie impulse
- electric terrain
- endure
- howl
- light screen
- rising voltage
- roar
- round
- scary face
- snarl
- snore
- thief
- uproar
- volt switch

### Sharpedo (sharpedoH)

Referência: Sword/Shield · sharpedo · forma base usada. Pool 50; PokeAPI 58.

- assurance
- attract
- brine
- bulldoze
- dive
- endure
- rock tomb
- round
- scale shot
- scary face
- screech
- snarl
- snore
- swagger
- taunt
- thief
- uproar

### Wailord (wailord)

Referência: Sword/Shield · wailord · forma base usada. Pool 40; PokeAPI 48.

- astonish
- attract
- brine
- bulldoze
- dive
- endure
- mist
- noble roar
- rock tomb
- round
- snore
- soak
- steel roller
- weather ball

### Camerupt (cameruptH)

Referência: Brilliant Diamond/Shining Pearl · camerupt · forma base usada. Pool 51; PokeAPI 45.

- attract
- bulldoze
- endure
- fissure
- flame wheel
- roar
- rock polish
- rock tomb
- stealth rock
- strength
- swagger
- yawn

### Torkoal (torkoal)

Referência: Brilliant Diamond/Shining Pearl · torkoal · forma base usada. Pool 52; PokeAPI 51.

- attract
- bulldoze
- clear smog
- endure
- fissure
- flail
- inferno
- rock tomb
- smog
- smokescreen
- stealth rock
- strength
- swagger
- yawn

### Flygon (flygonNM)

Referência: Brilliant Diamond/Shining Pearl · flygon · forma base usada. Pool 62; PokeAPI 56.

- astonish
- attract
- bulldoze
- defog
- dragon tail
- endure
- fissure
- laser focus
- mud slap
- rock tomb
- sand attack
- sand tomb
- screech
- strength
- swagger
- uproar

### Altaria (altariaL)

Referência: Brilliant Diamond/Shining Pearl · altaria · forma base usada. Pool 51; PokeAPI 50.

- attract
- bulldoze
- cotton guard
- disarming voice
- dream eater
- endure
- false swipe
- mist
- peck
- pluck
- psych up
- roar
- round
- safeguard
- swagger
- thief

### Crawdaunt (crawdauntH)

Referência: Brilliant Diamond/Shining Pearl · crawdaunt · forma base usada. Pool 59; PokeAPI 51.

- attract
- bubble beam
- double hit
- endeavor
- endure
- false swipe
- fling
- guillotine
- razor shell
- rock tomb
- snarl
- strength
- swagger
- taunt

### Claydol (claydol)

Referência: Sword/Shield · claydol · forma base usada. Pool 44; PokeAPI 68.

- ally switch
- bulldoze
- confusion
- eerie impulse
- endure
- expanding force
- grass knot
- guard split
- guard swap
- imprison
- light screen
- mud slap
- power split
- power swap
- power trick
- psybeam
- psychic terrain
- rock tomb
- round
- safeguard
- sand tomb
- scorching sands
- skill swap
- snore
- stealth rock
- stored power
- trick
- trick room
- wonder room

### Cradily (cradily)

Referência: Sword/Shield · cradily · forma base usada. Pool 37; PokeAPI 50.

- acid
- astonish
- attract
- brine
- bulldoze
- endure
- gastro acid
- grass knot
- grassy terrain
- mega drain
- meteor beam
- power whip
- rock blast
- rock tomb
- round
- snore
- stealth rock
- stockpile
- swallow
- wrap

### Armaldo (armaldo)

Referência: Sword/Shield · armaldo · forma base usada. Pool 46; PokeAPI 50.

- attract
- brine
- brutal swing
- bug bite
- bulldoze
- endure
- false swipe
- meteor beam
- rock blast
- rock tomb
- round
- screech
- smack down
- snore
- stealth rock
- stomping tantrum

### Milotic (milotic)

Referência: Brilliant Diamond/Shining Pearl · milotic · forma base usada. Pool 46; PokeAPI 41.

- aqua ring
- attract
- brine
- bulldoze
- coil
- disarming voice
- dragon tail
- endure
- flail
- life dew
- light screen
- psych up
- safeguard
- swagger
- twister
- wrap

### Absol (absolNM)

Referência: Sword/Shield · absol · forma base usada. Pool 69; PokeAPI 73.

- assurance
- attract
- baton pass
- brutal swing
- detect
- endure
- false swipe
- magic coat
- mean look
- rock tomb
- round
- snarl
- snore
- taunt
- thief

### Glalie (glalieNM)

Referência: Brilliant Diamond/Shining Pearl · glalie · forma base usada. Pool 39; PokeAPI 41.

- astonish
- attract
- bulldoze
- endure
- flash
- frost breath
- light screen
- powder snow
- safeguard
- sheer cold
- swagger
- taunt
- torment

### Walrein (walreinH)

Referência: Sword/Shield · walrein · forma base usada. Pool 39; PokeAPI 48.

- attract
- aurora beam
- brine
- bulldoze
- defense curl
- dive
- encore
- endure
- icicle spear
- powder snow
- rock tomb
- round
- sheer cold
- snore
- steel roller
- stomping tantrum
- swagger

### Salamence (salamence)

Referência: Brilliant Diamond/Shining Pearl · salamence · forma base usada. Pool 58; PokeAPI 47.

- attract
- bulldoze
- defog
- dragon tail
- endure
- roar
- rock tomb
- scary face
- strength
- swagger

### Metagross (metagross)

Referência: Brilliant Diamond/Shining Pearl · metagross · forma base usada. Pool 59; PokeAPI 47.

- bulldoze
- confusion
- endure
- flash
- grass knot
- light screen
- psych up
- rock polish
- rock tomb
- scary face
- stealth rock
- strength
- swagger

### Torterra (torterra)

Referência: Brilliant Diamond/Shining Pearl · torterra · forma base usada. Pool 55; PokeAPI 52.

- absorb
- attract
- bulldoze
- endure
- flash
- grass knot
- growth
- leafage
- light screen
- mega drain
- roar
- rock polish
- rock tomb
- safeguard
- stealth rock
- strength
- swagger
- work up

### Infernape (infernape)

Referência: Brilliant Diamond/Shining Pearl · infernape · forma base usada. Pool 69; PokeAPI 61.

- attract
- bulldoze
- endure
- fling
- fury swipes
- grass knot
- low sweep
- power up punch
- roar
- rock tomb
- stealth rock
- strength
- swagger
- taunt
- torment
- work up

### Empoleon (empoleon)

Referência: Brilliant Diamond/Shining Pearl · empoleon · forma base usada. Pool 62; PokeAPI 58.

- attract
- brine
- bubble beam
- bulldoze
- charm
- defog
- endure
- fling
- grass knot
- mist
- peck
- pluck
- pound
- roar
- rock tomb
- stealth rock
- strength
- swagger
- work up

### Staraptor (staraptor)

Referência: Brilliant Diamond/Shining Pearl · staraptor · forma base usada. Pool 43; PokeAPI 33.

- attract
- defog
- endeavor
- endure
- final gambit
- pluck
- swagger
- thief
- whirlwind
- work up

### Luxray (luxrayM)

Referência: Brilliant Diamond/Shining Pearl · luxray · forma base usada. Pool 39; PokeAPI 36.

- attract
- charge
- charge beam
- electric terrain
- endure
- flash
- light screen
- roar
- scary face
- snarl
- spark
- strength
- swagger
- thief
- thunder shock
- volt switch

### Roserade (roserade)

Referência: Sword/Shield · roserade · forma base usada. Pool 38; PokeAPI 52.

- absorb
- aromatherapy
- attract
- endure
- grass knot
- grassy terrain
- growth
- magical leaf
- mega drain
- power whip
- round
- snore
- stun spore
- sweet scent
- uproar
- venom drench
- venoshock
- weather ball
- worry seed

### Gastrodon (gastrodonAP)

Referência: Brilliant Diamond/Shining Pearl · gastrodon · forma base usada. Pool 44; PokeAPI 40.

- attract
- brine
- bulldoze
- endure
- flash
- memento
- mud slap
- rock tomb
- strength
- swagger

### Lopunny (lopunny)

Referência: Sword/Shield · lopunny · forma base usada. Pool 53; PokeAPI 70.

- after you
- assurance
- attract
- baby doll eyes
- baton pass
- brutal swing
- charm
- defense curl
- encore
- endure
- entrainment
- fake tears
- flatter
- fling
- grass knot
- healing wish
- helping hand
- low sweep
- magic coat
- mega kick
- mega punch
- pound
- reversal
- round
- snore
- uproar
- work up

### Honchkrow (honchkrowSP)

Referência: Brilliant Diamond/Shining Pearl · honchkrow · forma base usada. Pool 45; PokeAPI 46.

- air cutter
- assurance
- astonish
- attract
- defog
- dream eater
- endure
- gust
- haze
- mean look
- night shade
- peck
- pluck
- psych up
- quash
- snarl
- swagger
- taunt
- thief
- torment

### Bronzong (bronzongSP)

Referência: Brilliant Diamond/Shining Pearl · bronzong · forma base usada. Pool 43; PokeAPI 52.

- block
- bulldoze
- charge beam
- confusion
- dream eater
- endure
- flash
- grass knot
- imprison
- light screen
- psych up
- recycle
- rock polish
- rock tomb
- safeguard
- skill swap
- stealth rock
- strength
- swagger
- trick room
- weather ball

### Spiritomb (spiritomb)

Referência: Brilliant Diamond/Shining Pearl · spiritomb · forma base usada. Pool 36; PokeAPI 46.

- attract
- destiny bond
- disable
- dream eater
- endure
- flash
- grudge
- imprison
- memento
- night shade
- psych up
- rock tomb
- smokescreen
- snarl
- spite
- swagger
- taunt
- thief
- torment

### Garchomp (garchomp)

Referência: Brilliant Diamond/Shining Pearl · garchomp · forma base usada. Pool 56; PokeAPI 50.

- attract
- bulldoze
- dual chop
- endure
- false swipe
- fling
- roar
- rock tomb
- sand attack
- sand tomb
- stealth rock
- strength
- swagger

### Lucario (lucario)

Referência: Brilliant Diamond/Shining Pearl · lucario · forma base usada. Pool 65; PokeAPI 66.

- attract
- bulldoze
- copycat
- detect
- endure
- final gambit
- fling
- heal pulse
- helping hand
- laser focus
- life dew
- low sweep
- power up punch
- quick guard
- reversal
- roar
- rock tomb
- screech
- strength
- swagger
- work up

### Drapion (drapionAP)

Referência: Sword/Shield · drapion · forma base usada. Pool 50; PokeAPI 66.

- acupressure
- assurance
- attract
- brutal swing
- bug bite
- bulldoze
- endure
- false swipe
- fell stinger
- fling
- hone claws
- lash out
- rock tomb
- round
- sand tomb
- scary face
- screech
- skitter smack
- snarl
- snore
- stomping tantrum
- taunt
- thief
- venom drench
- venoshock

### Toxicroak (toxicroak)

Referência: Brilliant Diamond/Shining Pearl · toxicroak · forma base usada. Pool 55; PokeAPI 51.

- astonish
- attract
- belch
- bulldoze
- endure
- flatter
- fling
- low sweep
- mud slap
- revenge
- rock tomb
- strength
- swagger
- taunt
- thief
- torment
- venoshock
- work up

### Weavile (weavile)

Referência: Brilliant Diamond/Shining Pearl · weavile · forma base usada. Pool 60; PokeAPI 61.

- assurance
- attract
- beat up
- dream eater
- endure
- false swipe
- fling
- fury swipes
- hone claws
- low sweep
- psych up
- revenge
- screech
- snarl
- strength
- swagger
- taunt
- thief
- torment

### Magnezone (magnezoneD)

Referência: Brilliant Diamond/Shining Pearl · magnezone · forma base usada. Pool 41; PokeAPI 41.

- charge beam
- electric terrain
- endure
- flash
- light screen
- lock on
- magnetic flux
- psych up
- recycle
- screech
- spark
- swagger
- thunder shock
- volt switch
- zap cannon

### Rhyperior (rhyperior)

Referência: Brilliant Diamond/Shining Pearl · rhyperior · forma base usada. Pool 80; PokeAPI 61.

- attract
- bulldoze
- endure
- fling
- horn drill
- roar
- rock blast
- rock polish
- rock tomb
- scary face
- smack down
- stealth rock
- stomp
- strength
- swagger
- thief

### Electivire (electivireAP)

Referência: Brilliant Diamond/Shining Pearl · electivire · forma base usada. Pool 49; PokeAPI 49.

- attract
- bulldoze
- charge
- charge beam
- endure
- flash
- fling
- light screen
- low sweep
- rock tomb
- screech
- strength
- swagger
- taunt
- thief
- thunder shock
- torment
- volt switch

### Togekiss (togekiss)

Referência: Sword/Shield · togekiss · forma base usada. Pool 58; PokeAPI 75.

- after you
- ally switch
- attract
- baton pass
- charm
- encore
- endure
- fairy wind
- fling
- grass knot
- helping hand
- imprison
- last resort
- life dew
- light screen
- magical leaf
- mega kick
- mega punch
- pound
- round
- safeguard
- smart strike
- snore
- stored power
- sweet kiss
- trick
- uproar
- wish
- work up
- yawn

### Gliscor (gliscorAP)

Referência: Brilliant Diamond/Shining Pearl · gliscor · forma base usada. Pool 66; PokeAPI 58.

- attract
- bulldoze
- defog
- endure
- false swipe
- fling
- guillotine
- mud slap
- poison sting
- rock polish
- rock tomb
- sand attack
- screech
- stealth rock
- strength
- swagger
- taunt
- thief
- torment

### Mamoswine (mamoswine)

Referência: Brilliant Diamond/Shining Pearl · mamoswine · forma base usada. Pool 49; PokeAPI 43.

- attract
- bulldoze
- double hit
- endure
- flail
- light screen
- mist
- mud slap
- powder snow
- roar
- rock tomb
- stealth rock
- strength
- swagger
- thrash

### Gallade (galladeSP)

Referência: Brilliant Diamond/Shining Pearl · gallade · forma base usada. Pool 76; PokeAPI 79.

- attract
- bulldoze
- charge beam
- charm
- confusion
- disarming voice
- dream eater
- endure
- false swipe
- flash
- fling
- grass knot
- heal pulse
- helping hand
- imprison
- life dew
- light screen
- low sweep
- psybeam
- psych up
- quick guard
- recycle
- rock tomb
- safeguard
- skill swap
- strength
- swagger
- taunt
- thief
- torment
- trick room
- wide guard
- work up

### Froslass (froslassAP)

Referência: Brilliant Diamond/Shining Pearl · froslass · forma base usada. Pool 47; PokeAPI 49.

- astonish
- attract
- destiny bond
- dream eater
- endure
- flash
- fling
- frost breath
- light screen
- powder snow
- psych up
- safeguard
- swagger
- taunt
- torment

### Unfezant (unfezant)

Referência: Sword/Shield · unfezant · forma base usada. Pool 31; PokeAPI 38.

- air cutter
- attract
- detect
- endure
- feather dance
- gust
- round
- snore
- swagger
- taunt
- uproar
- work up

### Darmanitan (darmanitan)

Referência: Sword/Shield · darmanitan-standard · forma base usada. Pool 49; PokeAPI 68.

- attract
- belly drum
- bulldoze
- burning jealousy
- encore
- endure
- expanding force
- fling
- grass knot
- guard swap
- incinerate
- lash out
- mega kick
- mega punch
- power swap
- reversal
- rock tomb
- round
- snore
- taunt
- thief
- thrash
- trick
- uproar
- work up

### Sigilyph (sigilyph)

Referência: Sword/Shield · sigilyph · forma base usada. Pool 41; PokeAPI 59.

- air cutter
- attract
- confusion
- endure
- expanding force
- gravity
- gust
- imprison
- light screen
- magic room
- power swap
- psybeam
- psycho shift
- round
- safeguard
- skill swap
- snore
- speed swap
- stored power
- thief
- trick
- trick room
- whirlwind

### Cofagrigus (cofagrigus)

Referência: Sword/Shield · cofagrigus · forma base usada. Pool 37; PokeAPI 53.

- ally switch
- astonish
- attract
- crafty shield
- destiny bond
- disable
- endure
- fake tears
- grass knot
- grudge
- guard split
- guard swap
- haze
- imprison
- mean look
- night shade
- power split
- power swap
- revenge
- round
- safeguard
- scary face
- skill swap
- snore
- thief
- trick
- trick room
- wonder room

### Archeops (archeops)

Referência: Sword/Shield · archeops · forma base usada. Pool 47; PokeAPI 58.

- ally switch
- assurance
- attract
- bulldoze
- endeavor
- endure
- lash out
- meteor beam
- pluck
- quick guard
- rock blast
- rock throw
- rock tomb
- round
- scary face
- snore
- stealth rock
- taunt
- thrash
- uproar

### Vanilluxe (vanilluxe)

Referência: Sword/Shield · vanilluxe · forma base usada. Pool 26; PokeAPI 37.

- acid armor
- ally switch
- astonish
- attract
- beat up
- endure
- icicle spear
- imprison
- light screen
- mist
- round
- sheer cold
- snore
- taunt
- uproar
- weather ball

### Klinklang (klinklang)

Referência: Sword/Shield · klinklang · forma base usada. Pool 25; PokeAPI 42.

- ally switch
- assurance
- bind
- charge
- charge beam
- electric terrain
- endure
- gear up
- lock on
- magnetic flux
- rising voltage
- round
- screech
- snore
- steel beam
- steel roller
- thunder shock
- trick room
- uproar
- vice grip
- volt switch
- zap cannon

### Accelgor (accelgorJJ)

Referência: Sword/Shield · accelgor · forma base usada. Pool 30; PokeAPI 49.

- absorb
- acid
- acid armor
- acid spray
- attract
- baton pass
- encore
- endure
- final gambit
- guard swap
- mega drain
- power swap
- reversal
- round
- skitter smack
- snore
- struggle bug
- venom drench
- venoshock
- yawn

### Druddigon (druddigonI)

Referência: Sword/Shield · druddigon · forma base usada. Pool 55; PokeAPI 64.

- attract
- bulldoze
- dragon tail
- endure
- fling
- glare
- hone claws
- lash out
- mega punch
- poison tail
- revenge
- rock tomb
- round
- scale shot
- scary face
- snarl
- snore
- stealth rock
- stomping tantrum
- taunt

### Aegislash (aegislash)

Referência: Sword/Shield · aegislash-shield · forma base usada. Pool 43; PokeAPI 45.

- attract
- brutal swing
- endure
- false swipe
- kings shield
- power trick
- reversal
- round
- screech
- snore
- solar blade
- steel beam

### Tyrantrum (tyrantrum)

Referência: Sword/Shield · tyrantrum · forma base usada. Pool 45; PokeAPI 63.

- assurance
- attract
- breaking swipe
- brutal swing
- bulldoze
- charm
- dragon tail
- endure
- horn drill
- lash out
- meteor beam
- roar
- rock blast
- rock tomb
- round
- scale shot
- scary face
- snore
- stealth rock
- stomp
- stomping tantrum
- thrash

### Aurorus (aurorus)

Referência: Sword/Shield · aurorus · forma base usada. Pool 45; PokeAPI 55.

- attract
- aurora beam
- bulldoze
- encore
- endure
- icicle spear
- light screen
- meteor beam
- mist
- nature power
- powder snow
- rock blast
- rock tomb
- round
- safeguard
- snore
- stealth rock
- weather ball

### Gourgeist (gourgeist)

Referência: Sword/Shield · gourgeist-average · forma base usada. Pool 46; PokeAPI 57.

- ally switch
- astonish
- attract
- brutal swing
- endure
- grass knot
- imprison
- light screen
- power whip
- round
- safeguard
- scary face
- skill swap
- skitter smack
- snore
- thief
- trick
- trick or treat
- trick room
- worry seed

### Golisopod (golisopodJJ)

Referência: Sword/Shield · golisopod · forma base usada. Pool 55; PokeAPI 65.

- assurance
- attract
- bug bite
- defense curl
- dive
- endure
- false swipe
- fling
- razor shell
- rock tomb
- round
- sand attack
- screech
- skitter smack
- snarl
- snore
- spite
- struggle bug
- taunt
- venoshock

### Buzzwole (buzzwoleJJ)

Referência: Sword/Shield · buzzwole · forma base usada. Pool 36; PokeAPI 52.

- bulldoze
- coaching
- darkest lariat
- endure
- false swipe
- fell stinger
- fling
- low sweep
- mega punch
- power up punch
- revenge
- reversal
- rock tomb
- round
- snore
- stomping tantrum
- taunt
- vital throw
- work up

### Pheromosa (pheromosaJJ)

Referência: Sword/Shield · pheromosa · forma base usada. Pool 37; PokeAPI 48.

- assurance
- bug bite
- coaching
- electroweb
- endure
- false swipe
- fling
- low sweep
- quick guard
- round
- skitter smack
- snore
- speed swap
- stomp
- taunt
- triple kick

### Marshadow (marshadow)

Referência: Sword/Shield · marshadow · forma base usada. Pool 51; PokeAPI 68.

- assurance
- coaching
- copycat
- endeavor
- endure
- false swipe
- fling
- grass knot
- laser focus
- low sweep
- mega kick
- mega punch
- psych up
- revenge
- reversal
- rock tomb
- role play
- round
- skitter smack
- snore
- thief
- work up

### Bulbasaur (bulbasaur)

Referência: Brilliant Diamond/Shining Pearl · bulbasaur · forma base usada. Pool 41; PokeAPI 52.

- attract
- charm
- endure
- false swipe
- flash
- grass knot
- grassy terrain
- growth
- light screen
- magical leaf
- nature power
- poison powder
- power whip
- safeguard
- sludge
- strength
- swagger
- sweet scent
- work up
- worry seed

### Charmander (charmander)

Referência: Brilliant Diamond/Shining Pearl · charmander · forma base usada. Pool 60; PokeAPI 55.

- air cutter
- attract
- beat up
- belly drum
- dragon tail
- endure
- false swipe
- fling
- inferno
- rock tomb
- scary face
- smokescreen
- strength
- swagger
- work up

### Squirtle (squirtle)

Referência: Brilliant Diamond/Shining Pearl · squirtle · forma base usada. Pool 61; PokeAPI 53.

- aqua ring
- attract
- brine
- endure
- fake out
- false swipe
- flail
- fling
- haze
- life dew
- mist
- rock tomb
- strength
- swagger
- work up
- yawn

### Pidgey (pidgey)

Referência: ORAS · pidgey · forma base usada. Pool 33; PokeAPI 46.

- air cutter
- attract
- confide
- defog
- feather dance
- feint attack
- foresight
- frustration
- gust
- hidden power
- return
- round
- sand attack
- secret power
- snore
- swagger
- thief
- twister
- uproar
- whirlwind

### Rattata (rattata)

Referência: ORAS · rattata · forma base usada. Pool 44; PokeAPI 62.

- assurance
- attract
- charge beam
- confide
- covet
- endeavor
- final gambit
- frustration
- fury swipes
- grass knot
- hidden power
- hyper fang
- last resort
- me first
- return
- revenge
- reversal
- round
- screech
- secret power
- snore
- super fang
- swagger
- taunt
- thief
- uproar

### Caterpie (caterpie)

Referência: Sword/Shield · caterpie · forma base usada. Pool 1; PokeAPI 4.

- bug bite
- electroweb
- string shot

### Weedle (weedle)

Referência: ORAS · weedle · forma base usada. Pool 1; PokeAPI 4.

- bug bite
- electroweb
- string shot

### Zubat (zubat)

Referência: Sword/Shield · zubat · forma base usada. Pool 43; PokeAPI 52.

- absorb
- air cutter
- assurance
- astonish
- attract
- defog
- endure
- gust
- haze
- mean look
- quick guard
- round
- snore
- taunt
- thief
- uproar
- venom drench
- venoshock
- whirlwind

### Ekans (ekans)

Referência: Brilliant Diamond/Shining Pearl · ekans · forma base usada. Pool 44; PokeAPI 50.

- acid
- acid spray
- attract
- beat up
- belch
- bulldoze
- coil
- disable
- endure
- gastro acid
- glare
- haze
- poison tail
- rock tomb
- scary face
- screech
- slam
- spite
- stockpile
- strength
- swagger
- swallow
- switcheroo
- thief
- torment
- wrap

### Koffing (koffing)

Referência: Brilliant Diamond/Shining Pearl · koffing · forma base usada. Pool 33; PokeAPI 51.

- assurance
- attract
- belch
- clear smog
- destiny bond
- endure
- flash
- grudge
- haze
- memento
- poison gas
- psybeam
- screech
- sludge
- smog
- smokescreen
- spite
- stockpile
- swagger
- swallow
- taunt
- thief
- torment
- venom drench

### Geodude (geodude)

Referência: Brilliant Diamond/Shining Pearl · geodude · forma base usada. Pool 44; PokeAPI 45.

- attract
- block
- bulldoze
- defense curl
- endure
- flail
- fling
- harden
- mega punch
- rock blast
- rock polish
- rock throw
- rock tomb
- smack down
- stealth rock
- strength
- swagger
- wide guard

### Onix (onix)

Referência: Sword/Shield · onix · forma base usada. Pool 41; PokeAPI 59.

- attract
- bind
- block
- breaking swipe
- brutal swing
- bulldoze
- defense curl
- dragon tail
- endure
- flail
- meteor beam
- rock blast
- rock polish
- rock throw
- rock tomb
- round
- sand tomb
- scary face
- scorching sands
- screech
- slam
- smack down
- snore
- stealth rock
- stomping tantrum
- taunt
- wide guard

### Ivysaur (ivysaur)

Referência: Brilliant Diamond/Shining Pearl · ivysaur · forma base usada. Pool 28; PokeAPI 40.

- attract
- cut
- double team
- endure
- false swipe
- flash
- grass knot
- growth
- light screen
- poison powder
- rock smash
- safeguard
- strength
- swagger
- sweet scent
- work up
- worry seed

### Charmeleon (charmeleon)

Referência: Brilliant Diamond/Shining Pearl · charmeleon · forma base usada. Pool 37; PokeAPI 42.

- aerial ace
- attract
- cut
- double team
- endure
- false swipe
- fling
- inferno
- iron tail
- rock smash
- rock tomb
- scary face
- smokescreen
- strength
- swagger
- work up

### Wartortle (wartortle)

Referência: Brilliant Diamond/Shining Pearl · wartortle · forma base usada. Pool 37; PokeAPI 41.

- attract
- brine
- double team
- dragon pulse
- endure
- false swipe
- fling
- hail
- iron tail
- rock smash
- rock tomb
- scald
- skull bash
- strength
- swagger
- waterfall
- work up

### Chikorita (chikorita)

Referência: Brilliant Diamond/Shining Pearl · chikorita · forma base usada. Pool 24; PokeAPI 42.

- ancient power
- aromatherapy
- attract
- counter
- cut
- double team
- endure
- flail
- flash
- grass knot
- grassy terrain
- heal pulse
- ingrain
- iron tail
- light screen
- magical leaf
- nature power
- poison powder
- safeguard
- swagger
- sweet scent
- vine whip
- work up

### Bayleef (bayleef)

Referência: Brilliant Diamond/Shining Pearl · bayleef · forma base usada. Pool 25; PokeAPI 35.

- aromatherapy
- attract
- cut
- double team
- endure
- flash
- grass knot
- iron tail
- light screen
- magical leaf
- nature power
- poison powder
- rock smash
- safeguard
- strength
- swagger
- sweet scent
- work up

### Meganium (meganium)

Referência: Brilliant Diamond/Shining Pearl · meganium · forma base usada. Pool 34; PokeAPI 43.

- aromatherapy
- attract
- bulldoze
- cut
- double team
- endure
- flash
- grass knot
- iron tail
- light screen
- magical leaf
- nature power
- poison powder
- rock climb
- rock smash
- safeguard
- strength
- swagger
- sweet scent
- work up

### Cyndaquil (cyndaquil)

Referência: Brilliant Diamond/Shining Pearl · cyndaquil · forma base usada. Pool 34; PokeAPI 43.

- attract
- burn up
- covet
- crush claw
- cut
- defense curl
- double kick
- double team
- endure
- extrasensory
- fury swipes
- howl
- inferno
- nature power
- reversal
- smokescreen
- swagger
- thrash
- work up

### Quilava (quilava)

Referência: Brilliant Diamond/Shining Pearl · quilava · forma base usada. Pool 35; PokeAPI 38.

- attract
- burn up
- cut
- defense curl
- double team
- endure
- focus punch
- inferno
- roar
- rock smash
- smokescreen
- strength
- swagger
- work up

### Totodile (totodile)

Referência: Brilliant Diamond/Shining Pearl · totodile · forma base usada. Pool 41; PokeAPI 54.

- ancient power
- aqua jet
- attract
- block
- cut
- double team
- endure
- fake tears
- flail
- flatter
- fling
- hail
- iron tail
- mud slap
- rock tomb
- scald
- scary face
- screech
- swagger
- thrash
- work up

### Croconaw (croconaw)

Referência: Brilliant Diamond/Shining Pearl · croconaw · forma base usada. Pool 42; PokeAPI 49.

- attract
- cut
- double team
- endure
- flail
- fling
- hail
- iron tail
- mud slap
- roar
- rock smash
- rock tomb
- scald
- scary face
- screech
- strength
- swagger
- thrash
- work up

### Feraligatr (feraligatr)

Referência: Brilliant Diamond/Shining Pearl · feraligatr · forma base usada. Pool 51; PokeAPI 59.

- attract
- bulldoze
- cut
- double team
- dragon pulse
- endure
- flail
- fling
- hail
- iron tail
- mud slap
- roar
- rock climb
- rock smash
- rock tomb
- scald
- scary face
- screech
- strength
- swagger
- thrash
- work up

### Metapod (metapod)

Referência: Sword/Shield · metapod · forma base usada. Pool 2; PokeAPI 3.

- electroweb

### Butterfree (butterfree)

Referência: Sword/Shield · butterfree · forma base usada. Pool 29; PokeAPI 49.

- attract
- baton pass
- bug bite
- confusion
- dual wingbeat
- electroweb
- endure
- gust
- poison powder
- psybeam
- rage powder
- round
- safeguard
- skill swap
- snore
- string shot
- stun spore
- thief
- venoshock
- whirlwind

### Kakuna (kakuna)

Referência: ORAS · kakuna · forma base usada. Pool 1; PokeAPI 4.

- bug bite
- electroweb
- iron defense

### Beedrill (beedrill)

Referência: ORAS · beedrill · forma base usada. Pool 29; PokeAPI 55.

- assurance
- attract
- bug bite
- confide
- drill run
- electroweb
- endeavor
- false swipe
- fell stinger
- flash
- frustration
- giga drain
- hidden power
- infestation
- knock off
- rage
- return
- round
- secret power
- snore
- struggle bug
- swagger
- tailwind
- thief
- twineedle
- venoshock

### Pidgeotto (pidgeotto)

Referência: ORAS · pidgeotto · forma base usada. Pool 22; PokeAPI 40.

- attract
- confide
- feather dance
- frustration
- gust
- heat wave
- hidden power
- return
- round
- sand attack
- secret power
- sky attack
- snore
- swagger
- thief
- twister
- uproar
- whirlwind

### Raticate (raticate)

Referência: ORAS · raticate · forma base usada. Pool 33; PokeAPI 60.

- assurance
- attract
- charge beam
- confide
- covet
- endeavor
- frustration
- grass knot
- hidden power
- hyper fang
- icy wind
- iron tail
- last resort
- return
- roar
- round
- scary face
- secret power
- shock wave
- snore
- strength
- super fang
- swagger
- taunt
- thief
- uproar
- zen headbutt

### Spearow (spearow)

Referência: ORAS · spearow · forma base usada. Pool 21; PokeAPI 48.

- assurance
- astonish
- attract
- confide
- drill run
- echoed voice
- false swipe
- feather dance
- feint attack
- frustration
- heat wave
- hidden power
- peck
- quick attack
- razor wind
- return
- round
- scary face
- secret power
- sky attack
- snore
- swagger
- tailwind
- thief
- tri attack
- uproar
- whirlwind

### Fearow (fearow)

Referência: ORAS · fearow · forma base usada. Pool 24; PokeAPI 43.

- assurance
- attract
- confide
- echoed voice
- false swipe
- frustration
- heat wave
- hidden power
- peck
- pluck
- return
- round
- secret power
- sky attack
- snore
- swagger
- tailwind
- thief
- uproar

### Arbok (arbok)

Referência: Brilliant Diamond/Shining Pearl · arbok · forma base usada. Pool 38; PokeAPI 47.

- acid
- acid spray
- attract
- belch
- bulldoze
- coil
- double team
- endure
- gastro acid
- glare
- haze
- iron tail
- payback
- rock tomb
- screech
- stockpile
- strength
- swagger
- swallow
- thief
- torment
- wrap

### Raichu (raichu)

Referência: Brilliant Diamond/Shining Pearl · raichu · forma base usada. Pool 35; PokeAPI 49.

- attract
- charge beam
- charm
- endure
- flash
- fling
- grass knot
- light screen
- nuzzle
- play nice
- rock smash
- safeguard
- shock wave
- slam
- spark
- strength
- swagger
- sweet kiss
- thief
- thunder shock
- volt switch

### Sandshrew (sandshrew)

Referência: Brilliant Diamond/Shining Pearl · sandshrew · forma base usada. Pool 41; PokeAPI 53.

- attract
- bulldoze
- counter
- crush claw
- cut
- defense curl
- double team
- endure
- flail
- fling
- fury swipes
- hone claws
- iron tail
- mud slap
- night slash
- rock climb
- rock smash
- rock tomb
- safeguard
- sand attack
- stealth rock
- strength
- swagger
- thief
- work up

### Sandslash (sandslash)

Referência: Brilliant Diamond/Shining Pearl · sandslash · forma base usada. Pool 47; PokeAPI 51.

- attract
- bulldoze
- cut
- defense curl
- double team
- endure
- fling
- fury swipes
- iron tail
- rock climb
- rock smash
- rock tomb
- safeguard
- sand attack
- sand tomb
- stealth rock
- strength
- swagger
- thief
- work up

### Nidoranf (nidoranf)

Referência: Sword/Shield · nidoran-f · forma base usada. Pool 28; PokeAPI 47.

- attract
- beat up
- charm
- counter
- disable
- endure
- flatter
- fury swipes
- helping hand
- poison fang
- poison tail
- round
- skull bash
- snore
- supersonic
- take down
- thief
- venom drench
- venoshock

### Nidorina (nidorina)

Referência: Sword/Shield · nidorina · forma base usada. Pool 28; PokeAPI 41.

- attract
- beat up
- charm
- endure
- flatter
- fury swipes
- helping hand
- round
- snore
- stomping tantrum
- thief
- venom drench
- venoshock

### Nidoqueen (nidoqueen)

Referência: Sword/Shield · nidoqueen · forma base usada. Pool 57; PokeAPI 81.

- attract
- beat up
- bulldoze
- charm
- endure
- flatter
- fling
- fury swipes
- helping hand
- mega kick
- mega punch
- rock blast
- rock tomb
- round
- sand tomb
- scorching sands
- snore
- stealth rock
- stomping tantrum
- taunt
- thief
- uproar
- venom drench
- venoshock

### Nidoranm (nidoranm)

Referência: Sword/Shield · nidoran-m · forma base usada. Pool 28; PokeAPI 50.

- attract
- beat up
- confusion
- counter
- disable
- endure
- flatter
- head smash
- helping hand
- horn drill
- peck
- poison tail
- round
- smart strike
- snore
- sucker punch
- supersonic
- take down
- thief
- thrash
- venom drench
- venoshock

### Nidorino (nidorino)

Referência: Sword/Shield · nidorino · forma base usada. Pool 28; PokeAPI 41.

- attract
- beat up
- endure
- flatter
- helping hand
- peck
- round
- smart strike
- snore
- stomping tantrum
- thief
- venom drench
- venoshock

### Clefairy (clefairy)

Referência: Brilliant Diamond/Shining Pearl · clefairy · forma base usada. Pool 50; PokeAPI 66.

- after you
- attract
- charge beam
- charm
- copycat
- defense curl
- disarming voice
- double team
- dream eater
- encore
- endure
- flash
- fling
- grass knot
- gravity
- healing wish
- iron tail
- life dew
- light screen
- minimize
- pound
- psych up
- recycle
- rock smash
- safeguard
- shock wave
- stealth rock
- stored power
- strength
- swagger
- sweet kiss
- work up

### Vulpix (vulpix)

Referência: Brilliant Diamond/Shining Pearl · vulpix · forma base usada. Pool 32; PokeAPI 44.

- attract
- baby doll eyes
- disable
- double team
- endure
- flail
- grudge
- howl
- hypnosis
- imprison
- incinerate
- inferno
- iron tail
- memento
- payback
- power swap
- psych up
- roar
- safeguard
- spite
- swagger

### Ninetales (ninetales)

Referência: Brilliant Diamond/Shining Pearl · ninetales · forma base usada. Pool 36; PokeAPI 41.

- attract
- disable
- double team
- dream eater
- ember
- endure
- extrasensory
- grudge
- imprison
- incinerate
- inferno
- iron tail
- payback
- psych up
- roar
- safeguard
- spite
- swagger

### Jigglypuff (jigglypuff)

Referência: Brilliant Diamond/Shining Pearl · jigglypuff · forma base usada. Pool 52; PokeAPI 61.

- attract
- charge beam
- charm
- copycat
- covet
- defense curl
- disable
- disarming voice
- double team
- dream eater
- echoed voice
- endure
- flash
- fling
- grass knot
- light screen
- mimic
- pound
- psych up
- recycle
- round
- safeguard
- shock wave
- stealth rock
- stockpile
- strength
- swagger
- swallow
- sweet kiss
- work up

### Wigglytuff (wigglytuff)

Referência: Brilliant Diamond/Shining Pearl · wigglytuff · forma base usada. Pool 55; PokeAPI 64.

- attract
- charge beam
- charm
- copycat
- covet
- defense curl
- disable
- disarming voice
- double team
- dream eater
- echoed voice
- endure
- flash
- fling
- grass knot
- light screen
- mimic
- pound
- psych up
- recycle
- round
- safeguard
- shock wave
- stealth rock
- stockpile
- strength
- swagger
- swallow
- sweet kiss
- work up

### Golbat (golbat)

Referência: Sword/Shield · golbat · forma base usada. Pool 30; PokeAPI 48.

- absorb
- air cutter
- assurance
- astonish
- attract
- dual wingbeat
- endure
- haze
- mean look
- quick guard
- round
- screech
- snore
- taunt
- thief
- uproar
- venom drench
- venoshock

### Oddish (oddish)

Referência: Brilliant Diamond/Shining Pearl · oddish · forma base usada. Pool 20; PokeAPI 44.

- absorb
- acid
- after you
- attract
- charm
- cut
- dazzling gleam
- double team
- endure
- flail
- flash
- grass knot
- grassy terrain
- growth
- ingrain
- leech seed
- mega drain
- nature power
- poison powder
- razor leaf
- strength sap
- stun spore
- swagger
- sweet scent
- synthesis
- teeter dance
- tickle

### Gloom (gloom)

Referência: Brilliant Diamond/Shining Pearl · gloom · forma base usada. Pool 22; PokeAPI 35.

- absorb
- acid
- attract
- cut
- dazzling gleam
- double team
- drain punch
- endure
- flash
- fling
- grass knot
- grassy terrain
- growth
- mega drain
- poison powder
- stun spore
- swagger
- sweet scent

### Vileplume (vileplume)

Referência: Brilliant Diamond/Shining Pearl · vileplume · forma base usada. Pool 27; PokeAPI 40.

- absorb
- acid
- aromatherapy
- attract
- cut
- double team
- drain punch
- endure
- flash
- fling
- grass knot
- grassy terrain
- growth
- mega drain
- poison powder
- safeguard
- stun spore
- swagger
- sweet scent

### Paras (paras)

Referência: ORAS · paras · forma base usada. Pool 24; PokeAPI 68.

- after you
- agility
- aromatherapy
- attract
- bug bite
- confide
- counter
- cross poison
- endure
- false swipe
- fell stinger
- flail
- flash
- frustration
- grass knot
- growth
- hidden power
- hone claws
- knock off
- leech seed
- light screen
- metal claw
- natural gift
- nature power
- poison powder
- psybeam
- pursuit
- rage powder
- return
- rototiller
- round
- screech
- secret power
- seed bomb
- snore
- struggle bug
- stun spore
- swagger
- sweet scent
- synthesis
- thief
- venoshock
- wide guard
- worry seed

### Parasect (parasect)

Referência: ORAS · parasect · forma base usada. Pool 27; PokeAPI 56.

- after you
- aromatherapy
- attract
- bug bite
- confide
- false swipe
- flash
- frustration
- grass knot
- growth
- hidden power
- hone claws
- knock off
- light screen
- nature power
- poison powder
- rage powder
- return
- round
- secret power
- seed bomb
- snore
- struggle bug
- stun spore
- swagger
- synthesis
- thief
- venoshock
- worry seed

### Venonat (venonat)

Referência: Brilliant Diamond/Shining Pearl · venonat · forma base usada. Pool 25; PokeAPI 37.

- attract
- baton pass
- bug bite
- confusion
- disable
- double team
- endure
- flash
- mega drain
- morning sun
- poison powder
- psybeam
- rage powder
- screech
- skill swap
- struggle bug
- stun spore
- swagger
- thief

### Venomoth (venomoth)

Referência: Brilliant Diamond/Shining Pearl · venomoth · forma base usada. Pool 33; PokeAPI 41.

- aerial ace
- attract
- confusion
- defog
- disable
- double team
- endure
- flash
- gust
- mega drain
- poison powder
- psybeam
- roost
- skill swap
- struggle bug
- stun spore
- swagger
- thief
- whirlwind

### Diglett (diglett)

Referência: Brilliant Diamond/Shining Pearl · diglett · forma base usada. Pool 27; PokeAPI 42.

- aerial ace
- ancient power
- astonish
- attract
- beat up
- bulldoze
- cut
- double team
- endure
- final gambit
- fissure
- headbutt
- hone claws
- memento
- mud slap
- reversal
- rock smash
- rock tomb
- sand attack
- screech
- stealth rock
- swagger
- thief
- uproar
- work up

### Meowth (meowth)

Referência: Brilliant Diamond/Shining Pearl · meowth · forma base usada. Pool 40; PokeAPI 52.

- assurance
- attract
- charm
- covet
- cut
- double team
- dream eater
- endure
- fake out
- flail
- flash
- fury swipes
- hypnosis
- iron tail
- last resort
- payback
- psych up
- screech
- shock wave
- spite
- swagger
- tail whip
- taunt
- thief
- torment
- water pulse
- work up

### Psyduck (psyduck)

Referência: Brilliant Diamond/Shining Pearl · psyduck · forma base usada. Pool 41; PokeAPI 54.

- aerial ace
- attract
- brine
- clear smog
- confusion
- cross chop
- disable
- double team
- encore
- endure
- flash
- fling
- fury swipes
- future sight
- hail
- hypnosis
- iron tail
- light screen
- psybeam
- psych up
- rock smash
- scald
- screech
- simple beam
- soak
- strength
- swagger
- wonder room
- yawn

### Golduck (golduck)

Referência: Brilliant Diamond/Shining Pearl · golduck · forma base usada. Pool 47; PokeAPI 51.

- aerial ace
- attract
- brine
- confusion
- disable
- double team
- endure
- flash
- fling
- fury swipes
- hail
- iron tail
- light screen
- low sweep
- psych up
- rock climb
- rock smash
- scald
- screech
- soak
- strength
- swagger
- wonder room

### Mankey (mankey)

Referência: Brilliant Diamond/Shining Pearl · mankey · forma base usada. Pool 41; PokeAPI 60.

- aerial ace
- assurance
- attract
- beat up
- bulldoze
- counter
- covet
- cross chop
- double team
- encore
- endure
- final gambit
- fling
- fury swipes
- iron tail
- low sweep
- mud slap
- night slash
- payback
- retaliate
- revenge
- reversal
- rock climb
- rock smash
- rock tomb
- screech
- skull bash
- stomping tantrum
- strength
- swagger
- taunt
- thief
- thrash
- thunder
- work up

### Primeape (primeape)

Referência: Brilliant Diamond/Shining Pearl · primeape · forma base usada. Pool 44; PokeAPI 57.

- aerial ace
- assurance
- attract
- bulldoze
- covet
- cross chop
- double team
- endure
- final gambit
- fling
- fury swipes
- iron tail
- low sweep
- mud slap
- payback
- retaliate
- rock climb
- rock smash
- rock tomb
- screech
- skull bash
- stomping tantrum
- strength
- swagger
- taunt
- thief
- thrash
- work up

### Growlithe (growlithe)

Referência: Brilliant Diamond/Shining Pearl · growlithe · forma base usada. Pool 34; PokeAPI 47.

- aerial ace
- attract
- burn up
- covet
- double kick
- double team
- endure
- helping hand
- howl
- iron tail
- morning sun
- reversal
- roar
- rock smash
- safeguard
- snarl
- strength
- swagger
- thief
- thrash

### Poliwag (poliwag)

Referência: Brilliant Diamond/Shining Pearl · poliwag · forma base usada. Pool 29; PokeAPI 37.

- attract
- belly drum
- bubble beam
- bulldoze
- double team
- encore
- endeavor
- endure
- hail
- haze
- mind reader
- mist
- pound
- scald
- splash
- swagger
- thief

### Poliwhirl (poliwhirl)

Referência: Brilliant Diamond/Shining Pearl · poliwhirl · forma base usada. Pool 33; PokeAPI 37.

- attract
- belly drum
- bubble beam
- bulldoze
- double team
- endure
- fling
- hail
- pound
- rock smash
- scald
- strength
- swagger
- thief

### Poliwrath (poliwrath)

Referência: Brilliant Diamond/Shining Pearl · poliwrath · forma base usada. Pool 44; PokeAPI 53.

- attract
- belly drum
- bubble beam
- bulldoze
- circle throw
- double team
- endure
- fling
- hail
- low sweep
- mind reader
- payback
- pound
- rock climb
- rock smash
- rock tomb
- scald
- strength
- submission
- swagger
- thief
- water gun
- work up

### Abra (abra)

Referência: Sword/Shield · abra · forma base usada. Pool 27; PokeAPI 53.

- ally switch
- attract
- confusion
- encore
- endure
- fling
- grass knot
- guard split
- guard swap
- light screen
- magic coat
- magic room
- mega kick
- mega punch
- power swap
- psychic terrain
- round
- safeguard
- skill swap
- snore
- speed swap
- taunt
- thief
- trick
- trick room
- wonder room

### Kadabra (kadabra)

Referência: Sword/Shield · kadabra · forma base usada. Pool 30; PokeAPI 59.

- ally switch
- attract
- confusion
- disable
- encore
- endure
- expanding force
- fling
- grass knot
- guard swap
- kinesis
- light screen
- magic room
- mega kick
- mega punch
- power swap
- psybeam
- psychic terrain
- role play
- round
- safeguard
- skill swap
- snore
- speed swap
- taunt
- thief
- trick
- trick room
- wonder room

### Machop (machop)

Referência: Sword/Shield · machop · forma base usada. Pool 33; PokeAPI 61.

- attract
- bulldoze
- bullet punch
- coaching
- counter
- cross chop
- dual chop
- encore
- endure
- fling
- helping hand
- light screen
- low sweep
- mega kick
- mega punch
- quick guard
- revenge
- reversal
- rock tomb
- round
- scary face
- snore
- strength
- submission
- thief
- tickle
- vital throw
- work up

### Machoke (machoke)

Referência: Sword/Shield · machoke · forma base usada. Pool 33; PokeAPI 57.

- attract
- bulldoze
- coaching
- cross chop
- dual chop
- encore
- endure
- fling
- helping hand
- light screen
- low sweep
- mega kick
- mega punch
- revenge
- reversal
- rock tomb
- round
- scary face
- snore
- stomping tantrum
- strength
- thief
- vital throw
- work up

### Machamp (machamp)

Referência: Sword/Shield · machamp · forma base usada. Pool 39; PokeAPI 67.

- assurance
- attract
- bulldoze
- coaching
- cross chop
- darkest lariat
- dual chop
- encore
- endure
- fling
- helping hand
- light screen
- low sweep
- mega kick
- mega punch
- revenge
- reversal
- rock blast
- rock tomb
- round
- scary face
- snore
- stomping tantrum
- strength
- thief
- vital throw
- wide guard
- work up

### Bellsprout (bellsprout)

Referência: Brilliant Diamond/Shining Pearl · bellsprout · forma base usada. Pool 25; PokeAPI 47.

- acid
- acid spray
- attract
- belch
- clear smog
- cut
- double team
- encore
- endure
- flash
- gastro acid
- grass knot
- growth
- ingrain
- magical leaf
- poison powder
- power whip
- slam
- strength sap
- stun spore
- swagger
- sweet scent
- synthesis
- thief
- tickle
- weather ball
- worry seed
- wrap

### Weepinbell (weepinbell)

Referência: Brilliant Diamond/Shining Pearl · weepinbell · forma base usada. Pool 27; PokeAPI 34.

- acid
- attract
- cut
- double team
- endure
- flash
- gastro acid
- grass knot
- growth
- poison powder
- slam
- stun spore
- swagger
- sweet scent
- thief
- wrap

### Victreebel (victreebel)

Referência: Brilliant Diamond/Shining Pearl · victreebel · forma base usada. Pool 30; PokeAPI 42.

- acid
- attract
- cut
- double team
- endure
- flash
- gastro acid
- grass knot
- growth
- leaf tornado
- poison powder
- slam
- spit up
- stockpile
- stun spore
- swagger
- swallow
- sweet scent
- thief
- wrap

### Tentacool (tentacool)

Referência: Brilliant Diamond/Shining Pearl · tentacool · forma base usada. Pool 34; PokeAPI 48.

- acid
- acid armor
- acupressure
- aqua ring
- attract
- aurora beam
- brine
- bubble beam
- cut
- double team
- endure
- hail
- haze
- mirror coat
- payback
- rapid spin
- safeguard
- scald
- screech
- swagger
- thief
- tickle
- waterfall
- wrap

### Tentacruel (tentacruel)

Referência: Brilliant Diamond/Shining Pearl · tentacruel · forma base usada. Pool 36; PokeAPI 41.

- acid
- acid armor
- attract
- brine
- bubble beam
- cut
- double team
- endure
- hail
- payback
- reflect type
- safeguard
- scald
- screech
- swagger
- thief
- waterfall
- wrap

### Graveler (graveler)

Referência: Brilliant Diamond/Shining Pearl · graveler · forma base usada. Pool 35; PokeAPI 38.

- attract
- bulldoze
- defense curl
- double team
- endure
- fling
- harden
- rock blast
- rock climb
- rock polish
- rock smash
- rock throw
- rock tomb
- smack down
- stealth rock
- strength
- swagger

### Golem (golem)

Referência: Brilliant Diamond/Shining Pearl · golem · forma base usada. Pool 36; PokeAPI 43.

- attract
- bulldoze
- defense curl
- double team
- endure
- fling
- harden
- roar
- rock blast
- rock climb
- rock polish
- rock smash
- rock throw
- rock tomb
- rollout
- smack down
- stealth rock
- strength
- swagger

### Ponyta (ponyta)

Referência: Sword/Shield · ponyta · forma base usada. Pool 31; PokeAPI 46.

- ally switch
- attract
- charm
- double edge
- double kick
- endure
- horn drill
- hypnosis
- inferno
- morning sun
- round
- snore
- solar blade
- stomp
- thrash

### Rapidash (rapidash)

Referência: Sword/Shield · rapidash · forma base usada. Pool 40; PokeAPI 52.

- ally switch
- attract
- baton pass
- charm
- endure
- inferno
- round
- scorching sands
- smart strike
- snore
- solar blade
- stomp

### Slowpoke (slowpoke)

Referência: Brilliant Diamond/Shining Pearl · slowpoke · forma base usada. Pool 39; PokeAPI 57.

- attract
- belch
- belly drum
- block
- brine
- bulldoze
- confusion
- disable
- double team
- dream eater
- endure
- flash
- future sight
- grass knot
- hail
- heal pulse
- iron tail
- light screen
- psych up
- recycle
- safeguard
- scald
- skill swap
- snore
- stomp
- strength
- swagger
- trick room
- wonder room
- yawn

### Slowbro (slowbro)

Referência: Brilliant Diamond/Shining Pearl · slowbro · forma base usada. Pool 54; PokeAPI 62.

- aerial ace
- attract
- brine
- bulldoze
- confusion
- disable
- double team
- dream eater
- endure
- flash
- fling
- grass knot
- hail
- heal pulse
- iron tail
- light screen
- psych up
- recycle
- rock smash
- safeguard
- skill swap
- strength
- swagger
- trick room
- yawn

### Magnemite (magnemite)

Referência: Brilliant Diamond/Shining Pearl · magnemite · forma base usada. Pool 27; PokeAPI 35.

- charge beam
- double team
- endure
- explosion
- flash
- light screen
- lock on
- psych up
- recycle
- screech
- shock wave
- spark
- swagger
- thunder shock
- volt switch
- zap cannon

### Magneton (magneton)

Referência: Brilliant Diamond/Shining Pearl · magneton · forma base usada. Pool 29; PokeAPI 39.

- charge beam
- double team
- electric terrain
- endure
- explosion
- flash
- giga impact
- light screen
- lock on
- psych up
- recycle
- screech
- shock wave
- spark
- swagger
- thunder shock
- volt switch
- zap cannon

### Farfetchd (farfetchd)

Referência: Sword/Shield · farfetchd · forma base usada. Pool 30; PokeAPI 60.

- air cutter
- attract
- baton pass
- brutal swing
- covet
- curse
- dual wingbeat
- endure
- false swipe
- feather dance
- feint
- final gambit
- first impression
- flail
- gust
- helping hand
- night slash
- peck
- quick attack
- revenge
- roost
- round
- sand attack
- simple beam
- sky attack
- snore
- solar blade
- thief
- uproar
- work up

### Doduo (doduo)

Referência: Brilliant Diamond/Shining Pearl · doduo · forma base usada. Pool 25; PokeAPI 37.

- acupressure
- assurance
- attract
- double hit
- double team
- endeavor
- endure
- flail
- fly
- haze
- leer
- peck
- pluck
- roost
- steel wing
- supersonic
- swagger
- thief
- thrash
- uproar
- wing attack
- work up

### Seel (seel)

Referência: Brilliant Diamond/Shining Pearl · seel · forma base usada. Pool 29; PokeAPI 45.

- aqua ring
- attract
- aurora beam
- belch
- brine
- disable
- dive
- double team
- encore
- endure
- entrainment
- fake out
- fling
- hail
- horn drill
- icicle spear
- iron tail
- lick
- perish song
- safeguard
- slam
- spit up
- stockpile
- swagger
- swallow
- thief
- water gun

### Dewgong (dewgong)

Referência: Brilliant Diamond/Shining Pearl · dewgong · forma base usada. Pool 34; PokeAPI 38.

- aqua ring
- attract
- aurora beam
- brine
- bubble beam
- dive
- double team
- encore
- endure
- fling
- hail
- iron tail
- safeguard
- sheer cold
- swagger
- thief
- water gun

### Grimer (grimer)

Referência: Brilliant Diamond/Shining Pearl · grimer · forma base usada. Pool 35; PokeAPI 57.

- acid armor
- acid spray
- attract
- belch
- disable
- double team
- endure
- explosion
- fling
- haze
- imprison
- lick
- mean look
- memento
- minimize
- mud slap
- payback
- poison gas
- pound
- power up punch
- rock tomb
- scary face
- screech
- shadow punch
- shadow sneak
- shock wave
- sludge
- smog
- spit up
- stockpile
- strength
- swagger
- swallow
- taunt
- thief
- torment

### Muk (muk)

Referência: Brilliant Diamond/Shining Pearl · muk · forma base usada. Pool 45; PokeAPI 52.

- acid armor
- attract
- belch
- disable
- double team
- endure
- explosion
- fling
- memento
- minimize
- mud slap
- payback
- poison gas
- pound
- rock smash
- rock tomb
- screech
- shock wave
- sludge
- smog
- strength
- swagger
- taunt
- thief
- torment
- venom drench

### Shellder (shellder)

Referência: Brilliant Diamond/Shining Pearl · shellder · forma base usada. Pool 30; PokeAPI 40.

- aqua ring
- attract
- aurora beam
- brine
- bubble beam
- double team
- endure
- explosion
- hail
- icicle spear
- life dew
- payback
- rapid spin
- razor shell
- rock blast
- screech
- swagger

### Cloyster (cloyster)

Referência: Brilliant Diamond/Shining Pearl · cloyster · forma base usada. Pool 36; PokeAPI 40.

- attract
- aurora beam
- brine
- double team
- endure
- explosion
- hail
- icicle spear
- light screen
- payback
- razor shell
- swagger
- torment

### Gastly (gastly)

Referência: Brilliant Diamond/Shining Pearl · gastly · forma base usada. Pool 36; PokeAPI 53.

- astonish
- attract
- clear smog
- destiny bond
- disable
- double team
- dream eater
- endure
- explosion
- grudge
- haze
- mean look
- night shade
- perish song
- psych up
- reflect type
- scary face
- skill swap
- smog
- spite
- swagger
- taunt
- thief
- torment
- trick room

### Haunter (haunter)

Referência: Brilliant Diamond/Shining Pearl · haunter · forma base usada. Pool 42; PokeAPI 44.

- attract
- destiny bond
- double team
- dream eater
- endure
- explosion
- fling
- mean look
- night shade
- psych up
- skill swap
- spite
- swagger
- taunt
- thief
- torment
- trick room

### Drowzee (drowzee)

Referência: Brilliant Diamond/Shining Pearl · drowzee · forma base usada. Pool 37; PokeAPI 54.

- attract
- confusion
- disable
- double team
- dream eater
- endure
- flash
- flatter
- fling
- grass knot
- guard swap
- light screen
- low sweep
- mind reader
- poison gas
- pound
- power split
- psybeam
- psych up
- psycho cut
- recycle
- role play
- safeguard
- skill swap
- swagger
- taunt
- thief
- torment
- trick room

### Hypno (hypno)

Referência: Brilliant Diamond/Shining Pearl · hypno · forma base usada. Pool 42; PokeAPI 50.

- attract
- confusion
- disable
- double team
- dream eater
- endure
- flash
- fling
- grass knot
- light screen
- low sweep
- mind reader
- poison gas
- pound
- psybeam
- psych up
- recycle
- safeguard
- skill swap
- swagger
- switcheroo
- taunt
- thief
- torment
- trick room

### Krabby (krabby)

Referência: Sword/Shield · krabby · forma base usada. Pool 30; PokeAPI 52.

- ally switch
- ancient power
- attract
- brine
- bubble beam
- dive
- endure
- false swipe
- flail
- fling
- guillotine
- hammer arm
- knock off
- night slash
- razor shell
- rock tomb
- round
- slam
- slash
- snore
- stomp
- thief

### Kingler (kingler)

Referência: Sword/Shield · kingler · forma base usada. Pool 35; PokeAPI 55.

- ally switch
- attract
- brine
- brutal swing
- bubble beam
- dive
- endure
- false swipe
- flail
- fling
- guillotine
- razor shell
- rock tomb
- round
- slam
- snore
- stomp
- stomping tantrum
- thief
- wide guard

### Voltorb (voltorb)

Referência: Brilliant Diamond/Shining Pearl · voltorb · forma base usada. Pool 25; PokeAPI 35.

- charge
- charge beam
- double team
- eerie impulse
- endure
- flash
- light screen
- screech
- shock wave
- spark
- swagger
- taunt
- thief
- thunder shock
- torment
- volt switch

### Electrode (electrode)

Referência: Brilliant Diamond/Shining Pearl · electrode · forma base usada. Pool 28; PokeAPI 38.

- charge
- charge beam
- double team
- eerie impulse
- endure
- flash
- light screen
- magnetic flux
- screech
- shock wave
- spark
- swagger
- taunt
- thief
- thunder shock
- torment
- volt switch

### Exeggcute (exeggcute)

Referência: Brilliant Diamond/Shining Pearl · exeggcute · forma base usada. Pool 24; PokeAPI 49.

- absorb
- ancient power
- attract
- block
- confusion
- double team
- dream eater
- endure
- explosion
- flash
- grass knot
- grassy terrain
- ingrain
- light screen
- mega drain
- moonlight
- nature power
- poison powder
- power swap
- psych up
- skill swap
- sleep powder
- strength
- stun spore
- swagger
- thief
- trick room
- uproar
- worry seed

### Cubone (cubone)

Referência: Sword/Shield · cubone · forma base usada. Pool 33; PokeAPI 62.

- ancient power
- attract
- belly drum
- bonemerang
- brutal swing
- bulldoze
- curse
- detect
- double kick
- endeavor
- endure
- false swipe
- fling
- leer
- mega kick
- mega punch
- mud slap
- perish song
- rock tomb
- round
- scorching sands
- screech
- skull bash
- snore
- stealth rock
- stomping tantrum
- thief
- thrash
- uproar

### Marowak (marowak)

Referência: Sword/Shield · marowak · forma base usada. Pool 39; PokeAPI 60.

- attract
- bonemerang
- brutal swing
- bulldoze
- endeavor
- endure
- false swipe
- fling
- mega kick
- mega punch
- mud slap
- rock tomb
- round
- scorching sands
- screech
- snore
- stealth rock
- stomping tantrum
- thief
- thrash
- uproar

### Hitmonlee (hitmonlee)

Referência: Brilliant Diamond/Shining Pearl · hitmonlee · forma base usada. Pool 34; PokeAPI 43.

- attract
- bulldoze
- double team
- endure
- fake out
- fling
- focus punch
- helping hand
- low sweep
- mega kick
- mind reader
- revenge
- reversal
- rock climb
- rock smash
- rock tomb
- strength
- swagger
- thief
- wide guard
- work up

### Hitmonchan (hitmonchan)

Referência: Brilliant Diamond/Shining Pearl · hitmonchan · forma base usada. Pool 38; PokeAPI 47.

- attract
- bulldoze
- detect
- double team
- endure
- fake out
- fling
- helping hand
- low sweep
- mega punch
- power up punch
- quick guard
- revenge
- rock climb
- rock smash
- rock tomb
- strength
- swagger
- thief
- vacuum wave
- work up

### Lickitung (lickitung)

Referência: Sword/Shield · lickitung · forma base usada. Pool 41; PokeAPI 69.

- attract
- belch
- belly drum
- brutal swing
- bulldoze
- curse
- defense curl
- disable
- endure
- fling
- hammer arm
- helping hand
- mega kick
- mega punch
- power whip
- rock tomb
- round
- screech
- slam
- snore
- steel roller
- stomp
- stomping tantrum
- terrain pulse
- thief
- thrash
- work up
- wrap

### Weezing (weezing)

Referência: Brilliant Diamond/Shining Pearl · weezing · forma base usada. Pool 30; PokeAPI 44.

- assurance
- attract
- belch
- clear smog
- destiny bond
- double hit
- double team
- endure
- flash
- haze
- memento
- payback
- poison gas
- shock wave
- sludge
- smog
- smokescreen
- swagger
- taunt
- thief
- torment

### Rhyhorn (rhyhorn)

Referência: Brilliant Diamond/Shining Pearl · rhyhorn · forma base usada. Pool 40; PokeAPI 60.

- attract
- bulldoze
- counter
- crush claw
- double team
- dragon rush
- endure
- guard split
- horn drill
- iron tail
- metal burst
- payback
- reversal
- roar
- rock blast
- rock climb
- rock polish
- rock smash
- rock tomb
- scary face
- shock wave
- skull bash
- smack down
- stealth rock
- stomp
- strength
- swagger
- thief

### Chansey (chansey)

Referência: Brilliant Diamond/Shining Pearl · chansey · forma base usada. Pool 42; PokeAPI 78.

- aromatherapy
- attract
- bulldoze
- charge beam
- charm
- copycat
- counter
- covet
- defense curl
- disarming voice
- double team
- dream eater
- echoed voice
- endure
- flash
- fling
- focus punch
- grass knot
- gravity
- hail
- heal bell
- heal pulse
- healing wish
- helping hand
- iron tail
- last resort
- life dew
- light screen
- minimize
- pound
- present
- psych up
- recycle
- rock climb
- rock smash
- rock tomb
- safeguard
- seismic toss
- shock wave
- skill swap
- soft boiled
- stealth rock
- strength
- swagger
- sweet kiss
- work up

### Tangela (tangela)

Referência: Sword/Shield · tangela · forma base usada. Pool 24; PokeAPI 48.

- absorb
- attract
- bind
- confusion
- endeavor
- endure
- flail
- grass knot
- grassy glide
- grassy terrain
- growth
- leech seed
- mega drain
- nature power
- poison powder
- power swap
- power whip
- rage powder
- round
- slam
- snore
- stun spore
- thief
- tickle

### Kangaskhan (kangaskhan)

Referência: Sword/Shield · kangaskhan · forma base usada. Pool 46; PokeAPI 75.

- assurance
- attract
- beat up
- bulldoze
- circle throw
- counter
- disable
- double edge
- double hit
- endeavor
- endure
- fake out
- fling
- hammer arm
- helping hand
- last resort
- mega kick
- mega punch
- pound
- reversal
- rock tomb
- round
- safeguard
- snore
- stomp
- terrain pulse
- thief
- uproar
- work up

### Horsea (horsea)

Referência: Brilliant Diamond/Shining Pearl · horsea · forma base usada. Pool 27; PokeAPI 39.

- attract
- aurora beam
- brine
- bubble beam
- clear smog
- disable
- double team
- endure
- flail
- hail
- laser focus
- octazooka
- scald
- smokescreen
- splash
- swagger
- twister

### Seadra (seadra)

Referência: Brilliant Diamond/Shining Pearl · seadra · forma base usada. Pool 29; PokeAPI 33.

- attract
- brine
- bubble beam
- double team
- endure
- hail
- laser focus
- scald
- smokescreen
- swagger
- twister

### Goldeen (goldeen)

Referência: Sword/Shield · goldeen · forma base usada. Pool 30; PokeAPI 48.

- acupressure
- aqua ring
- aqua tail
- attract
- dive
- endure
- flail
- flip turn
- haze
- horn drill
- mud slap
- peck
- psybeam
- round
- scale shot
- smart strike
- snore
- soak

### Seaking (seaking)

Referência: Sword/Shield · seaking · forma base usada. Pool 32; PokeAPI 45.

- aqua ring
- attract
- dive
- endure
- flail
- flip turn
- horn drill
- peck
- round
- scale shot
- smart strike
- snore
- soak

### Staryu (staryu)

Referência: Sword/Shield · staryu · forma base usada. Pool 33; PokeAPI 42.

- brine
- dive
- endure
- flip turn
- light screen
- minimize
- psybeam
- round
- snore

### Starmie (starmie)

Referência: Sword/Shield · starmie · forma base usada. Pool 39; PokeAPI 56.

- ally switch
- brine
- dive
- endure
- expanding force
- flip turn
- grass knot
- light screen
- meteor beam
- minimize
- psybeam
- round
- skill swap
- snore
- trick
- trick room
- wonder room

### Mrmime (mrmime)

Referência: Sword/Shield · mr-mime · forma base usada. Pool 37; PokeAPI 82.

- ally switch
- attract
- baton pass
- charm
- confuse ray
- confusion
- copycat
- encore
- endure
- expanding force
- fake out
- fling
- grass knot
- guard swap
- helping hand
- hypnosis
- light screen
- magic room
- magical leaf
- mega kick
- mega punch
- mimic
- misty terrain
- pound
- power split
- power swap
- psybeam
- psychic terrain
- quick guard
- recycle
- role play
- round
- safeguard
- skill swap
- snore
- stored power
- taunt
- teeter dance
- thief
- tickle
- trick
- trick room
- uproar
- wide guard
- wonder room

### Jynx (jynx)

Referência: Sword/Shield · jynx · forma base usada. Pool 35; PokeAPI 70.

- ally switch
- attract
- charm
- confusion
- copycat
- covet
- encore
- endure
- expanding force
- fake tears
- fling
- grass knot
- helping hand
- icicle spear
- light screen
- lovely kiss
- magic room
- mean look
- mega kick
- mega punch
- pound
- powder snow
- psychic terrain
- round
- skill swap
- snore
- stored power
- sweet kiss
- taunt
- thief
- trick
- trick room
- triple axel
- uproar
- wonder room

### Electabuzz (electabuzz)

Referência: Brilliant Diamond/Shining Pearl · electabuzz · forma base usada. Pool 33; PokeAPI 40.

- attract
- charge
- charge beam
- double team
- endure
- flash
- fling
- iron tail
- light screen
- low sweep
- rock climb
- rock smash
- screech
- strength
- swagger
- thief
- thunder shock
- volt switch

### Magmar (magmar)

Referência: Brilliant Diamond/Shining Pearl · magmar · forma base usada. Pool 36; PokeAPI 38.

- attract
- clear smog
- double team
- endure
- fling
- iron tail
- low sweep
- rock climb
- rock smash
- scary face
- smog
- smokescreen
- strength
- swagger
- thief

### Pinsir (pinsir)

Referência: Sword/Shield · pinsir · forma base usada. Pool 27; PokeAPI 55.

- attract
- bind
- brutal swing
- bug bite
- bulldoze
- double hit
- endure
- false swipe
- feint
- flail
- fling
- fury attack
- guillotine
- helping hand
- quick attack
- revenge
- reversal
- rock tomb
- round
- snore
- stealth rock
- storm throw
- strength
- submission
- thief
- thrash
- vice grip
- vital throw

### Magikarp (magikarp)

Referência: Brilliant Diamond/Shining Pearl · magikarp · forma base usada. Pool 2; PokeAPI 3.

- flail

### Eevee (eevee)

Referência: Brilliant Diamond/Shining Pearl · eevee · forma base usada. Pool 21; PokeAPI 41.

- attract
- baby doll eyes
- baton pass
- charm
- copycat
- covet
- detect
- double kick
- double team
- endure
- fake tears
- flail
- helping hand
- iron tail
- last resort
- mud slap
- sand attack
- stored power
- swagger
- tickle
- wish
- work up
- yawn

### Vaporeon (vaporeon)

Referência: Brilliant Diamond/Shining Pearl · vaporeon · forma base usada. Pool 36; PokeAPI 51.

- acid armor
- aqua ring
- attract
- aurora beam
- baby doll eyes
- baton pass
- brine
- charm
- copycat
- covet
- double team
- endure
- hail
- haze
- helping hand
- iron tail
- last resort
- roar
- rock smash
- sand attack
- strength
- swagger
- work up

### Flareon (flareon)

Referência: Brilliant Diamond/Shining Pearl · flareon · forma base usada. Pool 33; PokeAPI 47.

- attract
- baby doll eyes
- baton pass
- charm
- copycat
- covet
- double team
- endure
- helping hand
- iron tail
- last resort
- roar
- rock smash
- sand attack
- scary face
- smog
- strength
- swagger
- work up

### Porygon (porygon)

Referência: Brilliant Diamond/Shining Pearl · porygon · forma base usada. Pool 30; PokeAPI 43.

- aerial ace
- charge beam
- conversion
- conversion 2
- double team
- dream eater
- endure
- flash
- iron tail
- lock on
- magic coat
- psybeam
- psych up
- recycle
- shock wave
- swagger
- thief
- thunder shock
- trick room
- zap cannon

### Omanyte (omanyte)

Referência: Sword/Shield · omanyte · forma base usada. Pool 31; PokeAPI 54.

- attract
- aurora beam
- bind
- bite
- brine
- bubble beam
- dive
- endure
- haze
- knock off
- meteor beam
- reflect type
- rock blast
- rock tomb
- round
- sand attack
- slam
- snore
- stealth rock
- supersonic
- thief
- tickle
- water pulse

### Omastar (omastar)

Referência: Sword/Shield · omastar · forma base usada. Pool 37; PokeAPI 50.

- attract
- bind
- brine
- dive
- endure
- meteor beam
- rock blast
- rock tomb
- round
- sand attack
- snore
- stealth rock
- thief

### Kabuto (kabuto)

Referência: Sword/Shield · kabuto · forma base usada. Pool 32; PokeAPI 53.

- absorb
- attract
- aurora beam
- brine
- bubble beam
- confuse ray
- endure
- flail
- knock off
- mega drain
- meteor beam
- rapid spin
- rock blast
- rock tomb
- round
- sand attack
- screech
- snore
- stealth rock
- take down
- thief

### Kabutops (kabutops)

Referência: Sword/Shield · kabutops · forma base usada. Pool 44; PokeAPI 61.

- absorb
- attract
- brine
- dive
- endure
- flip turn
- mega kick
- meteor beam
- razor shell
- rock blast
- rock tomb
- round
- sand attack
- screech
- snore
- stealth rock
- thief

### Aerodactyl (aerodactyl)

Referência: Sword/Shield · aerodactyl · forma base usada. Pool 38; PokeAPI 60.

- assurance
- attract
- brutal swing
- bulldoze
- curse
- dragon breath
- dual wingbeat
- endure
- meteor beam
- roar
- rock blast
- rock tomb
- roost
- round
- scary face
- snore
- stealth rock
- tailwind
- taunt
- thief
- whirlwind
- wide guard

### Articuno (articuno)

Referência: Brilliant Diamond/Shining Pearl · articuno · forma base usada. Pool 34; PokeAPI 39.

- defog
- double team
- endure
- gust
- hail
- mind reader
- mist
- pluck
- powder snow
- roar
- rock smash
- sheer cold
- steel wing
- swagger

### Zapdos (zapdos)

Referência: Brilliant Diamond/Shining Pearl · zapdos · forma base usada. Pool 32; PokeAPI 41.

- charge
- charge beam
- defog
- detect
- double team
- endure
- flash
- hail
- light screen
- magnetic flux
- peck
- pluck
- roar
- rock smash
- shock wave
- steel wing
- swagger
- thunder shock
- volt switch
- zap cannon

### Moltres (moltres)

Referência: Brilliant Diamond/Shining Pearl · moltres · forma base usada. Pool 38; PokeAPI 40.

- burn up
- defog
- double team
- endure
- gust
- incinerate
- pluck
- roar
- rock smash
- safeguard
- steel wing
- swagger

### Dratini (dratini)

Referência: Brilliant Diamond/Shining Pearl · dratini · forma base usada. Pool 34; PokeAPI 46.

- aqua jet
- attract
- double team
- dragon breath
- dragon tail
- endure
- extreme speed
- hail
- haze
- iron tail
- light screen
- mist
- safeguard
- shock wave
- slam
- supersonic
- swagger
- twister
- wrap

### Dragonair (dragonair)

Referência: Brilliant Diamond/Shining Pearl · dragonair · forma base usada. Pool 34; PokeAPI 40.

- attract
- double team
- dragon tail
- endure
- hail
- iron tail
- light screen
- safeguard
- shock wave
- slam
- swagger
- twister
- wrap

### Dragonite (dragonite)

Referência: Brilliant Diamond/Shining Pearl · dragonite · forma base usada. Pool 58; PokeAPI 65.

- attract
- bulldoze
- cut
- defog
- double team
- dragon tail
- endure
- fling
- hail
- iron tail
- light screen
- roar
- rock smash
- rock tomb
- safeguard
- shock wave
- slam
- steel wing
- strength
- swagger
- twister
- wrap

### Mewtwo (mewtwo)

Referência: Brilliant Diamond/Shining Pearl · mewtwo · forma base usada. Pool 64; PokeAPI 77.

- aerial ace
- bulldoze
- charge beam
- confusion
- disable
- double team
- dream eater
- endure
- flash
- fling
- grass knot
- guard swap
- hail
- iron tail
- laser focus
- life dew
- light screen
- low sweep
- mist
- power swap
- psych up
- psystrike
- recycle
- rock climb
- rock smash
- rock tomb
- safeguard
- shock wave
- skill swap
- strength
- swagger
- taunt
- torment
- trick room
- water pulse

### Mew (mew)

Referência: Brilliant Diamond/Shining Pearl · mew · forma base usada. Pool 142; PokeAPI 110.

- attract
- baton pass
- brine
- bulldoze
- charge beam
- cut
- defog
- double team
- dream eater
- endure
- explosion
- false swipe
- flash
- fling
- grass knot
- hail
- imprison
- iron tail
- life dew
- light screen
- low sweep
- payback
- pluck
- pound
- psych up
- recycle
- reflect type
- roar
- rock climb
- rock polish
- rock smash
- rock tomb
- roost
- safeguard
- shock wave
- skill swap
- snarl
- stealth rock
- steel wing
- strength
- swagger
- taunt
- thief
- torment
- trick room
- volt switch
- work up

### Gyarados (gyarados)

Referência: Brilliant Diamond/Shining Pearl · gyarados · forma base usada. Pool 44; PokeAPI 54.

- attract
- brine
- bulldoze
- double team
- endure
- flail
- hail
- iron tail
- payback
- roar
- rock smash
- scary face
- strength
- swagger
- taunt
- thrash
- torment
- twister

## Fora do grupo de versão

### Venusaur (venusaur)

- amnesia
- body slam
- curse
- earth power
- fury cutter
- grassy glide
- headbutt
- ingrain
- knock off
- leaf storm
- outrage
- poison jab
- reflect

### Charizard (charizard)

- acrobatics
- ancient power
- bite
- blaze kick
- body slam
- counter
- crunch
- curse
- double edge
- dragon dance
- dragon rage
- dragon rush
- dual wingbeat
- dynamic punch
- fire punch
- flame charge
- fury cutter
- headbutt
- heat crash
- hurricane
- metal claw
- mystical fire
- outrage
- reflect
- sandstorm
- seismic toss
- skull bash
- swift
- tailwind
- take down
- thunder punch
- toxic
- wing attack

### Blastoise (blastoise)

- aqua jet
- aura sphere
- body press
- body slam
- counter
- crunch
- curse
- double edge
- dynamic punch
- flip turn
- headbutt
- ice punch
- ice spinner
- icy wind
- iron head
- liquidation
- mirror coat
- mud shot
- muddy water
- outrage
- reflect
- rollout
- seismic toss
- take down
- toxic
- water spout
- wave crash
- whirlpool
- zen headbutt

### Pidgeot (pidgeot)

- brave bird
- curse
- double edge
- headbutt
- razor wind
- reflect
- swift
- take down

### Pikachu (pikachu)

- body slam
- calm mind
- counter
- curse
- double edge
- draining kiss
- dynamic punch
- extreme speed
- headbutt
- knock off
- magnet rise
- pay day
- play rough
- rollout
- seismic toss
- skull bash
- swift
- take down
- thunder punch
- toxic
- volt tackle
- wild charge

### Nidoqueen (nidoqueenAG)

- aerial ace
- aqua tail
- counter
- curse
- cut
- double edge
- double team
- dynamic punch
- focus punch
- fury cutter
- headbutt
- poison fang
- reflect
- rock climb
- rock smash
- seismic toss
- shock wave
- skull bash
- take down
- water gun
- water pulse

### Nidoking (nidoking)

- aqua tail
- counter
- curse
- cut
- double edge
- double team
- dynamic punch
- focus punch
- fury cutter
- headbutt
- reflect
- rock climb
- rock smash
- seismic toss
- shock wave
- skull bash
- sucker punch
- take down
- water gun
- water pulse

### Clefable (clefable)

- amnesia
- body slam
- bounce
- counter
- curse
- double edge
- draining kiss
- dual wingbeat
- dynamic punch
- fire punch
- future sight
- headbutt
- hyper voice
- ice punch
- icy wind
- knock off
- mystical fire
- play rough
- psyshock
- retaliate
- rollout
- seismic toss
- skull bash
- swift
- take down
- thunder punch
- toxic
- tri attack
- water gun
- zen headbutt

### Dugtrio (dugtrio)

- agility
- body slam
- curse
- double edge
- foul play
- headbutt
- high horsepower
- magnitude
- mud bomb
- mud shot
- sludge wave
- swords dance
- take down
- throat chop
- toxic

### Persian (persian)

- agility
- amnesia
- body slam
- curse
- double edge
- foul play
- gunk shot
- headbutt
- hyper voice
- hypnosis
- icy wind
- knock off
- metal claw
- metronome
- night slash
- pain split
- retaliate
- seed bomb
- skull bash
- spikes
- swift
- take down
- throat chop
- thunder wave
- toxic
- toxic spikes
- water gun

### Arcanine (arcanine)

- body slam
- close combat
- curse
- double edge
- dragon breath
- dragon rage
- fire spin
- flame charge
- headbutt
- heat crash
- heat wave
- hyper voice
- iron head
- outrage
- psychic fangs
- reflect
- skull bash
- superpower
- swift
- thunder fang
- toxic
- wild charge

### Alakazam (alakazam)

- counter
- curse
- dig
- double edge
- double team
- dynamic punch
- focus punch
- headbutt
- knock off
- seismic toss
- shock wave
- skull bash
- take down
- toxic

### Tentacruel (tentacruelH)

- confuse ray
- cross poison
- curse
- double edge
- flip turn
- gunk shot
- headbutt
- icy wind
- knock off
- liquidation
- mirror coat
- mud shot
- muddy water
- rapid spin
- reflect
- skull bash
- swift
- take down
- throat chop
- toxic
- toxic spikes
- whirlpool

### Golem (golemAG)

- ancient power
- body press
- body slam
- counter
- curse
- dynamic punch
- earth power
- fire punch
- fury cutter
- hammer arm
- headbutt
- high horsepower
- iron defense
- iron head
- magnitude
- metronome
- mud shot
- seismic toss
- sucker punch
- superpower
- take down
- thunder punch
- toxic

### Dodrio (dodrio)

- acrobatics
- body slam
- brave bird
- curse
- double edge
- drill run
- headbutt
- knock off
- low kick
- pursuit
- rain dance
- reflect
- skull bash
- sky attack
- swift
- tailwind
- take down
- throat chop
- toxic

### Muk (mukH)

- body slam
- confuse ray
- curse
- drain punch
- dynamic punch
- fire punch
- headbutt
- hex
- ice punch
- knock off
- lunge
- metronome
- mud bomb
- mud shot
- pain split
- sandstorm
- self destruct
- swift
- take down
- thunder punch
- toxic
- toxic spikes
- zen headbutt

### Gengar (gengar)

- body slam
- counter
- double edge
- dynamic punch
- fire punch
- foul play
- gunk shot
- headbutt
- ice punch
- icy wind
- knock off
- metronome
- pain split
- phantom force
- poltergeist
- seismic toss
- self destruct
- skull bash
- sludge wave
- take down
- thunder punch
- thunder wave
- toxic spikes

### Exeggutor (exeggutor)

- ancient power
- body slam
- curse
- double edge
- earthquake
- egg bomb
- future sight
- grassy glide
- headbutt
- low kick
- psycho cut
- rollout
- self destruct
- sleep powder
- take down
- toxic
- zen headbutt

### Weezing (weezingH)

- body slam
- curse
- gunk shot
- headbutt
- pain split
- rollout
- sludge wave
- take down
- toxic spikes

### Rhydon (rhydon)

- ancient power
- aqua tail
- body press
- body slam
- counter
- crunch
- curse
- double edge
- dragon rush
- dynamic punch
- earth power
- fire fang
- fire punch
- fury attack
- fury cutter
- headbutt
- heat crash
- heavy slam
- high horsepower
- hydro pump
- ice fang
- ice punch
- icy wind
- iron defense
- metal burst
- mud shot
- outrage
- pay day
- rollout
- seismic toss
- skull bash
- superpower
- thunder fang
- thunder punch
- toxic
- water gun
- whirlpool

### Scyther (scyther)

- acrobatics
- calm mind
- close combat
- cross poison
- curse
- double edge
- dual wingbeat
- headbutt
- knock off
- lunge
- psycho cut
- pursuit
- razor wind
- silver wind
- skull bash
- swift
- tailwind
- take down
- toxic

### Tauros (tauros)

- body slam
- close combat
- curse
- dig
- headbutt
- high horsepower
- icy wind
- iron head
- megahorn
- outrage
- pursuit
- raging bull
- retaliate
- shadow ball
- skull bash
- throat chop
- toxic
- whirlpool
- wild charge

### Lapras (lapras)

- aqua tail
- body press
- double edge
- dragon breath
- dragon rage
- drill run
- earthquake
- headbutt
- hyper voice
- icy wind
- iron head
- liquidation
- megahorn
- muddy water
- outrage
- reflect
- skull bash
- solar beam
- take down
- toxic
- zen headbutt

### Jolteon (jolteon)

- body slam
- calm mind
- curse
- electro ball
- focus energy
- headbutt
- hyper voice
- magnet rise
- metal sound
- pay day
- reflect
- retaliate
- skull bash
- toxic
- wild charge

### Aerodactyl (aerodactylM8)

- aerial ace
- aqua tail
- double edge
- double team
- dragon rage
- headbutt
- pursuit
- razor wind
- reflect
- rock smash
- sky attack
- toxic

### Snorlax (snorlax)

- body press
- dig
- dynamic punch
- fire punch
- gunk shot
- headbutt
- heat crash
- hydro pump
- hyper voice
- ice punch
- icy wind
- iron head
- outrage
- pay day
- pursuit
- reflect
- retaliate
- rollout
- seed bomb
- seismic toss
- self destruct
- skull bash
- superpower
- take down
- thunder punch
- toxic
- water gun
- whirlpool
- wild charge
- zen headbutt

### Dragonite (dragoniteL)

- air slash
- body press
- body slam
- curse
- double edge
- dragon breath
- dragon rage
- dual wingbeat
- dynamic punch
- fire spin
- fury cutter
- headbutt
- heat wave
- hydro pump
- ice punch
- ice spinner
- icy wind
- iron head
- low kick
- metronome
- razor wind
- reflect
- skull bash
- superpower
- swift
- tailwind
- take down
- toxic
- water gun
- whirlpool

### Typhlosion (typhlosion)

- body slam
- calm mind
- confuse ray
- counter
- curse
- double kick
- dynamic punch
- extrasensory
- fire fang
- fire punch
- fire spin
- flare blitz
- fury cutter
- headbutt
- heat wave
- hex
- iron head
- iron tail
- low kick
- play rough
- poltergeist
- seismic toss
- shadow ball
- take down
- throat chop
- thunder punch
- toxic
- wild charge
- zen headbutt

### Feraligatr (feraligatrD)

- ancient power
- aqua jet
- body slam
- counter
- curse
- double edge
- dragon dance
- dynamic punch
- flip turn
- fury cutter
- headbutt
- ice punch
- icy wind
- liquidation
- metal claw
- muddy water
- outrage
- psychic fangs
- seismic toss
- take down
- toxic
- whirlpool

### Crobat (crobat)

- aerial ace
- curse
- double edge
- double team
- knock off
- night slash
- psychic fangs
- razor wind
- roost
- sky attack
- wing attack

### Ampharos (ampharos)

- agility
- body slam
- counter
- curse
- dazzling gleam
- dig
- double edge
- dynamic punch
- flash cannon
- headbutt
- ice punch
- low kick
- magnet rise
- outrage
- seismic toss
- sunny day
- swift
- toxic
- wild charge

### Espeon (espeon)

- body slam
- confuse ray
- curse
- draining kiss
- focus energy
- headbutt
- hyper voice
- pay day
- power gem
- psychic fangs
- psyshock
- retaliate
- rock smash
- thunder wave
- toxic
- zen headbutt

### Umbreon (umbreon)

- body slam
- calm mind
- crunch
- curse
- focus energy
- headbutt
- hyper voice
- knock off
- pay day
- pursuit
- reflect
- retaliate
- rock smash
- sucker punch
- throat chop
- thunder wave
- toxic

### Steelix (steelixD)

- ancient power
- aqua tail
- cut
- double team
- explosion
- headbutt
- rock climb
- rock smash
- rollout
- toxic

### Scizor (scizorJJ)

- acrobatics
- calm mind
- close combat
- counter
- cross poison
- curse
- double edge
- dual wingbeat
- feint
- headbutt
- knock off
- lunge
- night slash
- psycho cut
- pursuit
- razor wind
- silver wind
- superpower
- swift
- tailwind
- take down
- toxic

### Heracross (heracross)

- body slam
- bug buzz
- calm mind
- curse
- fury cutter
- headbutt
- high horsepower
- iron defense
- knock off
- low kick
- lunge
- mud shot
- outrage
- pursuit
- retaliate
- spikes
- toxic

### Skarmory (skarmory)

- air slash
- body press
- counter
- double edge
- drill run
- dual wingbeat
- fury cutter
- giga impact
- hurricane
- hyper beam
- icy wind
- iron head
- pursuit
- swift
- tailwind
- take down
- toxic

### Houndoom (houndoomSP)

- body slam
- counter
- curse
- double edge
- fire spin
- flare blitz
- headbutt
- heat wave
- hyper voice
- mud shot
- pain split
- psychic fangs
- rain dance
- retaliate
- sucker punch
- swift
- take down
- throat chop
- toxic

### Kingdra (kingdraD)

- body slam
- bounce
- curse
- double edge
- flip turn
- headbutt
- hurricane
- icy wind
- iron head
- liquidation
- muddy water
- outrage
- splash
- swift
- take down
- toxic
- wave crash

### Tyranitar (tyranitar)

- ancient power
- aqua tail
- body press
- body slam
- counter
- curse
- double edge
- dragon breath
- dragon dance
- dynamic punch
- earth power
- fire punch
- focus energy
- foul play
- fury cutter
- headbutt
- heavy slam
- high horsepower
- hydro pump
- ice punch
- icy wind
- iron head
- knock off
- low kick
- mud shot
- muddy water
- outrage
- power gem
- retaliate
- seismic toss
- superpower
- take down
- thunder punch
- toxic
- whirlpool

### Sceptile (sceptile)

- acrobatics
- agility
- body slam
- counter
- cross poison
- crunch
- double edge
- double kick
- dragon breath
- dragon dance
- dynamic punch
- grassy glide
- headbutt
- leech seed
- low kick
- night slash
- outrage
- pursuit
- razor wind
- seed bomb
- seismic toss
- slash
- swift
- synthesis
- take down
- throat chop
- thunder punch
- toxic

### Blaziken (blazikenNM)

- acrobatics
- agility
- aura sphere
- body slam
- counter
- crush claw
- curse
- double edge
- drain punch
- dynamic punch
- feint
- fire spin
- fury cutter
- headbutt
- heat crash
- heat wave
- high jump kick
- knock off
- low kick
- mirror move
- night slash
- seismic toss
- sky uppercut
- superpower
- swift
- take down
- thunder punch
- toxic

### Swampert (swampertNM)

- ancient power
- aqua tail
- bite
- body press
- body slam
- counter
- curse
- double edge
- dynamic punch
- earth power
- flip turn
- headbutt
- high horsepower
- ice punch
- icy wind
- knock off
- liquidation
- low kick
- mirror coat
- mud bomb
- outrage
- poison jab
- rollout
- seismic toss
- sludge bomb
- sludge wave
- superpower
- toxic
- wave crash
- whirlpool

### Mightyena (mightyenaH)

- body slam
- counter
- double edge
- foul play
- hyper voice
- leer
- poison fang
- psychic fangs
- retaliate
- throat chop
- toxic

### Ludicolo (ludicoloNM)

- amnesia
- body slam
- counter
- double edge
- dynamic punch
- fire punch
- grassy glide
- headbutt
- hyper voice
- ice punch
- ice spinner
- icy wind
- leaf storm
- leech seed
- metronome
- mud shot
- muddy water
- razor leaf
- seed bomb
- seismic toss
- swift
- synthesis
- take down
- thunder punch
- toxic
- whirlpool

### Shiftry (shiftryNM)

- air slash
- amnesia
- body slam
- bounce
- confuse ray
- curse
- double edge
- foul play
- fury cutter
- grassy glide
- headbutt
- heat wave
- hex
- icy wind
- knock off
- leaf storm
- leech seed
- low kick
- night slash
- petal blizzard
- quick attack
- rain dance
- razor wind
- retaliate
- seed bomb
- self destruct
- silver wind
- swift
- tailwind
- take down
- throat chop
- toxic
- toxic spikes
- will o wisp

### Swellow (swellow)

- counter
- double edge
- swift

### Pelipper (pelipperNM)

- acrobatics
- body slam
- brave bird
- double edge
- dual wingbeat
- gunk shot
- icy wind
- knock off
- liquidation
- muddy water
- pursuit
- seed bomb
- sky attack
- swift
- take down
- toxic
- waterfall
- whirlpool

### Gardevoir (gardevoir)

- aura sphere
- body slam
- confuse ray
- double edge
- fire punch
- headbutt
- hyper voice
- ice beam
- ice punch
- icy wind
- knock off
- metronome
- mystical fire
- pain split
- psyshock
- swift
- thunder punch
- toxic
- triple axel
- zen headbutt

### Breloom (breloomNM)

- aerial ace
- body slam
- close combat
- dig
- double edge
- fury cutter
- gunk shot
- leaf storm
- low kick
- mud shot
- poison jab
- rain dance
- retaliate
- seismic toss
- sky uppercut
- superpower
- swift
- synthesis
- take down
- thunder punch
- zen headbutt

### Slaking (slakingNM)

- body press
- body slam
- curse
- dig
- double edge
- drain punch
- dynamic punch
- fire punch
- fury cutter
- gunk shot
- heavy slam
- high horsepower
- hyper voice
- ice punch
- icy wind
- knock off
- low kick
- metal claw
- metronome
- mud shot
- outrage
- poison jab
- retaliate
- seed bomb
- seismic toss
- take down
- throat chop
- thunder punch
- thunder wave
- toxic
- wild charge
- x scissor
- zen headbutt

### Ninjask (ninjaskAP)

- cut
- double edge
- roost
- silver wind
- toxic

### Shedinja (shedinjaNM)

- aerial ace
- cut
- double edge
- double team
- fury cutter
- sucker punch
- toxic

### Exploud (exploudNM)

- counter
- double edge
- double team
- dynamic punch
- headbutt
- rock climb
- rock smash
- rollout
- seismic toss
- shock wave
- toxic
- water pulse

### Aggron (aggron)

- aerial ace
- ancient power
- aqua tail
- counter
- cut
- double team
- dynamic punch
- focus punch
- fury cutter
- head smash
- magnet rise
- mud shot
- rock climb
- rock smash
- rollout
- seismic toss
- shock wave
- toxic
- water pulse

### Manectric (manectric)

- curse
- double edge
- double team
- headbutt
- magnet rise
- toxic
- volt tackle

### Sharpedo (sharpedoH)

- ancient power
- double edge
- double team
- feint
- fury cutter
- rock smash
- skull bash
- toxic
- water pulse

### Wailord (wailord)

- double edge
- double team
- headbutt
- rock smash
- rollout
- toxic

### Camerupt (cameruptH)

- body press
- body slam
- fire spin
- flame charge
- flare blitz
- headbutt
- heat crash
- heat wave
- heavy slam
- high horsepower
- iron head
- magnitude
- mud shot
- rain dance
- rollout
- self destruct
- toxic
- zen headbutt

### Torkoal (torkoal)

- body press
- double edge
- earth power
- fire spin
- flame charge
- flare blitz
- headbutt
- heat crash
- heavy slam
- rollout
- sandstorm
- self destruct
- take down
- toxic
- zen headbutt

### Flygon (flygonNM)

- agility
- air slash
- body slam
- double edge
- dual wingbeat
- fire punch
- fire spin
- first impression
- focus energy
- fury cutter
- headbutt
- heat wave
- mud shot
- quick attack
- silver wind
- sonic boom
- swift
- tailwind
- take down
- throat chop
- thunder punch
- toxic

### Altaria (altariaL)

- acrobatics
- agility
- body slam
- brave bird
- double edge
- dragon dance
- dual wingbeat
- fire spin
- heat wave
- hyper voice
- mirror move
- outrage
- play rough
- swift
- tailwind
- toxic
- will o wisp

### Crawdaunt (crawdauntH)

- ancient power
- aqua jet
- body slam
- close combat
- counter
- double edge
- dragon dance
- fury cutter
- hydro pump
- icy wind
- iron defense
- liquidation
- metal claw
- mud shot
- muddy water
- retaliate
- slash
- sludge wave
- superpower
- take down
- toxic
- whirlpool

### Claydol (claydol)

- double edge
- double team
- headbutt
- rock smash
- toxic

### Cradily (cradily)

- double edge
- double team
- headbutt
- pain split
- rock smash
- synthesis
- toxic

### Armaldo (armaldo)

- aerial ace
- aqua jet
- aqua tail
- cut
- double edge
- double team
- headbutt
- knock off
- rock smash
- seismic toss
- toxic
- water pulse

### Milotic (milotic)

- body slam
- calm mind
- confuse ray
- dazzling gleam
- double edge
- dragon breath
- dragon dance
- draining kiss
- flip turn
- hypnosis
- icy wind
- iron head
- liquidation
- mirror coat
- mud shot
- muddy water
- swift
- take down
- toxic
- triple axel
- whirlpool

### Absol (absolNM)

- aerial ace
- counter
- cut
- fury cutter
- headbutt
- pursuit
- razor wind
- rock smash
- shock wave
- toxic
- water pulse

### Glalie (glalieNM)

- body slam
- double edge
- foul play
- hex
- ice spinner
- iron head
- rollout
- self destruct
- spikes
- take down
- toxic

### Walrein (walreinH)

- aqua tail
- double edge
- double team
- fury cutter
- headbutt
- rock smash
- toxic
- water pulse

### Salamence (salamence)

- air slash
- aqua tail
- body slam
- dragon dance
- dual wingbeat
- fire fang
- fire spin
- fury cutter
- heat wave
- hurricane
- hydro pump
- hyper voice
- iron defense
- iron head
- psychic fangs
- rollout
- swift
- tailwind
- take down
- thunder fang
- toxic

### Metagross (metagross)

- body press
- body slam
- cosmic power
- double edge
- dynamic punch
- focus punch
- fury cutter
- future sight
- headbutt
- heavy slam
- ice punch
- icy wind
- iron head
- knock off
- psychic fangs
- psycho cut
- psyshock
- pursuit
- rollout
- self destruct
- shadow claw
- stone edge
- swift
- thunder punch
- toxic

### Torterra (torterra)

- amnesia
- body press
- body slam
- double edge
- earth power
- grassy glide
- headbutt
- heavy slam
- high horsepower
- hyper voice
- iron defense
- iron head
- mud shot
- outrage
- seed bomb
- shell smash
- spit up
- superpower
- take down
- toxic
- zen headbutt

### Infernape (infernape)

- agility
- aura sphere
- body slam
- counter
- double edge
- double kick
- drain punch
- fire punch
- flame charge
- focus energy
- gunk shot
- headbutt
- heat wave
- knock off
- low kick
- metronome
- retaliate
- rollout
- swift
- take down
- throat chop
- thunder punch
- toxic
- zen headbutt

### Empoleon (empoleon)

- agility
- air slash
- aqua cutter
- body slam
- double edge
- dual wingbeat
- flip turn
- fury cutter
- headbutt
- ice spinner
- icy wind
- iron defense
- knock off
- liquidation
- metal sound
- roost
- supersonic
- swift
- take down
- throat chop
- toxic
- triple axel
- wave crash

### Staraptor (staraptor)

- acrobatics
- air slash
- blaze kick
- brick break
- bulk up
- double edge
- dual wingbeat
- focus blast
- focus energy
- heat wave
- hurricane
- knock off
- outrage
- razor wind
- retaliate
- skull bash
- sky attack
- swift
- tailwind
- toxic

### Luxray (luxrayM)

- agility
- body slam
- confuse ray
- double edge
- electro ball
- fire fang
- fury cutter
- headbutt
- ice fang
- magnet rise
- play rough
- psychic fangs
- sunny day
- superpower
- swift
- take down
- throat chop
- thunder fang
- toxic

### Roserade (roserade)

- cut
- double team
- fury cutter
- mud shot
- sleep powder

### Gastrodon (gastrodonAP)

- amnesia
- curse
- headbutt
- hydro pump
- icy wind
- liquidation
- mud bomb
- mud shot
- pain split
- sludge wave
- spikes
- take down
- toxic
- whirlpool

### Lopunny (lopunny)

- cut
- dizzy punch
- double team
- focus punch
- fury cutter
- rock smash
- shock wave
- swords dance
- toxic
- water pulse

### Honchkrow (honchkrowSP)

- acrobatics
- air slash
- brave bird
- confuse ray
- double edge
- drill peck
- dual wingbeat
- heat wave
- hex
- hurricane
- icy wind
- pursuit
- retaliate
- sky attack
- superpower
- swift
- take down
- toxic
- u turn

### Bronzong (bronzongSP)

- ancient power
- body press
- body slam
- hex
- ice spinner
- iron head
- power gem
- psyshock
- rollout
- take down
- toxic
- zen headbutt

### Spiritomb (spiritomb)

- body slam
- icy wind
- phantom force
- poltergeist
- psyshock
- pursuit
- retaliate
- silver wind
- toxic

### Garchomp (garchomp)

- aqua tail
- body slam
- double edge
- dragon rage
- earth power
- fire fang
- fury cutter
- headbutt
- iron head
- liquidation
- metal claw
- mud shot
- outrage
- power gem
- spikes
- swift
- thunder fang
- toxic
- whirlpool

### Lucario (lucario)

- aerial ace
- agility
- blaze kick
- body slam
- bullet punch
- crunch
- focus energy
- fury cutter
- headbutt
- ice punch
- iron defense
- low kick
- magnet rise
- metronome
- retaliate
- swift
- take down
- thunder punch
- toxic
- zen headbutt

### Drapion (drapionAP)

- aerial ace
- aqua tail
- cut
- double team
- fury cutter
- headbutt
- pursuit
- rock climb
- rock smash

### Toxicroak (toxicroak)

- aerial ace
- bounce
- close combat
- cross poison
- earth power
- foul play
- fury cutter
- gunk shot
- headbutt
- ice punch
- icy wind
- knock off
- low kick
- mud bomb
- mud shot
- pursuit
- retaliate
- shadow claw
- sludge wave
- take down
- throat chop
- thunder punch

### Weavile (weavile)

- foul play
- fury cutter
- headbutt
- ice punch
- ice spinner
- knock off
- low kick
- metronome
- psycho cut
- pursuit
- retaliate
- swift
- take down
- throat chop
- toxic
- triple axel
- water pulse
- whirlpool

### Magnezone (magnezoneD)

- body press
- body slam
- confuse ray
- double edge
- heavy slam
- iron defense
- iron head
- rollout
- sandstorm
- self destruct
- sonic boom
- swift
- take down
- toxic
- wild charge

### Rhyperior (rhyperior)

- ancient power
- aqua tail
- body press
- body slam
- counter
- crunch
- curse
- double edge
- dragon rush
- earth power
- fire fang
- fire punch
- fury attack
- fury cutter
- headbutt
- heat crash
- heavy slam
- high horsepower
- hydro pump
- ice fang
- ice punch
- icy wind
- iron defense
- iron head
- metal burst
- metal claw
- mud shot
- outrage
- pay day
- rollout
- superpower
- thunder fang
- thunder punch
- toxic
- whirlpool

### Electivire (electivireAP)

- body slam
- bulk up
- double edge
- dynamic punch
- electro ball
- feint
- fire punch
- follow me
- hammer arm
- headbutt
- ice punch
- knock off
- magnet rise
- metal sound
- metronome
- reflect
- take down
- toxic

### Togekiss (togekiss)

- aerial ace
- calm mind
- double team
- focus punch
- headbutt
- rock smash
- rollout
- roost
- shock wave
- silver wind
- tailwind
- toxic
- water pulse

### Gliscor (gliscorAP)

- agility
- aqua tail
- counter
- crabhammer
- cross poison
- crunch
- double edge
- dual wingbeat
- earth power
- feint
- gunk shot
- headbutt
- high horsepower
- lunge
- metal claw
- mud shot
- psychic fangs
- sky attack
- sky uppercut
- spikes
- swift
- tailwind
- take down
- throat chop
- toxic
- toxic spikes
- wing attack

### Mamoswine (mamoswine)

- bite
- body press
- body slam
- curse
- double edge
- earth power
- freeze dry
- fury attack
- fury cutter
- headbutt
- heavy slam
- high horsepower
- horn attack
- icicle crash
- iron head
- knock off
- mud bomb
- mud shot
- superpower
- throat chop
- toxic

### Gallade (galladeSP)

- agility
- air slash
- aqua cutter
- aura sphere
- body slam
- confuse ray
- fire punch
- focus energy
- headbutt
- hex
- hyper voice
- ice beam
- ice punch
- icy wind
- knock off
- leaf blade
- low kick
- metronome
- pain split
- psyshock
- retaliate
- sacred sword
- shadow claw
- swift
- take down
- throat chop
- thunder punch
- toxic
- triple axel
- zen headbutt

### Froslass (froslassAP)

- body slam
- curse
- ice punch
- ice spinner
- nasty plot
- pain split
- poltergeist
- rollout
- spikes
- sucker punch
- take down
- toxic
- triple axel

### Unfezant (unfezant)

- aerial ace
- double team
- razor wind
- toxic
- wing attack

### Darmanitan (darmanitan)

- double team
- flame charge
- focus punch
- rock smash
- rollout
- toxic

### Sigilyph (sigilyph)

- aerial ace
- double team
- mirror move
- shock wave
- toxic

### Cofagrigus (cofagrigus)

- double team
- giga drain
- icy wind
- knock off
- mud shot
- pain split
- psyshock
- self destruct
- shadow punch
- shock wave
- thunder wave
- toxic

### Archeops (archeops)

- aerial ace
- aqua tail
- cut
- double team
- knock off
- rock smash
- roost
- sky attack
- toxic

### Vanilluxe (vanilluxe)

- double team
- explosion
- magnet rise
- toxic
- water pulse

### Klinklang (klinklang)

- double team
- magnet rise
- rock smash
- shock wave
- toxic

### Accelgor (accelgorJJ)

- knock off

### Druddigon (druddigonI)

- aerial ace
- aqua tail
- crush claw
- cut
- double team
- dragon rage
- pursuit
- rock climb
- rock smash
- shock wave
- toxic

### Aegislash (aegislash)

- cut
- double team
- headbutt
- king s shield
- magnet rise
- pursuit
- rock smash
- shock wave
- toxic
- zen headbutt

### Tyrantrum (tyrantrum)

- aerial ace
- double team
- rock smash
- toxic

### Aurorus (aurorus)

- aqua tail
- aurora veil
- double team
- magnet rise
- rock smash
- take down
- toxic
- water pulse

### Gourgeist (gourgeist)

- curse
- double team
- fire spin
- flame charge
- rock smash
- self destruct
- shadow claw
- synthesis
- toxic

### Golisopod (golisopodJJ)

- aerial ace
- agility
- double team
- gunk shot
- knock off
- night slash
- pain split
- toxic
- u turn
- water pulse

### Buzzwole (buzzwoleJJ)

- double team
- roost
- toxic

### Pheromosa (pheromosaJJ)

- double team
- roost
- shock wave
- silver wind
- toxic

### Marshadow (marshadow)

- double team
- focus punch
- knock off
- mach punch
- toxic

### Bulbasaur (bulbasaur)

- body slam
- frenzy plant
- fury cutter
- grassy glide
- headbutt
- knock off
- outrage
- razor wind
- reflect

### Charmander (charmander)

- acrobatics
- blast burn
- body slam
- curse
- double edge
- dragon rage
- dynamic punch
- fire punch
- flame charge
- focus blast
- fury cutter
- headbutt
- heat wave
- reflect
- seismic toss
- skull bash
- swift
- take down
- thunder punch
- toxic

### Squirtle (squirtle)

- body slam
- counter
- curse
- double edge
- dynamic punch
- flip turn
- headbutt
- hydro cannon
- ice punch
- ice spinner
- icy wind
- iron head
- liquidation
- mud shot
- outrage
- reflect
- rock slide
- rollout
- seismic toss
- take down
- toxic
- wave crash
- whirlpool
- zen headbutt

### Pidgey (pidgey)

- curse
- double edge
- headbutt
- razor wind
- reflect
- swift
- take down

### Rattata (rattata)

- body slam
- curse
- headbutt
- skull bash
- sludge bomb
- swift
- take down
- water gun

### Zubat (zubat)

- aerial ace
- double edge
- double team
- headbutt
- pursuit
- razor wind
- roost
- tailwind
- take down
- toxic

### Ekans (ekans)

- aqua tail
- body slam
- crunch
- curse
- double edge
- fire fang
- headbutt
- ice fang
- knock off
- leech life
- mud shot
- psychic fangs
- pursuit
- seed bomb
- skull bash
- sludge wave
- take down
- thunder fang
- toxic
- toxic spikes

### Koffing (koffing)

- body slam
- gunk shot
- headbutt
- rollout
- sludge wave
- take down

### Geodude (geodude)

- ancient power
- body slam
- counter
- dynamic punch
- earth power
- fire punch
- headbutt
- high horsepower
- iron defense
- metronome
- mud shot
- seismic toss
- sucker punch
- superpower
- take down
- thunder punch
- toxic

### Onix (onix)

- ancient power
- double team
- explosion
- headbutt
- rock climb
- rock smash
- skull bash
- take down
- toxic

### Ivysaur (ivysaur)

- body slam
- curse
- grassy glide
- knock off
- leaf storm

### Charmeleon (charmeleon)

- body slam
- crunch
- dragon dance
- fire punch
- flame charge
- focus blast
- heat wave
- outrage
- swift
- take down
- thunder punch

### Wartortle (wartortle)

- body slam
- double edge
- flip turn
- ice punch
- ice spinner
- icy wind
- liquidation
- mud shot
- muddy water
- take down
- wave crash
- whirlpool
- zen headbutt

### Chikorita (chikorita)

- curse
- double edge
- grassy glide
- seed bomb
- take down

### Bayleef (bayleef)

- curse
- double edge
- grassy glide
- knock off
- leaf storm
- leech seed
- seed bomb
- take down

### Meganium (meganium)

- body press
- curse
- double edge
- grassy glide
- knock off
- leaf storm
- leech seed
- outrage
- seed bomb
- take down
- zen headbutt

### Cyndaquil (cyndaquil)

- body slam
- curse
- fire fang
- fire spin
- heat wave
- iron head
- play rough
- take down
- wild charge
- zen headbutt

### Quilava (quilava)

- body slam
- curse
- fire fang
- fire spin
- flare blitz
- heat wave
- iron head
- play rough
- take down
- wild charge
- zen headbutt

### Totodile (totodile)

- curse
- double edge
- flip turn
- icy wind
- liquidation
- muddy water
- take down
- whirlpool

### Croconaw (croconaw)

- curse
- double edge
- dragon dance
- flip turn
- ice punch
- icy wind
- liquidation
- metal claw
- muddy water
- psychic fangs
- take down
- whirlpool

### Feraligatr (feraligatr)

- body slam
- curse
- double edge
- dragon dance
- flip turn
- ice punch
- icy wind
- liquidation
- metal claw
- muddy water
- outrage
- psychic fangs
- take down
- whirlpool

### Arbok (arbok)

- body slam
- double edge
- knock off
- leech life
- mud shot
- pain split
- psychic fangs
- seed bomb
- sludge wave
- take down
- throat chop
- toxic
- toxic spikes

### Raichu (raichu)

- body slam
- draining kiss
- knock off
- play rough
- swift
- take down
- wild charge

### Sandshrew (sandshrew)

- amnesia
- body slam
- curse
- double edge
- earth power
- high horsepower
- knock off
- leech life
- low kick
- spikes
- stone edge
- take down
- throat chop

### Sandslash (sandslash)

- amnesia
- body slam
- curse
- double edge
- drill run
- earth power
- gunk shot
- high horsepower
- knock off
- leech life
- low kick
- metal claw
- mud shot
- spikes
- take down
- throat chop

### Clefairy (clefairy)

- amnesia
- body slam
- double edge
- draining kiss
- dual wingbeat
- fire punch
- hyper voice
- ice punch
- icy wind
- knock off
- play rough
- psyshock
- swift
- take down
- thunder punch
- zen headbutt

### Vulpix (vulpix)

- agility
- body slam
- double edge
- foul play
- nasty plot
- pain split
- swift
- take down
- zen headbutt

### Ninetales (ninetales)

- agility
- body slam
- double edge
- flame charge
- flare blitz
- foul play
- heat wave
- hex
- pain split
- psyshock
- swift
- take down
- zen headbutt

### Jigglypuff (jigglypuff)

- amnesia
- body press
- calm mind
- dark pulse
- draining kiss
- energy ball
- fire punch
- ice punch
- ice spinner
- icy wind
- knock off
- metronome
- nasty plot
- pain split
- psyshock
- sandstorm
- swift
- take down
- thunder punch
- wild charge
- zen headbutt

### Wigglytuff (wigglytuff)

- amnesia
- body press
- calm mind
- dark pulse
- draining kiss
- energy ball
- fire punch
- ice punch
- ice spinner
- icy wind
- knock off
- metronome
- nasty plot
- pain split
- psyshock
- sandstorm
- swift
- take down
- thunder punch
- wild charge
- zen headbutt

### Oddish (oddish)

- grassy glide
- leaf storm
- seed bomb

### Gloom (gloom)

- grassy glide
- leaf storm
- petal blizzard
- pollen puff
- seed bomb

### Vileplume (vileplume)

- body slam
- grassy glide
- leaf storm
- pollen puff
- seed bomb
- sludge wave

### Venonat (venonat)

- bug buzz
- confuse ray
- energy ball
- lunge
- swift
- take down
- toxic

### Venomoth (venomoth)

- acrobatics
- agility
- air slash
- confuse ray
- double edge
- lunge
- sludge wave
- swift
- take down
- toxic
- toxic spikes

### Diglett (diglett)

- agility
- body slam
- curse
- double edge
- foul play
- mud shot
- stone edge
- swords dance
- take down
- throat chop

### Meowth (meowth)

- agility
- body slam
- double edge
- gunk shot
- hyper voice
- icy wind
- knock off
- metal claw
- pain split
- power gem
- seed bomb
- swift
- take down
- throat chop
- thunder wave

### Psyduck (psyduck)

- body slam
- double edge
- flip turn
- ice punch
- icy wind
- knock off
- liquidation
- low kick
- metronome
- mud shot
- muddy water
- nasty plot
- psyshock
- swift
- take down
- whirlpool

### Golduck (golduck)

- body slam
- confuse ray
- double edge
- flip turn
- future sight
- ice punch
- icy wind
- knock off
- liquidation
- low kick
- metronome
- mud shot
- muddy water
- nasty plot
- power gem
- psyshock
- swift
- take down
- whirlpool

### Mankey (mankey)

- acrobatics
- body slam
- curse
- double edge
- drain punch
- fire punch
- gunk shot
- ice punch
- metronome
- seed bomb
- shadow claw
- stone edge
- swift
- take down
- throat chop
- thunder punch

### Primeape (primeape)

- acrobatics
- body slam
- curse
- double edge
- drain punch
- fire punch
- gunk shot
- ice punch
- metronome
- seed bomb
- shadow claw
- swift
- take down
- throat chop
- thunder punch

### Growlithe (growlithe)

- curse
- flame charge
- outrage
- psychic fangs
- swift
- thunder fang
- wild charge

### Poliwag (poliwag)

- amnesia
- focus punch
- icy wind
- liquidation
- low kick
- muddy water
- swift
- take down
- whirlpool

### Poliwhirl (poliwhirl)

- amnesia
- ice punch
- icy wind
- liquidation
- low kick
- metronome
- muddy water
- swift
- take down
- whirlpool

### Poliwrath (poliwrath)

- amnesia
- close combat
- high horsepower
- ice punch
- icy wind
- knock off
- liquidation
- low kick
- metronome
- muddy water
- swift
- take down
- throat chop
- whirlpool

### Bellsprout (bellsprout)

- grassy glide
- leaf storm
- lunge
- seed bomb
- sludge wave
- toxic

### Weepinbell (weepinbell)

- body slam
- grassy glide
- leaf storm
- leech life
- lunge
- seed bomb
- sludge wave
- swift
- toxic

### Victreebel (victreebel)

- body slam
- grassy glide
- leech life
- lunge
- seed bomb
- sludge wave
- swift
- toxic

### Tentacool (tentacool)

- flip turn
- gunk shot
- icy wind
- liquidation
- mud shot
- swift
- throat chop
- toxic
- toxic spikes
- whirlpool

### Tentacruel (tentacruel)

- confuse ray
- flip turn
- gunk shot
- icy wind
- knock off
- liquidation
- mud shot
- muddy water
- swift
- throat chop
- toxic
- toxic spikes
- whirlpool

### Graveler (graveler)

- body press
- body slam
- curse
- earth power
- fire punch
- focus blast
- heavy slam
- high horsepower
- iron defense
- iron head
- metronome
- mud shot
- take down
- thunder punch

### Golem (golem)

- body press
- body slam
- curse
- earth power
- fire punch
- high horsepower
- iron defense
- iron head
- metronome
- mud shot
- take down
- thunder punch

### Slowpoke (slowpoke)

- avalanche
- body slam
- foul play
- hydro pump
- icy wind
- liquidation
- mud shot
- psyshock
- swift
- take down
- waterfall
- whirlpool

### Slowbro (slowbro)

- body press
- body slam
- foul play
- future sight
- hydro pump
- ice punch
- icy wind
- iron defense
- liquidation
- metronome
- mud shot
- muddy water
- psyshock
- swift
- take down
- waterfall
- whirlpool

### Magnemite (magnemite)

- confuse ray
- heavy slam
- iron defense
- iron head
- sandstorm
- swift
- take down
- wild charge

### Magneton (magneton)

- confuse ray
- heavy slam
- iron defense
- iron head
- sandstorm
- swift
- take down
- wild charge

### Doduo (doduo)

- acrobatics
- body slam
- double edge
- knock off
- low kick
- rain dance
- swift
- tailwind
- take down
- throat chop

### Seel (seel)

- avalanche
- body slam
- curse
- double edge
- drill run
- flip turn
- hydro pump
- ice spinner
- muddy water
- triple axel
- whirlpool

### Dewgong (dewgong)

- body slam
- curse
- double edge
- drill run
- flip turn
- hydro pump
- ice spinner
- knock off
- liquidation
- muddy water
- play rough
- triple axel
- whirlpool

### Grimer (grimer)

- body slam
- confuse ray
- drain punch
- fire punch
- hex
- ice punch
- metronome
- mud shot
- pain split
- sandstorm
- take down
- thunder punch
- toxic
- zen headbutt

### Muk (muk)

- body slam
- confuse ray
- curse
- drain punch
- fire punch
- hex
- ice punch
- knock off
- lunge
- metronome
- mud shot
- pain split
- sandstorm
- swift
- take down
- thunder punch
- toxic
- toxic spikes
- zen headbutt

### Shellder (shellder)

- ice spinner
- icy wind
- liquidation
- spikes
- swift
- toxic spikes
- waterfall

### Cloyster (cloyster)

- body slam
- drill run
- ice spinner
- icy wind
- liquidation
- mud shot
- swift
- take down
- waterfall

### Gastly (gastly)

- foul play
- gunk shot
- icy wind
- nasty plot
- pain split
- poltergeist
- sludge wave
- thunder

### Haunter (haunter)

- fire punch
- focus blast
- foul play
- gunk shot
- ice punch
- icy wind
- metronome
- nasty plot
- pain split
- phantom force
- poltergeist
- sludge wave
- thunder
- thunder punch
- toxic spikes

### Drowzee (drowzee)

- body slam
- curse
- double edge
- draining kiss
- focus blast
- foul play
- knock off
- low kick
- metronome
- swift
- take down
- toxic

### Hypno (hypno)

- body press
- body slam
- confuse ray
- curse
- double edge
- draining kiss
- fire punch
- foul play
- hex
- ice punch
- knock off
- low kick
- metronome
- swift
- take down
- thunder punch
- toxic

### Voltorb (voltorb)

- agility
- double edge
- foul play
- metal sound
- take down
- wild charge

### Electrode (electrode)

- agility
- curse
- double edge
- foul play
- metal sound
- take down
- wild charge

### Exeggcute (exeggcute)

- grassy glide
- psyshock
- seed bomb
- zen headbutt

### Hitmonlee (hitmonlee)

- aura sphere
- body slam
- double edge
- giga impact
- knock off
- lunge
- metronome
- sucker punch
- swift
- swords dance
- take down
- throat chop

### Hitmonchan (hitmonchan)

- aura sphere
- body slam
- double edge
- giga impact
- knock off
- low kick
- metronome
- poison jab
- swift
- swords dance
- take down
- throat chop

### Weezing (weezing)

- body slam
- curse
- gunk shot
- pain split
- sludge wave
- take down
- toxic spikes

### Rhyhorn (rhyhorn)

- body press
- body slam
- double edge
- earth power
- heavy slam
- high horsepower
- icy wind
- mud shot

### Chansey (chansey)

- body slam
- fire punch
- focus blast
- hyper voice
- ice punch
- icy wind
- swift
- thunder punch
- wild charge
- zen headbutt

### Horsea (horsea)

- flip turn
- icy wind
- liquidation
- swift
- whirlpool

### Seadra (seadra)

- flip turn
- icy wind
- liquidation
- muddy water
- outrage
- swift
- whirlpool

### Electabuzz (electabuzz)

- body slam
- bulk up
- double edge
- electro ball
- fire punch
- ice punch
- knock off
- metal sound
- metronome
- take down
- wild charge

### Magmar (magmar)

- body slam
- curse
- double edge
- fire spin
- flame charge
- flare blitz
- heat crash
- heat wave
- knock off
- metronome
- poison jab
- take down
- thunder punch

### Eevee (eevee)

- body slam
- calm mind
- hyper voice

### Vaporeon (vaporeon)

- body slam
- calm mind
- curse
- flip turn
- hyper voice
- icy wind
- liquidation
- whirlpool

### Flareon (flareon)

- body slam
- calm mind
- curse
- heat wave
- hyper voice

### Porygon (porygon)

- double edge
- foul play
- icy wind
- psyshock
- swift
- take down
- zen headbutt

### Articuno (articuno)

- air slash
- brave bird
- double edge
- dual wingbeat
- ice spinner
- icy wind
- swift
- take down
- triple axel

### Zapdos (zapdos)

- acrobatics
- brave bird
- dual wingbeat
- electro ball
- heat wave
- hurricane
- metal sound
- swift
- tailwind
- take down
- wild charge

### Moltres (moltres)

- acrobatics
- brave bird
- double edge
- dual wingbeat
- fire spin
- flame charge
- flare blitz
- swift
- tailwind
- take down

### Dratini (dratini)

- body slam
- fire spin
- hydro pump
- icy wind
- iron head
- swift
- take down

### Dragonair (dragonair)

- body slam
- fire spin
- hydro pump
- icy wind
- iron head
- swift
- take down

### Dragonite (dragonite)

- air slash
- body press
- body slam
- fire spin
- heat wave
- hydro pump
- ice punch
- ice spinner
- icy wind
- iron head
- low kick
- metronome
- swift
- tailwind
- take down

### Mewtwo (mewtwo)

- agility
- body slam
- confuse ray
- curse
- dark pulse
- double edge
- earth power
- electro ball
- fire punch
- foul play
- hex
- hurricane
- ice punch
- icy wind
- knock off
- low kick
- metronome
- power gem
- psyshock
- take down
- thunder punch
- zen headbutt

### Mew (mew)

- acrobatics
- agility
- air slash
- blast burn
- body press
- body slam
- brave bird
- close combat
- confuse ray
- crunch
- curse
- double edge
- draco meteor
- dragon dance
- draining kiss
- drill run
- dual wingbeat
- earth power
- electro ball
- fire fang
- fire punch
- fire spin
- flame charge
- flare blitz
- flip turn
- foul play
- frenzy plant
- future sight
- grassy glide
- gunk shot
- heat crash
- heat wave
- heavy slam
- hex
- high horsepower
- hurricane
- hydro cannon
- hydro pump
- hyper voice
- ice fang
- ice punch
- ice spinner
- icy wind
- iron defense
- iron head
- knock off
- leaf storm
- leech life
- liquidation
- low kick
- lunge
- metal claw
- metal sound
- mud shot
- muddy water
- outrage
- pain split
- petal blizzard
- phantom force
- play rough
- pollen puff
- poltergeist
- power gem
- psychic fangs
- psyshock
- seed bomb
- sludge wave
- spikes
- swift
- tailwind
- take down
- throat chop
- thunder fang
- thunder punch
- toxic spikes
- triple axel
- whirlpool
- wild charge
- zen headbutt

### Gyarados (gyarados)

- body slam
- double edge
- icy wind
- iron head
- muddy water
- outrage
- sunny day
- take down
