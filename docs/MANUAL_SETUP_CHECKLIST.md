# MANUAL_SETUP_CHECKLIST.md — qué puede hacer Claude vs. qué requiere a Cristian

Lista operativa, por servicio, separando estrictamente lo que Claude
puede ejecutar en una sesión futura (con el acceso correcto) de lo que
**solo Cristian puede hacer** — cuentas, pagos, identidad legal, y
cualquier credencial que no deba pasar por un chat. Nada aquí se
inventó: cada fila reflexiona directamente sobre lo que este bloque
encontró (o no encontró) conectado.

## Supabase

**Block 06 completado**: el conector MCP oficial de Supabase se
conectó, se autorizó a nivel de cuenta, y — un paso adicional real que
vale la pena que Cristian recuerde para la próxima vez — tuvo que
**habilitarse también para esta sesión de chat específica**
(`enabledInChat`, distinto de la autorización a nivel de cuenta) antes
de que sus herramientas aparecieran. Con eso resuelto, las 5
migraciones + seed se aplicaron al proyecto real
(`Cristian-Barbosa-UNIVERSE`, ref `yskfntcurmqqxjuvqoto`) y quedaron
auditadas en `docs/SUPABASE_PRODUCTION.md` §3. Ninguna contraseña ni
connection string se pegó en el chat en ningún momento.

| Tarea | Quién | Estado |
|---|---|---|
| Crear la cuenta/organización Supabase | **Cristian** | ✅ Hecho |
| Crear el proyecto (nombre, región, contraseña de base de datos) | **Cristian** | ✅ Hecho |
| Conectar el conector oficial de Supabase (`Settings → Connectors`) | **Cristian** | ✅ Hecho |
| Habilitar el conector para esta sesión de chat específica | **Cristian** | ✅ Hecho |
| Auditar tablas/RLS/policies existentes contra `docs/SUPABASE_PRODUCTION.md` §2 | Claude | ✅ Hecho |
| Aplicar las 5 migraciones (`0001`–`0005`) al proyecto real | Claude, vía MCP `apply_migration` | ✅ Hecho |
| Ejecutar el seed contra el proyecto real | Claude, vía MCP `execute_sql` | ✅ Hecho |
| Verificar RLS final (roles, policies) | Claude | ✅ Hecho |
| **Pendiente**: bootstrap de `public.schema_migrations` en el proyecto real (docs/SUPABASE_PRODUCTION.md §2/§12) — necesario antes de correr `db:migrate` contra este proyecto directamente | Claude, con confirmación explícita de Cristian (es una escritura fuera de las 5 migraciones aprobadas) | ⏳ No hecho |
| **Pendiente**: copiar el connection string del **pooler** (`sslmode=require`) para usarlo como `DATABASE_URL` en Vercel, cuando exista ese proyecto | **Cristian**, desde `Project Settings → Database` | ⏳ No hecho |
| Rotar la contraseña de base de datos si alguna vez se expone | **Cristian** (vía dashboard de Supabase) | — |

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

## Resumen — Block 06 cerrado

Supabase real ya está desplegado y auditado (docs/SUPABASE_PRODUCTION.md
§3) — deja de ser el bloqueo. Lo único pendiente de este bloque
específico es el bootstrap de `schema_migrations` (fila marcada ⏳
arriba), que requiere una confirmación explícita de Cristian por ser
una escritura fuera de las 5 migraciones ya aprobadas. Todo lo demás en
esta tabla es relevante para bloques futuros (deployment en Vercel,
comercio real, pixels), no para cerrar Block 06.
