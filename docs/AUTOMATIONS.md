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

## Implementado — WhatsApp (2026-08-25, Twilio)

Cristian creó su cuenta de Twilio. `src/server/notifications/whatsapp.ts`
— `sendWelcomeWhatsApp()`, mismo contrato que `sendWelcomeEmail()`
(nunca revienta `/api/lead`, se salta en silencio con un
`console.warn` si algo no está listo): sin credenciales configuradas,
con el texto de ese tema todavía en placeholder
(`src/server/notifications/whatsappTemplates.ts`,
`isPendingWhatsAppTemplate()`), o si el teléfono no se pudo normalizar
a formato internacional (`src/server/notifications/phone.ts` —
asume `+57` para un celular colombiano de 10 dígitos sin prefijo,
nunca adivina para otros países).

Arranca contra el **WhatsApp Sandbox de Twilio** (gratis, instantáneo,
sin verificación de negocio de Meta) y pasa a un número real aprobado
más adelante sin cambiar nada de código — solo la variable
`TWILIO_WHATSAPP_FROM`. Una diferencia real que hay que saber: fuera
del Sandbox, un mensaje que la persona no inició (como este, de
bienvenida) necesita una **plantilla aprobada por Meta**, no texto
libre — el Sandbox sí permite texto libre para probar ya mismo.

## WhatsApp — investigación del número (contexto de la decisión de arriba)

Cristian ya tiene WhatsApp Business (la app), pero eso no es lo mismo
que la plataforma necesaria para enviar mensajes automáticos — la app
es para que un humano escriba manualmente. Su número actual es de uso
mixto (negocio y familia/personal) — no se recomendó conectarlo ese
mismo número: un número migrado a la Platform deja de poder usarse con
la app normal para chatear manualmente.

Opciones evaluadas para conseguir un número dedicado, sin necesidad de
una SIM física (Twilio, la opción elegida arriba, fue la recomendada):

| Opción | Necesita SIM física | Riesgo | Notas |
|---|---|---|---|
| **Twilio** (elegida) | No | Ninguno, oficial | Cristian ya creó la cuenta. Solo credenciales/API, sin panel visual propio de WhatsApp — el control está en el código. |
| **WATI** | No | Ninguno, oficial (mismo canal de Meta por debajo) | Pensada para dueños de negocio no técnicos — tiene su propio panel visual (bandeja de entrada, plantillas, automatizaciones simples sin código). Cobra su propia suscripción mensual además del costo de Meta. Buena alternativa si Cristian quiere poder tocar/ajustar cosas él mismo sin pasar siempre por código. |
| **360dialog / Gupshup** | No | Ninguno, oficiales | Otros proveedores del mismo tipo que Twilio, a veces con precio más plano por volumen. No más simples de configurar que Twilio. |
| **Meta Cloud API directamente** (sin intermediario) | No | Ninguno, oficial | Más barato a largo plazo, configuración inicial más técnica (Business Manager, permisos de app) — no es "más fácil" que Twilio. |
| **n8n** | — | — | No resuelve el problema del número — por debajo sigue necesitando una de las opciones oficiales de arriba. Para el alcance actual (2 disparadores bien definidos), agregarlo sería una pieza más que mantener sin necesidad real (docs/ARCHITECTURE.md §10-11, "no agregar vendor sin revisar primero"). |
| **Automatización no oficial** (whatsapp-web.js/Baileys, simulan WhatsApp Web) | No | **Alto — riesgo real de baneo permanente**, sin aviso | Explícitamente NO recomendado para un negocio real. |

**La complejidad real no es "cuál herramienta"** — las 4 primeras
opciones son solo distintas puertas hacia el mismo sistema oficial de
Meta, y todas heredan el mismo requisito de verificación de negocio
para producción real. Twilio ya está creado y ya tiene código
funcionando (arriba) — cambiar de proveedor ahora perdería ese avance
sin resolver nada estructuralmente distinto.
