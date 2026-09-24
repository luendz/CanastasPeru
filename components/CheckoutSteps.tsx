const steps = ["Carrito", "Datos y entrega", "Pago", "Confirmación"];

export default function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol className="checkoutSteps" aria-label="Pasos de la compra">
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={label} style={{ "--i": i } as React.CSSProperties} data-state={state} aria-current={state === "current" ? "step" : undefined}>
            <span>{state === "done" ? "✓" : i + 1}</span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}
