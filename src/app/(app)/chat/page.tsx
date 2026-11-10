import type { Metadata } from "next";
import { EncabezadoPagina, Vacio } from "@/components/ui/varios";

export const metadata: Metadata = { title: "Agente" };

export default function Chat() {
  return (
    <>
      <EncabezadoPagina titulo="Agente" descripcion="El mismo Agente de las llamadas, por escrito." />
      <Vacio titulo="El chat llega en la fase 3">Vas a poder actualizar tareas y pedir ayuda escribiendo, y deshacer cada cambio que haga el Agente.</Vacio>
    </>
  );
}
