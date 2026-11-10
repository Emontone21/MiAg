import type { Metadata } from "next";
import { EncabezadoPagina, Vacio } from "@/components/ui/varios";

export const metadata: Metadata = { title: "Hoy" };

export default function Hoy() {
  return (
    <>
      <EncabezadoPagina titulo="Hoy" descripcion="Lo que toca ahora, con lo vencido arriba." />
      <Vacio titulo="Todavía no hay tareas">Acá vas a ver lo de hoy y lo de esta semana, ordenado por prioridad y fecha límite. Llega en la fase 2.</Vacio>
    </>
  );
}
