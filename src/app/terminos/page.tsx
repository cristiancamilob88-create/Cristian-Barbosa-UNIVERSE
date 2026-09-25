import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { LegalSection } from "@/components/legal/LegalSection";
import { buildMetadata } from "@/lib/seo";
import { legalEntity, termsVersion } from "@/config/legal";

export const metadata: Metadata = buildMetadata({
  title: "Términos y condiciones",
  description:
    "Condiciones de uso del sitio y de compra: precios, pagos, envíos, derecho de retracto, reembolsos y garantías (Ley 1480 de 2011).",
  path: "/terminos",
});

/**
 * Términos y condiciones — Estatuto del Consumidor (Ley 1480 de 2011):
 * seller identity (art. 50), right of withdrawal (art. 47), payment
 * reversal (art. 51), legal warranty (art. 7-8). Written for how the
 * site actually sells today: checkout via Mercado Pago or a linked
 * store, shows/coaching/brand deals agreed individually over WhatsApp.
 */
export default function TerminosPage() {
  return (
    <>
      <PageHero
        tag="LEGAL"
        title="Términos y condiciones"
        description="Condiciones de uso del sitio y de compra — Ley 1480 de 2011 (Estatuto del Consumidor)."
      />
      <Container className="pb-8">
        <LegalSection title="1. Quién vende">
          <p>
            <strong>{legalEntity.name}</strong>, persona natural, {legalEntity.documentLabel}{" "}
            {legalEntity.documentNumber}, domicilio en {legalEntity.city}, {legalEntity.country}. Correo <strong>{legalEntity.email}</strong>,
            teléfono / WhatsApp <strong>{legalEntity.phoneDisplay}</strong>.
          </p>
          <p>Al usar este sitio o comprar a través de él aceptas estos términos.</p>
        </LegalSection>

        <LegalSection title="2. Qué se ofrece aquí">
          <ul>
            <li><strong>Productos físicos y digitales</strong>: cada producto muestra su precio, sus características y el medio de pago antes de comprar.</li>
            <li><strong>Shows, coaching y colaboraciones de marca</strong>: se cotizan y acuerdan de forma individual (por WhatsApp, correo o documento aparte). Lo publicado en el sitio es informativo; las condiciones finales son las del acuerdo que firmemos.</li>
            <li><strong>Suscripciones y comunidad</strong> en redes sociales (por ejemplo, la suscripción de Facebook): se rigen además por las condiciones de esa plataforma.</li>
            <li><strong>Apoyos voluntarios</strong> (PayPal, Nequi): son donaciones libres, no una compra.</li>
          </ul>
        </LegalSection>

        <LegalSection title="3. Precios y pagos">
          <p>
            Los precios están en pesos colombianos (COP) e incluyen los impuestos que apliquen, salvo que se
            indique otra cosa. El costo de envío, si lo hay, se muestra antes de pagar. Los pagos se procesan
            por pasarelas externas (como Mercado Pago o la tienda enlazada); los datos de tu tarjeta o cuenta
            los maneja directamente esa pasarela.
          </p>
        </LegalSection>

        <LegalSection title="4. Envíos y entregas">
          <p>
            Los productos físicos se envían a la dirección que indiques al comprar. El tiempo estimado de
            entrega se informa antes de pagar y puede variar según la ciudad y la transportadora. Los productos
            digitales se entregan por correo o por acceso en línea después de confirmado el pago.
          </p>
        </LegalSection>

        <LegalSection title="5. Derecho de retracto">
          <p>
            En compras hechas por internet puedes arrepentirte y devolver el producto dentro de los{" "}
            <strong>5 días hábiles</strong> siguientes a la entrega (o a la celebración del contrato, si es un
            servicio), según el artículo 47 de la Ley 1480 de 2011. El producto debe devolverse en el mismo
            estado en que lo recibiste; los costos de transporte de la devolución corren por tu cuenta.
          </p>
          <p>
            Te devolvemos el dinero pagado dentro de los <strong>30 días calendario</strong> siguientes a tu
            solicitud, sin descuentos.
          </p>
          <p>El retracto no aplica, por ley, en estos casos:</p>
          <ul>
            <li>Servicios que ya empezaron a prestarse con tu acuerdo (por ejemplo, un coaching ya iniciado).</li>
            <li>Productos hechos a tu medida o personalizados.</li>
            <li>Contenidos digitales que ya descargaste o a los que ya accediste.</li>
            <li>Productos de uso personal que, por higiene, no pueden devolverse una vez abiertos.</li>
          </ul>
        </LegalSection>

        <LegalSection title="6. Reembolsos y reversión del pago">
          <p>
            Si pagaste con un medio electrónico (tarjeta, PSE, etc.) y fuiste víctima de fraude, la operación
            no fue solicitada, el producto no te llegó, o llegó distinto a lo ofrecido o defectuoso, puedes
            pedir la <strong>reversión del pago</strong> (artículo 51 de la Ley 1480) dentro de los 5 días
            hábiles siguientes a que te enteres. Escríbenos y avisa también al emisor de tu medio de pago.
          </p>
        </LegalSection>

        <LegalSection title="7. Garantía">
          <p>
            Los productos físicos tienen la garantía legal que establece la Ley 1480: si presentan defectos de
            calidad o funcionamiento, se reparan, se cambian o se devuelve el dinero según corresponda. Para
            hacerla válida escríbenos con tu número de pedido y una foto o video del problema.
          </p>
        </LegalSection>

        <LegalSection title="8. Propiedad intelectual">
          <p>
            Las fotos, videos, música, textos, logos y marca de Cristian Barbosa que aparecen en este sitio le
            pertenecen o se usan con autorización. No se pueden copiar ni usar con fines comerciales sin
            permiso escrito.
          </p>
        </LegalSection>

        <LegalSection title="9. Datos personales">
          <p>
            El tratamiento de tus datos se rige por la{" "}
            <Link href="/privacidad" className="text-chalk underline underline-offset-4 hover:text-ember">
              política de privacidad
            </Link>
            .
          </p>
        </LegalSection>

        <LegalSection title="10. Quejas, ley aplicable y cambios">
          <p>
            Cualquier queja o solicitud: <strong>{legalEntity.email}</strong> o WhatsApp{" "}
            <strong>{legalEntity.phoneDisplay}</strong>. Estos términos se rigen por las leyes de la República
            de Colombia; también puedes acudir a la Superintendencia de Industria y Comercio. Versión{" "}
            {termsVersion}; si cambian, la nueva versión se publica en esta página y aplica a las compras
            hechas desde entonces.
          </p>
        </LegalSection>
      </Container>
    </>
  );
}
