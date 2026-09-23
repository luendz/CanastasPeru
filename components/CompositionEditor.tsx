"use client";

import { useRef, useState } from "react";
import ProductComposition from "@/components/ProductComposition";
import { ProductVisualItem, basketTypes, products } from "@/lib/mock-data";

type Variant = "card" | "detail";

const clamp = (value: number) => Math.min(100, Math.max(0, value));
const round = (value: number) => Math.round(value * 10) / 10;

function formatItem(item: ProductVisualItem) {
  const parts = [
    `name: ${JSON.stringify(item.name)}`,
    `emoji: ${JSON.stringify(item.emoji)}`,
  ];
  if (item.image) parts.push(`image: ${JSON.stringify(item.image)}`);
  parts.push(`top: ${round(item.top)}`, `left: ${round(item.left)}`, `size: ${item.size}`);
  if (item.rotate) parts.push(`rotate: ${item.rotate}`);
  if (item.zIndex !== undefined) parts.push(`zIndex: ${item.zIndex}`);
  return `      { ${parts.join(", ")} },`;
}

export default function CompositionEditor() {
  const [slug, setSlug] = useState(products[0].slug);
  const [variant, setVariant] = useState<Variant>("detail");
  const [items, setItems] = useState<ProductVisualItem[]>(products[0].visualItems);
  const [selected, setSelected] = useState(0);
  const [copied, setCopied] = useState(false);

  const product = products.find((item) => item.slug === slug) ?? products[0];
  const [basketImage, setBasketImage] = useState(product.baseImage ?? basketTypes[0].image);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ index: number; offsetX: number; offsetY: number } | null>(null);

  const multiplier = variant === "detail" ? 1.65 : 1;
  const draft = { ...product, visualItems: items };
  const current = items[selected];

  function loadProduct(nextSlug: string) {
    const next = products.find((item) => item.slug === nextSlug) ?? products[0];
    setSlug(nextSlug);
    setItems(next.visualItems);
    setBasketImage(next.baseImage ?? basketTypes[0].image);
    setSelected(0);
    setCopied(false);
  }

  function patch(index: number, changes: Partial<ProductVisualItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...changes } : item)));
    setCopied(false);
  }

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>, index: number) {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const centerX = rect.left + (items[index].left / 100) * rect.width;
    const centerY = rect.top + (items[index].top / 100) * rect.height;
    dragRef.current = { index, offsetX: event.clientX - centerX, offsetY: event.clientY - centerY };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelected(index);
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;
    const rect = stage.getBoundingClientRect();
    patch(drag.index, {
      left: clamp(((event.clientX - drag.offsetX - rect.left) / rect.width) * 100),
      top: clamp(((event.clientY - drag.offsetY - rect.top) / rect.height) * 100),
    });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.shiftKey ? 2 : 0.5;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    patch(index, { left: clamp(items[index].left + move[0]), top: clamp(items[index].top + move[1]) });
  }

  const output = `    visualItems: [\n${items.map(formatItem).join("\n")}\n    ],`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="devEditor">
      <div className="devToolbar">
        <label>
          Producto
          <select className="select" onChange={(event) => loadProduct(event.target.value)} value={slug}>
            {products.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
        <label>
          Canasta de fondo
          <select className="select" onChange={(event) => setBasketImage(event.target.value)} value={basketImage}>
            {basketTypes.map((type) => <option key={type.id} value={type.image}>{type.label}</option>)}
          </select>
        </label>
        <label>
          Vista
          <select className="select" onChange={(event) => setVariant(event.target.value as Variant)} value={variant}>
            <option value="detail">Detalle (×1.65)</option>
            <option value="card">Catálogo (×1)</option>
          </select>
        </label>
        <button className="btn btnGhost" onClick={() => loadProduct(slug)} type="button">Restablecer</button>
      </div>

      <div className="devLayout">
        <div className={variant === "card" ? "devStageWrap devStageCard" : "devStageWrap"}>
          <div className="devStage" ref={stageRef}>
            <ProductComposition baseImage={basketImage} product={draft} variant={variant} />
            <div className="devOverlay">
              {items.map((item, index) => (
                <button
                  aria-label={`Mover ${item.name}`}
                  className={index === selected ? "devHandle devHandleActive" : "devHandle"}
                  key={item.name}
                  onKeyDown={(event) => onKeyDown(event, index)}
                  onPointerDown={(event) => onPointerDown(event, index)}
                  onPointerMove={onPointerMove}
                  onPointerUp={() => { dragRef.current = null; }}
                  style={{
                    top: `${item.top}%`,
                    left: `${item.left}%`,
                    width: `${item.size * multiplier}px`,
                    height: `${item.size * multiplier}px`,
                    transform: `translate(-50%, -50%) rotate(${item.rotate ?? 0}deg)`,
                  }}
                  type="button"
                />
              ))}
            </div>
          </div>
        </div>

        <aside className="devPanel">
          <h3>Productos</h3>
          <div className="devList">
            {items.map((item, index) => (
              <button
                className={index === selected ? "devListItem devListItemActive" : "devListItem"}
                key={item.name}
                onClick={() => setSelected(index)}
                type="button"
              >
                <span>{item.emoji} {item.name}</span>
                <small>{round(item.left)} · {round(item.top)}</small>
              </button>
            ))}
          </div>

          {current && (
            <div className="devControls">
              <h3>{current.name}</h3>
              <label>
                Tamaño <strong>{current.size}px</strong>
                <input max="160" min="20" onChange={(event) => patch(selected, { size: Number(event.target.value) })} step="1" type="range" value={current.size} />
              </label>
              <label>
                Giro <strong>{current.rotate ?? 0}°</strong>
                <input max="45" min="-45" onChange={(event) => patch(selected, { rotate: Number(event.target.value) })} step="1" type="range" value={current.rotate ?? 0} />
              </label>
              <label>
                Capa (zIndex) <strong>{current.zIndex ?? 5}</strong>
                <input max="30" min="1" onChange={(event) => patch(selected, { zIndex: Number(event.target.value) })} step="1" type="range" value={current.zIndex ?? 5} />
              </label>
              <p className="devHint">Arrastra sobre la imagen, o usa las flechas con el recuadro enfocado. Shift acelera el paso.</p>
            </div>
          )}
        </aside>
      </div>

      <div className="devOutputWrap">
        <div className="devOutputHead">
          <h3>Pega esto en <code>lib/mock-data.ts</code>, en <code>{product.slug}</code></h3>
          <button className="btn btnDark" onClick={copy} type="button">{copied ? "Copiado ✓" : "Copiar"}</button>
        </div>
        <pre className="devOutput">{output}</pre>
      </div>
    </div>
  );
}
