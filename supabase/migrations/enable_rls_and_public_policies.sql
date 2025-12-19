-- Activer RLS sur toutes les tables utilisées
alter table public.users enable row level security;
alter table public.spaces enable row level security;
alter table public.reservations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- Politique lecture publique
drop policy if exists "public read users" on public.users;
drop policy if exists "public read spaces" on public.spaces;
drop policy if exists "public read reservations" on public.reservations;
drop policy if exists "public read messages" on public.messages;
drop policy if exists "public read notifications" on public.notifications;
create policy "public read users" on public.users for select using (true);
create policy "public read spaces" on public.spaces for select using (true);
create policy "public read reservations" on public.reservations for select using (true);
create policy "public read messages" on public.messages for select using (true);
create policy "public read notifications" on public.notifications for select using (true);

-- Politiques écriture publiques (alignées avec le code actuel côté client)
-- users: insertion (enregistrement), mise à jour (profil)
drop policy if exists "public insert users" on public.users;
drop policy if exists "public update users" on public.users;
create policy "public insert users" on public.users for insert with check (true);
create policy "public update users" on public.users for update using (true) with check (true);

-- spaces: mise à jour (utilisé depuis admin via service role; public ici pour compatibilité)
drop policy if exists "public update spaces" on public.spaces;
create policy "public update spaces" on public.spaces for update using (true) with check (true);

-- reservations: insert/update/delete via client
drop policy if exists "public insert reservations" on public.reservations;
drop policy if exists "public update reservations" on public.reservations;
drop policy if exists "public delete reservations" on public.reservations;
create policy "public insert reservations" on public.reservations for insert with check (true);
create policy "public update reservations" on public.reservations for update using (true) with check (true);
create policy "public delete reservations" on public.reservations for delete using (true);

-- messages: insert/update/delete via client
drop policy if exists "public insert messages" on public.messages;
drop policy if exists "public update messages" on public.messages;
drop policy if exists "public delete messages" on public.messages;
create policy "public insert messages" on public.messages for insert with check (true);
create policy "public update messages" on public.messages for update using (true) with check (true);
create policy "public delete messages" on public.messages for delete using (true);

-- notifications: insert/update/delete via client
drop policy if exists "public insert notifications" on public.notifications;
drop policy if exists "public update notifications" on public.notifications;
drop policy if exists "public delete notifications" on public.notifications;
create policy "public insert notifications" on public.notifications for insert with check (true);
create policy "public update notifications" on public.notifications for update using (true) with check (true);
create policy "public delete notifications" on public.notifications for delete using (true);

-- Grants basiques pour rôles anon/authenticated
grant select on public.users to anon;
grant insert, update on public.users to anon;
grant select on public.spaces to anon;
grant update on public.spaces to anon;
grant select, insert, update, delete on public.reservations to anon;
grant select, insert, update, delete on public.messages to anon;
grant select, insert, update, delete on public.notifications to anon;
