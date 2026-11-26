'use strict';

// Receives only a controlled Direct test. No customer content is stored.
const { createHmac, createHash, timingSafeEqual } = require('node:crypto');
const MAX_BODY = 256 * 1024;
const ACCOUNT_ID = /^\d{1,30}$/;

function sameToken(actual, expected) {
  if (typeof actual !== 'string' || actual.length > 512) return false;
  const hash = value => createHash('sha256').update(value).digest();
  return timingSafeEqual(hash(actual), hash(expected));
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_BODY) throw new RangeError('body_too_large');
    chunks.push(bytes);
  }
  return Buffer.concat(chunks);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const env = process.env;
  if (env.INSTAGRAM_WEBHOOK_ENABLED !== 'true') return res.status(503).end();

  if (req.method === 'GET') {
    const query = req.query || {};
    if (!env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) return res.status(503).end();
    if (query['hub.mode'] !== 'subscribe' ||
      !sameToken(query['hub.verify_token'], env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN)) return res.status(403).end();
    const challenge = query['hub.challenge'];
    if (typeof challenge !== 'string' || !/^\d{1,64}$/.test(challenge)) return res.status(400).end();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).end(challenge);
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end();
  }

  const pairs = [
    { account:env.INSTAGRAM_PILOT_ACCOUNT_ID, tester:env.INSTAGRAM_PILOT_TEST_SENDER_ID, label:'casa_bonita' },
    { account:env.INSTAGRAM_PILOT_SIERRA_ACCOUNT_ID, tester:env.INSTAGRAM_PILOT_SIERRA_TEST_SENDER_ID, label:'sierra' },
  ].filter(({account,tester})=>account||tester);
  const secret = env.INSTAGRAM_APP_SECRET;
  if(!secret||!pairs.length||pairs.some(({account,tester})=>
    !ACCOUNT_ID.test(account||'')||!ACCOUNT_ID.test(tester||'')||account===tester)||
    new Set(pairs.map(({account})=>account)).size!==pairs.length)
    return res.status(503).end();

  let raw;
  try {
    raw = await readBody(req);
  } catch (error) {
    return res.status(error instanceof RangeError ? 413 : 400).end();
  }
  const signature = req.headers['x-hub-signature-256'];
  if (typeof signature !== 'string' || !/^sha256=[a-f0-9]{64}$/i.test(signature)) return res.status(401).end();
  const expected = createHmac('sha256', secret).update(raw).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature.slice(7), 'hex'))) return res.status(401).end();

  let event;
  try {
    event = JSON.parse(raw.toString('utf8'));
  } catch {
    return res.status(400).end();
  }
  const entries = event?.object === 'instagram' && Array.isArray(event.entry) ? event.entry : [];
  for(const {account,tester,label} of pairs){
    const received=entries.some(entry=>entry?.id===account&&Array.isArray(entry.messaging)&&
      entry.messaging.some(item=>item?.sender?.id===tester&&item?.recipient?.id===account&&
        typeof item.message?.mid==='string'&&!item.message.is_echo));
    if(received)console.info('instagram_internal_direct_received',label);
  }
  return res.status(204).end();
};
