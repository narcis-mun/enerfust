// Backend d'Enerfust — llegeix albarans/factures cridant l'API d'Anthropic
// amb la clau GUARDADA AL SERVIDOR (mai al navegador).
//
// Funciona tal qual a Vercel i Netlify (funcions Node). La clau es
// configura com a variable d'entorn ANTHROPIC_API_KEY al tauler del host.
//
// El frontend envia { system, contentBlocks } i aquí ho reenviem a Anthropic.
// Tornem la resposta d'Anthropic sense tocar-la, perquè el frontend ja
// sap interpretar-la (data.content[].text).

module.exports = async (req, res) => {
  // CORS bàsic (per si el frontend viu en un altre domini)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Només POST'); }

  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: { message: "Falta configurar ANTHROPIC_API_KEY al servidor" } }));
  }

  try {
    // Llegir el cos (Vercel ja el parseja; Netlify/altres, per si de cas)
    let body = req.body;
    if (!body || typeof body === 'string') {
      const raw = await new Promise((resolve) => {
        let d = ''; req.on('data', c => d += c); req.on('end', () => resolve(d));
      });
      body = raw ? JSON.parse(raw) : {};
    }
    const { system, contentBlocks } = body;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: system || "",
        messages: [{ role: "user", content: contentBlocks || [] }]
      })
    });

    const data = await r.json();
    res.statusCode = r.status;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(data));
  } catch (e) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: { message: "Error al servidor d'Enerfust: " + String(e && e.message || e) } }));
  }
};
