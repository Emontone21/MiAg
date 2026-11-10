import type { Metadata } from "next";
import { EncabezadoPagina } from "@/components/ui/varios";
import { Cuenta } from "./cuenta";

export const metadata: Metadata = { title: "Configuración" };

export default function Configuracion() {
  return (
    <>
      <EncabezadoPagina titulo="Configuración" descripcion="Tu perfil y tu cuenta." />
      <Cuenta />
    </>
  );
}
