# Marshadow learnset expansion — bounded research

Research date: 2026-11-14. No matches were run and no engine, roster, data or server files were changed by this research task.

## Canonical vs custom

Primary learnset sources reviewed: [Generation VIII Sword/Shield](https://pokemondb.net/pokedex/marshadow/moves/8) and [Generation VII Ultra Sun/Ultra Moon](https://pokemondb.net/pokedex/marshadow/moves/7). These generations differ; the proposed pool deliberately combines legal historical options rather than claiming legality in one competitive cartridge format.

**Hex is canonical**, available through Sword/Shield TM77. Fire Punch, Thunder Punch, Drain Punch and Will-O-Wisp are also canonical. Knock Off and Toxic are historical Generation VII options. Bulk Up is canonical but no existing donor was found in the downloaded roster.

**Mach Punch**, already present in the port's first Marshadow pool, was not found in either complete Generation VII/VIII learnset reviewed; label it a custom port addition or omit it from an official-only pool. Earthquake and Psychic were likewise not found; avoid adding them under an official-learnset claim. This is a bounded two-generation check, not a statement about every later game or event.

The new Mega form and the port's capped Spectral Thief mechanics are fan-made adaptations regardless of learnset legality.

## Existing donor implementations

Values below are the exact current roster metadata, not recommended final balance settings. Cooldowns are frames at 60 frames/second. Selected source IDs exist in engine registries through the roster, although species-specific animation/body assumptions still warrant the parent's static inspection.

| Move | Existing donor ID | Type/category | Power | Cooldown | Reach |
|---|---|---|---:|---:|---|
| Fire Punch | `golemAG:Fire Punch` | fire/phys | 75 | 180f (3s) | close |
| Thunder Punch | `charizardR:Thunder Punch` | electric/phys | 75 | 180f (3s) | close |
| Drain Punch | `toxicroak:Drain Punch` | fighting/phys | 75 | 300f (5s) | mid |
| Hex | `cofagrigus:Hex` | ghost/spec | 65 | 480f (8s) | close |
| Will-O-Wisp | `cofagrigus:Will-O-Wisp` | fire/status | 0 | 300f (5s) | long |
| Toxic | `crobat:Toxic` | poison/status | 0 | 600f (10s) | mid |
| Stone Edge | `heracross:Stone Edge` | rock/phys | 100 | 300f (5s) | mid |
| Rock Slide | `golemAG:Rock Slide` | rock/phys | 75 | 180f (3s) | mid |
| Poison Jab | `toxicroak:Poison Jab` | poison/phys | 80 | 192f (3.2s) | mid |
| Knock Off | `rillaboomL:Knock Off` | dark/phys | 65 | 180f (3s) | close |
| Shadow Ball | `alakazam:Shadow Ball` | ghost/spec | 80 | 192f (3.2s) | mid |
| Focus Blast | `alakazam:Focus Blast` | fighting/spec | 120 | 420f (7s) | long |
| Protect | `weavile:Protect` | normal/status | 0 | 600f (10s) | self/status |
| Substitute | `manectric:Substitute` | normal/status | 0 | 900f (15s) | self/status |
| Calm Mind | `alakazamD:Calm Mind` | psychic/status | 0 | 900f (15s) | self/status |
| Agility | `metagrossA:Agility` | psychic/status | 0 | 900f (15s) | self/status |
| Iron Head | `aegislash:Iron Head` | steel/phys | 80 | 192f (3.2s) | close |
| Force Palm | `lucarioSP:Force Palm` | fighting/phys | 60 | 150f (2.5s) | mid |
| Counter | `lycanrocM:Counter` | fighting/status | 0 | 600f (10s) | self/status |
| Acrobatics | `archeops:Acrobatics` | flying/phys | 110 | 240f (4s) | mid |
| Low Kick | `weavileM8:Low Kick` | fighting/phys | 60 | 220f (3.66667s) | close |
| Brick Break | `scyther:Brick Break` | fighting/phys | 75 | 300f (5s) | close |
| Phantom Force | `shedinjaNM:Phantom Force` | ghost/phys | 90 | 420f (7s) | long |
| Poltergeist | `gourgeistM8:Poltergeist` | ghost/phys | 110 | 280f (4.66667s) | mid |
| Shadow Claw | `slakingNM:Shadow Claw` | ghost/phys | 70 | 140f (2.33333s) | close |
| Blaze Kick | `blazikenNM:Blaze Kick` | fire/phys | 85 | 200f (3.33333s) | close |
| Aura Sphere | `blastoiseB:Aura Sphere` | fighting/spec | 80 | 192f (3.2s) | long |
| Zen Headbutt | `tauros:Zen Headbutt` | psychic/phys | 80 | 192f (3.2s) | mid |
| Foul Play | `umbreonD:Foul Play` | dark/phys | 95 | 228f (3.8s) | close |
| Throat Chop | `nidoking:Throat Chop` | dark/phys | 80 | 192f (3.2s) | close |
| Payback | `bronzongSP:Payback` | dark/phys | 50 | 260f (4.33333s) | mid |
| Double Team | `swellow:Double Team` | normal/status | 0 | 900f (15s) | self/status |
| Rest | `snorlax:Rest` | psychic/status | 0 | 1200f (20s) | self/status |
| Sleep Talk | `heracrossAT:Sleep Talk` | normal/status | 0 | 200f (3.33333s) | self/status |

## Mechanics and balance caveats from static code inspection

- **Hex** (`cofagrigus:Hex`) is a SPECIAL attack, power 65, fixed ranked cooldown 480 frames and range [30,110]. PB's ranked wrapper changes the status-boosted power 130 to **97** (`G9a=97`), approximately 1.5× rather than canonical 2×. Do not describe the donor as physical or as doubled damage. A Will-O-Wisp + Hex set is thematic and uses the weaker special offense of base Marshadow, providing a distinct alternative to physical coverage.
- **Drain Punch** heals half the damage dealt in the donor generator. It is **not** in ranked healing set `hj`, so it does **not** automatically share the two-heals-per-battle restriction. Consider 360–420 frames rather than the default 300 if paired with Mega bulk; retain the damage-dependent recovery and avoid advertising a two-use limit that does not exist.
- **Rest/Recover-like recovery:** `hj` contains Rest, Recover, Roost, Synthesis, Moonlight, Morning Sun, Floral Healing, Soft-Boiled, Slack Off, Milk Drink, Shore Up, Heal Order. These use 30% max-HP restoration and share two heals per battle in ranked. Rest also causes sleep.
- **Buffs:** ranked set `bxe` includes Calm Mind, Bulk Up, Agility and Double Team; `Tq0` returns two uses per stay for these names. Canonical Bulk Up needs a new generator (+1 Attack/+1 Defense) if chosen. Reusing the exact name and wrapping it with the ranked wrapper enables the existing usage accounting; a differently named custom buff would not inherit that rule automatically.
- **Protect:** its metadata cd600 is not the full story: ranked handling starts at 420 frames (7s), adds 180 frames (3s) per use and resets on switch.
- **Substitute:** pays 25% max HP and is described as once per battle. Avoid implying it is merely a free shield on cooldown.
- **Technician:** boosts moves with listed power at most 60; it does not boost the elemental punches (75), Drain Punch (75), or Hex (65). Force Palm and Shadow Punch (60), Shadow Sneak (40) and Low Kick's listed 60 can interact with it; Low Kick has weight-based damage handling and should not be treated as a fixed 60-power attack.
- **Acrobatics:** donor metadata lists 110 (engine adaptation), unlike the cartridge base power 55. Keep a conservative cooldown (e.g. 300–360f) if offered alongside Technician-based coverage; do not blindly label it 55 in the UI.
- **Knock Off:** donor description is a strong backhand with knockback. It does not promise cartridge item-removal behavior; avoid claiming that without a dedicated implementation.
- **Poltergeist:** donor throws floor debris. Cartridge item-possession conditions are not asserted by its description.
- **Sucker Punch:** works only while the target is attacking; the ranked wrapper checks this condition and can fail it. Do not remove that counterplay when cloning it.
- **Phantom Force/Shadow Sneak:** invulnerability or self-hiding during their own animations plus a separate Protect/Substitute slot can make total untargetable time oppressive. Preserve the first version's longer Shadow Sneak cooldown and use a long Phantom Force cooldown (at least 480f) for Mega sets.
- **Mega interaction:** the same four selected moves should carry across transformation; expanding the pool does not mean increasing active slots. Avoid multiplying Technique/Technician twice by also pre-boosting move power.

## Recommended launch pool

Keep the current four defaults so saved teams remain recognizable. Add Fire Punch, Thunder Punch, Drain Punch, Hex, Will-O-Wisp, Poison Jab, Stone Edge, Rock Slide, Shadow Ball, Focus Blast, Protect, Substitute, Calm Mind, Agility, Iron Head, Force Palm, Counter, Acrobatics, Low Kick, Brick Break, Phantom Force, Poltergeist, Knock Off, Shadow Claw and Blaze Kick. Historical Toxic, Rest/Sleep Talk, Payback, Foul Play, Throat Chop, Aura Sphere, Zen Headbutt and Double Team can be additional advanced alternatives.

Suggested cloned cooldowns for *initial tuning*, separate from the source metadata: elemental punches 240f, Drain Punch 360–420f, Hex 480f, Will-O-Wisp 420f, Poison Jab 270f, Stone Edge 360f, Rock Slide 300f, Shadow Ball 270f, Focus Blast 420f, Force Palm 270f, Iron Head 300f, Knock Off 300f, Phantom Force 480–540f. Those values are design recommendations, not validated match results.

Coverage tradeoffs remain real with four slots: Fire Punch targets Steel, Thunder Punch targets Water/Flying, Ice Punch targets Flying/Dragon, Poison Jab/Iron Head target Fairy. Choosing one or two of these should cost ghost/fighting STAB, recovery, or a status slot. No win-rate or meta claim is established by this code-only research.
