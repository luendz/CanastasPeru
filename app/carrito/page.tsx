import CartView from "@/components/CartView";
import CheckoutSteps from "@/components/CheckoutSteps";
import SplitWords from "@/components/motion/SplitWords";

export default function CarritoPage() {
  return (
    <section className="shell cartPage">
      <CheckoutSteps current={0} />
      <div className="cartIntro">
        <span className="eyebrow">Tu compra</span>
        <h1><SplitWords text="Tu *carrito*" immediate /></h1>
      </div>
      <CartView />
    </section>
  );
}
