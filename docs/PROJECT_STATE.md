# PROJECT_STATE.md — memoria persistente del proyecto

**Última actualización:** 2026-08-23  
**Repositorio:** `cristiancamilob88-create/Cristian-Barbosa-UNIVERSE`  
**Rama de trabajo:** `claude/cristian-barbosa-master-init-jxln6u`

## 1. Propósito

Este archivo es la memoria ejecutiva persistente de CRISTIAN BARBOSA UNIVERSE. Debe permitir que un nuevo chat de ChatGPT, Claude Code o cualquier agente autorizado reconstruya rápidamente el estado del proyecto sin depender de conversaciones anteriores.

No reemplaza `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/COMMERCE.md`, `docs/UNIVERSE_UX.md` ni los demás documentos técnicos. Este archivo responde principalmente: **dónde estamos, qué sigue, qué decisiones están tomadas y cuál es el objetivo comercial actual.**

## 2. Objetivo maestro

Convertir la audiencia, reputación, habilidades, contactos y ofertas de Cristian Barbosa en un sistema digital de ingresos diversificado y medible.

El Universe es un único sistema Next.js que funciona como HUB central de la marca y distribuye al visitante hacia experiencias/landings comerciales según su intención.

Principio de navegación aprobado:

> **¿Qué quieres hacer con Cristian?**

Las intenciones principales son:

- `Quiero entrenar` → `/entrenar`
- `Quiero entrar a la comunidad` → `/comunidad`
- `Quiero escuchar su música` → `/musica`
- `Quiero ver los productos` → `/productos`
- `Quiero contratar un show` → `/shows`
- `Quiero trabajar con Cristian` → `/marcas`
- `Quiero ver la agenda` → `/eventos`
- `Quiero seguir a Cristian` → `/redes`

La arquitectura real de estas intenciones está definida en `src/config/site.ts` y `docs/UNIVERSE_UX.md`; no duplicar rutas ni CTAs en páginas aisladas.

## 3. Estado actual por bloques

| Bloque | Estado | Resultado |
|---|---|---|
| 01 Foundation | ✅ CERRADO | Stack, arquitectura y scaffold |
| 02 CRM + Attribution | ✅ CERRADO | CRM, visitor/contact/lead, attribution, social routing |
| 03 Analytics | ✅ CERRADO | Eventos, read models, KPIs y APIs analíticas |
| 04 Command Center | ✅ CERRADO | Auth admin + dashboard |
| 04.1 Dashboard | ✅ CERRADO | Sparklines, comparación, medium, leads recientes |
| 04.2 Conversion UX | ✅ CERRADO | Intención → CTA → tracking en el Universe |
| 05 Commerce Infrastructure | ✅ CERRADO | Product/offer + checkout abstraction |
| 06 Supabase REAL | ✅ CERRADO | Schema real desplegado y auditado |
| **07 Primera venta REAL** | **🟢 SIGUIENTE** | Primer funnel económico end-to-end |
| 08 Música / producto digital | ⏭️ SIGUIENTE | Segunda familia de monetización |
| 09 Productos físicos | ⏭️ SIGUIENTE | Catálogo/commerce físico |
| 10 Automatizaciones | ⏭️ SIGUIENTE | Automatización de lifecycle y operaciones |
| 11 Pauta | ⏭️ FUTURO | Ads + CAC/ROAS/CPA/CPL cuando exista gasto real |
| 12 Optimización visual / 3D | ⏭️ FUTURO | Polish avanzado después de validar conversión |

## 4. Objetivo inmediato

**Block 07 — Primera venta REAL.**

El cierre del bloque no es “landing terminada” ni “checkout conectado”. El Definition of Done es:

`audiencia → Universe → intención → landing/oferta → checkout → pago real → customer/subscription → CRM → attribution → analytics → retención`

La primera ruta prioritaria es la relacionada con entrenamiento/comunidad, usando la audiencia social existente y la oferta de Facebook Subscription/`Entrena con Cristian Barbosa` como primera experiencia de monetización.

## 5. Arquitectura de landings / dependencias comerciales

El Universe NO es un Linktree. Es un HUB de intención con rutas comerciales que pueden convertirse en funnels especializados.

La ruta `/entrenar` es especialmente importante porque contiene ofertas diferentes y no deben mezclarse como si fueran el mismo producto:

1. Comunidad gratuita de WhatsApp.
2. Facebook Subscription / `Entrena con Cristian Barbosa`.
3. Producto digital / curso de calistenia.
4. Coaching premium personalizado, con tiers Essential / Performance / Elite.

La landing de `/entrenar` funciona como capa de decisión. Cada oferta debe llevar al siguiente paso correcto y mantener su medición. La infraestructura de checkout ya existe, pero todavía no hay proveedor de pago real conectado.

Las demás familias siguen la misma arquitectura conceptual:

`/musica` → música / productos digitales relacionados.

`/productos` → productos físicos y digitales.

`/shows` → servicio B2B / contratación de show.

`/marcas` → partnerships, sponsors y colaboraciones B2B.

La arquitectura de intención actual ya distingue CTA, ruta, `intentId` y tracking. Ver `docs/UNIVERSE_UX.md`.

## 6. Capas que ya existen y deben reutilizarse

- CRM: visitor → contact → lead → customer derivado de órdenes.
- Attribution: first-touch + last-touch + UTM + QR + medium/referrer.
- Analytics: `interaction` + read models + `/api/analytics/*`.
- Command Center: `/admin/*` consume analytics APIs.
- Checkout: `/api/checkout/[offerSlug]` + `CheckoutLink` + `resolveCheckoutDestination()`.
- Social routing: `/go/[slug]` + `GoLink`.
- Internal CTA tracking: `TrackedLink`.
- Offer/product abstraction en Postgres.
- Supabase real con RLS y seed de diccionario/configuración.

No crear un CRM, analytics, checkout o tracking paralelo para Block 07–10.

## 7. Estado de infraestructura de producción

Supabase real: ✅ desplegado y auditado. Proyecto `Cristian-Barbosa-UNIVERSE`, ref `yskfntcurmqqxjuvqoto`, región `us-west-2`.

Pendiente:

- bootstrap explícito de `public.schema_migrations` antes de ejecutar `npm run db:migrate` contra producción;
- Vercel;
- `DATABASE_URL` de producción usando pooler;
- variables de entorno de producción;
- dominio/DNS;
- primer deploy público.

No hay todavía proveedor de pago real conectado, vendor de analytics real ni automatización externa.

## 8. Modelo operativo entre agentes

**ChatGPT — Centro de Control:** estrategia, priorización, checklist, decisiones, revisión de avances y memoria ejecutiva.

**Claude Code:** ejecución técnica sobre el repositorio. Debe recibir briefs por bloque con alcance, restricciones, Definition of Done y formato de entrega.

**GitHub:** memoria persistente y fuente de verdad compartida del estado del proyecto.

Cuando Cristian pausa un bloque por una pregunta, dependencia o decisión comercial, esa situación debe registrarse en la memoria del proyecto y luego reflejarse en el siguiente brief de Claude Code.

## 9. Regla de continuidad

Al iniciar una nueva sesión, leer en este orden:

1. `docs/PROJECT_STATE.md`
2. `docs/MASTER_CHECKLIST.md`
3. `docs/NEXT_BLOCK.md`
4. `docs/ARCHITECTURE.md`
5. documentación específica del bloque que se vaya a tocar.

No asumir que una conversación anterior sigue disponible.
