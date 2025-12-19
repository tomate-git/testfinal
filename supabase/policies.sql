alter table users enable row level security;
alter table spaces enable row level security;
alter table reservations enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;

create policy "public read spaces" on spaces for select using (true);
create policy "public update spaces" on spaces for update using (true);

create policy "public read users" on users for select using (true);
create policy "public upsert users" on users for insert with check (true);
create policy "public update users" on users for update using (true);
create policy "public delete users" on users for delete using (true);

create policy "public read reservations" on reservations for select using (true);
create policy "public insert reservations" on reservations for insert with check (true);
create policy "public update reservations" on reservations for update using (true);
create policy "public delete reservations" on reservations for delete using (true);

create policy "public read messages" on messages for select using (true);
create policy "public insert messages" on messages for insert with check (true);
create policy "public update messages" on messages for update using (true);
create policy "public delete messages" on messages for delete using (true);

create policy "public read notifications" on notifications for select using (true);
create policy "public insert notifications" on notifications for insert with check (true);
create policy "public update notifications" on notifications for update using (true);
create policy "public delete notifications" on notifications for delete using (true);
