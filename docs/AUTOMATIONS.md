# AUTOMATIONS.md — Decision Gate 5 (email/WhatsApp automation)

docs/NEXT_BLOCK.md's own rule: "never choose the vendor before the map."
This records both — the lifecycle map Cristian confirmed, then the
vendor decisions made against it, each with the real reasoning, not a
default pick.

## The lifecycle map (confirmed with Cristian, 2026-08-25)

| # | Trigger | Message | Canal | Estado |
|---|---|---|---|---|
| 1 | `lead_submitted` (cualquier tema) | Bienvenida, personalizada por tema (mismos 8 valores de `ContactForm`'s `topics`) | Correo **y** WhatsApp, los dos | **Correo: construido** (esta fase). WhatsApp: pendiente, ver abajo. |
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

## WhatsApp — investigado, decisión todavía pendiente

Cristian ya tiene WhatsApp Business (la app), pero **eso no es lo mismo
que la plataforma necesaria para enviar mensajes automáticos** — la app
es para que un humano escriba manualmente. Enviar mensajes sin que
alguien los escriba requiere la "WhatsApp Business Platform" (API),
un canal técnico aparte.

Su número actual de WhatsApp Business es de uso mixto (negocio y
familia/personal) — **no se recomienda conectarlo**: un número
migrado a la Platform deja de poder usarse con la app normal para
chatear manualmente; todo el tráfico de ese número (automático o no)
tendría que pasar por la API de ahí en adelante.

Opciones reales evaluadas para el número, sin necesidad de una SIM
física:

| Opción | Necesita SIM física | Riesgo | Notas |
|---|---|---|---|
| **Número virtual vía Twilio** | No — se renta en la nube, unos minutos | Ninguno, es el canal oficial | Recomendado. Unos pocos dólares/mes + costo por conversación de Meta. Meta solo pide poder recibir un SMS/llamada de verificación una vez, algo que un número virtual de Twilio sí puede hacer. |
| **Meta Cloud API directamente** (sin Twilio de por medio) | No | Ninguno, oficial | Más barato a largo plazo, configuración inicial más técnica (Business Manager, permisos de app) — Twilio simplifica ese primer paso. |
| **n8n** | — | — | No resuelve el problema del número — por debajo sigue necesitando una de las dos opciones oficiales de arriba. Para el alcance actual (2 disparadores bien definidos), agregarlo sería una pieza más que mantener sin necesidad real (docs/ARCHITECTURE.md §10-11, "no agregar vendor sin revisar primero"). |
| **Automatización no oficial** (librerías tipo whatsapp-web.js/Baileys, que simulan una sesión de WhatsApp Web) | No | **Alto — riesgo real de que Meta banee el número permanentemente**, sin aviso | Explícitamente NO recomendado para un negocio real, aunque técnicamente existe. |

**Pendiente de Cristian**: decidir si consigue un número virtual (vía
Twilio, sin trámite físico) dedicado a esto. En cuanto lo tenga, se
construye el envío de WhatsApp con el mismo patrón de `sendWelcomeEmail()`
(falla en silencio si no está configurado, nunca rompe el flujo real).
