import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "@/lib/env";

let cliente: ReturnType<typeof createBrowserClient> | undefined;

/** Cliente de Supabase para el navegador. Usa la sesión del usuario; RLS hace el resto. */
export function supabaseBrowser() {
  cliente ??= createBrowserClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
  return cliente;
}
