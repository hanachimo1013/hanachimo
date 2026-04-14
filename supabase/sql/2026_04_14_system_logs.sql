-- System Logs table
-- Records all system changes: employee CRUD, value changes, etc.

create table if not exists public.system_logs (
  id serial primary key,
  action varchar(50) not null,           -- CREATE, UPDATE, DELETE, VALUE_CHANGE
  entity_type varchar(50) not null,      -- employee, system
  entity_name varchar(255),              -- employee name or system entity
  details jsonb default '{}',            -- change details (old/new values, etc.)
  performed_by varchar(255),             -- username who performed the action
  created_at timestamp without time zone default now()
);

create index if not exists system_logs_created_idx
  on public.system_logs (created_at desc);

create index if not exists system_logs_entity_idx
  on public.system_logs (entity_type, entity_name);

-- Allow service_role full access (no RLS needed for server-side only access)
