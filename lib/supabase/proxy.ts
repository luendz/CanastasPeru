import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigurado } from "./config";

/**
 * Refresca la sesión de Supabase en cada request del panel y hace una
 * comprobación optimista: sin sesión, /admin redirige al login. La
 * verificación real (que sea administrador) se hace en cada página y acción.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!supabaseConfigurado) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // No poner código entre createServerClient y getClaims (ver guía de Supabase).
  const { data } = await supabase.auth.getClaims();

  const path = request.nextUrl.pathname;
  const esLogin = path === "/admin/login";
  if (!data?.claims && !esLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
