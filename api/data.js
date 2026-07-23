// Enerfust — dades al núvol (Supabase)
//
// El navegador MAI parla amb Supabase directament: passa per aquí, i és
// aquest servidor qui hi accedeix amb la clau de servei guardada a Vercel.
// Així les credencials no viatgen al navegador.
//
// Variables d'entorn necessàries a Vercel:
//   SUPABASE_URL               (p. ex. https://xxxx.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY  (Supabase → Settings → API → service_role)
//
// Protocol: POST { action:'get'|'set'|'del'|'list', key, value }

const TABLE = 'enerfust_kv';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Només POST'); }

  const URL_ = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const json = (status, obj) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj));
  };

  if (!URL_ || !KEY) {
    return json(500, { error: "Falten SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY al servidor" });
  }

  try {
    let body = req.body;
    if (!body || typeof body === 'string') {
      const raw = await new Promise(r => { let d=''; req.on('data',c=>d+=c); req.on('end',()=>r(d)); });
      body = raw ? JSON.parse(raw) : {};
    }
    const { action, key, value } = body;
    if (!action) return json(400, { error: "Falta 'action'" });
    if (action !== 'list' && !key) return json(400, { error: "Falta 'key'" });

    const base = `${URL_.replace(/\/$/,'')}/rest/v1/${TABLE}`;
    const headers = {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json'
    };

    if (action === 'get') {
      const r = await fetch(`${base}?key=eq.${encodeURIComponent(key)}&select=value`, { headers });
      if (!r.ok) return json(r.status, { error: 'Supabase: ' + (await r.text()).slice(0,300) });
      const rows = await r.json();
      if (!rows.length) return json(200, { found: false, value: null });
      return json(200, { found: true, value: rows[0].value });
    }

    if (action === 'set') {
      if (typeof value !== 'string') return json(400, { error: "'value' ha de ser text" });
      const r = await fetch(base, {
        method: 'POST',
        headers: Object.assign({}, headers, { 'Prefer': 'resolution=merge-duplicates,return=minimal' }),
        body: JSON.stringify([{ key, value, updated_at: new Date().toISOString() }])
      });
      if (!r.ok) return json(r.status, { error: 'Supabase: ' + (await r.text()).slice(0,300) });
      return json(200, { ok: true });
    }

    if (action === 'del') {
      const r = await fetch(`${base}?key=eq.${encodeURIComponent(key)}`, { method: 'DELETE', headers });
      if (!r.ok) return json(r.status, { error: 'Supabase: ' + (await r.text()).slice(0,300) });
      return json(200, { ok: true });
    }

    if (action === 'list') {
      const r = await fetch(`${base}?select=key,updated_at`, { headers });
      if (!r.ok) return json(r.status, { error: 'Supabase: ' + (await r.text()).slice(0,300) });
      return json(200, { keys: await r.json() });
    }

    return json(400, { error: "Acció desconeguda: " + action });
  } catch (e) {
    return json(502, { error: "Error al servidor: " + String((e && e.message) || e) });
  }
};
