# Decisiones

Lo que el pedido original no definía y cómo se resolvió. La regla fue elegir la opción más simple que cumple.

## Fase 0 — Verificaciones contra la documentación (noviembre de 2026)

| Tema | Resultado | Consecuencia |
|---|---|---|
| Modelos gratuitos de Gemini | La página de precios muestra gratis Gemini 3.6 Flash y Gemini 3.5 Flash-Lite. No se pudo confirmar que `gemini-3.5-flash` y `gemini-3.1-flash-lite` sigan gratis. | Los nombres de modelo van en variables de entorno (`GEMINI_MODEL_CHAT`, `GEMINI_MODEL_FONDO`). Se confirman en AI Studio antes de la fase 3. |
| Privacidad en Gemini gratis | El contenido se usa para mejorar productos de Google. | Aviso en Configuración (fase 3). |
| Groq gratis, `openai/gpt-oss-120b` | 30 pedidos/min, 1.000/día, 8.000 tokens/min, 200.000 tokens/día. | El contexto de un turno tiene que entrar en unos 3.000 tokens. |
| Azure Speech F0 | 5 h/mes de transcripción, 500.000 caracteres/mes de voz neuronal, 1 reconocimiento simultáneo, 20 síntesis por minuto. | El micrófono no se envía a Azure mientras habla el Agente (la interrupción se detecta en el navegador). La síntesis se agrupa para no pasar de 20 por minuto. |
| Voces `es-UY` | `es-UY-MateoNeural` y `es-UY-ValentinaNeural`. | Mateo por defecto; se cambia en Configuración. |
| Cron de Vercel (Hobby) | Una vez por día. | El minuto a minuto lo hace `pg_cron` de Supabase. |
| Supabase gratis | El proyecto se pausa tras una semana sin actividad. | Pendiente de confirmar en la fase 6 si el cron por minuto cuenta como actividad. |
| Push en iOS | Solo con la app instalada en la pantalla de inicio y permiso pedido desde un toque. | El onboarding guía la instalación. |

Estas verificaciones se hicieron con búsquedas (la red de la sesión de trabajo no permitía abrir las páginas oficiales completas). Se repiten antes de cada fase que dependa de ellas.

## Fase 1 — Base

- **Ingreso con enlace y con código.** El mismo correo trae el enlace mágico y un código numérico. En iPhone el enlace abre Safari y no la app instalada, y la sesión no se comparte entre ambos; el código se escribe dentro de la app y resuelve eso.
- **Sin Cache Components.** Next.js 16 lo activa en proyectos nuevos; se desactivó. La app es privada y muy interactiva: el panel lee los datos desde el navegador con la sesión del usuario, y no hay contenido público que convenga prerenderizar.
- **El panel habla directo con Supabase.** La barrera de seguridad es RLS en la base. El `proxy.ts` solo refresca la sesión y redirige a quien no la tiene; no es la protección principal.
- **Estados y categorías como texto con `check`**, no como tipos `enum` de Postgres: agregar un valor más adelante es una migración trivial.
- **Prioridad de 1 a 4** (1 = urgente, 4 = baja), por defecto 2.
- **Subtareas de un solo nivel**: una tarea con `parent_id`.
- **Archivar en lugar de borrar**: `tasks`, `areas` y `memories` tienen `archived_at`; los proyectos usan el estado `archivado`. El borrado definitivo es un `delete` real que solo se ofrece en el panel.
- **`status_changed_at` en tareas**, para que el Agente detecte lo que lleva mucho en curso sin moverse. Un disparador mantiene esa fecha, `completed_at` y `blocked_reason` coherentes con el estado, lo cambie el panel o el Agente.
- **El contador de voz es de solo lectura para el usuario**; lo actualiza el servidor con la clave de servicio.
- **El service worker no cachea páginas ni datos de la app**, solo una página de «sin conexión». La información personal no queda en caché del dispositivo.
- **Tipografía Geist servida desde el propio sitio** (paquete `geist`), sin pedidos a Google Fonts.
- **Un solo color de acento: ámbar `#f5a524`.** Rojo y verde se usan únicamente para estado (vencido, hecho).
- **Pruebas del esquema con PGlite**: las migraciones se aplican en un Postgres en memoria y se comprueba que RLS aísla a dos usuarios. El esquema `auth` de Supabase se simula con lo mínimo.
