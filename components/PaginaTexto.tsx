import SplitWords from "@/components/motion/SplitWords";

/** Página simple de texto (términos, privacidad): cabecera y párrafos. */
export default function PaginaTexto({ etiqueta, titulo, texto, children }: { etiqueta: string; titulo: string; texto?: string; children?: React.ReactNode }) {
  return (
    <>
      <section className="catalogHero">
        <div className="shell catalogHeroInner">
          <div>
            <span className="eyebrow">{etiqueta}</span>
            <h1><SplitWords text={titulo} immediate /></h1>
          </div>
        </div>
      </section>
      <section className="shell section paginaTexto">
        {texto?.split(/\n\s*\n/).map((p, n) => <p key={n}>{p}</p>)}
        {children}
      </section>
    </>
  );
}
