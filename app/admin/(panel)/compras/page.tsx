import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { fechaCorta, hoyLima, numero, soles } from "@/lib/admin/format";
import { labelDocumento, labelTipoCosto, TIPOS_COSTO, type Compra } from "@/lib/admin/types";

export const metadata = { title: "Costos totales" };

type Search = { mes?: string; tipo?: string; q?: string; registrado?: string; editado?: string };

const entero = (n: number) => numero(n, 2).replace(/[.,]00$/, "");

export default async function CostosTotalesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { supabase } = await requireAdmin();
  const hoy = hoyLima();
  const { mes = hoy.slice(0, 7), tipo = "", q = "", registrado, editado } = await searchParams;
  const [anio, m] = mes.split("-").map(Number);
  const desde = `${mes}-01`;
  const hasta = new Date(Date.UTC(anio, m, 1)).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("compras")
    .select("*")
    .gte("fecha", desde)
    .lt("fecha", hasta)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });
  const delMes = (data ?? []) as Compra[];
  const texto = q.trim().toLowerCase();
  const lista = delMes.filter(
    (c) => (!tipo || c.categoria === tipo) && (!texto || [c.descripcion, c.proveedor, c.comprobante].some((v) => v?.toLowerCase().includes(texto))),
  );

  const totalDe = (t: string) => delMes.filter((c) => c.categoria === t).reduce((s, c) => s + Number(c.total), 0);
  const totalMes = delMes.reduce((s, c) => s + Number(c.total), 0);
  const enlace = (nuevoTipo: string) => {
    const p = new URLSearchParams({ mes });
    if (nuevoTipo) p.set("tipo", nuevoTipo);
    if (q) p.set("q", q);
    return `/admin/compras?${p}`;
  };

  return (
    <>
      <header className="admHead">
        <div>
          <h1>Costos totales</h1>
          <p className="admMuted">Todas las compras y gastos del negocio, en 5 tipos. Las compras de productos suman inventario y actualizan su costo.</p>
        </div>
        <Link className="admBtn admBtnPrimary" href="/admin/compras/registrar">+ Registrar</Link>
      </header>

      {registrado && <p className="admSuccess" role="status">Se registraron {registrado} {registrado === "1" ? "ítem" : "ítems"}.</p>}
      {editado && <p className="admSuccess" role="status">Registro actualizado.</p>}
      {error && <p className="admError">No se pudieron cargar los costos: {error.message}</p>}

      <section className="admCostosResumen">
        <Link href={enlace("")} className="admCostoTotal" aria-current={!tipo ? "page" : undefined}>
          <span>Costos totales del mes</span>
          <strong>{soles(totalMes)}</strong>
          <small>{delMes.length} registros</small>
        </Link>
        {TIPOS_COSTO.map((t) => (
          <Link key={t.id} href={enlace(t.id)} className="admCostoTipo" data-tipo={t.id} aria-current={tipo === t.id ? "page" : undefined} title={t.ayuda}>
            <span>{t.label}</span>
            <strong>{soles(totalDe(t.id))}</strong>
          </Link>
        ))}
      </section>

      <form className="admFilters" method="get">
        <label className="admInlineLabel">Mes<input className="admInput" type="month" name="mes" defaultValue={mes} /></label>
        {tipo && <input type="hidden" name="tipo" value={tipo} />}
        <input className="admInput" name="q" defaultValue={q} placeholder="Buscar por descripción, proveedor o comprobante" />
        <button className="admBtn" type="submit">Ver</button>
        {(tipo || q) && <Link className="admLinkMuted" href={`/admin/compras?mes=${mes}`}>Limpiar</Link>}
      </form>

      <div className="admCard admCardFlush">
        {lista.length === 0 ? (
          <p className="admEmpty">No hay registros {tipo ? `de ${labelTipoCosto(tipo).toLowerCase()} ` : ""}en este mes.</p>
        ) : (
          <table className="admTable admTablaCostos">
            <thead>
              <tr><th>Editar</th><th>Fecha</th><th>Comprobante</th><th>Proveedor</th><th>Descripción</th><th className="num">Cantidad</th><th className="num">C. unit.</th><th className="num">Total</th><th>Tipo</th></tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id}>
                  <td><Link className="admIconBtn" href={`/admin/compras/${c.id}`}>Editar</Link></td>
                  <td>{fechaCorta(c.fecha)}</td>
                  <td>{labelDocumento(c.tipo_documento)}<small className="admMuted admBlock">{c.comprobante ?? ""}</small></td>
                  <td>{c.proveedor ?? "—"}</td>
                  <td className="admCeldaLarga">
                    {c.descripcion}
                    {Number(c.unidades_por_presentacion) > 1 && (
                      <small className="admMuted admBlock">{entero(c.cantidad_presentaciones)} {c.presentacion.toLowerCase()} × {entero(c.unidades_por_presentacion)} unid.</small>
                    )}
                  </td>
                  <td className="num">{entero(c.cantidad)}</td>
                  <td className="num">{soles(c.costo_unitario)}</td>
                  <td className="num"><strong>{soles(c.total)}</strong></td>
                  <td><span className="admBadge" data-tipo={c.categoria}>{labelTipoCosto(c.categoria)}</span></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="admTotalRow"><td colSpan={7}>Total {tipo ? labelTipoCosto(tipo).toLowerCase() : "del mes"}</td><td className="num">{soles(lista.reduce((s, c) => s + Number(c.total), 0))}</td><td /></tr>
            </tfoot>
          </table>
        )}
      </div>
    </>
  );
}
