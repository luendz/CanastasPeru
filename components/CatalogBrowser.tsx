"use client";

import { startTransition, useMemo, useState, ViewTransition } from "react";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/mock-data";

const budgets = [
  { id: "all", label: "Cualquier precio", max: Infinity },
  { id: "100", label: "Hasta S/ 100", max: 100 },
  { id: "150", label: "Hasta S/ 150", max: 150 },
  { id: "250", label: "Hasta S/ 250", max: 250 },
];

type Sort = "featured" | "price-asc" | "price-desc";

export default function CatalogBrowser() {
  const [category, setCategory] = useState("Todas");
  const [budget, setBudget] = useState("all");
  const [sort, setSort] = useState<Sort>("featured");

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => counts.set(p.category, (counts.get(p.category) ?? 0) + 1));
    return [["Todas", products.length] as const, ...counts.entries()];
  }, []);

  const max = budgets.find((b) => b.id === budget)?.max ?? Infinity;
  const visible = products
    .filter((p) => (category === "Todas" || p.category === category) && p.price <= max)
    .sort((a, b) => (sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : 0));

  // Dentro de una transición, React anima las tarjetas que entran, salen o cambian de lugar.
  const update = (fn: () => void) => startTransition(fn);
  const reset = () => update(() => { setCategory("Todas"); setBudget("all"); setSort("featured"); });

  return (
    <>
      <div className="catalogBar">
        <div className="chipRow" role="group" aria-label="Categoría">
          {categories.map(([name, count]) => (
            <button key={name} type="button" className="chip" aria-pressed={category === name} onClick={() => update(() => setCategory(name))}>
              {name} <small>{count}</small>
            </button>
          ))}
        </div>
        <div className="catalogBarEnd">
          <label className="srOnly" htmlFor="budget">Presupuesto</label>
          <select id="budget" className="select selectPill" value={budget} onChange={(e) => { const v = e.target.value; update(() => setBudget(v)); }}>
            {budgets.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
          <label className="srOnly" htmlFor="sort">Ordenar</label>
          <select id="sort" className="select selectPill" value={sort} onChange={(e) => { const v = e.target.value as Sort; update(() => setSort(v)); }}>
            <option value="featured">Destacados</option>
            <option value="price-asc">Menor precio</option>
            <option value="price-desc">Mayor precio</option>
          </select>
        </div>
      </div>

      <p className="catalogCount" aria-live="polite">
        <strong>{visible.length}</strong> {visible.length === 1 ? "canasta" : "canastas"}
        {category !== "Todas" && <> en {category}</>}
      </p>

      {visible.length > 0 ? (
        <div className="productGrid catalogGrid">
          {visible.map((product, i) => (
            <ViewTransition key={product.slug} name={`grid-${product.slug}`} enter="cardIn" exit="cardOut" default="gridMove">
              <div className="catalogItem" style={{ "--i": i } as React.CSSProperties}>
                <ProductCard product={product} />
              </div>
            </ViewTransition>
          ))}
        </div>
      ) : (
        <ViewTransition enter="cardIn" default="none">
          <div className="emptyState">
            <h3>No hay canastas con esos filtros</h3>
            <p>Prueba con otro presupuesto, o cuéntanos qué buscas y la armamos a medida.</p>
            <button type="button" className="btnV2 btnV2Solid" onClick={reset}>Quitar filtros</button>
          </div>
        </ViewTransition>
      )}
    </>
  );
}
