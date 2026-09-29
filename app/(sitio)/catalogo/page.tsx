import { redirect } from "next/navigation";

/** El catálogo ahora vive en /canastas (con sus líneas) y /boxes. */
export default function CatalogoPage() {
  redirect("/canastas");
}
