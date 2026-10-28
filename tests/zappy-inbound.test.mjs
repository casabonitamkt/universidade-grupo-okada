import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHmac } from 'node:crypto';
const require = createRequire(import.meta.url);
const handler = require('../api/zappy-inbound.js');
const SECRET = 'unit-test-only-not-a-real-secret';
const INSTANCE = 'test-instance';
function event(overrides = {}) {
  return { event: 'message.received', timestamp: 1793090000, payload: {
    instance_id: INSTANCE,
    message: { id: 'msg-001', from: '5544999999999@s.whatsapp.net',
      is_group: false, is_from_me: false, type: 'text',
      text: 'Quero conhecer os sofás', timestamp: '2026-10-27T12:00:00Z',
      ...overrides }
  }};
}
function sign(raw) { return 'sha256=' + createHmac('sha256', SECRET).update(raw).digest('hex'); }
function request(raw, signature) {
  return { method: 'POST', headers: { 'x-webhook-signature': signature },
    async *[Symbol.asyncIterator]() { yield Buffer.from(raw); } };
}
function response() {
  return { code: 200, body: null, setHeader() {},
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; } };
}
test('assinatura HMAC verifica corpo original, rejeita adulteração', () => {
  const raw = Buffer.from(JSON.stringify(event()));
  assert.equal(handler.verifySignature(raw, sign(raw), SECRET), true);
  assert.equal(handler.verifySignature(Buffer.from(raw.toString() + ' '), sign(raw), SECRET), false);
  assert.equal(handler.verifySignature(raw, 'sha256=abc', SECRET), false);
  assert.equal(handler.verifySignature(raw, '', SECRET), false);
});
test('normaliza apenas mensagens individuais recebidas e evita mídia em texto', () => {
  const normalized = handler.normalizeEvent(event(), INSTANCE);
  assert.equal(normalized.body, 'Quero conhecer os sofás');
  assert.equal(normalized.phone, '5544999999999');
  assert.equal(handler.normalizeEvent(event({ is_group: true }), INSTANCE), null);
  assert.equal(handler.normalizeEvent(event({ is_from_me: true }), INSTANCE), null);
  assert.equal(handler.normalizeEvent(event({ from: 'group@g.us' }), INSTANCE), null);
  assert.equal(handler.normalizeEvent(event({ type: 'image', text: 'segredo' }), INSTANCE).body, '');
  assert.equal(handler.normalizeEvent(event(), 'another-instance'), null);
});
test('não aceita webhook sem flag e sem ambiente preview', async () => {
  const original = { ...process.env };
  try {
    process.env.VERCEL_ENV = 'production';
    process.env.ZAPPY_INBOUND_ENABLED = 'true';
    const raw = JSON.stringify(event());
    const res = response();
    await handler(request(raw, sign(raw)), res);
    assert.equal(res.code, 503);
    assert.equal(res.body.error, 'inbound_disabled');
  } finally { process.env = original; }
});
test('falha fechada sem credenciais reais configuradas', async () => {
  const original = { ...process.env };
  try {
    process.env.VERCEL_ENV = 'preview';
    process.env.ZAPPY_INBOUND_ENABLED = 'true';
    delete process.env.ZAPPY_WEBHOOK_SECRET;
    const raw = JSON.stringify(event());
    const res = response();
    await handler(request(raw, sign(raw)), res);
    assert.equal(res.code, 503);
    assert.equal(res.body.error, 'inbound_not_configured');
  } finally { process.env = original; }
});
test('rejeita HMAC inválido sem tocar banco', async () => {
  const original = { ...process.env };
  try {
    Object.assign(process.env, {
      VERCEL_ENV: 'preview', ZAPPY_INBOUND_ENABLED: 'true',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'unit-test-only',
      CRM_THIAGO_USER_ID: '123e4567-e89b-42d3-a456-426614174000',
      ZAPPY_INSTANCE_ID: INSTANCE, ZAPPY_WEBHOOK_SECRET: SECRET
    });
    const raw = JSON.stringify(event());
    const res = response();
    await handler(request(raw, 'sha256=' + '0'.repeat(64)), res);
    assert.equal(res.code, 401);
    assert.equal(res.body.error, 'invalid_signature');
  } finally { process.env = original; }
});


test('registra somente entrada nas tabelas piloto, sem qualquer chamada ao WhatsApp', async () => {
  const originalEnv = { ...process.env }, originalFetch = globalThis.fetch;
  const requests = [];
  try {
    Object.assign(process.env, {
      VERCEL_ENV: 'preview', ZAPPY_INBOUND_ENABLED: 'true',
      SUPABASE_URL: 'https://unit-test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'test-only',
      CRM_THIAGO_USER_ID: '123e4567-e89b-42d3-a456-426614174000',
      ZAPPY_INSTANCE_ID: INSTANCE, ZAPPY_WEBHOOK_SECRET: SECRET
    });
    globalThis.fetch = async (url, options) => {
      requests.push({ url, options });
      assert.match(url, /^https:\/\/unit-test\.invalid\/rest\/v1\/crm_pilot_/);
      const path = new URL(url).pathname;
      if (path.endsWith('/crm_pilot_leads') && options.method === 'GET') {
        return { ok: true, status: 200, json: async () => [] };
      }
      if (path.endsWith('/crm_pilot_leads') && options.method === 'POST') {
        return { ok: true, status: 201, json: async () => [{ id: '123e4567-e89b-42d3-a456-426614174001', owner_consultant_id: '123e4567-e89b-42d3-a456-426614174000' }] };
      }
      if (path.endsWith('/crm_pilot_messages') && options.method === 'GET') {
        return { ok: true, status: 200, json: async () => [] };
      }
      if (path.endsWith('/crm_pilot_messages') && options.method === 'POST') {
        return { ok: true, status: 204 };
      }
      throw new Error('unexpected_mock_request');
    };
    const raw = JSON.stringify(event());
    const res = response();
    await handler(request(raw, sign(raw)), res);
    assert.equal(res.code, 200);
    assert.equal(res.body.status, 'stored');
    assert.equal(requests.length, 4);
    const message = JSON.parse(requests[3].options.body);
    assert.equal(message.direction, 'entrada');
    assert.equal(message.source, 'zapi');
    assert.equal(message.body, 'Quero conhecer os sofás');
  } finally { process.env = originalEnv; globalThis.fetch = originalFetch; }
});
test('evento repetido não grava segunda mensagem no fluxo sequencial', async () => {
  const originalEnv = { ...process.env }, originalFetch = globalThis.fetch;
  let calls = 0;
  try {
    Object.assign(process.env, {
      VERCEL_ENV: 'preview', ZAPPY_INBOUND_ENABLED: 'true',
      SUPABASE_URL: 'https://unit-test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'test-only',
      CRM_THIAGO_USER_ID: '123e4567-e89b-42d3-a456-426614174000',
      ZAPPY_INSTANCE_ID: INSTANCE, ZAPPY_WEBHOOK_SECRET: SECRET
    });
    globalThis.fetch = async (url, options) => {
      calls++;
      assert.equal(options.method, 'GET');
      if (url.includes('crm_pilot_leads')) return {
        ok: true, status: 200, json: async () => [{ id: '123e4567-e89b-42d3-a456-426614174001', owner_consultant_id: '123e4567-e89b-42d3-a456-426614174000' }]
      };
      if (url.includes('crm_pilot_messages')) return {
        ok: true, status: 200, json: async () => [{ id: '123e4567-e89b-42d3-a456-426614174002' }]
      };
      throw new Error('unexpected_mock_request');
    };
    const raw = JSON.stringify(event());
    const res = response();
    await handler(request(raw, sign(raw)), res);
    assert.equal(res.code, 200);
    assert.equal(res.body.status, 'duplicate');
    assert.equal(calls, 2);
  } finally { process.env = originalEnv; globalThis.fetch = originalFetch; }
});

function testConfig() {
  return {
    VERCEL_ENV: 'preview', ZAPPY_INBOUND_ENABLED: 'true',
    SUPABASE_URL: 'https://unit-test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'test-only',
    CRM_THIAGO_USER_ID: '123e4567-e89b-42d3-a456-426614174000',
    ZAPPY_INSTANCE_ID: INSTANCE, ZAPPY_WEBHOOK_SECRET: SECRET
  };
}
function mockHttp(status, data) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}
test('nao grava mensagens em lead pertencente a outro consultor', async () => {
  const env = { ...process.env }, oldFetch = globalThis.fetch;
  const calls = [];
  try {
    Object.assign(process.env, testConfig());
    globalThis.fetch = async (url, options) => {
      calls.push({ url, method: options.method });
      assert.equal(options.method, 'GET');
      assert.match(url, /crm_pilot_leads/);
      return mockHttp(200, [{ id: '123e4567-e89b-42d3-a456-426614174001',
        owner_consultant_id: '123e4567-e89b-42d3-a456-426614174099' }]);
    };
    const raw = JSON.stringify(event()), res = response();
    await handler(request(raw, sign(raw)), res);
    assert.equal(res.code, 503);
    assert.equal(res.body.error, 'storage_unavailable');
    assert.equal(calls.length, 1);
  } finally { process.env = env; globalThis.fetch = oldFetch; }
});
test('concorrencia na criacao de lead: conflito 409 so aceita mesmo proprietario', async () => {
  const env = { ...process.env }, oldFetch = globalThis.fetch;
  let leadGets = 0, leadPosts = 0, messagePosts = 0;
  try {
    Object.assign(process.env, testConfig());
    globalThis.fetch = async (url, options) => {
      if (url.includes('crm_pilot_leads') && options.method === 'GET') {
        leadGets++;
        return mockHttp(200, leadGets === 1 ? [] : [{
          id: '123e4567-e89b-42d3-a456-426614174001',
          owner_consultant_id: testConfig().CRM_THIAGO_USER_ID
        }]);
      }
      if (url.includes('crm_pilot_leads') && options.method === 'POST') {
        leadPosts++; return mockHttp(409, {});
      }
      if (url.includes('crm_pilot_messages') && options.method === 'GET') return mockHttp(200, []);
      if (url.includes('crm_pilot_messages') && options.method === 'POST') {
        messagePosts++; return mockHttp(204);
      }
      throw new Error('unexpected_mock_request');
    };
    const raw = JSON.stringify(event()), res = response();
    await handler(request(raw, sign(raw)), res);
    assert.equal(res.code, 200);
    assert.equal(res.body.status, 'stored');
    assert.equal(leadGets, 2);
    assert.equal(leadPosts, 1);
    assert.equal(messagePosts, 1);
  } finally { process.env = env; globalThis.fetch = oldFetch; }
});
test('conflito 409 em mensagem so vira duplicata apos confirmacao no banco', async () => {
  const env = { ...process.env }, oldFetch = globalThis.fetch;
  let messageGets = 0, messagePosts = 0;
  try {
    Object.assign(process.env, testConfig());
    globalThis.fetch = async (url, options) => {
      if (url.includes('crm_pilot_leads') && options.method === 'GET') return mockHttp(200, [{
        id: '123e4567-e89b-42d3-a456-426614174001',
        owner_consultant_id: testConfig().CRM_THIAGO_USER_ID
      }]);
      if (url.includes('crm_pilot_messages') && options.method === 'GET') {
        messageGets++;
        return mockHttp(200, messageGets === 1 ? [] : [{
          id: '123e4567-e89b-42d3-a456-426614174002'
        }]);
      }
      if (url.includes('crm_pilot_messages') && options.method === 'POST') {
        messagePosts++; return mockHttp(409, {});
      }
      throw new Error('unexpected_mock_request');
    };
    const raw = JSON.stringify(event()), res = response();
    await handler(request(raw, sign(raw)), res);
    assert.equal(res.code, 200);
    assert.equal(res.body.status, 'duplicate');
    assert.equal(messageGets, 2);
    assert.equal(messagePosts, 1);
  } finally { process.env = env; globalThis.fetch = oldFetch; }
});
