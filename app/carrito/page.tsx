import CartView from "@/components/CartView";
import CheckoutSteps from "@/components/CheckoutSteps";
import PageHead from "@/components/PageHead";

export const metadata = { title: "Carrito" };

export default function CarritoPage() {
  return (
    <>
      <PageHead kicker="Tu compra" title="Tu carrito" aside={<CheckoutSteps current={0} />} />
      <section className="shell cartPage">
        <CartView />
      </section>
    </>
  );
}
