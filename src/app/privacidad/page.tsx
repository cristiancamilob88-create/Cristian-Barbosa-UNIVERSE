import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { LegalSection } from "@/components/legal/LegalSection";
import { buildMetadata } from "@/lib/seo";
import { legalEntity, privacyPolicyVersion } from "@/config/legal";

export const metadata: Metadata = buildMetadata({
  title: "Política de privacidad y tratamiento de datos",
  description:
    "Cómo Cristian Barbosa recolecta, usa y protege tus datos personales, y cómo ejercer tus derechos (Ley 1581 de 2012).",
  path: "/privacidad",
});

/**
 * Política de tratamiento de datos personales — Ley 1581 de 2012 and
 * Decreto 1377 de 2013 (compiled in Decreto 1074 de 2015), including
 * cookies. Describes what this codebase actually does: the /api/lead
 * form (name, email, phone, interest, message), the first-party
 * `cb_visitor` analytics cookie (src/proxy.ts), and the processors the
 * app really uses. Bump `privacyPolicyVersion` (src/config/legal.ts)
 * on any material change — contacts store which version they accepted.
 */
export default function PrivacidadPage() {
  return (
    <>
      <PageHero
        tag="LEGAL"
        title="Política de privacidad"
        description="Política de tratamiento de datos personales — Ley 1581 de 2012."
      />
      <Container className="pb-8">
        <LegalSection title="1. Responsable del tratamiento">
          <p>
            <strong>{legalEntity.name}</strong>, persona natural, {legalEntity.documentLabel}{" "}
            {legalEntity.documentNumber}, domicilio en {legalEntity.city}, {legalEntity.country}.
          </p>
          <p>
            Correo: <strong>{legalEntity.email}</strong> · Teléfono / WhatsApp:{" "}
            <strong>{legalEntity.phoneDisplay}</strong>
          </p>
        </LegalSection>

        <LegalSection title="2. Qué datos recolectamos">
          <ul>
            <li>
              <strong>Los que tú nos das</strong> en el formulario de contacto: nombre, correo, celular,
              el motivo de tu mensaje y el mensaje (opcional).
            </li>
            <li>
              <strong>Datos de navegación</strong>: páginas que visitas en este sitio, de qué red social,
              campaña o código QR llegaste, y en qué botones haces clic. Se asocian a un identificador
              aleatorio guardado en una cookie (ver sección 6), no a tu nombre, salvo que luego llenes el
              formulario.
            </li>
            <li>
              <strong>Datos de compra</strong>, si compras algo: lo que compraste, el valor y el estado del
              pago. Los datos de tu tarjeta o cuenta los maneja directamente la pasarela de pago; nosotros
              nunca los vemos ni los guardamos.
            </li>
          </ul>
          <p>No pedimos datos sensibles (salud, origen, religión, etc.). No recolectamos a propósito datos de menores de edad.</p>
        </LegalSection>

        <LegalSection title="3. Para qué usamos tus datos">
          <ul>
            <li>Responder tu solicitud (shows, marcas, coaching, productos, música o preguntas generales).</li>
            <li>Contactarte por correo, WhatsApp o llamada sobre esa solicitud.</li>
            <li>Enviarte información sobre contenidos, productos, servicios y eventos de Cristian Barbosa. Puedes pedir que dejemos de hacerlo en cualquier momento.</li>
            <li>Procesar y hacer seguimiento a tus compras.</li>
            <li>Entender de dónde llegan las visitas y qué funciona, para mejorar el sitio.</li>
            <li>Cumplir obligaciones legales.</li>
          </ul>
          <p>No vendemos ni alquilamos tus datos a nadie.</p>
        </LegalSection>

        <LegalSection title="4. Autorización">
          <p>
            Antes de enviar el formulario te pedimos que autorices expresamente este tratamiento, marcando
            la casilla correspondiente. Guardamos la fecha y la versión de esta política que aceptaste, como
            prueba de tu autorización. Sin esa autorización no guardamos el formulario.
          </p>
        </LegalSection>

        <LegalSection title="5. Con quién se comparten (encargados)">
          <p>
            Para funcionar, el sitio usa proveedores que guardan o procesan datos por cuenta nuestra, algunos
            con servidores fuera de Colombia. Solo reciben lo necesario para prestar su servicio:
          </p>
          <ul>
            <li><strong>Vercel</strong> — alojamiento del sitio web.</li>
            <li><strong>Supabase</strong> — base de datos donde se guardan los contactos y las estadísticas.</li>
            <li><strong>Google (Gmail)</strong> — envío de correos.</li>
            <li><strong>Meta (WhatsApp)</strong> — mensajes de WhatsApp.</li>
            <li><strong>Mercado Pago</strong> y otras pasarelas o tiendas que se usen para cobrar — procesamiento de pagos.</li>
          </ul>
          <p>Al autorizar el tratamiento, autorizas también esta transferencia a dichos proveedores.</p>
        </LegalSection>

        <LegalSection title="6. Cookies">
          <p>El sitio usa solo cookies propias, no de publicidad:</p>
          <ul>
            <li>
              <strong>cb_visitor</strong> — identificador aleatorio para saber que varias visitas vienen del
              mismo navegador y de qué canal llegaste. Dura hasta 2 años. No contiene tu nombre ni tus datos
              de contacto.
            </li>
            <li>
              <strong>cb_admin_session</strong> — solo para el administrador del sitio al iniciar sesión.
            </li>
          </ul>
          <p>
            Puedes borrar o bloquear las cookies desde la configuración de tu navegador; el sitio seguirá
            funcionando. Si en el futuro agregamos cookies de terceros (por ejemplo de publicidad), lo
            informaremos aquí y te pediremos permiso antes de activarlas.
          </p>
        </LegalSection>

        <LegalSection title="7. Tus derechos">
          <p>Como titular de tus datos puedes, en cualquier momento y sin costo:</p>
          <ul>
            <li>Conocer, actualizar y rectificar tus datos.</li>
            <li>Pedir prueba de la autorización que diste.</li>
            <li>Saber qué uso se le ha dado a tus datos.</li>
            <li>Revocar la autorización y pedir que borremos tus datos, cuando no exista un deber legal de conservarlos.</li>
            <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC), después de haber hecho tu solicitud ante nosotros.</li>
          </ul>
        </LegalSection>

        <LegalSection title="8. Cómo ejercerlos">
          <p>
            Escribe a <strong>{legalEntity.email}</strong> o al WhatsApp <strong>{legalEntity.phoneDisplay}</strong>{" "}
            indicando tu nombre, el correo o celular con el que te registraste y qué quieres hacer.
          </p>
          <ul>
            <li><strong>Consultas</strong> (qué datos tenemos, para qué): respuesta en máximo 10 días hábiles, prorrogables 5 más si es necesario, avisándote.</li>
            <li><strong>Reclamos</strong> (corregir, borrar, revocar): respuesta en máximo 15 días hábiles, prorrogables 8 más si es necesario, avisándote.</li>
          </ul>
        </LegalSection>

        <LegalSection title="9. Seguridad y conservación">
          <p>
            Los datos viajan cifrados (HTTPS), la base de datos no es accesible públicamente y el panel de
            administración está protegido con contraseña. Guardamos tus datos mientras sean necesarios para
            las finalidades de esta política o mientras la ley lo exija.
          </p>
        </LegalSection>

        <LegalSection title="10. Vigencia y cambios">
          <p>
            Versión {privacyPolicyVersion}. Rige desde su publicación. Si cambia de forma importante, lo
            publicaremos en esta página. Ver también los{" "}
            <Link href="/terminos" className="text-chalk underline underline-offset-4 hover:text-ember">
              términos y condiciones
            </Link>
            .
          </p>
        </LegalSection>
      </Container>
    </>
  );
}
