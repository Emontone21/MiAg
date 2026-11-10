"use client";

import { useEffect } from "react";

/** Registra el service worker (necesario para instalar la app y para el push). */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // Sin service worker la app funciona igual; solo no hay push ni modo sin conexión.
    });
  }, []);
  return null;
}
