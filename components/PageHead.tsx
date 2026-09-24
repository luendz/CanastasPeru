import SplitWords from "@/components/motion/SplitWords";

type PageHeadProps = {
  kicker?: string;
  title: string;
  lead?: React.ReactNode;
  /** Contenido extra a la derecha del título (por ejemplo, pasos de la compra). */
  aside?: React.ReactNode;
  tone?: "paper" | "cream";
};

/** Encabezado de página: título que sube palabra por palabra y bajada opcional. */
export default function PageHead({ kicker, title, lead, aside, tone = "paper" }: PageHeadProps) {
  return (
    <header className={`pageHead${tone === "cream" ? " pageHeadCream" : ""}`}>
      <div className="shell pageHeadInner">
        <div>
          {kicker && <p className="pageKicker">{kicker}</p>}
          <h1><SplitWords text={title} immediate /></h1>
        </div>
        {(lead || aside) && (
          <div className="pageHeadSide">
            {lead && <p className="pageLead">{lead}</p>}
            {aside}
          </div>
        )}
      </div>
    </header>
  );
}
