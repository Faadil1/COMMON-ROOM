# COMMON ROOM

**Day 17 — North Quarter Public Library**

COMMON ROOM reimagines the public-library card as a belonging artifact rather than a generic access credential.

> A library card should not just unlock access. It should express belonging.

> Every member becomes part of the collection.

---

## The idea

Most library cards function as anonymous credentials.

COMMON ROOM treats the card as something different: a physical record of how someone participates in the library.

Visitors do not choose a personality or membership tier.

They move through the institution, leave real traces, and the system resolves those actions into a **Member Record**.

The result is not a badge.

It is an accumulated artifact.

**You do not receive a card. You accumulate one.**

---

## Core experience

COMMON ROOM is structured as **rooms, not pages**.

```text
COMMON ROOM
   ↓
THE STACKS     → READ
THE WORKSHOP   → MAKE
THE INDEX      → SEEK
THE QUARTER    → BELONG
   ↓
MEMBER RECORD
   ↓
MEMBER LENS
   ↓
THE LIVING COLLECTION
   ↓
NORTH QUARTER
```

The experience follows one core rule:

> Do not ask visitors how they belong; let behavior inside the library leave the evidence.

---

## Four Member Record families

The four families are not status levels or personality types.

They describe the relationship a visitor develops with the library through actual behavior.

| Family | Relationship | Evidence language |
| --- | --- | --- |
| **READER** | Returns to the page | margins, page traces, annotations |
| **MAKER** | Uses the library to make | registration, stock, ink, process |
| **SEEKER** | Follows references and questions | index paths, catalogue references |
| **LOCAL** | Treats the library as part of home | streets, addresses, civic memory |

Family resolution comes from the density of recorded actions. If scores tie, the most recent action among the tied families resolves the record.

---

## Signature system

### ACCESSION APERTURE

Every Member Record shares one asymmetrical physical opening.

It is not a decorative family motif.

The aperture is the structural signature of the object and carries a different evidence grammar for each family:

- **READER** — margin / page
- **MAKER** — registration / plate
- **SEEKER** — `021 → 114 → 403`
- **LOCAL** — market / school / river

The same aperture later becomes the reveal instrument inside the Member Lens.

**ONE CUT → FOUR EVIDENCE GRAMMARS**

---

## ACCESSION STRATA

The resolved Member Record also accumulates physical depth from real behavior.

Each registered action can become a visible stratum beneath the card. Hidden traces can appear as rarer deeper layers.

The stack briefly separates to reveal its construction before settling back into a compact object.

```text
MARK
  ↓
LAYER
  ↓
ACCUMULATE
  ↓
APERTURE
  ↓
REVEAL
  ↓
BELONG
```

**THE CARD REMEMBERS IN LAYERS.**

Depth is causal here: every visible layer corresponds to something the visitor actually did.

No synthetic history or separate scoring model is introduced.

---

## Member Lens

The resolved credential becomes an instrument.

Moving the Member Record across the archive reveals hidden provenance through the same ACCESSION APERTURE.

The card therefore changes from:

```text
credential
→ accumulated artifact
→ optical instrument
```

This keeps the reveal connected to the object itself rather than introducing a separate UI effect.

---

## The Living Collection

Individual Member Records become part of a larger accession wall.

The same object language is preserved at collection scale.

From there, the collection can be pulled back into an abstract map of North Quarter:

```text
member trace
→ card trace
→ collection trace
→ civic trace
```

**THE LIBRARY REMEMBERS.**

Every record keeps its own marks. When those traces connect, they draw the place that made them possible.

---

## Hidden traces

There are exactly four canonical hidden traces — one per exploratory room.

- **The Stacks** — Borrower Card / 1978
- **The Workshop** — Registered Imperfection
- **The Index** — Found Through Curiosity
- **The Quarter** — The Room Before the Library

They are cultural evidence, not achievements or game rewards.

---

## Design laws

COMMON ROOM is governed by a small set of rules:

```text
MARK → MEMORY → REVEAL → BELONG
ONE TRACE → MANY FORMS
THE LIBRARY REMEMBERS
```

The same evidence changes representation as it moves through the institution:

```text
margin → register → reference → street → card → city
```

The project deliberately avoids generic SaaS patterns, gamified progression, decorative 3D, and arbitrary card customization.

Removing the library rooms, Member Record, cataloguing logic, and domain-native traces should break the experience.

---

## Persistent state

The prototype keeps one local Member Record in the browser.

```text
localStorage key:
common-room-member-record-v2
```

That single record stores:

- registered room actions
- discovered hidden traces

Everything else — family resolution, card evidence, patina, strata, Lens content, and collection state — is derived from that record.

---

## Technology

- React
- Vite
- JavaScript
- CSS
- Lucide React
- localStorage
- three.js (Member Record only, lazy-loaded)
- jsPDF (print sheet, lazy-loaded)
- Cloudflare Pages-compatible SPA routing

No backend, authentication layer or wallet system is required. WebGL is optional: the Member Record falls back to the SVG card.

---

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

## Project status

The Day 17 prototype is now promoted to **`main`**.

Current canonical implementation includes:

- Rooms-not-pages navigation
- persistent Member Record
- READER / MAKER / SEEKER / LOCAL resolution
- four hidden traces
- behavior-derived card evidence
- semantic patina
- ACCESSION APERTURE
- ACCESSION STRATA
- Member Lens
- Living Collection
- Collection → Quarter reveal
- reduced-motion handling

The remaining work is runtime QA and final publication capture rather than product-scope expansion.

---

## Member Record v3 — the card as an archive object

The Member Record is now drawn as one SVG object (`src/cardArt.jsx`) and reused everywhere: lobby, record, wall, lens, 3D, PNG and print.

- **Four materials** — READER (book cloth, gilt, marbled window, ex libris), MAKER (kraft, two-ink letterpress, colour bar), SEEKER (cyanotype catalogue card, typewriter), LOCAL (transit green, civic map, line diagram of your places).
- **Generative accession rosette** — a guilloche computed from the visitor's own marks; hidden traces add gilt stars.
- **Edge-notched card (McBee Keysort)** — each mark opens a notch; the accession number is notched in binary on the bottom edge.
- **Tipped-in ephemera** — each hidden trace arrives as a 1978 borrower's card, a kept misprint, an NQ.000 slip or a 1963 postmark.
- **Back of the card** — barcode and a date-registered slip, one stamp per mark.
- **3D accession** (`src/card3d.jsx`, three.js, lazy-loaded on `/record` only) — die-cut plate with real thickness, foil that catches light, strata as sheets, the stamp pressed into the card. SVG fallback without WebGL or with reduced motion (`?flat` forces it).
- **Rooms as objects** (`src/rooms.jsx`) — a bookshelf and an open book for margin marks, a letterpress with registration, a card catalogue, an engraved civic map. Each mark flies into the header passport.
- **Take it with you** — PNG export, a print-at-home PDF at CR80 size (fold-and-glue), and a share link `/card/<code>` that encodes the visit in the URL (no server).
- **Sound** — synthesised paper, drawer, press and stamp sounds, off by default.
- **Specimen board** at `/cards`.

---

## Day 17

COMMON ROOM is part of **30 Days of Real Business Problems** — a project series exploring how research, product logic, interaction design, and implementation can turn overlooked operational or cultural problems into working artifacts.
