# AUTOMATIONS.md — Decision Gate 5 (email/WhatsApp automation)

docs/NEXT_BLOCK.md's own rule: "never choose the vendor before the map."
This records both — the lifecycle map Cristian confirmed, then the
vendor decisions made against it, each with the real reasoning, not a
default pick.

## The lifecycle map (confirmed with Cristian, 2026-08-25)

| # | Trigger | Message | Canal | Estado |
|---|---|---|---|---|
| 1 | `lead_submitted` (cualquier tema) | Bienvenida, personalizada por tema (mismos 8 valores de `ContactForm`'s `topics`) | Correo **y** WhatsApp, los dos | **Ambos construidos** — ver abajo. |
| 2 | Han pasado 7 días desde el registro (o desde el último recordatorio) de un contacto, y ese contacto no ha hecho clic en el link de la comunidad de WhatsApp | Invitación a unirse a la comunidad | WhatsApp y/o correo | No construido todavía — depende de la decisión de WhatsApp de abajo. |

Nota honesta sobre el trigger 2: no hay forma de saber con certeza si
alguien ya se unió al grupo de WhatsApp (WhatsApp no expone eso). El
criterio real es una aproximación: "¿ha hecho clic en el link de la
comunidad?" (`whatsapp_click`, ya registrado por `/go/[slug]`), no "¿ya
está en el grupo?".

Una idea más grande que Cristian propuso — un agente que dé seguimiento
continuo según el interés de cada persona a lo largo del tiempo —
evaluada y deliberadamente pospuesta: necesita datos históricos reales
acumulados para tener sentido, y hoy casi no hay volumen todavía. Revisar
una vez el mapa de arriba esté funcionando con datos reales.

## Decisión — Correo: Gmail SMTP, no un vendor transaccional (Resend/similar)

Resend (la primera opción propuesta) fue verificada directamente contra
su propia documentación: sin un dominio propio verificado, **solo puede
enviar al correo de la cuenta del dueño**, no a destinatarios reales
([fuente](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain)).
Cristian no tiene un dominio comprado todavía y no quiso bloquear el
avance en eso.

Gmail SMTP no tiene esa restricción — envía a cualquier destinatario
real desde el día uno, usando solo un correo de Gmail que Cristian ya
tiene más una "Contraseña de aplicación" (nunca su contraseña real).
Trade-off, dicho explícitamente: tope de ~500 correos/día (cuenta Gmail
personal), y el correo llega como "de parte de" el Gmail de Cristian,
no de un dominio propio con su marca. Aceptable al volumen actual;
revisar (Resend, ya con dominio) si eso deja de ser cierto.

### Cómo generar el App Password (paso de Cristian, no de código)

1. Activar verificación en dos pasos, si no está activa:
   https://myaccount.google.com/security
2. Ir a https://myaccount.google.com/apppasswords
3. Generar una nueva, darle un nombre (ej. "Cristian Barbosa Universe")
4. Copiar el código de 16 caracteres
5. Pegar `GMAIL_USER` (el correo de Gmail) y `GMAIL_APP_PASSWORD` (el
   código, con o sin espacios — el código los quita antes de usarlos)
   en las variables de entorno de Vercel, igual que se hizo con
   `ADMIN_PASSWORD_HASH` — Settings → Environment Variables → Redeploy.

### Texto real — escrito y aprobado (2026-08-28)

Los 8 correos ya no son placeholder. Decisión de Cristian, afinada en
varias rondas de chat: cada tema manda a la página del sitio que ya
tiene el CTA correcto integrado (`/entrenar`, `/shows`, `/marcas`,
`/productos`, `/musica`, o `/` para "Otro") — más simple de mantener
(si el link de WhatsApp/Facebook cambia, se edita la página, no los 8
correos) y la persona ve contexto antes de dar el clic. La única
excepción es **Coaching personalizado**, que manda directo a
`/go/whatsapp-commercial` (mismo número que usa Shows/Marcas — Cristian
confirmó que es el mismo WhatsApp personal/comercial que ya usa para
clientes, `+57 302 634 2927`, nunca escrito en el repo) porque ahí el
objetivo es cerrar la venta en conversación directa, no navegar
contenido primero. Todos los 8 terminan con una línea compartida
invitando a `/redes` (idea de Cristian).

## Implementado esta fase

- `src/server/notifications/email.ts` — `sendWelcomeEmail()`, transporte
  Gmail vía `nodemailer`. Nunca revienta `/api/lead`: si Gmail no está
  configurado, o si el texto de ese tema todavía es un placeholder, se
  salta en silencio (con un `console.warn`) — el lead se guarda igual.
- `src/server/notifications/emailTemplates.ts` — un template por tema,
  **todos placeholder hoy** (`isPendingTemplate()` lo confirma y lo
  hace cumplir: nunca se manda un placeholder a una persona real).
  **Para activar un tema**: edita ese tema's `subject`/`body` en este
  archivo con el texto real de Cristian — nada más cambia. `{name}` se
  reemplaza por el nombre de quien se registró.
- Disparado desde `src/app/api/lead/route.ts`, después de que la
  transacción ya guardó todo — `void sendWelcomeEmail(...)`, sin
  bloquear ni poder romper la respuesta al visitante.

## Decisión — WhatsApp: Meta Cloud API directamente, sin intermediario

Primer intento: Twilio (Cristian había creado la cuenta). **Cambiado el
mismo día**, después de que Cristian confirmó que no le importa hacer
la verificación de negocio de Meta él mismo — la tiene ya de otros
proyectos. Ir directo a Meta evita la comisión que Twilio cobra encima
del costo por conversación de Meta, y quita un intermediario.

Alternativas evaluadas antes de decidir (ninguna es "más fácil" en el
sentido que importa — todas son puertas distintas al mismo sistema de
Meta, y todas heredan su mismo requisito de verificación de negocio):

| Opción | Notas |
|---|---|
| **Meta Cloud API directamente** (elegida) | Más barato (sin comisión de intermediario). Configuración inicial algo más técnica (Business Manager, permisos de app) — aceptable, Cristian ya tiene experiencia con Meta. |
| Twilio | Simplifica el primer registro del número, pero cobra su propia comisión encima de Meta. Ya no se usa — el paquete `twilio` fue desinstalado. |
| WATI | Pensada para dueños de negocio no técnicos, con panel visual propio (bandeja, plantillas, automatizaciones sin código). Cobra su propia suscripción mensual aparte. Buena opción futura si Cristian quiere una pantalla propia sin depender siempre de código. |
| 360dialog / Gupshup | Mismo tipo de intermediario que Twilio, no más simples de configurar. |
| n8n | No resuelve el problema del número — por debajo necesitaría una de las opciones de arriba igual. Para 2 disparadores bien definidos, agregarlo sería una pieza más sin necesidad real (docs/ARCHITECTURE.md §10-11). |
| Automatización no oficial (whatsapp-web.js/Baileys) | **Riesgo real de que Meta banee el número para siempre.** Explícitamente no recomendado. |

Cristian ya tiene WhatsApp Business (la app), pero eso no es lo mismo
que la Cloud API — la app es para chatear manualmente. Su número
actual es de uso mixto (negocio y familia/personal); se le recomendó
no conectar ese mismo número a la Cloud API (una vez migrado, deja de
poder usarse con la app normal) — necesita un número dedicado.

### Texto real — escrito y aprobado (2026-08-28)

Los 8 mensajes de `whatsappTemplates.ts` ya no son placeholder — Cristian
los revisó y aprobó en el chat ("me gustan los mensajes") antes de que
quedaran en el código. Los 8 apuntan a `https://cristian-barbosa-
universe.vercel.app` (el dominio real hoy — Cristian no tiene dominio
propio comprado todavía) y, salvo Productos (que además manda a
`/productos`), todos terminan invitando a `/comunidad` — esa página ya
tiene su propio botón hacia el grupo de WhatsApp, así que un solo link
cumple las dos cosas que Cristian pidió: que la persona pise el sitio, y
que quede invitada a la comunidad, sin mandar dos links separados.

### Implementado

`src/server/notifications/whatsapp.ts` — `sendWelcomeWhatsApp()`, habla
directo con `https://graph.facebook.com/{version}/{phone-number-id}/messages`
(formato de request confirmado contra la documentación oficial de
Meta, no adivinado:
[Meta for Developers — Messages reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages/)).
Mismo contrato que `sendWelcomeEmail()` — nunca revienta `/api/lead`,
se salta en silencio con un `console.warn` si: las credenciales no
están configuradas, el texto de ese tema todavía es un placeholder
(`whatsappTemplates.ts`, `isPendingWhatsAppTemplate()`), o el teléfono
no se pudo normalizar (`phone.ts` — asume `+57` solo para un celular
colombiano de 10 dígitos sin prefijo, nunca adivina para otros países).

Una diferencia real que hay que saber: un mensaje que la persona no
inició (como este, de bienvenida) necesita una **plantilla aprobada
por Meta** para producción real — texto libre como el que usa esta
función solo funciona contra números de prueba de tu propia cuenta de
desarrollador, hasta que una plantilla quede aprobada.

### Lo que Cristian necesita generar en developers.facebook.com

1. Crear una app tipo "Business" en developers.facebook.com
2. Agregar el producto "WhatsApp" a esa app
3. Dentro de WhatsApp → API Setup: registrar/usar un número
4. Generar un **token de acceso permanente** (System User), no el
   temporal de 24h que aparece por defecto
5. Copiar de esa misma pantalla: el token, y el **Phone Number ID**
   (no el número de teléfono en sí)
6. Pegar `META_WHATSAPP_ACCESS_TOKEN` y `META_WHATSAPP_PHONE_NUMBER_ID`
   en las variables de entorno de Vercel + Redeploy (igual que se hizo
   con `ADMIN_PASSWORD_HASH`)
