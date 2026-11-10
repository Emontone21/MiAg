import type { Metadata } from "next";
import { EncabezadoPagina, Vacio } from "@/components/ui/varios";

export const metadata: Metadata = { title: "Calendario" };

export default function Calendario() {
  return (
    <>
      <EncabezadoPagina titulo="Calendario" descripcion="Tareas, fechas límite y llamadas." />
      <Vacio titulo="El calendario llega en la fase 2">Acá van a convivir las fechas de tus tareas y proyectos con las llamadas programadas.</Vacio>
    </>
  );
}
