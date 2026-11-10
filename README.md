# MiAgente

Project manager para la vida personal: un panel donde documentás proyectos y tareas, y un Agente que te llama, conoce tus proyectos y te hace avanzar.

Estado: **fase 1 de 7** (base: autenticación, esquema con RLS, estructura de PWA y sistema de diseño). Las decisiones de diseño están en [DECISIONES.md](DECISIONES.md).

## Puesta en marcha

### 1. Supabase

1. Creá un proyecto gratuito en supabase.com.
2. En **SQL Editor**, pegá y ejecutá el contenido de `supabase/migrations/0001_esquema_inicial.sql`.
3. En **Authentication → URL Configuration**:
   - *Site URL*: la dirección de la app (por ejemplo `https://miagente.vercel.app`).
   - *Redirect URLs*: agregá `https://TU-DOMINIO/auth/confirmar` y `http://localhost:3000/auth/confirmar`.
4. **Correo con código (requiere SMTP propio).** En el plan gratuito, Supabase no deja cambiar la plantilla del correo mientras se use su servicio de envío integrado: el correo trae solo el enlace. Para que también traiga el código (necesario para entrar desde la app instalada en iPhone), configurá un SMTP gratuito en **Authentication → Emails → SMTP Settings** y después usá este cuerpo en las plantillas **Magic Link** y **Confirm signup**:

   ```html
   <h2>Tu acceso a MiAgente</h2>
   <p>Tu código es: <strong>{{ .Token }}</strong></p>
   <p>O entrá con este enlace:
     <a href="{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=email">Ingresar</a>
   </p>
   ```

5. En **Project Settings → API** copiá la URL del proyecto, la clave pública y la clave de servicio.

El envío integrado de Supabase permite 2 correos por hora. Con SMTP propio ese límite deja de aplicar.

### 2. Variables de entorno

Copiá `.env.example` a `.env.local` y completá las tres de Supabase. Las demás se piden en fases posteriores. Ninguna clave va en el código; al navegador solo llegan las que empiezan con `NEXT_PUBLIC_`.

### 3. Correr en tu computadora

```bash
npm install
```

```bash
npm run dev
```

### 4. Desplegar en Vercel

Importá el repositorio en Vercel (plan Hobby), cargá las mismas variables en **Settings → Environment Variables** y desplegá.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm test` | Pruebas (esquema y RLS en un Postgres en memoria) |
| `npm run lint` | Linter |
| `npm run typecheck` | Chequeo de tipos |

## Estructura

```
src/app/(app)/        Pantallas con sesión (hoy, tablero, calendario, proyectos, chat, memoria, configuración)
src/app/ingresar/     Ingreso por correo (enlace o código)
src/app/auth/         Destino del enlace mágico
src/components/ui/    Sistema de diseño (botón, campo, tarjeta, etiqueta, estado vacío)
src/lib/supabase/     Clientes de Supabase para navegador y servidor
src/proxy.ts          Refresco de sesión y redirección a /ingresar
public/sw.js          Service worker (sin conexión y push)
supabase/migrations/  Esquema de la base con RLS
tests/                Pruebas
```
