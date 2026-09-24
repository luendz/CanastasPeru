import CheckoutForm from "@/components/CheckoutForm";
import CheckoutSteps from "@/components/CheckoutSteps";
import PageHead from "@/components/PageHead";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <>
      <PageHead kicker="Finalizar compra" title="Ya casi está." aside={<CheckoutSteps current={1} />} />
      <section className="shell cartPage">
        <CheckoutForm />
      </section>
    </>
  );
}
