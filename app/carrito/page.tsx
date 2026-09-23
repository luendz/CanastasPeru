import CartView from "@/components/CartView";
import CheckoutSteps from "@/components/CheckoutSteps";

export default function CarritoPage() {
  return (
    <section className="shell cartPage">
      <CheckoutSteps current={0} />
      <div className="cartIntro">
        <span className="eyebrow">Tu compra</span>
        <h1>Tu <em>carrito</em></h1>
      </div>
      <CartView />
    </section>
  );
}
