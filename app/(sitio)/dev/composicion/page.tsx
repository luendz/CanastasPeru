import { getCatalogo } from "@/lib/catalogo";
import CompositionEditor from "@/components/CompositionEditor";

export const metadata = {
  title: "Editor de composición",
};

export default async function EditorComposicionPage() {
  const { products, basketTypes } = await getCatalogo();
  return (
    <section className="section shell">
      <div className="pageIntro">
        <span className="eyebrow">Herramienta interna</span>
        <h1>Editor de composición</h1>
        <p>Arrastra cada producto sobre la canasta y copia las posiciones resultantes. Esta página es solo para ajustar el prototipo; no forma parte de la tienda.</p>
      </div>
      <CompositionEditor products={products} basketTypes={basketTypes} />
    </section>
  );
}
