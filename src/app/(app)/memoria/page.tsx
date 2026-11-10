import type { Metadata } from "next";
import { EncabezadoPagina, Vacio } from "@/components/ui/varios";

export const metadata: Metadata = { title: "Lo que sé de vos" };

export default function Memoria() {
  return (
    <>
      <EncabezadoPagina titulo="Lo que sé de vos" descripcion="Todo lo que el Agente aprendió, editable." />
      <Vacio titulo="Todavía no sé nada de vos">Las memorias aparecen acá a partir de la fase 4, con la sesión de la que salió cada una.</Vacio>
    </>
  );
}
