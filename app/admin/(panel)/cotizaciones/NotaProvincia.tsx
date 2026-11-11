import { NOTA_PROVINCIA, esProvincia } from "@/lib/admin/delivery";

/** Al elegir «Provincia»: la observación que saldrá en el PDF de la cotización y en la orden. */
export default function NotaProvincia({ distrito }: { distrito: string | null | undefined }) {
  if (!esProvincia(distrito)) return null;
  return (
    <p className="admNotaProvincia" role="note">
      <strong>Se incluirá en la cotización y en la orden:</strong> {NOTA_PROVINCIA}
    </p>
  );
}
