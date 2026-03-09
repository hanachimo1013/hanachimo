-- Lock down employees data for direct client access.
-- After this, frontend must use backend /api/employees endpoints.

alter table if exists public.employees enable row level security;

do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'employees'
  loop
    execute format('drop policy if exists %I on public.employees', p.policyname);
  end loop;
end $$;

revoke all on table public.employees from anon, authenticated;

-- Optional: if you previously exposed storage bucket employee-photos to anon/authenticated,
-- drop the permissive policies you created earlier:
drop policy if exists "anon can read employee photos" on storage.objects;
drop policy if exists "anon can upload employee photos" on storage.objects;
drop policy if exists "anon can update employee photos" on storage.objects;
drop policy if exists "anon can delete employee photos" on storage.objects;
