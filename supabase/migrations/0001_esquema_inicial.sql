-- MiAgente: esquema inicial.
-- Todas las tablas tienen user_id y RLS: cada usuario solo ve y toca lo suyo.

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Perfil
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text,
  timezone text not null default 'America/Montevideo',
  -- Configuración del Agente: orden de proveedores, voz, margen de espera,
  -- máximo de reprogramaciones. Los valores por defecto viven en el código.
  agent_config jsonb not null default '{}'::jsonb,
  onboarding_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Crea el perfil cuando se registra un usuario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Áreas > Proyectos > Tareas > Subtareas
-- ---------------------------------------------------------------------------

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#8b8b94',
  icon text,
  sort_order double precision not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  area_id uuid references public.areas (id) on delete set null,
  name text not null,
  goal text,
  description text,
  status text not null default 'activo'
    check (status in ('activo', 'pausado', 'completado', 'archivado')),
  priority smallint not null default 2 check (priority between 1 and 4), -- 1 = urgente, 4 = baja
  due_date date,
  sort_order double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  parent_id uuid references public.tasks (id) on delete cascade, -- subtarea (un solo nivel)
  title text not null,
  description text,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'en_curso', 'bloqueada', 'hecha')),
  priority smallint not null default 2 check (priority between 1 and 4),
  due_date date,
  due_set_by text check (due_set_by in ('usuario', 'agente')),
  effort_minutes integer check (effort_minutes is null or effort_minutes > 0),
  blocked_reason text,
  sort_order double precision not null default 0,
  completed_at timestamptz,
  status_changed_at timestamptz not null default now(),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Mantiene completed_at y status_changed_at coherentes con el estado,
-- lo cambie quien lo cambie (panel o Agente).
create or replace function public.tasks_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'hecha' and new.completed_at is null then
      new.completed_at = now();
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    new.status_changed_at = now();
    if new.status = 'hecha' then
      new.completed_at = coalesce(new.completed_at, now());
    else
      new.completed_at = null;
    end if;
    if new.status <> 'bloqueada' then
      new.blocked_reason = null;
    end if;
  end if;
  return new;
end;
$$;

create trigger tasks_before_write
  before insert or update on public.tasks
  for each row execute function public.tasks_before_write();

-- ---------------------------------------------------------------------------
-- Sesiones y mensajes
-- ---------------------------------------------------------------------------

create table public.call_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  weekdays smallint[] not null default '{}', -- 0 = domingo ... 6 = sábado
  local_time time not null,                  -- en la zona horaria del perfil
  target_minutes integer not null default 10 check (target_minutes between 1 and 120),
  focus text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[])
);

create table public.availability_windows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('onboarding', 'llamada_programada', 'chat')),
  channel text not null check (channel in ('voz', 'texto')),
  status text not null default 'en_curso'
    check (status in ('programada', 'notificada', 'en_curso', 'completada', 'reprogramada', 'perdida')),
  routine_id uuid references public.call_routines (id) on delete set null,
  rescheduled_from uuid references public.sessions (id) on delete set null,
  scheduled_at timestamptz,
  notified_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  summary text,
  commitments jsonb not null default '[]'::jsonb,
  reschedule_count integer not null default 0,
  providers_used text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  role text not null check (role in ('usuario', 'agente', 'herramienta', 'sistema')),
  content text,
  tool_calls jsonb,   -- herramientas que pidió el Agente en este mensaje
  tool_result jsonb,  -- resultado, cuando role = 'herramienta'
  provider text,
  model text,
  tokens_in integer,
  tokens_out integer,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Bitácora, memorias y registro de cambios
-- ---------------------------------------------------------------------------

create table public.project_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null default 'nota'
    check (kind in ('nota', 'avance', 'decision', 'resumen_llamada')),
  author text not null default 'usuario' check (author in ('usuario', 'agente')),
  session_id uuid references public.sessions (id) on delete set null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null
    check (category in ('rutina', 'preferencia', 'objetivo', 'obstaculo_recurrente',
                        'solucion_que_funciono', 'contexto_personal')),
  content text not null,
  source_session_id uuid references public.sessions (id) on delete set null,
  edited_by_user boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.change_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete set null,
  message_id uuid references public.messages (id) on delete set null,
  table_name text not null,
  row_id uuid not null,
  operation text not null check (operation in ('crear', 'actualizar', 'archivar')),
  summary text not null,       -- frase legible: "Tarea X: fecha límite → jueves 14"
  old_values jsonb,            -- null cuando la operación es 'crear'
  new_values jsonb,
  undone_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Push y uso de voz
-- ---------------------------------------------------------------------------

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  device_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.voice_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  month date not null, -- primer día del mes
  stt_seconds integer not null default 0,
  tts_chars integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, month)
);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------

create index areas_user_idx on public.areas (user_id, sort_order);
create index projects_user_idx on public.projects (user_id, status);
create index projects_area_idx on public.projects (area_id);
create index tasks_user_status_idx on public.tasks (user_id, status) where archived_at is null;
create index tasks_project_idx on public.tasks (project_id, sort_order);
create index tasks_parent_idx on public.tasks (parent_id);
create index tasks_due_idx on public.tasks (user_id, due_date) where archived_at is null and status <> 'hecha';
create index sessions_user_idx on public.sessions (user_id, created_at desc);
create index sessions_due_idx on public.sessions (scheduled_at) where status in ('programada', 'notificada');
create index messages_session_idx on public.messages (session_id, created_at);
create index project_log_project_idx on public.project_log (project_id, created_at);
create index memories_user_idx on public.memories (user_id, category) where archived_at is null;
create index change_log_session_idx on public.change_log (session_id, created_at);
create index change_log_user_idx on public.change_log (user_id, created_at desc);
create index call_routines_user_idx on public.call_routines (user_id);
create index availability_user_idx on public.availability_windows (user_id, weekday);
create index push_user_idx on public.push_subscriptions (user_id);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'areas', 'projects', 'tasks', 'call_routines', 'availability_windows',
    'sessions', 'project_log', 'memories', 'push_subscriptions', 'voice_usage'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Seguridad por filas
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'areas', 'projects', 'tasks', 'call_routines', 'availability_windows',
    'sessions', 'messages', 'project_log', 'memories', 'change_log',
    'push_subscriptions', 'voice_usage'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;

  -- Tablas que el usuario lee y escribe completas desde el panel.
  foreach t in array array[
    'areas', 'projects', 'tasks', 'call_routines', 'availability_windows',
    'sessions', 'messages', 'project_log', 'memories', 'push_subscriptions'
  ] loop
    execute format(
      'create policy "propio: todo" on public.%I for all to authenticated
         using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id)', t);
  end loop;
end;
$$;

-- Perfil: se crea solo con el registro; el usuario lo lee y lo edita.
create policy "propio: leer" on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "propio: editar" on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Registro de cambios: lo escribe el servidor en nombre del usuario; el usuario
-- lo lee, marca un cambio como deshecho y puede borrarlo.
create policy "propio: leer" on public.change_log for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "propio: crear" on public.change_log for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "propio: editar" on public.change_log for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "propio: borrar" on public.change_log for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Uso de voz: solo lectura para el usuario. Lo actualiza el servidor con la
-- clave de servicio, así nadie puede bajarse el contador desde el navegador.
create policy "propio: leer" on public.voice_usage for select to authenticated
  using ((select auth.uid()) = user_id);
