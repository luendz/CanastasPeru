import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getCatalogo } from "@/lib/catalogo";

export const metadata = { title: "Buscar" };

const normal = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Busca canastas por nombre, categoría, descripción o los productos que traen. */
export default async function BuscarPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q = "" }, { products }] = await Promise.all([searchParams, getCatalogo()]);
  const palabras = normal(q.trim()).split(/\s+/).filter(Boolean);
  const encontrados = palabras.length
    ? products.filter((p) => {
        const texto = normal([p.name, p.category, p.description, ...p.items].join(" "));
        return palabras.every((w) => texto.includes(w));
      })
    : [];

  return (
    <section className="shell section">
      <form className="buscarForm" action="/buscar" role="search">
        <input className="input" name="q" type="search" defaultValue={q} placeholder="Buscar canastas o productos (ej. panetón, premium)…" aria-label="Buscar" autoFocus={!q} />
        <button className="btn btnPrimary" type="submit">Buscar</button>
      </form>
      {q && (
        <p className="catalogCount" aria-live="polite">
          <strong>{encontrados.length}</strong> {encontrados.length === 1 ? "resultado" : "resultados"} para “{q}”
        </p>
      )}
      {encontrados.length > 0 ? (
        <div className="productGrid catalogGrid">
          {encontrados.map((p) => <div className="gridItem" key={p.slug}><ProductCard product={p} /></div>)}
        </div>
      ) : q ? (
        <div className="emptyState">
          <span aria-hidden="true">✦</span>
          <h3>No encontramos canastas con esa búsqueda</h3>
          <p>Prueba con otra palabra o mira todo el catálogo.</p>
          <Link className="btn btnPrimary" href="/canastas">Ver canastas</Link>
        </div>
      ) : null}
    </section>
  );
}
