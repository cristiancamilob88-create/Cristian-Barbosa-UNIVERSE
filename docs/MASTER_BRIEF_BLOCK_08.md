# MASTER BRIEF — BLOCK 08
# Monetización + Experience de los 9 departamentos del CRISTIAN BARBOSA UNIVERSE

Fecha: 2026-08-24
Fuente: Centro de Control + decisiones confirmadas por Cristian.

## 1. OBJETIVO

Convertir el Universe de obra gris funcional en una experiencia comercial real y navegable, atacando en un mismo bloque las 9 unidades/departamentos del ecosistema. No crear nueve sistemas independientes: cada departamento es una experiencia/ruta dentro del mismo Next.js y reutiliza CRM, Attribution, Analytics, Commerce, routing y seguridad existentes.

Prioridad operativa: poder navegar y probar el sistema como usuario real cuanto antes. La perfección visual no bloquea la primera versión funcional. Las mejoras visuales se priorizan después de detectar problemas de UX/conversión.

## 2. LAS 9 UNIDADES

### 08.1 — QUIERO ENTRENAR
Incluye entrenamiento, comunidad y coaching personalizado.
- Facebook Subscription: 29.900 COP/mes, URL real ya confirmada.
- Comunidad WhatsApp.
- Coaching Essential: 1.100.000 COP.
- Coaching Performance: 1.600.000 COP.
- Coaching Elite: 2.000.000 COP.
- Coaching se cierra por WhatsApp comercial, no checkout automático.
- Debe existir registro/interés medible y ruta clara hacia WhatsApp.

### 08.2 — QUIERO ESCUCHAR LA MÚSICA DE CRISTIAN
- Precio confirmado: 10.000 COP por canción.
- No inventar título, artwork ni identidad de canción.
- Diseñar experiencia extensible a múltiples canciones/EP/álbumes/bundles.
- Flujo objetivo: discovery → preview → oferta → checkout → pago confirmado → acceso privado → escuchar/descargar → historial → CRM → analytics.
- No liberar contenido por simple formulario.
- El proveedor de pago sigue siendo Decision Gate; diseñar provider-neutral y detener implementación de confirmación automática si falta la decisión.

### 08.3 — QUIERO COMPRAR PRODUCTOS DIGITALES
- Productos pequeños y rápidos de producir: rutinas, PDFs, programas, guías, etc.
- No inventar catálogo definitivo.
- Diseñar patrón reutilizable Product → Offer → Checkout → Order → Delivery/Access → CRM → Analytics.

### 08.4 — QUIERO COMPRAR PRODUCTOS FÍSICOS
- Ropa/merchandising/productos seleccionados.
- Droppy existe como posible proveedor; no asumir API.
- Investigar qué necesita realmente la primera versión: catálogo, precio, margen, stock, fulfillment, tracking, devoluciones.
- Primera versión puede ser manual + WhatsApp comercial.
- No construir integración Droppy sin evidencia de API/documentación.

### 08.5 — QUIERO CONTRATAR UN SHOW / EVENTO
Segmentos confirmados:
Empresas, Colegios, Ferias, Festivales, Productoras, Eventos privados, Quince años, Rooftops, Eventos masivos, Circo/espectáculos.

Formatos iniciales:
Corporativo, Productoras/festivales, Colegios, Eventos privados, Rooftops/venues.

Preparar arquitectura para propuestas/PDF comerciales y cierre por WhatsApp. B2B opportunity existente debe continuar alimentándose.

### 08.6 — QUIERO TRABAJAR CON CRISTIAN / MARCAS & SPONSORS
- Campañas.
- Contenido.
- Activaciones.
- Embajador de marca.
- Patrocinios.
- Club Nativos.
- Expo Fitness.
- Cierre por WhatsApp comercial.
- B2B opportunity.

### 08.7 — QUIERO CONOCER LA HISTORIA DE CRISTIAN
- Historia personal/profesional.
- Calistenia y trayectoria.
- Música.
- Shows.
- Marcas.
- Prensa, incluyendo El Colombiano; no inventar URLs de prensa no entregadas.
- La historia debe funcionar como autoridad y confianza y contener puentes contextuales hacia entrenar, comunidad, música, productos, shows y marcas.

### 08.8 — QUIERO CONOCER EVENTOS
- Eventos propios.
- Eventos donde Cristian participó.
- Próximas participaciones cuando existan datos reales.
- Registro cuando corresponda.
- Puentes comerciales hacia shows, comunidad, productos o música según contexto.
- No inventar eventos.

### 08.9 — QUIERO SEGUIR A CRISTIAN / REDES
Canales reales confirmados:
- Facebook principal (~400k).
- Facebook secundario (~70k).
- Instagram principal.
- Instagram Comunidad.
- TikTok principal.
- TikTok secundario.
- YouTube.
- X.
- WhatsApp Community.
- Facebook Subscription se trata como destino comercial, no simplemente como red social.

La página /redes debe ser un Social Distribution Hub, no un listado plano de URLs. Debe facilitar descubrimiento y retorno al Universe cuando tenga sentido.

## 3. EXPERIENCE AUDIT V1 — 08.0

Antes de pulir visualmente, recorrer todas las rutas como usuario real y registrar P0/P1/P2:
- Home/HUB.
- Entrenar.
- Comunidad.
- Música.
- Productos.
- Shows.
- Marcas.
- About/Historia.
- Eventos.
- Redes.
- Contacto.

Para cada ruta comprobar:
1. claridad de intención;
2. conversión primaria;
3. CTA y tracking;
4. destino real;
5. captura de lead/registro cuando corresponda;
6. interest correcto;
7. attribution;
8. mobile;
9. accesibilidad básica;
10. velocidad/performance básica;
11. navegación contextual hacia el ecosistema;
12. ausencia de rutas/links muertos.

## 4. MEDIA / ASSETS FOUNDATION

Desde Block 08 preparar la infraestructura y contrato de contenido para:
- fotos de Cristian;
- fotos de entrenamiento;
- fotos de shows;
- artwork musical;
- logos propios;
- logos de marcas autorizadas;
- logos/medios de prensa autorizados;
- imágenes de productos;
- PDFs comerciales;
- videos/teasers cuando aplique.

No subir secretos ni material sin autorización. No inventar derechos de uso.

Preferir una estrategia de assets que no obligue a meter archivos pesados o secretos en el repositorio. Si se propone Supabase Storage, Vercel Blob u otro proveedor, documentar la decisión y sus implicaciones antes de introducir una dependencia importante. Para la primera versión puede existir un manifest/contrato de assets y placeholders claramente identificados.

El sistema debe permitir que Cristian entregue los assets posteriormente sin rehacer las páginas.

## 5. CRM / REGISTRO

No convertir cada página en un formulario obligatorio. Capturar datos en puntos de intención relevantes.

Visitor → Contact → Lead → Customer → Repeat Customer.

Siempre que sea posible conservar source/medium/campaign/referrer/landing/intent/interest/CTA y consentimiento/preferencias cuando aplique.

Una persona puede acumular múltiples intereses. No duplicar personas por departamento.

## 6. COMMERCE

Reutilizar Product + Offer + Checkout + Order. Para acceso/entrega digital, diseñar una abstracción extensible, no un caso especial para una canción.

CheckoutLink debe seguir siendo la puerta comercial. Nunca apuntar un botón de compra directamente a un proveedor.

## 7. SEGURIDAD

Mantener las reglas de AGENTS.md/CLAUDE.md. No secretos en repo. Inputs externos con zod. DB solo server-side vía repositories/Route Handlers. No service_role en cliente. No redirects abiertos. No inventar integraciones OAuth/API.

No cerrar silenciosamente los dos hallazgos heredados de Block 06 (function_search_path_mutable y extension_in_public); si se corrigen, debe existir migración nueva y reporte explícito.

## 8. NAVEGACIÓN / DEFINITION OF DONE

Block 08 no se considera terminado porque "compila". Debe existir una versión navegable que Cristian pueda recorrer como cualquier usuario web.

Definition of Done por fase:
- ruta accesible directamente;
- responsive mobile/desktop;
- CTA principal funcional;
- tracking correcto;
- CRM/interest correcto cuando exista captura;
- destino real o Decision Gate explícito;
- contenido no inventado;
- tests/lint/typecheck/build verdes;
- evidencia de smoke test;
- memoria del repo actualizada.

## 9. NO HACER

- No rehacer CRM.
- No rehacer Attribution.
- No crear otro analytics engine.
- No crear otro checkout system.
- No inventar precios, URLs, APIs, títulos de canciones, eventos o datos de prensa.
- No integrar Droppy sin investigar primero.
- No conectar proveedor de email/WhatsApp todavía como parte de Block 08.
- No convertir 3D/motion pesado en requisito de Block 08.
- No sacrificar conversión, mobile o performance por decoración.

## 10. DECISION GATES

Gate 3 — proveedor de pago para música/digital: sigue abierto. Preparar arquitectura sin inventar proveedor.
Gate 4 — Droppy API vs fulfillment manual: sigue abierto. Investigar antes de integrar.
Gate 5 — vendor de email/WhatsApp: queda para Block 09 y no bloquea Block 08.

## 11. ENTREGA A CLAUDE CODE

Ejecutar por fases 08.0 → 08.1 → 08.2 → 08.3 → 08.4 → 08.5 → 08.6 → 08.7 → 08.8 → 08.9 dentro del mismo Block 08, con checkpoints internos. Puede paralelizar análisis/lecturas independientes, pero no mezclar cambios incompatibles ni saltarse Decision Gates.

Al cierre de cada fase: tests → smoke test → reporte → actualización de docs/PROJECT_STATE.md, docs/MASTER_CHECKLIST.md y docs/NEXT_BLOCK.md.

El objetivo es avanzar rápido sin perder control: primero experiencia funcional navegable, luego conversión, luego assets, luego polish.
