import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.ADMIN_TOKEN || '';
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const projectRef = (supabaseUrl.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i) || [])[1] || '';

const policiesSQL = `
alter table users enable row level security;
alter table spaces enable row level security;
alter table reservations enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;

create policy "public read spaces" on spaces for select using (true);


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
`;

const runQuery = (query) => new Promise((resolve) => {
  const data = JSON.stringify({ query });
  const options = {
    hostname: 'api.supabase.com',
    port: 443,
    path: `/v1/projects/${projectRef}/database/query`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  const req = https.request(options, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        if (parsed && parsed.message && String(parsed.message).includes('already exists')) {
          console.log(`Skipped: ${query.split('\n')[0]} (already exists)`);
          return resolve();
        }
        console.log(body);
      } catch {
        console.log(body);
      }
      resolve();
    });
  });
  req.on('error', e => { console.error(e); resolve(); });
  req.write(data);
  req.end();
});

const main = async () => {
  if (!token || !projectRef) {
    console.error('ADMIN_TOKEN ou VITE_SUPABASE_URL manquant');
    return;
  }
  const statements = policiesSQL.split('\n').filter(s => s.trim().length).join('\n').split(';').map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    await runQuery(stmt);
  }
  console.log('Policies applied');
};

main();
