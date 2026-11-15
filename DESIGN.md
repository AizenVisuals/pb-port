---
name: PULSE ARENA
description: Light framed game menus with pixel creatures and a real-time battle surface.
colors:
  bg: "#d7e8e4"
  surface: "#fff9eb"
  raised: "#f2ead7"
  ink: "#263f4d"
  muted: "#526c75"
  cyan: "#2b9f9f"
  coral: "#e96758"
  gold: "#9a6812"
  line: "#c8c5ae"
  good: "#28734e"
  bad: "#ae3943"
  header: "#284a58"
  content: "#f7f2e3"
  panel: "#fffbef"
  on-primary: "#49251f"
  battle-ink: "#f6f3ea"
  battle-cyan: "#7de5e0"
typography:
  display:
    fontFamily: "BarlowCondensed, Barlow, sans-serif"
    fontSize: "38px"
    fontWeight: 800
    lineHeight: 0.85
    letterSpacing: "-.025em"
  headline:
    fontFamily: "BarlowCondensed, Barlow, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-.02em"
  title:
    fontFamily: "Barlow, sans-serif"
    fontSize: "23px"
    fontWeight: 700
    lineHeight: 1.12
  body:
    fontFamily: "Barlow, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Barlow, sans-serif"
    fontSize: "12px"
    fontWeight: 700
rounded:
  tag: "6px"
  field: "9px"
  secondary: "10px"
  primary: "11px"
  slot: "12px"
  card: "13px"
  panel: "14px"
  dialog: "18px"
spacing:
  tight: "4px"
  compact: "8px"
  control: "12px"
  panel: "16px"
  workspace: "18px"
  expanded: "24px"
components:
  button-primary:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.primary}"
    height: "48px"
  button-secondary:
    textColor: "#304a54"
    rounded: "{rounded.secondary}"
    height: "48px"
  input:
    backgroundColor: "#fffdf6"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px"
    height: "48px"
  type-tag:
    backgroundColor: "#e3eee5"
    textColor: "#264b4b"
    rounded: "{rounded.tag}"
    padding: "3px 7px"
  side-panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
    padding: "16px"
  collection-card:
    textColor: "#304b51"
    rounded: "{rounded.card}"
    padding: "8px"
  inventory-slot:
    rounded: "{rounded.slot}"
    padding: "8px"
  navigation-item:
    rounded: "{rounded.slot}"
    padding: "3px 5px"
---

# Design System: PULSE ARENA

## Overview

**Creative North Star: "Light game panels around a living pixel partner"**

PULSE ARENA uses warm ivory panels, navy graphite text and structural frames around colorful pixel creatures and original world art. Coral commands have shallow tactile depth; cyan distinguishes selection and progress. The game remains compact and landscape, with an animated favorite leading the lobby.

This records the approved light-game replacement, superseding the old dark menu rules while preserving the graphite/cyan/coral identity, bundled Barlow typography, pixel assets and high-contrast real-time battle HUD. Authority is PRODUCT.md and `.impeccable/surfaces/pulse-light-game.md`; the pinned Pokémon: Champion captures establish composition rather than reusable promotional art. No catalog roll, QUALITY BAR card or independently verified FORM seed was recorded.

**Key Characteristics:**
- Warm framed task panels and shallow bevels.
- Pixel creatures carry identity; world artwork carries place.
- Coral actions, cyan selection and explicit text states.
- Landscape workspaces with internal scrolling and persistent navigation.

## Colors

The normative colors above are extracted from the final stylesheet cascade, with menu and battle scopes kept distinct.

### Primary
- **Coral command:** the coral token marks the action family; the actual filled button uses a light-to-deep coral gradient and dark on-primary text, recorded in the sidecar.
- **Cyan selection:** selection edges, progress and focus; selected tabs also use a warm cream fill and coral text.

### Secondary
- **Earned gold:** coins, counts and rewards. Diamond balances use a separate blue accent in the implemented wallet.
- **State green / state red:** eligibility and failure messaging; labels explain the state.

### Neutral
- **Warm surface / raised / panel / content:** distinguish cards, side panels and page ground without reverting to the old dark menus.
- **Graphite ink / muted:** hierarchy for primary and supporting text. The header uses deep blue graphite with a cyan lower edge.
- **Battle ink / battle cyan:** local high-contrast HUD overrides; these are not an alternate management theme.


**The Action and Selection Rule.** Use coral for primary commands and cyan for selected inventory, formation and progress; keep state text alongside color.

## Typography

**Display Font:** self-hosted BarlowCondensed, with Barlow and sans-serif fallbacks. The shipped condensed face is weight 800 italic; the wordmark and creature name use that game display character. Page-title CSS requests normal style, although no separate upright condensed face is bundled.
**Body Font:** self-hosted Barlow at 400, 600 and 700, with sans-serif fallback. Some commands request 800 from the same family; no separate Barlow 800 file is declared.

### Hierarchy
- **Display:** the base wordmark uses the frontmatter role; compact landscape uses 33px, expanded desktop 56px. The creature name uses 29px base, 27px compact and 43px expanded.
- **Headline:** contextual screen titles use the frontmatter role, adapting to 25px compact and 34px expanded; campaign compact titles use 23px.
- **Title:** panel headings use the title role; compact panels commonly use 20px, with inventory and formation refinements scoped locally.
- **Body:** base 16px and 1.4 line-height; panel text commonly uses 13px base, 11–12px compact and 15px expanded.
- **Label:** common chips and navigation use 12px, with navigation 11px compact and 14px expanded. Quantities and experience use tabular numerals where defined.

The type ramp is responsive and component-specific, not a single multiplicative scale. Compact micro-labels are implementation debt, not a new minimum legibility standard.

**The Pixel Subject Rule.** Preserve pixel rendering on creature and item assets; UI labels remain normal text.

## Layout

The app fills 100svh as header, flexible content and bottom navigation, with safe-area padding on every edge. The base header/navigation heights are 56px/69px; compact landscape at max-height 440px uses 50px/62px. At min-width 1100px and min-height 600px they become 65px/83px. Bottom navigation remains horizontal at the observed desktop size; the old rail prescription no longer describes the build.

Content uses 12px 18px base padding, 9px 14px compact and 20px 30px expanded. The spacing tokens are recurring measurements, not an exclusive grid. Formation uses a field and command panel with an owned roster below; partner uses sprite stage and tabbed workspace; inventory uses item slots and persistent detail; campaign uses a pannable numbered map and stage summary with a fixed launch action. Most workspaces use a flexible main area with a roughly 215–250px minimum side panel on phones. The collection uses auto-fill cards, with compact minimum column width 103px and 8px gaps.

Internal scrolling is explicit on task panels, roster and stage summary. Campaign adds an "Arraste para explorar" affordance. At max-width 639px in portrait, task workspaces stack as a fallback; landscape remains the product orientation. All 48px measurements here are CSS pixels in the shared WebView surface, not verified Android dp measurements.

**The Task Workspace Rule.** Keep partner, formation, inventory, shop and invocation as separate tasks, with contextual Back and retained selection when returning.

## Elevation & Depth

This world uses shallow gradients, inset highlights and soft ambient shadows as game-panel materials. These devices are native to the approved direction. The lobby layers UI over an illustrated terrace, formation over an oval field and campaign over original route art. Depth is structural and contextual rather than decorative glass.

### Shadow Vocabulary
- **Command bevel:** inset top highlight, subtle lower lip and short ambient shadow; exact snippets are in the sidecar.
- **Task panel:** low soft separation beneath light side panels.
- **Dialog:** stronger ambient shadow with a dark translucent backdrop; account, capture choices, pause and results interrupt through dialogs.

**The Combat Contrast Rule.** Keep the dark real-time HUD scoped to battle; light menu tokens must not reduce its control contrast.

## Shapes

Small tags have gently rounded corners, fields and secondary buttons slightly larger corners, cards and inventory slots rounded rectangular frames, and dialogs the largest shared radius. Contextual Back is circular. Campaign nodes are circles with numbered captions; the formation field is an oval. These content geometries are part of the game vocabulary. Primary borders and shallow bevels remain visible against light panels.

## Components

### Buttons
Coral primary buttons use the two-stop gradient, dark text, thin coral border, inset highlight and lower lip shown in the sidecar. Secondary buttons use a cream gradient, navy text and muted border. Text actions retain a simple readable label. Hover brightens enabled controls; press moves them down 2px. Disabled opacity is .48 with the disabled cursor inherited from the base sheet. Focus-visible is a 3px outline, menu color #148b91 and 2px offset for buttons/fields. Most task commands are at least 48px high; smaller ancillary controls are exceptions, not a pattern to extend.

### Chips and Tabs
Type tags are small framed labels rather than buttons. Segmented filters use an inset pale container with a warm selected tile. Partner and invocation tabs expose aria-selected; selected tabs use a cream gradient, coral text and a small shadow. Compact task tabs retain the final 48px minimum override.

### Cards / Containers
Collection cards use pale green gradients, framed borders, shallow shadows and pixel portraits. Rare cards shift toward mint, epic toward warm gold. Locked cards retain readable text and use desaturated portraits with .45 opacity; ownership is also stated in copy. Inventory slots use cream gradients, item art and visible quantities, with a cyan border and mint fill for the selection. The side panel keeps item description, recipient selection and equip command separate from the grid.

### Inputs / Fields
Inputs/selects use warm white fill, graphite text, a muted green-gray stroke, field radius, 12px padding and a 48px base minimum. Search remains editable; the body's text-selection restriction explicitly exempts editable fields. Some compact lobby selects override the minimum; do not reuse that exception as a general field specification.

### Navigation
Seven labeled SVG destinations form the bottom hub in the shipped menu. Active aria-current uses a warm peach gradient and border; each destination icon has its own restrained color. Secondary tasks add a circular Back control and contextual title. The sidecar reproduces the item treatment, not the complete routing logic.

### Partner, Formation and Campaign
The partner workspace separates attributes, moves, evolution and held item. Evolution shows eligibility, a disclosure explaining permanent real-time evolution, and a sticky campaign command. Compact formation keeps six ordered slots, text lead/reserve roles and actual add/replace/remove actions; small sprites are supporting content, not a decorative badge system. Map nodes expose locked/current/cleared states through text, icons and color. Invocation separates Pokémon banners from compatible technique draws and keeps costs, chances and pity visible.

### Motion and Feedback
Menu title arrival uses a short eased 5px rise and fade; pressed controls respond immediately. Selected map nodes gently pulse. Summon reveal uses authored film plus sprite/reveal states. The base reduced-motion media rule suppresses CSS animation/transition ; the controller omits portal film and chooses the reduced-motion path. This records implementation support, not a measured native frame-rate claim.

## Do's and Don'ts

### Do:
- Do keep the warm light panels and graphite structure of the approved replacement.
- Do show owned, locked, level, quantity and eligibility states in text.
- Do preserve pixel creature animation, with reduced-motion alternatives for interface transitions and reveals.
- Do keep primary commands reachable while task content scrolls.

### Don't:
- Don't restore the superseded dark menu system across management screens.
- Don't copy promotional character art, phone frames or monetization clutter from reference screenshots.
- Don't imply that formation position grants a front/back combat bonus or that acquisition rarity increases stats.
- Don't claim native performance or complete device coverage from browser screenshots.

Source evidence: `public/pulse.html` loads `public/pulse/style.css` before `public/pulse/rpg.css`; final overrides determine the values above. Behavior samples: `public/pulse/management-ui.js` and `public/pulse/app.js`. Visual samples inspected: `research/validation/rpg/home-phone.png`, `team-phone.png`, and `bag-desktop.png` (844×390 phone / 1280×720 desktop matrix). The native captures `research/validation/rpg/redmi-inventory.png` and `redmi-final-lobby.png` are separate device evidence; they do not establish every menu or performance condition. The finish verdict covers its seven scored fixes, not a fresh complete quality audit.

Not canonized or repaired: compact microtype, ancillary controls below the 48px target, seven-destination bottom navigation on expanded screens, and the bundled-font/style mismatch remain build limitations. No invented kickers, system display faces or hard offset shadows are promoted as rules. Only documentation changed.
