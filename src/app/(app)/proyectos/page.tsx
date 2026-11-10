import type { Metadata } from "next";
import { EncabezadoPagina, Vacio } from "@/components/ui/varios";

export const metadata: Metadata = { title: "Proyectos" };

export default function Proyectos() {
  return (
    <>
      <EncabezadoPagina titulo="Proyectos" descripcion="Agrupados por área de vida." />
      <Vacio titulo="Todavía no hay proyectos">En la fase 2 vas a poder crearlos acá. En la fase 4, el Agente arma los primeros en la entrevista inicial.</Vacio>
    </>
  );
}
