import SeguimientoPedido from "@/components/SeguimientoPedido";
import SplitWords from "@/components/motion/SplitWords";
import { getContenido } from "@/lib/contenido";

export const metadata = { title: "Seguimiento de pedido" };

export default async function SeguimientoPage({ searchParams }: { searchParams: Promise<{ pedido?: string }> }) {
  const [{ pedido }, { contacto }] = await Promise.all([searchParams, getContenido()]);
  // Solo el número de pedido puede venir en la URL (desde la confirmación); el correo o celular se escribe aquí.
  const numero = pedido && /^OP-\d{1,9}$/.test(pedido) ? pedido : undefined;
  return (
    <>
      <section className="catalogHero heroPortada">
        <div className="shell catalogHeroInner">
          <div>
            <span className="eyebrow">Tu pedido</span>
            <h1><SplitWords text="Seguimiento de *pedido*" immediate /></h1>
          </div>
          <p>Escribe tu número de pedido y el correo o celular con el que compraste para ver en qué etapa está.</p>
        </div>
      </section>
      <section className="shell cartPage">
        <SeguimientoPedido numeroInicial={numero} correoContacto={contacto.correo} telefono={contacto.telefono} />
      </section>
    </>
  );
}
