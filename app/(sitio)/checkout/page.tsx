import CheckoutForm from "@/components/CheckoutForm";
import CheckoutSteps from "@/components/CheckoutSteps";
import SplitWords from "@/components/motion/SplitWords";

export default function CheckoutPage() {
  return (
    <section className="shell cartPage">
      <CheckoutSteps current={1} />
      <div className="cartIntro">
        <span className="eyebrow">Finalizar compra</span>
        <h1><SplitWords text="Casi *listo*" immediate /></h1>
      </div>
      <CheckoutForm />
    </section>
  );
}
