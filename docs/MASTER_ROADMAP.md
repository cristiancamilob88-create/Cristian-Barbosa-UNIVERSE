# MASTER_ROADMAP.md — CRISTIAN BARBOSA UNIVERSE

Fuente de verdad del roadmap operativo de alto nivel. Actualizado el 2026-08-24 por el Centro de Control.

## Principio

CRISTIAN BARBOSA UNIVERSE es un solo Revenue OS: un HUB central con departamentos/experiencias comerciales independientes, todos conectados al mismo CRM, Attribution, Analytics y Commerce.

No construir mini-sitios aislados. Cada departamento debe poder recibir tráfico directo desde anuncios, redes, QR o enlaces y también debe poder llevar al usuario al resto del ecosistema mediante navegación contextual.

## Roadmap vigente

### BLOCK 07 — Universe comercial + primera venta
Estado: TÉCNICAMENTE COMPLETO / pendiente escritura de 0006 + datos reales a Supabase producción.

Objetivo: convertir el HUB en una experiencia comercial navegable, con ofertas y destinos reales.

Incluye el esqueleto comercial y las rutas: entrenar, comunidad, música, productos, shows, marcas, eventos, redes, about/contacto; CRM; Attribution; Analytics; Commerce; B2B opportunity; Facebook Subscription; coaching; WhatsApp comercial.

### BLOCK 08 — Monetización + experiencia de los 9 departamentos
Estado: SIGUIENTE BLOQUE / iniciar después del checkpoint de Block 07; puede desarrollarse localmente mientras se resuelve la escritura de producción.

Objetivo: atacar de forma coordinada las 9 unidades comerciales del Universe, convertir la obra gris en experiencias utilizables y preparar las rutas de monetización reales sin duplicar infraestructura.

Fases:
- 08.0 — Experience Audit V1 + navegación real + media/assets foundation.
- 08.1 — Quiero entrenar: entrenamiento, comunidad y coaching.
- 08.2 — Quiero escuchar la música de Cristian: música y producto digital musical.
- 08.3 — Quiero comprar productos digitales.
- 08.4 — Quiero comprar productos físicos.
- 08.5 — Quiero contratar un show / evento.
- 08.6 — Quiero trabajar con Cristian: marcas y sponsors.
- 08.7 — Quiero conocer la historia de Cristian.
- 08.8 — Quiero conocer eventos / participar / contratar.
- 08.9 — Quiero seguir a Cristian: redes sociales y distribución.

Todas las fases deben reutilizar CRM + Attribution + Analytics + Commerce + componentes de routing existentes.

### BLOCK 09 — Automatización / Lifecycle Marketing
Estado: futuro.

Objetivo: transformar datos, intereses, registros, compras y comportamiento en seguimiento automatizado con consentimiento/preferencias.

Orden inicial: lead follow-up → onboarding de compra → onboarding de comunidad/suscripción → retención → recuperación de checkout cuando sea técnicamente fiable → segmentación → cross-sell → reactivación → lanzamientos/promociones.

### BLOCK 10 — Pauta / Ad Acquisition
Estado: futuro.

Objetivo: enviar tráfico pagado directamente a las landings de intención y medir tráfico → landing → CTA → lead/checkout → venta.

No conectar vendors de ads antes de validar conversiones y tracking.

### BLOCK 11 — Revenue Optimization
Estado: futuro.

Objetivo: optimizar conversión, CPL/CAC/CPA/ROAS cuando exista gasto real, AOV, LTV, retención, cross-sell, mejores landings, CTAs, segmentos y fuentes.

### BLOCK 12 — Experience Visual / 3D / Motion
Estado: futuro, pero assets y requisitos se preparan desde Block 08.

Objetivo: elevar percepción, storytelling, engagement y conversión con fotografía, video, motion, microinteracciones y 3D solo donde aporte valor y sin degradar performance.

## Regla de navegación y conversión

Cada departamento debe cumplir:

TRÁFICO DIRECTO → LANDING/DEPARTAMENTO → INTENCIÓN → OFERTA/CTA → REGISTRO O CHECKOUT → CRM → ATTRIBUTION → ANALYTICS → SIGUIENTE ACCIÓN.

La navegación secundaria debe permitir descubrir el ecosistema sin competir con la conversión primaria.

## Regla de memoria persistente

Cuando cambie el estado, decisión, dependencia o siguiente paso, actualizar este archivo y los documentos de checkpoint relevantes. GitHub es la memoria compartida entre Centro de Control y Claude Code.
