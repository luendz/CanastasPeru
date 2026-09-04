import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/mock-data";

export default function CatalogoPage() {
  return (
    <section className="section shell">
      <div className="pageIntro"><span className="eyebrow">Catálogo</span><h1>Canastas y regalos</h1><p>Explora nuestras opciones de prueba. Los datos son mock y luego se conectarán a Supabase.</p></div>
      <div className="catalogLayout">
        <aside className="filters">
          <h3>Filtrar</h3>
          <label><input type="checkbox" /> Económicas</label>
          <label><input type="checkbox" /> Premium</label>
          <label><input type="checkbox" /> Ejecutivas</label>
          <label><input type="checkbox" /> Boxes</label>
          <hr />
          <label>Presupuesto máximo</label>
          <input className="input" placeholder="S/ 250" />
          <button className="btn btnDark full">Aplicar filtros</button>
        </aside>
        <div className="catalogContent">
          <div className="catalogToolbar"><span>{products.length} productos</span><select className="select"><option>Ordenar: destacados</option><option>Menor precio</option><option>Mayor precio</option></select></div>
          <div className="productGrid">{products.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
        </div>
      </div>
    </section>
  );
}
