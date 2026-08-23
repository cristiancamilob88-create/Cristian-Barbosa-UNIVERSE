# MASTER_CHECKLIST.md — CRISTIAN BARBOSA UNIVERSE

## Estado maestro

| Bloque | Estado |
|---|---|
| 01 Foundation | ✅ |
| 02 CRM + Attribution | ✅ |
| 03 Analytics | ✅ |
| 04 Command Center | ✅ |
| 04.1 Dashboard | ✅ |
| 04.2 Conversion UX | ✅ |
| 05 Commerce Infrastructure | ✅ |
| 06 Supabase REAL | ✅ |
| **07 Primera venta REAL** | **🟢 AHORA** |
| 08 Música / producto digital | ⏭️ |
| 09 Productos físicos | ⏭️ |
| 10 Automatizaciones | ⏭️ |
| 11 Pauta | ⏭️ |
| 12 Optimización visual / 3D | ⏭️ |

## Regla de ejecución

Los bloques son unidades grandes de negocio/arquitectura. Cada bloque se divide en fases, tareas y checkpoints. Se puede preparar un brief maestro para varios bloques, pero Claude Code debe ejecutar y validar por bloque para evitar mezclar decisiones no resueltas.

## Block 07 — Primera venta REAL

**Objetivo:** producir la primera transacción real y demostrar el circuito completo.

### Funnel objetivo

`Facebook / audiencia social → Universe HUB → Quiero entrenar → /entrenar → oferta correcta → checkout → pago → customer/subscription → CRM → attribution → analytics → retención`

### Fases

- [ ] 07.1 Definir y confirmar oferta inicial.
- [ ] 07.2 Definir arquitectura final de `/entrenar` como landing de decisión.
- [ ] 07.3 Conectar Facebook Subscription / `Entrena con Cristian Barbosa` como destino comercial real.
- [ ] 07.4 Configurar product + offer real.
- [ ] 07.5 Conectar proveedor de pago real elegido por Cristian.
- [ ] 07.6 Conectar checkout mediante `/api/checkout/[offerSlug]`.
- [ ] 07.7 Implementar confirmación/webhook del proveedor y persistencia de orden/suscripción.
- [ ] 07.8 Verificar CRM: visitor → contact → lead/customer.
- [ ] 07.9 Verificar attribution y tracking de intención/checkout.
- [ ] 07.10 Verificar Command Center y métricas comerciales.
- [ ] 07.11 Ejecutar prueba end-to-end.
- [ ] 07.12 Obtener primera venta real.
- [ ] 07.13 Documentar resultado, fricciones y cambios para el siguiente bloque.

## Block 08 — Música / producto digital

**Objetivo:** reutilizar la infraestructura comercial para monetizar música y/o productos digitales sin crear un sistema paralelo.

### Fases previstas

- [ ] 08.1 Definir producto/oferta digital real.
- [ ] 08.2 Definir landing `/musica` y/o landing específica de producto.
- [ ] 08.3 Definir acceso, entrega y post-compra.
- [ ] 08.4 Conectar checkout real reutilizado de Block 07.
- [ ] 08.5 CRM + attribution + analytics.
- [ ] 08.6 Test end-to-end.

## Block 09 — Productos físicos

**Objetivo:** convertir `/productos` en catálogo comercial real y preparar venta física sin duplicar commerce.

### Fases previstas

- [ ] 09.1 Definir catálogo inicial.
- [ ] 09.2 Definir product/offer taxonomy y precios reales.
- [ ] 09.3 Landing/catalog UX.
- [ ] 09.4 Checkout/logística/fulfillment según proveedor elegido.
- [ ] 09.5 Orders + CRM + attribution + analytics.
- [ ] 09.6 Test end-to-end.

## Block 10 — Automatizaciones

**Objetivo:** automatizar lifecycle, seguimiento y operaciones usando los eventos y datos ya existentes.

### Fases previstas

- [ ] 10.1 Mapear triggers existentes y eventos de negocio.
- [ ] 10.2 Definir automatizaciones prioritarias.
- [ ] 10.3 Elegir proveedores solo cuando exista una necesidad real.
- [ ] 10.4 Lead follow-up.
- [ ] 10.5 Post-purchase / onboarding.
- [ ] 10.6 Retención de suscripciones.
- [ ] 10.7 Recuperación de checkout abandonado si el proveedor/datos lo permiten.
- [ ] 10.8 Reporting de automatizaciones.

## Block 11 — Pauta

- [ ] Conectar vendor(s) de ads cuando exista gasto real.
- [ ] Pixels / eventos externos.
- [ ] CAC / CPL / CPA / ROAS.
- [ ] Attribution publicitaria.

## Block 12 — Optimización visual / 3D

- [ ] Polish visual después de validar conversión.
- [ ] Motion avanzado solo cuando aporte conversión/experiencia.
- [ ] 3D/WebGL solo con justificación explícita.

## Dependencias críticas

1. Block 07 depende de un proveedor de pago real elegido por Cristian.
2. Vercel y dominio son habilitadores de producción de Block 07, no un bloque comercial independiente.
3. Block 08 reutiliza commerce/CRM/analytics de 07.
4. Block 09 reutiliza commerce/CRM/analytics de 07–08.
5. Block 10 reutiliza los eventos, CRM y estados comerciales acumulados.
6. Block 11 debe esperar a que exista gasto publicitario real para calcular métricas económicas.
7. Block 12 no debe adelantarse a la validación de conversión.

## Definition of Done del roadmap comercial

El Universe debe poder llevar a una persona desde una intención concreta hasta una acción comercial medible, registrar su journey y permitir optimizarlo con datos. Cada nuevo pilar comercial debe reutilizar la misma infraestructura central en lugar de crear funnels, CRM, checkout o analytics paralelos.
