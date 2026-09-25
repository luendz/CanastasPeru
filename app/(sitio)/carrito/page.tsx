import { getCatalogo } from "@/lib/catalogo";
import { getContenido } from "@/lib/contenido";
import CartView from "@/components/CartView";
import CheckoutSteps from "@/components/CheckoutSteps";
import SplitWords from "@/components/motion/SplitWords";

export default async function CarritoPage() {
  const [{ products, basketTypes }, { checkout }] = await Promise.all([getCatalogo(), getContenido()]);
  return (
    <section className="shell cartPage">
      <CheckoutSteps current={0} />
      <div className="cartIntro">
        <span className="eyebrow">Tu compra</span>
        <h1><SplitWords text="Tu *carrito*" immediate /></h1>
      </div>
      <CartView products={products} basketTypes={basketTypes} notaImpuestos={checkout.notaImpuestos} />
    </section>
  );
}
