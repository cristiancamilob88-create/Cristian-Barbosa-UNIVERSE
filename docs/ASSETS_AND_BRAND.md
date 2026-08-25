# ASSETS_AND_BRAND.md — Block 08.10, Fase 6

Extends `docs/ASSETS.md` (Block 08's per-department checklist, still
valid) with the 16 specific categories requested for public-preview
readiness, each marked with a real status — no asset is invented or
assumed here, and none is uploaded to this repo (docs/ASSETS.md's own
rule: binaries don't belong in git history).

**Status legend**
- **REAL** — a real file/URL exists and the app already uses it.
- **PENDIENTE** — nothing exists yet; Cristian needs to provide it.
- **PLACEHOLDER** — the app currently shows a structural stand-in
  (text card, solid color, generic icon) instead of the real asset,
  by design (docs/ASSETS.md, "Convention today") — not broken, just
  not final.

## 1. Categorías

| # | Categoría | Estado | Detalle | Dónde vive en producción |
|---|---|---|---|---|
| 1 | Logo principal | **PENDIENTE** | No existe ningún archivo de logo en el repo (`public/` no tiene imágenes de marca); el sitio usa wordmark tipográfico (`siteConfig.name`/`universeName`, `src/config/site.ts`) en vez de un logo gráfico. | `public/` + referencia en `layout.tsx`/`Header.tsx`/`Footer.tsx` una vez exista |
| 2 | Logo secundario (ícono/monograma) | **PENDIENTE** | Igual que el principal — no hay una versión reducida para favicon/app icon todavía. | `public/` (favicon.ico, apple-icon, icon.svg) |
| 3 | Fotos de Cristian | **REAL** (parcial) — 2026-08-25 | Una foto real (`public/brand/cristian-hero-01.jpg`) en el hero de `/bienvenida/[slug]`, primera imagen real de Cristian en toda la app. `/about`, `/entrenar` y la home siguen en texto puro — mismo asset se puede reusar ahí cuando se decida el diseño. | `/bienvenida/[slug]` hero (listo); `/about` hero, `/entrenar` hero, homepage pillar grid (pendientes) |
| 4 | Fotos de entrenamiento/calistenia | **PLACEHOLDER** | `/entrenar` describe los tiers de coaching en texto (`coachingTiers`), sin fotos de sesiones. | `/entrenar` cards |
| 5 | Fotos de shows | **PLACEHOLDER** | `/shows` lista 10 segmentos y 5 paquetes (`audiences`/`packages`) en texto puro, sin evidencia visual de shows anteriores. | `/shows` "formatos de partida" |
| 6 | Fotos musicales / artwork | **PENDIENTE** | `/musica` ya declara el precio (10.000 COP/canción) pero **sin** título ni artwork confirmados — explícitamente no inventado (Decision Gate abierto en Block 07). | `/musica`, futura zona de acceso privado (`entitlement`) |
| 7 | Fotos de eventos | **PENDIENTE** | `/eventos` tiene 4 categorías, todas con estado vacío honesto (`categories` array) — no hay ni un evento real confirmado, ninguno fue inventado. | `/eventos` por categoría |
| 8 | Fotos B2B (activaciones con marcas) | **PENDIENTE** | `/marcas` documenta Club Nativos y Expo Fitness como embajadorías confirmadas (`ambassadorships`), sin fotos de activaciones. | `/marcas` sección de embajador |
| 9 | Logos de marcas (Club Nativos, Expo Fitness) | **PENDIENTE** | Mismas dos marcas — nombre confirmado, logo con autorización de uso todavía no provisto. | `/marcas` sección de embajador |
| 10 | Logos de medios/prensa (El Colombiano) | **PENDIENTE** | `/about` menciona la mención de prensa por nombre (confirmado por Cristian) sin URL/fecha/título del artículo ni logo del medio — nada de eso fue inventado. | `/about` sección de prensa |
| 11 | Artwork musical (portada de sencillo) | **PENDIENTE** | Mismo ítem que #6, listado aparte porque el brief lo pide como categoría propia — depende del mismo Decision Gate (título + artwork + almacenamiento). | `/musica` |
| 12 | Imágenes de producto (físicos/digitales) | **PLACEHOLDER** | `/productos` separa `productos_fisicos`/`productos_digitales` en texto, con CTA a WhatsApp comercial para físicos — sin fotos de catálogo ni mockups. | `/productos` catálogo |
| 13 | Iconografía social (íconos de plataforma) | **PLACEHOLDER** | `/redes` y `GoLink` muestran el nombre de la plataforma como texto (`profile.platform`, mono uppercase), no un ícono gráfico — ver Fase 7 más abajo. | `/redes`, footer |
| 14 | Videos | **PENDIENTE** | Ninguna página del sitio referencia video todavía (ni embed ni archivo) — no hay vendor de hosting de video decidido (fuera de alcance, docs/ARCHITECTURE.md §10-11: sin librerías 3D/motion pesadas todavía). | Sin ubicación definida — depende de elegir vendor |
| 15 | Testimonios | **PENDIENTE** | No existe ninguna sección de testimonios en ninguna ruta; no hay dato de cliente/alumno real capturado todavía (0 filas en `contact`/`lead` de producción, confirmado en docs/SUPABASE_PRODUCTION.md §3). | Candidato natural: `/entrenar`, `/comunidad` |
| 16 | Material de prensa (kit de prensa) | **PENDIENTE** | No existe un press kit; la única mención de prensa real es El Colombiano (#10), sin material descargable. | Candidato natural: `/about` o una ruta dedicada futura |

## 2. Qué NO se hizo en esta fase

- No se subió ningún binario a este repositorio (sigue la regla de
  `docs/ASSETS.md`).
- No se inventó ningún nombre de archivo, URL de imagen ni proveedor
  de CDN/almacenamiento — la fila 6/11 (música) y la 16 (kit de
  prensa) dependen de decisiones que Cristian aún no ha tomado
  (Decision Gates ya abiertos en blocks anteriores, no reabiertos
  aquí).
- No se cambió ninguna página para "simular" un asset — cada
  PLACEHOLDER de esta tabla es exactamente el mismo placeholder
  estructural que ya describía `docs/ASSETS.md` desde Block 08, solo
  reclasificado bajo las 16 categorías pedidas.

## 3. Cómo aterriza un asset real (sin cambio de arquitectura)

Idéntico al proceso ya documentado en `docs/ASSETS.md`, "How a real
asset lands, when it arrives": Cristian provee el archivo → entra por
`public/` + `next/image` (sin vendor externo decidido todavía) → la
tarjeta/placeholder existente en la página gana una imagen en el mismo
lugar, sin restructurar la página. Nada en esta fase cambia ese
proceso; esta tabla solo hace explícito, categoría por categoría, qué
falta y dónde va a vivir.
