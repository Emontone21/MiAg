"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Boton } from "@/components/ui/boton";
import { Campo, Entrada } from "@/components/ui/campo";
import { supabaseBrowser } from "@/lib/supabase/client";

function mensajeDeError(codigo: string | undefined, status: number | undefined): string {
  if (status === 429 || codigo === "over_email_send_rate_limit") {
    return "Se pidieron demasiados correos. Esperá unos minutos y probá de nuevo.";
  }
  if (codigo === "otp_expired" || codigo === "invalid_credentials") {
    return "El código no es correcto o ya venció. Pedí uno nuevo.";
  }
  if (codigo === "email_address_invalid" || codigo === "validation_failed") {
    return "Revisá el correo: no parece una dirección válida.";
  }
  return "No se pudo completar. Revisá tu conexión y probá de nuevo.";
}

export function FormularioIngreso() {
  const router = useRouter();
  const params = useSearchParams();
  const [paso, setPaso] = useState<"correo" | "codigo">("correo");
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "enlace"
      ? "El enlace no sirvió o ya venció. Pedí uno nuevo."
      : null,
  );

  async function enviarCorreo(e: FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email: correo.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/confirmar` },
    });
    setCargando(false);
    if (error) return setError(mensajeDeError(error.code, error.status));
    setPaso("codigo");
  }

  async function verificarCodigo(e: FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.verifyOtp({
      email: correo.trim(),
      token: codigo.trim(),
      type: "email",
    });
    if (error) {
      setCargando(false);
      return setError(mensajeDeError(error.code, error.status));
    }
    router.replace("/hoy");
    router.refresh();
  }

  if (paso === "correo") {
    return (
      <form onSubmit={enviarCorreo} className="flex flex-col gap-4">
        <Campo etiqueta="Correo" htmlFor="correo" error={error}>
          <Entrada
            id="correo"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            required
            autoFocus
            placeholder="vos@ejemplo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
        </Campo>
        <Boton type="submit" variante="primario" disabled={cargando || correo.trim() === ""}>
          {cargando ? "Enviando…" : "Enviarme el acceso"}
        </Boton>
        <p className="text-[13px] text-texto-3">
          Sin contraseña: te llega un correo con un enlace y un código. Si es tu primera vez, se
          crea tu cuenta.
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={verificarCodigo} className="flex flex-col gap-4">
      <p className="text-sm text-texto-2">
        Te mandamos un correo a <span className="text-texto">{correo.trim()}</span>. Abrí el enlace
        en este mismo dispositivo o escribí acá el código.
      </p>
      <Campo
        etiqueta="Código del correo"
        htmlFor="codigo"
        error={error}
        ayuda="Si instalaste la app en el celular, usá el código: el enlace abre el navegador, no la app."
      >
        <Entrada
          id="codigo"
          name="codigo"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6,10}"
          maxLength={10}
          required
          autoFocus
          placeholder="123456"
          className="font-mono tracking-[0.3em]"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
        />
      </Campo>
      <Boton type="submit" variante="primario" disabled={cargando || codigo.length < 6}>
        {cargando ? "Verificando…" : "Entrar"}
      </Boton>
      <Boton
        variante="fantasma"
        onClick={() => {
          setPaso("correo");
          setCodigo("");
          setError(null);
        }}
      >
        Usar otro correo o reenviar
      </Boton>
    </form>
  );
}
