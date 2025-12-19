import 'dotenv/config';
import http from 'http';
import path from 'path';
import url from 'url';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const __dirnameResolved = path.dirname(url.fileURLToPath(import.meta.url));
const distDir = path.join(__dirnameResolved, 'dist');
const port = process.env.PORT || 8080;
const adminToken = process.env.ADMIN_TOKEN || '';
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Service Key:', supabaseServiceKey);
const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-token',
  'Access-Control-Allow-Methods': 'GET, PUT, PATCH, POST, DELETE, OPTIONS'
};

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { ...headers, ...corsHeaders });
  res.end(body);
};

const serveStatic = (req, res) => {
  const parsed = url.parse(req.url);
  const pathname = parsed.pathname || '/';
  let filePath = path.join(distDir, pathname);

  if (pathname === '/' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, 'Not Found');
    const ext = path.extname(filePath);
    const type = mime[ext] || 'application/octet-stream';
    send(res, 200, data, { 'Content-Type': type });
  });
};

const log = (level, scope, msg, extra) => {
  const time = new Date().toISOString();
  const base = `[${time}] [${scope}] ${msg}`;
  const line = extra !== undefined ? `${base} ${typeof extra === 'string' ? extra : JSON.stringify(extra)}` : base;
  (console[level] || console.log)(line);
};

const validateSpace = (s) => {
  if (!s || typeof s !== 'object') return false;
  if (!s.id || typeof s.id !== 'string') return false;
  if (s.name !== undefined && typeof s.name !== 'string') return false;
  if (s.description !== undefined && typeof s.description !== 'string') return false;
  if (s.category !== undefined && typeof s.category !== 'string') return false;
  if (s.capacity !== undefined && typeof s.capacity !== 'number') return false;
  if (s.image !== undefined && typeof s.image !== 'string') return false;
  return true;
};

const isDateString = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isIsoDateTime = (v) => typeof v === 'string' && /T/.test(v);
const validateReservationPatch = (r) => {
  if (!r || typeof r !== 'object') return false;
  if (r.status !== undefined && typeof r.status !== 'string') return false;
  if (r.date !== undefined && !(isDateString(r.date) || isIsoDateTime(r.date))) return false;
  if (r.enddate !== undefined && !(isDateString(r.enddate) || isIsoDateTime(r.enddate))) return false;
  if (r.checkedinat !== undefined && !isIsoDateTime(r.checkedinat)) return false;
  return true;
};

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname || '/';
  if (req.method === 'OPTIONS') {
    return send(res, 204, '');
  }

  if (pathname.startsWith('/api/')) {
    const token = req.headers['x-admin-token'];

    if (pathname === '/api/public/spaces' && req.method === 'GET') {
      if (!supabase) {
        return send(res, 500, JSON.stringify({ error: 'supabase_not_configured' }), { 'Content-Type': 'application/json' });
      }
      supabase
        .from('spaces')
        .select('*')
        .then(({ data, error }) => {
          if (error) return send(res, 500, JSON.stringify({ error: 'internal_error' }), { 'Content-Type': 'application/json' });
          return send(res, 200, JSON.stringify(data || []), { 'Content-Type': 'application/json' });
        });
      return;
    }

    if (pathname === '/api/admin/stats' && req.method === 'GET') {
      if (!adminToken || token !== adminToken) return send(res, 403, JSON.stringify({ error: 'forbidden' }), { 'Content-Type': 'application/json' });
      if (!supabase) {
        return send(res, 500, JSON.stringify({ error: 'supabase_not_configured' }), { 'Content-Type': 'application/json' });
      }
      Promise.all([
        supabase.from('reservations').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('spaces').select('*', { count: 'exact', head: true })
      ]).then((results) => {
        const payload = {
          reservationsCount: results[0].count || 0,
          messagesCount: results[1].count || 0,
          usersCount: results[2].count || 0,
          spacesCount: results[3].count || 0
        };
        return send(res, 200, JSON.stringify(payload), { 'Content-Type': 'application/json' });
      }).catch(() => {
        return send(res, 500, JSON.stringify({ error: 'internal_error' }), { 'Content-Type': 'application/json' });
      });
      return;
    }

    if (pathname === '/api/admin/spaces' && req.method === 'GET') {
      if (!adminToken || token !== adminToken) return send(res, 403, JSON.stringify({ error: 'forbidden' }), { 'Content-Type': 'application/json' });
      if (!supabase) {
        return send(res, 500, JSON.stringify({ error: 'supabase_not_configured' }), { 'Content-Type': 'application/json' });
      }
      supabase.from('spaces').select('*').then(({ data, error }) => {
        if (error) return send(res, 500, JSON.stringify({ error: 'internal_error' }), { 'Content-Type': 'application/json' });
        return send(res, 200, JSON.stringify(data || []), { 'Content-Type': 'application/json' });
      });
      return;
    }

    if (pathname.startsWith('/api/admin/spaces/') && (req.method === 'PUT' || req.method === 'PATCH')) {
      if (!adminToken || token !== adminToken) return send(res, 403, JSON.stringify({ error: 'forbidden' }), { 'Content-Type': 'application/json' });
      if (!supabase) {
        return send(res, 500, JSON.stringify({ error: 'supabase_not_configured' }), { 'Content-Type': 'application/json' });
      }
      const id = pathname.split('/').pop();
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        let patch = {};
        try { patch = body ? JSON.parse(body) : {}; } catch { return send(res, 400, JSON.stringify({ error: 'bad_request' }), { 'Content-Type': 'application/json' }); }
        if (!patch.id) patch.id = id;
        if (!validateSpace(patch)) {
          log('warn', 'api.admin.spaces.update', 'validation_failed', patch);
          return send(res, 400, JSON.stringify({ error: 'invalid_payload' }), { 'Content-Type': 'application/json' }); }
        supabase.from('spaces').update(patch).eq('id', id).then(({ error }) => {
          if (error) {
            log('error', 'api.admin.spaces.update', 'supabase_error', error);
            return send(res, 500, JSON.stringify({ error: 'internal_error' }), { 'Content-Type': 'application/json' });
          }
          return send(res, 200, JSON.stringify({ ok: true }), { 'Content-Type': 'application/json' });
        });
      });
      return;
    }

    if (pathname.startsWith('/api/admin/reservations/') && req.method === 'PATCH') {
      if (!adminToken || token !== adminToken) return send(res, 403, JSON.stringify({ error: 'forbidden' }), { 'Content-Type': 'application/json' });
      if (!supabase) {
        return send(res, 500, JSON.stringify({ error: 'supabase_not_configured' }), { 'Content-Type': 'application/json' });
      }
      const parts = pathname.split('/');
      const id = parts[parts.length - 1];
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        let patch = {};
        try { patch = body ? JSON.parse(body) : {}; } catch { return send(res, 400, JSON.stringify({ error: 'bad_request' }), { 'Content-Type': 'application/json' }); }
        if (!validateReservationPatch(patch)) {
          log('warn', 'api.admin.reservations.update', 'validation_failed', patch);
          return send(res, 400, JSON.stringify({ error: 'invalid_payload' }), { 'Content-Type': 'application/json' });
        }
        supabase.from('reservations').update(patch).eq('id', id).then(({ error }) => {
          if (error) {
            log('error', 'api.admin.reservations.update', 'supabase_error', error);
            return send(res, 500, JSON.stringify({ error: 'internal_error' }), { 'Content-Type': 'application/json' });
          }
          return send(res, 200, JSON.stringify({ ok: true }), { 'Content-Type': 'application/json' });
        });
      });
      return;
    }

    return send(res, 404, JSON.stringify({ error: 'not_found' }), { 'Content-Type': 'application/json' });
  }

  serveStatic(req, res);
});

server.listen(port, () => {
  console.log(`Server listening on :${port}`);
});
