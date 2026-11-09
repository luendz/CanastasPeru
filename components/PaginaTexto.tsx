import SplitWords from "@/components/motion/SplitWords";

/** Convierte direcciones web y correos en enlaces. */
function conEnlaces(texto: string) {
  return texto.split(/(https?:\/\/[^\s]+[^\s.,;:)]|[\w.+-]+@[\w-]+\.[\w.]+[\w])/g).map((parte, n) => {
    if (n % 2 === 0) return parte;
    const href = parte.includes("@") && !parte.startsWith("http") ? `mailto:${parte}` : parte;
    return <a key={n} href={href}>{parte}</a>;
  });
}

/**
 * Formato sencillo del texto: los bloques se separan con una línea en blanco;
 * "## " es un subtítulo, "### " un subtítulo menor y las líneas con "- " son viñetas.
 */
function Bloques({ texto }: { texto: string }) {
  return texto.split(/\n\s*\n/).map((bloque, n) => {
    const b = bloque.trim();
    if (b.startsWith("### ")) return <h3 key={n}>{b.slice(4)}</h3>;
    if (b.startsWith("## ")) return <h2 key={n}>{b.slice(3)}</h2>;
    const lineas = b.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lineas.length && lineas.every((l) => l.startsWith("- "))) {
      return <ul key={n}>{lineas.map((l, i) => <li key={i}>{conEnlaces(l.slice(2))}</li>)}</ul>;
    }
    return <p key={n}>{conEnlaces(b)}</p>;
  });
}

/** Página simple de texto (términos, privacidad): cabecera y contenido con subtítulos y viñetas. */
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
        {texto ? <Bloques texto={texto} /> : null}
        {children}
      </section>
    </>
  );
}
