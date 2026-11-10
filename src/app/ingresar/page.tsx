import type { Metadata } from "next";
import { Suspense } from "react";
import { FormularioIngreso } from "./formulario";

export const metadata: Metadata = { title: "Ingresar" };

export default function Ingresar() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <div className="mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/iconos/icono.svg" alt="" width={44} height={44} className="mb-5" />
        <h1 className="titulo-pagina">MiAgente</h1>
        <p className="mt-1 text-texto-2">Tus proyectos, y un Agente que no te deja postergarlos.</p>
      </div>
      <Suspense>
        <FormularioIngreso />
      </Suspense>
    </main>
  );
}
