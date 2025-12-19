import https from 'https';

const token = 'sbp_ec3a9f9383beb846826bf276a72b5a829eb387be';
const projectRef = 'awvlatfqdoeovsurepwy';

const schemaSQL = `
create table if not exists users (
  id text primary key,
  email text not null unique,
  password text,
  role text not null,
  type text not null,
  firstName text,
  lastName text,
  phone text,
  companyName text,
  siret text
);
create table if not exists spaces (
  id text primary key,
  name text not null,
  description text not null,
  category text not null,
  capacity integer not null,
  image text not null,
  pricing jsonb not null,
  minDuration text,
  maxDuration text,
  features jsonb not null,
  availableSlots jsonb,
  showInCalendar boolean,
  autoApprove boolean,
  brochureUrl text,
  brochureType text,
  brochureName text
);
create table if not exists reservations (
  id text primary key,
  spaceId text not null references spaces(id) on delete cascade,
  userId text not null references users(id) on delete cascade,
  date date not null,
  endDate date,
  slot text not null,
  status text not null,
  createdAt timestamptz not null,
  eventName text,
  eventDescription text,
  customTimeLabel text,
  isGlobalClosure boolean,
  isQuoteRequest boolean,
  recurringGroupId text,
  checkedInAt timestamptz
);
create table if not exists messages (
  id text primary key,
  name text not null,
  email text not null,
  subject text not null,
  content text not null,
  date timestamptz not null,
  read boolean not null,
  readAt timestamptz,
  senderRole text not null,
  attachment text,
  attachmentName text,
  pinned boolean,
  reactions jsonb,
  editedAt timestamptz,
  isDeleted boolean
);
create table if not exists notifications (
  id text primary key,
  userId text not null references users(id) on delete cascade,
  title text not null,
  message text not null,
  date timestamptz not null,
  read boolean not null,
  type text not null,
  link text
);
`;

const data = JSON.stringify({ query: schemaSQL });
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
  res.on('end', () => console.log(body));
});
req.on('error', e => console.error(e));
req.write(data);
req.end();