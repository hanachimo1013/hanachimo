-- Login user table for backend JWT authentication.
create table if not exists public.app_users (
  id bigint generated always as identity primary key,
  username text not null unique,
  password_hash text not null,
  role text not null check (role in ('superadmin', 'employee')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_on_app_users on public.app_users;
create trigger trg_set_updated_at_on_app_users
before update on public.app_users
for each row execute function public.set_updated_at();

-- Lock down direct access; backend uses the service role key.
revoke all on table public.app_users from anon, authenticated;

-- Example seed (replace password hash first):
-- insert into public.app_users (username, password_hash, role)
-- values ('admin', '$2b$10$replace_with_bcrypt_hash', 'superadmin');
