import type { Metadata } from "next";

export const metadata: Metadata = { title: "Falta configurar" };

/** Se muestra cuando el despliegue no tiene las variables de Supabase. */
export default function Configurar() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-3 px-5 py-10">
      <h1 className="titulo-pagina">Falta conectar la base de datos</h1>
      <p className="text-texto-2">
        Este despliegue no tiene las variables de entorno de Supabase. Cargá{" "}
        <code className="font-mono text-[13px] text-texto">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
        <code className="font-mono text-[13px] text-texto">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>{" "}
        y volvé a desplegar. Los pasos están en el archivo README del proyecto.
      </p>
    </main>
  );
}
