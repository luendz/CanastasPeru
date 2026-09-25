import { getCatalogo } from "@/lib/catalogo";
import { getContenido } from "@/lib/contenido";
import CheckoutForm from "@/components/CheckoutForm";
import CheckoutSteps from "@/components/CheckoutSteps";
import SplitWords from "@/components/motion/SplitWords";

export default async function CheckoutPage() {
  const [{ products, deliveryZones }, { checkout }] = await Promise.all([getCatalogo(), getContenido()]);
  return (
    <section className="shell cartPage">
      <CheckoutSteps current={1} />
      <div className="cartIntro">
        <span className="eyebrow">Finalizar compra</span>
        <h1><SplitWords text="Casi *listo*" immediate /></h1>
      </div>
      <CheckoutForm products={products} deliveryZones={deliveryZones} opciones={checkout} />
    </section>
  );
}
