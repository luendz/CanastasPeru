import { getCatalogo } from "@/lib/catalogo";
import CheckoutForm from "@/components/CheckoutForm";
import CheckoutSteps from "@/components/CheckoutSteps";
import SplitWords from "@/components/motion/SplitWords";

export default async function CheckoutPage() {
  const { products, deliveryZones } = await getCatalogo();
  return (
    <section className="shell cartPage">
      <CheckoutSteps current={1} />
      <div className="cartIntro">
        <span className="eyebrow">Finalizar compra</span>
        <h1><SplitWords text="Casi *listo*" immediate /></h1>
      </div>
      <CheckoutForm products={products} deliveryZones={deliveryZones} />
    </section>
  );
}
