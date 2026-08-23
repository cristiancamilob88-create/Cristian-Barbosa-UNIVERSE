# MASTER BRIEF — BLOCKS 07 → 10

## 0. Misión

Convertir CRISTIAN BARBOSA UNIVERSE de infraestructura validada en un sistema comercial real, empezando por la primera venta y extendiendo la misma arquitectura a música/productos digitales, productos físicos y automatizaciones.

Este brief es un **plan coordinado de 4 bloques**, no autorización para saltarse checkpoints. Claude Code debe trabajar de forma incremental y detenerse ante decisiones comerciales o dependencias reales no definidas.

## 1. Fuente de verdad y orden de lectura

Antes de tocar código:

1. `docs/PROJECT_STATE.md`
2. `docs/MASTER_CHECKLIST.md`
3. `docs/NEXT_BLOCK.md`
4. `docs/ARCHITECTURE.md`
5. `docs/UNIVERSE_UX.md`
6. `docs/COMMERCE.md`
7. `docs/DATABASE.md`
8. `docs/DATA_MODEL.md`
9. `docs/SECURITY.md`
10. `docs/MANUAL_SETUP_CHECKLIST.md`
11. `AGENTS.md` / `CLAUDE.md`

No inventar una arquitectura paralela si una abstracción existente resuelve la necesidad.

## 2. Arquitectura comercial que debe preservarse

El Universe es un HUB central de intención. La navegación comercial debe responder a la pregunta:

**¿Qué quieres hacer con Cristian?**

Intenciones principales existentes:

- `Quiero entrenar` → `/entrenar`
- `Quiero entrar a la comunidad` → `/comunidad`
- `Quiero escuchar su música` → `/musica`
- `Quiero ver los productos` → `/productos`
- `Quiero contratar un show` → `/shows`
- `Quiero trabajar con Cristian` → `/marcas`
- `Quiero ver la agenda` → `/eventos`
- `Quiero seguir a Cristian` → `/redes`

Las rutas e intent IDs vienen de `src/config/site.ts` y deben mantenerse como source of truth.

### `/entrenar` es la primera landing comercial prioritaria

Debe funcionar como landing/capa de decisión, no como una lista genérica de links.

Ofertas/paths que deben diferenciarse claramente:

1. Comunidad gratuita de WhatsApp.
2. Facebook Subscription / `Entrena con Cristian Barbosa`.
3. Producto digital/curso de calistenia.
4. Coaching premium personalizado: Essential / Performance / Elite.

La primera monetización prioritaria es Facebook Subscription/entrenamiento, pero la landing debe dejar preparada la arquitectura para que las otras ofertas puedan existir sin rehacer el HUB.

## 3. Infraestructura existente que OBLIGATORIAMENTE se reutiliza

- `TrackedLink` para CTA internos comerciales.
- `GoLink` para rutas salientes/sociales.
- `CheckoutLink` para compras.
- `/api/checkout/[offerSlug]` como entrada de checkout.
- `resolveCheckoutDestination()` como resolución del destino real.
- CRM existente.
- attribution first-touch + last-touch.
- analytics/read models existentes.
- `/api/analytics/*` para reporting.
- Command Center `/admin/*` únicamente a través de APIs.
- Product/Offer de Commerce.
- Supabase/Postgres mediante `src/server/db/` y repositories.
- Zod para inputs externos.

No crear un segundo checkout, segundo CRM, segundo attribution engine o segundo analytics engine.

## 4. BLOCK 07 — PRIMERA VENTA REAL

### Objetivo

Demostrar un funnel comercial real y medible de principio a fin.

### Secuencia

`Social/Facebook → Universe → intent Quiero entrenar → /entrenar → oferta → checkout → pago → order/subscription → CRM → attribution → analytics → retención`

### Fases

#### 07.1 Auditoría de readiness

- Auditar estado actual del código frente a este brief.
- Identificar qué piezas ya existen y cuáles faltan.
- No reconstruir lo existente.
- Verificar tests/lint/typecheck/build antes de cambios.

#### 07.2 Landing `/entrenar`

- Revisar implementación actual.
- Hacerla claramente orientada a decisión/conversión.
- Mantener diferenciación de las 4 rutas de oferta.
- Cada CTA comercial debe ser medible.
- No hardcodear rutas fuera de la arquitectura existente.

#### 07.3 Oferta Facebook Subscription

- Modelar la oferta con `product` + `offer` existentes.
- Confirmar qué significa técnicamente el flujo de Facebook Subscription en este sistema.
- Si requiere URL externa, usar `GoLink`/routing apropiado.
- No inventar una integración API con Meta si no existe una necesidad/credencial definida.
- Si el flujo requiere una decisión de producto o dato de Cristian, crear Decision Gate.

#### 07.4 Checkout real

- Elegir proveedor real únicamente después de revisar la abstracción existente y la realidad operativa de Cristian.
- Mantener `CheckoutLink` → `/api/checkout/[offerSlug]`.
- No enviar botones de compra directamente a un proveedor.
- Implementar webhook/confirmación cuando el proveedor lo requiera.
- Validar firmas y payloads con Zod.
- Persistir estados de orden/suscripción de acuerdo con el modelo existente.

#### 07.5 CRM + attribution + analytics

Verificar el circuito real:

`visitor → interaction → contact/lead → checkout_started → order/subscription → customer`

Conservar first-touch y last-touch.

Medir al menos:

- landing views;
- CTA clicks;
- offer views;
- checkout started;
- checkout completed/pago confirmado;
- customer/subscription creado;
- source/medium/campaign/QR cuando exista;
- revenue cuando esté soportado por el modelo.

No inventar KPIs nuevos si el modelo actual ya los cubre.

#### 07.6 Retención

Diseñar el punto de integración para onboarding/retención, pero no introducir proveedores de automatización innecesarios dentro de Block 07.

Debe quedar claro qué dato/evento permite saber que una suscripción está activa, cancelada, vencida o renovada, según las capacidades del proveedor elegido.

#### 07.7 Production

Vercel, dominio, env vars y conexión de producción son habilitadores del objetivo de primera venta.

Antes de `npm run db:migrate` contra producción debe resolverse el bootstrap de `schema_migrations`.

#### 07.8 E2E + primera venta

No considerar Block 07 cerrado hasta tener evidencia del flujo end-to-end. La venta real es el checkpoint comercial final.

## 5. BLOCK 08 — MÚSICA / PRODUCTO DIGITAL

### Objetivo

Crear una segunda familia monetizable reutilizando commerce/CRM/analytics.

### Fases

- 08.1 Definir producto digital real.
- 08.2 Definir landing `/musica` y/o landing de producto.
- 08.3 Product + Offer.
- 08.4 Checkout reutilizado.
- 08.5 Entrega/acceso post-compra.
- 08.6 CRM + attribution + analytics.
- 08.7 E2E.

La entrega digital debe ser segura y no depender de una URL pública sin control si el producto es privado.

## 6. BLOCK 09 — PRODUCTOS FÍSICOS

### Objetivo

Convertir `/productos` en un catálogo/commerce físico real sin duplicar la infraestructura de Block 07.

### Fases

- 09.1 Catálogo inicial.
- 09.2 Product/Offer taxonomy.
- 09.3 UX de catálogo y producto.
- 09.4 Checkout.
- 09.5 Order state.
- 09.6 Fulfillment/logística según proveedor elegido.
- 09.7 CRM + attribution + analytics.
- 09.8 E2E.

No inventar inventario, costos de envío, proveedores o políticas comerciales. Decision Gate cuando falte información.

## 7. BLOCK 10 — AUTOMATIZACIONES

### Objetivo

Automatizar el lifecycle comercial usando eventos y estados ya existentes.

Prioridad:

1. Lead follow-up.
2. Onboarding/post-purchase.
3. Retención de suscripciones.
4. Recuperación de checkout abandonado cuando sea técnicamente fiable.

Primero mapear eventos/triggers y necesidades. Luego recomendar proveedor. No añadir vendors solo por “modernizar” el stack.

## 8. Definition of Done transversal

Cada bloque debe terminar con:

- implementación coherente con arquitectura;
- tests unitarios/integración pertinentes;
- lint/typecheck/build limpios;
- documentación actualizada;
- estado actualizado en `docs/PROJECT_STATE.md`;
- checklist actualizado;
- decisiones registradas;
- pendientes explícitos;
- siguiente bloque identificado.

## 9. Decision Gates

Claude Code debe detenerse y reportar antes de implementar cuando falte una decisión sobre:

- proveedor de pago;
- credenciales/secretos;
- precio real;
- URL/destino comercial real;
- política de entrega/fulfillment;
- proveedor externo que agregue dependencia significativa;
- cambio de schema con impacto irreversible;
- cambio arquitectónico que contradiga `ARCHITECTURE.md`;
- cualquier acción de producción irreversible.

El reporte de Decision Gate debe incluir:

1. Qué falta decidir.
2. Por qué bloquea.
3. Opciones posibles.
4. Recomendación de Claude Code.
5. Qué cambiaría en arquitectura/código.
6. Qué necesita aportar Cristian.

## 10. Formato obligatorio de entrega por bloque

Al terminar o pausar un bloque, Claude Code debe entregar:

### Estado
`CERRADO / PAUSADO / BLOQUEADO`

### Implementado
Lista concreta de cambios.

### No implementado
Lista concreta.

### Tests
lint / typecheck / unit / integration / build.

### Producción
Qué fue probado en local y qué fue probado realmente en producción.

### Decision Gates
Preguntas pendientes y opciones.

### Riesgos
Riesgos técnicos/comerciales.

### Memoria
Archivos de `docs/` actualizados.

### Siguiente paso
Una instrucción concreta para continuar.

## 11. Regla final

La velocidad importa, pero la velocidad debe venir de reutilizar infraestructura y coordinar bloques, no de saltarse decisiones críticas.

**Pensar 07–10 juntos. Ejecutar y validar por bloques.**

El objetivo no es construir más software. El objetivo es convertir el software ya construido en ingresos medibles y después replicar el sistema en los siguientes pilares de Cristian Barbosa.
