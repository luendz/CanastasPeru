import CheckoutForm from "@/components/CheckoutForm";
import CheckoutSteps from "@/components/CheckoutSteps";

export default function CheckoutPage() {
  return (
    <section className="shell cartPage">
      <CheckoutSteps current={1} />
      <div className="cartIntro">
        <span className="eyebrow">Finalizar compra</span>
        <h1>Casi <em>listo</em></h1>
      </div>
      <CheckoutForm />
    </section>
  );
}
