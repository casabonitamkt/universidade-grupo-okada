'use strict';
// Recepção unilateral Zappy -> CRM piloto. Nunca envia WhatsApp nem altera esquema/RLS.
// ATIVAÇÃO: somente preview, flag explícita e segredos reais configurados no servidor.
const { createHmac, timingSafeEqual } = require('node:crypto');

const MAX_BODY = 256 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function verifySignature(raw, signature, secret) {
  if (!secret || typeof signature !== 'string' || !/^sha256=[0-9a-f]{64}$/i.test(signature)) return false;
  const provided = Buffer.from(signature.slice(7), 'hex');
  const expected = createHmac('sha256', secret).update(raw).digest();
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
function normalizeEvent(event, expectedInstance) {
  if (!event || event.event !== 'message.received') return null;
  const p = event.payload || {}, m = p.message || {};
  if (p.instance_id !== expectedInstance || m.is_group || m.is_from_me) return null;
  if (typeof m.id !== 'string' || !/^[\w.-]{1,128}$/.test(m.id)) return null;
  if (typeof m.from !== 'string' || !/^\d{10,15}@s\.whatsapp\.net$/.test(m.from)) return null;
  const kind = typeof m.type === 'string' ? m.type.slice(0, 32) : 'unknown';
  const body = kind === 'text' && typeof m.text === 'string' ? m.text.slice(0, 10000) : '';
  const timestamp = Date.parse(m.timestamp || '');
  return {
    phone: m.from.split('@')[0], name: typeof m.push_name === 'string' ? m.push_name.slice(0, 100) : 'Cliente',
    messageId: m.id, instanceId: p.instance_id, kind, body,
    eventAt: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : new Date().toISOString()
  };
}
async function readRaw(req) {
  const parts = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error('too_large');
    parts.push(chunk);
  }
  return Buffer.concat(parts);
}
async function supabase(path, options, config) {
  const response = await fetch(config.url + '/rest/v1/' + path, {
    ...options,
    headers: {
      apikey: config.key, Authorization: 'Bearer ' + config.key,
      'Content-Type': 'application/json', ...options?.headers
    },
    signal: AbortSignal.timeout(6000)
  });
  if (!response.ok) throw new Error('crm_storage_error_' + response.status);
  if (response.status === 204) return [];
  return response.json();
}
async function persist(message, config) {
  const filters = new URLSearchParams({
    select: 'id', source: 'eq.zapi', phone: 'eq.' + message.phone,
    owner_consultant_id: 'eq.' + config.owner, limit: '1'
  });
  let leads = await supabase('crm_pilot_leads?' + filters, { method: 'GET' }, config);
  let leadId = leads[0]?.id;
  if (!leadId) {
    const inserted = await supabase('crm_pilot_leads', {
      method: 'POST', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        source: 'zapi', phone: message.phone, display_name: message.name,
        store: 'Sierra - homologação', owner_consultant_id: config.owner, stage: 'novo'
      })
    }, config);
    leadId = inserted[0]?.id;
    if (!leadId) throw new Error('crm_lead_missing_id');
  }
  const existing = await supabase('crm_pilot_messages?' + new URLSearchParams({
    select: 'id', source: 'eq.zapi', instance_id: 'eq.' + message.instanceId,
    external_message_id: 'eq.' + message.messageId, limit: '1'
  }), { method: 'GET' }, config);
  if (existing.length) return 'duplicate';
  await supabase('crm_pilot_messages', {
    method: 'POST', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      lead_id: leadId, source: 'zapi', instance_id: message.instanceId,
      external_message_id: message.messageId, direction: 'entrada',
      kind: message.kind, body: message.body, event_at: message.eventAt
    })
  }, config);
  return 'stored';
}
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const env = process.env;
  if (env.VERCEL_ENV !== 'preview' || env.ZAPPY_INBOUND_ENABLED !== 'true') {
    return res.status(503).json({ error: 'inbound_disabled' });
  }
  const config = {
    url: env.SUPABASE_URL?.replace(/\/$/, ''), key: env.SUPABASE_SERVICE_ROLE_KEY,
    owner: env.CRM_THIAGO_USER_ID, instance: env.ZAPPY_INSTANCE_ID,
    secret: env.ZAPPY_WEBHOOK_SECRET
  };
  if (!config.url?.startsWith('https://') || !config.key || !UUID.test(config.owner || '') ||
      !config.instance || !config.secret) {
    return res.status(503).json({ error: 'inbound_not_configured' });
  }
  let raw;
  try { raw = await readRaw(req); } catch { return res.status(413).json({ error: 'body_too_large' }); }
  if (!verifySignature(raw, req.headers['x-webhook-signature'], config.secret)) {
    return res.status(401).json({ error: 'invalid_signature' });
  }
  let event;
  try { event = JSON.parse(raw.toString('utf8')); }
  catch { return res.status(400).json({ error: 'invalid_json' }); }
  if (event?.payload?.instance_id !== config.instance) return res.status(403).json({ error: 'wrong_instance' });
  // Outros eventos autenticados são ignorados; não há resposta automática nem download de mídia.
  if (event.event !== 'message.received') return res.status(204).end();
  const message = normalizeEvent(event, config.instance);
  if (!message) return res.status(204).end();
  try {
    const result = await persist(message, config);
    return res.status(200).json({ received: true, status: result });
  } catch (error) {
    // Sem log de mensagens, telefones ou credenciais. 503 permite retry pelo provedor.
    console.error('zappy_inbound_storage_failed', error.message);
    return res.status(503).json({ error: 'storage_unavailable' });
  }
};
module.exports.verifySignature = verifySignature;
module.exports.normalizeEvent = normalizeEvent;
