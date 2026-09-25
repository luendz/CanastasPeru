import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Solo el panel usa sesión; la tienda pública no pasa por aquí.
export const config = {
  matcher: ["/admin/:path*"],
};
