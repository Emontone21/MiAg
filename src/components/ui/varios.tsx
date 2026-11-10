import type { ReactNode } from "react";

export function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-borde bg-panel p-4 sm:p-5 ${className}`}>
      {children}
    </section>
  );
}

type Tono = "neutro" | "acento" | "peligro" | "ok";
const tonos: Record<Tono, string> = {
  neutro: "bg-elevado text-texto-2",
  acento: "bg-acento-suave text-acento",
  peligro: "bg-peligro-suave text-peligro",
  ok: "bg-ok-suave text-ok",
};

export function Etiqueta({ children, tono = "neutro" }: { children: ReactNode; tono?: Tono }) {
  return (
    <span
      className={`inline-flex h-5 items-center rounded px-1.5 text-[11px] font-medium ${tonos[tono]}`}
    >
      {children}
    </span>
  );
}

/** Estado vacío: dice qué va a haber acá y, si aplica, qué hacer. */
export function Vacio({
  titulo,
  children,
  accion,
}: {
  titulo: string;
  children?: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-borde px-5 py-8">
      <p className="font-medium text-texto">{titulo}</p>
      {children ? <p className="max-w-prose text-sm text-texto-2">{children}</p> : null}
      {accion ? <div className="mt-2">{accion}</div> : null}
    </div>
  );
}

export function EncabezadoPagina({
  titulo,
  descripcion,
  acciones,
}: {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="titulo-pagina">{titulo}</h1>
        {descripcion ? <p className="mt-1 text-sm text-texto-2">{descripcion}</p> : null}
      </div>
      {acciones}
    </header>
  );
}
