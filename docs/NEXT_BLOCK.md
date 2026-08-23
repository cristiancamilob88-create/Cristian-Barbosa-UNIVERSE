# NEXT_BLOCK.md — BLOCK 07 → 10

## Estado

**Siguiente ejecución: Block 07 — Primera venta REAL.**

El brief maestro puede contemplar Blocks 07, 08, 09 y 10 desde el inicio para diseñar dependencias y reutilización correctamente. Sin embargo, Claude Code debe ejecutar por checkpoints: 07 primero; 08–10 quedan preparados y pueden avanzar solo cuando sus dependencias y decisiones estén suficientemente definidas.

## Principio comercial

El Universe funciona como un HUB central de intención. El visitante no debe ser enviado directamente a una colección de links sin contexto. Primero elige qué quiere hacer y luego entra a una landing/página de decisión apropiada.

Ejemplo prioritario:

`Quiero entrenar` → `/entrenar` → elegir entre comunidad gratuita, Facebook Subscription, producto digital o coaching premium → siguiente acción correspondiente.

## Block 07 — primera venta

La primera monetización prioritaria es entrenamiento/comunidad, aprovechando la audiencia social existente y la oferta Facebook Subscription / `Entrena con Cristian Barbosa`.

### Resultado esperado

Una persona real debe poder:

1. llegar desde Facebook/social;
2. entrar al Universe con attribution conservada;
3. elegir `Quiero entrenar`;
4. llegar a `/entrenar`;
5. entender claramente las ofertas sin confundirlas;
6. elegir la oferta correcta;
7. iniciar checkout mediante `CheckoutLink` → `/api/checkout/[offerSlug]`;
8. pagar mediante un proveedor real;
9. generar la orden/suscripción correspondiente;
10. quedar identificada en CRM;
11. conservar attribution;
12. producir métricas visibles en Command Center;
13. entrar al flujo de retención/onboarding disponible.

## Dependencias a resolver durante 07

- proveedor de pago real;
- destino/operación real de Facebook Subscription;
- configuración de product/offer;
- Vercel + variables de entorno + dominio como habilitadores de producción;
- webhook/confirmación de pago;
- cualquier decisión adicional que Claude Code detecte como bloqueante.

Claude Code NO debe inventar credenciales, precios, URLs, proveedores ni reglas comerciales. Debe presentar una pregunta/decision gate cuando una dependencia requiera información de Cristian.

## Block 08 — música / producto digital

Preparar reutilización de:

`landing → product → offer → checkout → order → delivery/access → CRM → analytics`

No crear un segundo checkout.

## Block 09 — productos físicos

Preparar reutilización de:

`catalog → product → offer → checkout → order → fulfillment → CRM → analytics`

La logística/fulfillment será una decisión separada y no debe mezclarse prematuramente con el CRM central.

## Block 10 — automatizaciones

Primero usar eventos y estados ya existentes. Solo después seleccionar vendors de automatización.

Prioridades iniciales:

1. lead follow-up;
2. post-purchase/onboarding;
3. subscription retention;
4. checkout recovery, si el proveedor y la arquitectura permiten detectar el caso de forma confiable.

## Reglas de ejecución para Claude Code

- Leer `docs/PROJECT_STATE.md`, `docs/MASTER_CHECKLIST.md`, `docs/ARCHITECTURE.md`, `docs/UNIVERSE_UX.md` y `docs/COMMERCE.md` antes de ejecutar.
- Mantener Blocks 07–10 conceptualmente coordinados, pero cerrar cada bloque con sus tests y checkpoint.
- No construir integraciones reales sin credenciales/decisiones reales.
- No duplicar CRM, attribution, analytics, checkout o catálogo.
- No adelantar Block 11 ni Block 12 salvo decisión explícita.
- Ante una ambigüedad comercial que afecte arquitectura, detenerse en un decision gate y reportar opciones, impacto y recomendación.
- Al finalizar cada bloque actualizar la memoria persistente del repo: estado, decisiones, pendientes y siguiente bloque.
