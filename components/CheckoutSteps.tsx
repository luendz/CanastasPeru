const steps = ["Carrito", "Datos y entrega", "Pago", "Confirmación"];

/** Pasos de la compra con una línea que se rellena hasta el paso actual. */
export default function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol className="checkoutSteps" aria-label="Pasos de la compra" style={{ "--progress": current / (steps.length - 1) } as React.CSSProperties}>
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={label} data-state={state} aria-current={state === "current" ? "step" : undefined} style={{ "--i": i } as React.CSSProperties}>
            <span>{state === "done" ? "✓" : i + 1}</span>
            <small>{label}</small>
          </li>
        );
      })}
    </ol>
  );
}
