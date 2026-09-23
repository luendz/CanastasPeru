"use client";

import { useMemo, useState } from "react";
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

  const reset = () => { setCategory("Todas"); setBudget("all"); setSort("featured"); };

  return (
    <>
      <div className="catalogBar">
        <div className="chipRow" role="group" aria-label="Categoría">
          {categories.map(([name, count]) => (
            <button key={name} type="button" className="chip" aria-pressed={category === name} onClick={() => setCategory(name)}>
              {name} <small>{count}</small>
            </button>
          ))}
        </div>
        <div className="catalogBarEnd">
          <label className="srOnly" htmlFor="budget">Presupuesto</label>
          <select id="budget" className="select selectPill" value={budget} onChange={(e) => setBudget(e.target.value)}>
            {budgets.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
          <label className="srOnly" htmlFor="sort">Ordenar</label>
          <select id="sort" className="select selectPill" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="featured">Destacados</option>
            <option value="price-asc">Menor precio</option>
            <option value="price-desc">Mayor precio</option>
          </select>
        </div>
      </div>

      <p className="catalogCount" aria-live="polite">
        <strong>{visible.length}</strong> {visible.length === 1 ? "canasta" : "canastas"}
        {category !== "Todas" && <> en <em>{category}</em></>}
      </p>

      {visible.length > 0 ? (
        <div className="productGrid catalogGrid">
          {visible.map((product) => <ProductCard key={product.slug} product={product} />)}
        </div>
      ) : (
        <div className="emptyState">
          <span aria-hidden="true">✦</span>
          <h3>No encontramos canastas con esos filtros</h3>
          <p>Prueba con otro presupuesto o arma una a medida con nuestro equipo.</p>
          <button type="button" className="btn btnPrimary" onClick={reset}>Quitar filtros</button>
        </div>
      )}
    </>
  );
}
