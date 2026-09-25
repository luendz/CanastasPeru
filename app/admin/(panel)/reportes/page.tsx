import { requireAdmin } from "@/lib/admin/auth";
import { hoyLima, inicioMesLima } from "@/lib/admin/format";
import Reportes from "./Reportes";

export const metadata = { title: "Reportes Excel" };

export default async function ReportesPage() {
  await requireAdmin();
  return (
    <>
      <header className="admHead">
        <div>
          <h1>Reportes en Excel</h1>
          <p className="admMuted">Elige el período y descarga. Los totales del Excel usan fórmulas, así siguen cuadrando si editas el archivo.</p>
        </div>
      </header>
      <Reportes desdeInicial={inicioMesLima()} hastaInicial={hoyLima()} />
    </>
  );
}
