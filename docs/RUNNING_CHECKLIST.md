# RUNNING_CHECKLIST.md — the live, ongoing list

Not a block deliverable — a running list Cristian asked to keep as
things come up mid-conversation, so nothing said in passing gets lost.
Update this file (add/close items) instead of letting a spoken request
live only in chat history. Newest items at the top of each section.

**2026-09-18**: Cristian's own ask, re-stated — "necesito que lleves
checklist ordenados y organizados para seguir trabajando lo que se
pausa, lo que falta y todo eso." Full pass done this date: every item
below re-checked against the real state of the code/production, not
assumed from memory. Several items closed here for the first time
since 2026-08-25/28 even though the underlying work finished earlier
in the conversation — this file had gone stale relative to the actual
session.

## Open

- **Cumplimiento legal — BLOQUEANTE antes de pauta/ventas** (2026-09-24,
  a partir de un checklist que Cristian compartió): faltan `/privacidad`
  (Ley 1581/2012 + cookies), `/terminos` (Ley 1480: compras, derecho de
  retracto 5 días hábiles, reembolsos, reversión de pago), casilla de
  autorización obligatoria en `ContactForm` con fecha guardada como
  prueba (necesita migración nueva), y datos del negocio en el footer.
  Esperando de Cristian: nombre legal completo, cédula/NIT, ciudad,
  correo para solicitudes de datos, teléfono. No inventar ninguno.

- **SEO — pendientes pequeños** (2026-09-24): (1) CERRADO — "ENTRENADOR" reemplazado por "CREADOR" en la franja animada
  del home (`tickerWords`, src/app/page.tsx) todavía dice "ENTRENADOR"
  — Cristian dijo que no le gusta mucho ese término (quiere ser
  conocido por música, shows y contenido); preguntado si se quita, sin
  respuesta todavía. (2) CERRADO — Facebook ya usa los links directos
  (`cristianbarbosa201`, `cristian.barbosa.870099`), aplicado en producción. (3) Revisar en Search Console
  al día siguiente: sitemap en "Correcto" e indexación del home.

- **NUEVO (2026-09-18) — Agente de IA público, esquina inferior
  derecha, en todas las páginas**: idea propia de Cristian, con una
  motivación específica — quiere que el público conozca a sus futuros
  patrocinadores, y se le ocurrió que el agente los presente en vez de
  (o además de) una sección visual fija. Un feature real y construible,
  pero necesita respuestas antes de escribir código, no solo "sí,
  hazlo":
  1. **Proveedor/costo**: un chat de IA real necesita una API de
     lenguaje (Claude/Anthropic u otra) — es un vendor nuevo con costo
     por conversación, la misma categoría que AGENTS.md pide confirmar
     antes de conectar (no una decisión que se toma sola).
  2. **Qué debe poder responder**: ¿solo patrocinadores? ¿también
     entrenamiento/coaching, shows, productos? Entre más amplio, más
     riesgo de que invente algo — este proyecto nunca ha inventado
     copy/datos comerciales, y un agente de IA en vivo es el lugar
     donde ese riesgo es más real, no menos.
  3. **Patrocinadores reales**: hoy no existe ningún dato de
     patrocinadores en la base de datos — haría falta una tabla nueva
     (nombre, logo, link, algo real que Cristian confirme uno por uno,
     nunca inventado) antes de que el agente pueda "presentarlos" con
     información verdadera.
  4. **¿Solo el chat, o también algo visible?** — una franja de logos
     de patrocinadores es el patrón más común en sitios así; el chat
     puede *complementar* eso, no reemplazarlo — vale la pena que
     Cristian confirme si quiere ambos o solo el chat.
  Relacionado pero DISTINTO del ítem ya abierto más abajo ("IA dentro
  del panel...") — ese es privado, solo para Cristian en `/admin`; este
  es público, para cualquier visitante. No confundir los dos al
  retomar.
- **Shopify + Dropify + Mercado Pago (app de Shopify) para el primer
  producto físico** (2026-09-17/18, reemplaza el ítem anterior de
  "Dropi directo" — ver Closed): Cristian decidió ir por Shopify en vez
  de esperar una integración de API directa con Dropi. Camino
  confirmado, investigado y explicado (no solo propuesto): Dropify es
  una app gratuita y oficial en la tienda de Shopify que conecta con
  Dropi (catálogo + fulfillment automático); Mercado Pago también tiene
  su propia app oficial de Shopify (misma cuenta real que ya usa
  Cristian). Nuestro lado no necesita ninguna integración profunda de
  API — `offer.checkout_provider = 'manual'` + `checkout_url` (ya
  existe, cero migración) alcanza para mandar el botón "Comprar" de
  `/productos` directo al checkout de Shopify. Falta, del lado de
  Cristian: crear/confirmar la tienda Shopify, instalar Dropify y
  conectar su cuenta de Dropi ahí, instalar la app de Mercado Pago,
  escoger el primer producto real. Falta, de mi lado, una vez tenga
  esos datos: montar la tarjeta real del producto en `/productos` con
  foto/precio/botón de compra — no depende de la clave de webhook de
  Mercado Pago de abajo, es un camino de pago independiente.
- **Clave secreta de producción del webhook de Mercado Pago** (abierto
  2026-09-09, sigue igual): Cristian solo dio la de prueba. Sin la
  real, cualquier pago confirmado por la integración DIRECTA (no la de
  Shopify de arriba) no queda registrado en `orders` aunque el cobro sí
  pase — solo importa el día que exista un producto vendido directo
  desde este sitio sin pasar por Shopify (ej. un curso digital).
- **Panel de negocios (`/admin/negocios`) ya tiene 2 solicitudes reales
  de shows esperando seguimiento** (encontrado 2026-09-17, sigue sin
  que Cristian confirme haberlas gestionado más allá de "ya lo revisé
  tranquilo" el 2026-09-17) — no es trabajo técnico pendiente, es
  seguimiento comercial de Cristian.
- **Tráfico pago — Fase 1 aprobada, no ejecutada todavía** (propuesta
  2026-09-13, "Progresión de Tráfico"): presupuesto chico, links con
  utm_, apuntando a la comunidad — cero código nuevo, listo para
  arrancar cuando Cristian quiera. Cristian mencionó $100.000 (COP,
  asumido) disponibles el lunes/martes de esa semana — no hay
  confirmación de que se haya usado. Con el producto de Shopify en
  camino, considerar apuntar la pauta directo al producto en vez de
  solo a la comunidad, una vez esté montado.
- **Reuniones de Cristian con gente para "crear sitios web para
  promocionar shows en restaurantes"** (mencionado 2026-09-13,
  pregunta hecha, sin respuesta todavía): ¿son sitios nuevos y
  separados de este, o algo que debería vivir dentro de este mismo
  código? Importa para no duplicar esfuerzo o terminar con dos sitios
  compitiendo por el mismo tráfico.
- **Redes sociales apagadas ~1 mes sin contenido** (mencionado
  2026-09-13): Instagram/Facebook/TikTok sin publicar. Contenido real
  (fotos/videos) tiene que salir de Cristian — ofrecido ayudar con
  calendario/ideas cuando tenga tiempo, sin respuesta todavía.
- **Música / curso digital — necesita decisión de contenido y precio
  de Cristian** (identificado 2026-09-13, "Ruta de Capitalización" Fase
  B): el mecanismo de venta de contenido digital (`entitlement`) ya
  existe en el código pero no tiene ningún escritor real — no es un
  tema técnico todavía, es una decisión de negocio pendiente.
- **Aviso de cookies + primer píxel de publicidad** (Fase 2 de
  "Progresión de Tráfico", 2026-09-13): deliberadamente en pausa hasta
  que exista una primera venta real confirmada — no antes.
- **IA dentro del panel que explica los datos en lenguaje natural**
  (2026-08-25) — Cristian's own idea: ask the dashboard "¿alguien se
  registró hoy?" in plain Spanish instead of reading tables. Needs a
  real Claude/Anthropic API integration (new vendor, cost per query) —
  deliberately not started. **Privado, solo `/admin`** — distinto del
  agente público nuevo de arriba, no confundir los dos.
- **Mensajes automáticos — código de WhatsApp ya construido (Meta
  directo), falta activarlo** (2026-08-25): `sendWelcomeWhatsApp()`
  está construido y probado (docs/AUTOMATIONS.md), falla en silencio
  hasta que reciba `META_WHATSAPP_ACCESS_TOKEN`/
  `META_WHATSAPP_PHONE_NUMBER_ID` reales. Falta: Cristian genera esas
  credenciales en developers.facebook.com, las pega en Vercel, y
  escribe el texto real de cada tema.
- **Confirmar que el correo real de bienvenida sí llega, con el fix de
  `after()` ya puesto** (2026-08-28): el bug real que lo rompía está
  arreglado y verificado contra un build de producción real. Falta:
  que Cristian repita el registro real una vez desplegado, para
  confirmar que el correo llega de verdad esta vez.
- **Assets reales de Cristian** — fotos, imágenes, logos "para
  perfeccionar la página" (2026-08-25, en curso): desde entonces sí
  llegaron reales — la foto de Cristian con José Miguel en el globo de
  la muerte (2026-09-12) es la más reciente. Sigue abierto porque es un
  flujo continuo, no un evento único — tracked per-category en
  docs/ASSETS_AND_BRAND.md.
- **Visual/brand identity pass** (2026-08-25): "empezar a trabajar
  arquitectura visual" — no retomado todavía. Sin brief específico;
  próxima sesión debería preguntar qué cambiar primero, o partir del
  hallazgo ya documentado (`/redes` agrupado por categoría,
  docs/UNIVERSE_UX.md §8).
- **Dominio real `cristianbarbosa.com`** (mencionado varias veces,
  más reciente 2026-09-17): Cristian planea comprarlo. Cuando lo haga:
  el dominio raíz debe apuntar a este sitio (Vercel) — el equivalente
  de `NEXT_PUBLIC_SITE_URL` cambia de la URL de `.vercel.app` a la
  real. Si además quiere navegar el catálogo de Shopify bajo el mismo
  dominio, un subdominio (ej. `tienda.cristianbarbosa.com`) puede
  apuntar a Shopify por separado — investigado y confirmado que sí se
  puede, con la salvedad de que el checkout final de Shopify (en
  planes normales, no Plus) siempre pasa por un dominio de Shopify,
  no importa qué subdominio se conecte.
  **SEO (2026-09-24):** la propiedad de Google Search Console actual es
  de tipo "Prefijo de URL" sobre `https://cristian-barbosa-universe.vercel.app/`.
  Al mover el dominio: crear una propiedad nueva tipo "Dominio" (DNS),
  redirigir 301 de `.vercel.app` al dominio real, y usar la herramienta
  "Cambio de dirección" de Search Console para no perder lo indexado.

## Closed

- **SEO del sitio** (2026-09-24): imagen para compartir en todas las
  páginas (`src/app/opengraph-image.jpg`, "Música · Shows ·
  Calistenia"), títulos/descripciones con palabras de búsqueda, y
  JSON-LD Person/WebSite con `sameAs` a sus 8 perfiles reales (leídos
  de `social_profile`, home con ISR 1h). Posicionamiento pedido por
  Cristian: música, shows y contenido primero — **no "entrenador"**.
  Verificado en vivo en producción.

- **Google Search Console — sitio verificado** (2026-09-24): propiedad
  "Prefijo de URL" sobre `https://cristian-barbosa-universe.vercel.app/`
  (no la URL de un deployment puntual — Cristian registró primero
  `...-gm655r2hc-...vercel.app` y se corrigió). Verificada con el
  método de archivo HTML: `public/googled21796551529be29.html` —
  **no borrarlo**, Google lo revisa periódicamente y la propiedad se
  pierde si desaparece. `sitemap.xml` (11 rutas públicas) confirmado
  en vivo; Cristian lo envía desde Search Console → Sitemaps.

- **Shopify/Dropify/Mercado Pago — investigación completa, camino
  confirmado** (2026-09-17/18): reemplaza la integración directa de
  Dropi (abajo) que llevaba abierta desde 2026-08-28 sin avanzar.
  Confirmado por investigación real (no supuesto): Dropify (app oficial
  gratuita de Shopify para Dropi) y Mercado Pago (app oficial de
  Shopify) ambas existen y resuelven exactamente el bloqueo que tenía
  Cristian con la API directa de Dropi. Ver el ítem abierto arriba para
  lo que falta ejecutar.
- **`/admin/negocios` — pipeline de shows/marcas/patrocinios, hecho
  visible** (2026-09-17): `b2b_opportunity` tenía escritor real desde
  Block 07 (`/contacto?topic=shows|marcas`) pero ningún panel lo
  mostraba — Cristian no tenía forma de ver una solicitud real sin
  pedir una consulta SQL directa. Misma arquitectura que
  `/admin/contactos` (PII real, nunca por `/api/analytics/*`). Full
  record: docs/COMMAND_CENTER.md §19. Encontró 2 solicitudes reales de
  shows esperando desde antes de que existiera el panel (ver Open).
- **Enlaces directos a la página en vivo de cada campaña, desde
  `/admin`** (2026-09-12): Cristian pedía el link cada vez en el chat.
  Columna "Página" agregada en `/admin/campanas`, `/admin/qr` y
  `/admin/landings`, más el link en `/admin/campanas/[slug]` — sin
  endpoint nuevo, los tres ya tenían el dato, solo faltaba el link
  clicable. `src/lib/publicUrl.ts` nuevo.
- **Támesis, Antioquia — campaña real con QR, redada, últimas
  actualizaciones** (2026-09-11 al 14): campaña y QR reales creados en
  producción; anuncio del evento actualizado dos veces con datos reales
  de Cristian (fin de semana completo, luego el anuncio del último día
  gratis para niños 0-14); crédito real a José Miguel ("globo de la
  muerte", foto real, link real de TikTok) agregado a la plantilla
  compartida de `/bienvenida/[slug]` — nuevas columnas
  `collaborator_*` en `campaign`, reutilizable para cualquier futura
  campaña. Confirmado con un 403 reportado por Cristian que resultó ser
  el wifi del venue, no el sitio — verificado en vivo, sin cambios de
  código necesarios.
- **Rediseño de la jerarquía de CTAs en `/bienvenida/[slug]`** (2026-
  09-11), motivado por los datos reales de Concordia (24 visitas, 1
  clic único a la comunidad, 0 registros): "Unirme a la comunidad" pasó
  a ser la única acción grande y llena; se quitaron dos de los tres
  enlaces "ver todo el universo" de la zona de mayor atención, luego se
  devolvió uno (`_hero`) en una posición y estilo distintos a pedido
  directo de Cristian tras verlo en vivo. Documentado como hipótesis
  motivada por datos, no una prueba estadística — la muestra es
  pequeña. Full record: docs/UNIVERSE_UX.md §9.
- **Mercado Pago — checkout real para físicos/infoproductos**
  (2026-09-09): Cristian eligió Mercado Pago sobre Stripe/Nequi/
  Bancolombia (ya tiene cuenta real) y decidió el alcance exacto: solo
  compras únicas (físicos/infoproductos), la suscripción de Facebook
  ($29.900/mes) sigue igual. `GET /api/checkout/[offerSlug]` crea una
  preferencia real de Checkout Pro para cualquier offer con
  `checkout_provider = 'mercadopago'`; `POST /api/webhooks/mercadopago`
  es el primer escritor real de `orders`/`order_items`, verificado con
  firma HMAC. Registro completo en docs/COMMERCE.md §10. Todo verde en
  tests/build. Falta lo anotado en Open (clave de producción, y ahora
  el camino de Shopify cubre el primer producto físico en su lugar).
- **Dropi directo (API) — cerrado sin avanzar, reemplazado por
  Shopify+Dropify** (abierto 2026-08-28, retomado 2026-09-09, cerrado
  2026-09-17): Cristian nunca recibió respuesta de Dropi para la
  integración directa de API — este entorno tampoco puede alcanzar
  `dropi.co`/`api.dropi.co` para investigar su documentación por su
  cuenta. En vez de seguir esperando, Cristian decidió ir por Shopify
  (ver el ítem "Shopify/Dropify/Mercado Pago" arriba), que resuelve el
  mismo problema sin depender de que Dropi responda un correo.
- **Progresión de Tráfico — análisis de 3 fases para Meta/TikTok/
  Google Ads/SEO** (2026-09-13): entregado como documento — evidencia
  real de Concordia/Támesis, comparación de canales, plan de 3 fases.
  Ejecución de la Fase 1 sigue abierta (ver Open).
- **Ruta de Capitalización — mapa de qué activar primero** (2026-09-13):
  entregado como documento — identificó que Shows/Marcas ya generaba
  datos reales sin panel para verlos (resuelto, ver `/admin/negocios`
  arriba) y que 0 de 5 ofertas usaban Mercado Pago (en camino de
  resolverse vía Shopify).
- **Favicon real** (2026-08-25, confirmado 2026-08-28).
- **Welcome-email automation — real code, pending Cristian's Gmail
  credentials + his own message text** (2026-08-25): full record in
  docs/AUTOMATIONS.md.
- **`/admin/contactos` — real name/email/teléfono per registro**
  (2026-08-25): full record in docs/COMMAND_CENTER.md §17.
- **Dashboard translated fully to Spanish** (2026-08-25).
- **Vercel Authentication (SSO) wall was blocking the whole public
  site** (2026-08-25).
- **"Presentaciones pasadas" ready to hold real activity entries**
  (2026-08-25) — Colegio de la Leticia visit is its first real entry.
- **Command Center: 8/10 sections crashed in production; dwell-time +
  session-duration metrics added** (2026-08-25).
- **Colegio de la Leticia — Envigado — QR landing for the 2026-08-27
  visit** (2026-08-25).
- **Google AdSense — evaluated, not added** (2026-08-25): documented in
  docs/ARCHITECTURE.md §11 addendum.
- **20-point public web-security checklist audit** (2026-08-25).
- **Vercel public preview + DATABASE_URL/NEXT_PUBLIC_SITE_URL
  blank-env bugs** (2026-08-25): full record in docs/PROJECT_STATE.md.
- **Probar la base de datos con datos reales, no solo seed**
  (abierto 2026-08-25, cerrado 2026-09-18): ampliamente superado por
  eventos —Concordia, Támesis y Colegio de la Leticia son campañas
  reales con visitantes, leads y solicitudes de shows/marcas reales
  corriendo en producción, verificadas repetidamente vía `/admin` y
  consultas directas a Supabase.
