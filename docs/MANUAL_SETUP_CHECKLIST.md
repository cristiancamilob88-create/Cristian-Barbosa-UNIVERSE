# MANUAL_SETUP_CHECKLIST.md — qué puede hacer Claude vs. qué requiere a Cristian

Lista operativa, por servicio, separando estrictamente lo que Claude
puede ejecutar en una sesión futura (con el acceso correcto) de lo que
**solo Cristian puede hacer** — cuentas, pagos, identidad legal, y
cualquier credencial que no deba pasar por un chat. Nada aquí se
inventó: cada fila reflexiona directamente sobre lo que este bloque
encontró (o no encontró) conectado.

## Supabase

Confirmado en este bloque: existe un conector MCP **oficial** de
Supabase en el registro de Anthropic (`directoryUuid
11ca66fc-1e98-49d5-ab9b-7cb4672a8f10`, herramientas incluyendo
`list_projects`, `get_project`, y ~24 más — probablemente listado de
tablas, ejecución de SQL, gestión de migraciones). **No está instalado
en esta cuenta** (`installState: "not_installed"`). Esta es la vía
preferida — evita pegar una contraseña en el chat.

| Tarea | Quién |
|---|---|
| Crear la cuenta/organización Supabase | **Cristian** (identidad de facturación) |
| Crear el proyecto (nombre, región, contraseña de base de datos) | **Cristian** |
| **Opción A (preferida) — conectar el conector oficial de Supabase**: en claude.ai, ir a `Settings → Connectors`, buscar "Supabase", conectarlo y autorizarlo (esto abre el flujo OAuth de Supabase — Cristian inicia sesión ahí, no comparte contraseña con Claude). Luego, en esta sesión de Claude Code, confirmar que el conector está habilitado para el chat. | **Cristian** conecta; Claude verifica con `ListConnectors` una vez hecho |
| Al conectar el MCP de Supabase, limitarlo (si la UI de Supabase lo permite en el flujo de autorización) al proyecto de Cristian Barbosa Universe específicamente, no a toda la organización | **Cristian**, durante el flujo de autorización |
| **Opción B (alternativa) — connection string manual**: copiar el "Connection string" (con `sslmode=require`, idealmente el del connection pooler) desde `Project Settings → Database → Connection string` y pegarlo en el chat como `DATABASE_URL` | **Cristian**, solo si prefiere no usar el conector MCP |
| Auditar tablas/RLS/policies existentes contra `docs/SUPABASE_PRODUCTION.md` §2 | Claude, una vez tenga acceso por cualquiera de las dos vías |
| Ejecutar `npm run db:migrate` contra el proyecto real | Claude, solo después de la auditoría y con confirmación explícita |
| Ejecutar `npm run db:seed` contra el proyecto real | Claude, mismo paso que arriba |
| Verificar RLS final (roles, policies) | Claude |
| Rotar la contraseña de base de datos si alguna vez se expone | **Cristian** (vía dashboard de Supabase) |

**Nota de seguridad**: pegar una connection string con contraseña
directamente en el chat la deja en el historial de la conversación. Si
Cristian prefiere evitarlo, la alternativa es conectar un conector MCP
de Supabase (si el entorno lo soporta) para que Claude opere sin ver la
credencial en texto plano — pero decidir cuál usar es de Cristian.

## GitHub

| Tarea | Quién |
|---|---|
| Repositorio, rama, permisos de colaboradores | **Cristian** (ya existe — sin acción pendiente) |
| Push de commits a la rama de trabajo | Claude (ya lo hace en cada bloque) |
| Crear un Pull Request | Claude, **solo si Cristian lo pide explícitamente** |
| Configurar branch protection / reglas de merge | **Cristian** |
| Secrets del repositorio (`Settings → Secrets`) para CI, si se necesitan más adelante | **Cristian** |

## Vercel

| Tarea | Quién |
|---|---|
| Crear la cuenta/proyecto Vercel y conectarlo al repo de GitHub | **Cristian** |
| Configurar las variables de entorno de producción (`DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, `ANALYTICS_API_TOKEN`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`) en el dashboard de Vercel | **Cristian** (o Claude, si Cristian entrega un conector/token de Vercel) |
| Usar el connection string del **pooler** de Supabase (no el directo) para `DATABASE_URL` en Vercel — ver docs/SUPABASE_PRODUCTION.md §10 | **Cristian**, al copiarlo desde Supabase |
| Primer deploy | **Cristian** (dispara automáticamente al conectar el repo) o Claude si tiene acceso a la API/CLI de Vercel |
| Revisar logs de build/runtime en caso de error | Claude, si tiene acceso al proyecto Vercel; si no, Cristian debe compartir el log |

## Dominio / DNS

| Tarea | Quién |
|---|---|
| Compra/renovación del dominio `cristianbarbosa.com` (o el que se use) | **Cristian** |
| Apuntar los registros DNS al proyecto de Vercel | **Cristian** (Vercel entrega las instrucciones exactas tras conectar el dominio) |
| Configurar `NEXT_PUBLIC_SITE_URL` con el dominio final | **Cristian** entrega el valor; Claude lo configura donde corresponda |

## Meta (Instagram / Facebook / WhatsApp Business)

| Tarea | Quién |
|---|---|
| Cuentas reales de Instagram/Facebook y sus URLs finales | **Cristian** |
| Entregar esas URLs para reemplazar los placeholders de `supabase/seed.sql` (`social_profile`) | **Cristian** entrega, Claude actualiza el `INSERT`/`UPDATE` |
| Número de WhatsApp Business real (para el enlace de comunidad) | **Cristian** |
| Meta Ads API / credenciales de pauta | **Cristian** — explícitamente NO se conecta todavía (fuera de alcance hasta que exista gasto publicitario real, docs/COMMERCE.md) |

## WhatsApp (automatización, no el enlace de comunidad)

| Tarea | Quién |
|---|---|
| WhatsApp Business API / proveedor de automatización (si se decide usar uno) | **Cristian** decide el proveedor y provee credenciales |
| Integración de automatización en el código | Claude, una vez existan credenciales reales — explícitamente no implementado todavía |

## Email

| Tarea | Quién |
|---|---|
| Proveedor de email transaccional/marketing (si se decide usar uno) | **Cristian** decide y provee credenciales |
| Integración en el código | Claude, una vez existan credenciales — no implementado todavía |

## Hotmart / checkout real

| Tarea | Quién |
|---|---|
| Cuenta Hotmart (o Stripe/Mercado Pago, lo que Cristian decida) | **Cristian** |
| Credenciales/API keys del proveedor elegido | **Cristian** |
| Configurar `offer.checkout_provider`/`checkout_url` con datos reales | Claude, una vez existan esas credenciales (docs/COMMERCE.md) |
| Webhook de confirmación de pago → escritura en `orders` | Claude, diseño + implementación, una vez exista el proveedor conectado |

## Analytics / pixels (GA4, Meta Pixel, TikTok Pixel, etc.)

| Tarea | Quién |
|---|---|
| Decidir qué vendor(es) usar | **Cristian** |
| Crear las cuentas/pixels en cada plataforma | **Cristian** |
| Conectar `registerAnalyticsSink()` (`src/lib/analytics.ts`) al vendor elegido | Claude, una vez exista la decisión + credenciales — explícitamente diferido hasta ahora (docs/ANALYTICS_ENGINE.md) |

## Redes sociales (contenido, no infraestructura)

| Tarea | Quién |
|---|---|
| Publicar contenido, gestionar comunidad | **Cristian** (o su equipo) — fuera del alcance de este proyecto de software |
| Confirmar handles/URLs oficiales finales para `social_profile` | **Cristian** |

## Resumen — lo único que bloquea el resto de Block 06

De toda la lista, una sola fila es la que impide continuar con las
Fases 2/3/5/7/9 de este bloque: **la connection string real de
Supabase** (o un conector MCP de Supabase conectado a esta sesión).
Todo lo demás en esta tabla es relevante para bloques futuros
(deployment, comercio real, pixels), no para cerrar Block 06.
