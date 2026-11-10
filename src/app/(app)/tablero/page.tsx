import type { Metadata } from "next";
import { EncabezadoPagina, Vacio } from "@/components/ui/varios";

export const metadata: Metadata = { title: "Tablero" };

export default function Tablero() {
  return (
    <>
      <EncabezadoPagina titulo="Tablero" descripcion="Pendiente, en curso, bloqueada y hecha." />
      <Vacio titulo="El tablero llega en la fase 2">Vas a poder arrastrar las tareas entre columnas y filtrar por área y por proyecto.</Vacio>
    </>
  );
}
