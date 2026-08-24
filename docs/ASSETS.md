# ASSETS.md — media architecture, Block 08

No binary media lives in this repository — images/video/PDFs are large,
change independently of code, and don't belong in git history
(docs/MASTER_BRIEF_BLOCK_08.md, "18. ASSETS": "no llenar el repo
innecesariamente con archivos pesados"). This document is the
placeholder convention every page already follows, and the exact list
of what Cristian needs to provide, per department, for real assets to
replace them — arrival of real assets should never require rebuilding
a page.

## Convention today

Every page ships with **structurally-correct placeholders**, not
missing sections: text-only cards/heroes with real copy, no `<img>`
pointing at a fake URL, no broken image icon. None of the pages built
in Block 07/08 reference an external image host or a local `/public`
asset that doesn't exist — this was true before this doc existed and
is now the explicit, documented rule.

## How a real asset lands, when it arrives

1. Cristian provides the file (photo/logo/video/PDF).
2. It goes through Next.js's own static asset pipeline (`public/` +
   `next/image`) or a future media host — **not decided yet**, out of
   scope for Block 08 (no vendor chosen, no credentials exist).
3. The page's own placeholder block (a text card, a solid-color hero)
   gets an `<Image>`/`<video>` added in the same slot — a content
   change, not a restructure, exactly like every other "infrastructure
   ready, content pending" pattern this repo already uses (offers with
   no price yet, an about page with no biography yet).

## Asset checklist, by department

| Department | Needed | Where it lands |
|---|---|---|
| **Entrenar** | Fotos de Cristian entrenando/calistenia; thumbnail para cada tier de coaching (opcional) | `/entrenar` cards |
| **Comunidad** | Foto/logo de la comunidad WhatsApp/Instagram | `/comunidad` cards |
| **Música** | Título y artwork definitivos de la primera canción; archivo de audio final (nunca en este repo); mecanismo de distribución/almacenamiento (Decision Gate 3) | `/musica`, futura zona de acceso privado |
| **Productos** | Fotos de producto (físicos); mockups/covers (digitales) | `/productos` catálogo |
| **Shows** | Fotos/video de shows anteriores, por segmento (corporativo, colegio, festival, etc.) | `/shows` "formatos de partida" |
| **Marcas** | Logos de Club Nativos y Expo Fitness (uso autorizado); fotos de activaciones si existen | `/marcas` sección de embajador |
| **Historia** | Fotos de trayectoria/competencias/música/shows; logos de medios (El Colombiano); enlaces a entrevistas | `/about`, cada tema de la grilla |
| **Eventos** | Fecha, lugar, imagen, descripción por evento real (ninguno existe todavía — no se inventa) | `/eventos` |
| **Redes** | Ninguno — las URLs ya son reales (docs/UNIVERSE_UX.md §7); un favicon/OG image general del sitio es la única pieza gráfica pendiente a nivel global | `layout.tsx` metadata |

## What this does NOT include

No decisión de proveedor de almacenamiento/CDN para música (Decision
Gate 3, docs/MASTER_BRIEF_BLOCK_07_10.md) — listado aquí como
dependencia, no resuelto. No PDFs comerciales de shows todavía
(docs/MASTER_BRIEF_BLOCK_08.md, "08.5": "no crear 15 PDFs ahora").
