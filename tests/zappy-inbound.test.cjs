'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const { verifySignature, normalizeEvent } = require('../api/zappy-inbound.js');

const instance = '643de1d0-819a-4bd5-bfcb-b444a1ab873a';
const template = {
  event: 'message.received',
  payload: {
    instance_id: instance,
    message: {
      id: '3EB0C767D12345', from: '5544999999999@s.whatsapp.net', push_name: 'Cliente Teste',
      is_group: false, is_from_me: false, type: 'text', text: 'Teste integração',
      timestamp: '2026-10-29T19:00:00Z',
    }
  }
};
const clone = () => JSON.parse(JSON.stringify(template));

test('assinatura HMAC-SHA256 autêntica do corpo bruto', () => {
  const raw = Buffer.from(JSON.stringify(template)), secret = 'unit-test-only';
  const signature = 'sha256=' + createHmac('sha256', secret).update(raw).digest('hex');
  assert.equal(verifySignature(raw, signature, secret), true);
  assert.equal(verifySignature(Buffer.from('{}'), signature, secret), false);
  assert.equal(verifySignature(raw, signature, 'wrong'), false);
  assert.equal(verifySignature(raw, undefined, secret), false);
});

test('mensagem recebida com telefone padrão', () => {
  const value = normalizeEvent(clone(), instance);
  assert.equal(value.phone, '5544999999999');
  assert.equal(value.body, 'Teste integração');
  assert.equal(value.messageId, '3EB0C767D12345');
});

test('mensagem recebida com remetente @lid e sender_pn válido', () => {
  const event = clone();
  event.payload.message.from = '1234567890123@lid';
  event.payload.message.sender_pn = '5544999999999@s.whatsapp.net';
  assert.equal(normalizeEvent(event, instance)?.phone, '5544999999999');
});

test('mensagem sem telefone confiável é ignorada', () => {
  const event = clone();
  event.payload.message.from = '1234567890123@lid';
  assert.equal(normalizeEvent(event, instance), null);
});

test('ignora grupo, próprio envio e outra instância', () => {
  const group = clone(); group.payload.message.is_group = true;
  assert.equal(normalizeEvent(group, instance), null);
  const sent = clone(); sent.payload.message.is_from_me = true;
  assert.equal(normalizeEvent(sent, instance), null);
  assert.equal(normalizeEvent(clone(), 'other-instance'), null);
});


test('POST autenticado salva mensagem mesmo quando PostgREST responde 201 sem corpo', async () => {
  const handler = require('../api/zappy-inbound.js');
  const owner = 'ff819b24-a03e-4e24-a37b-8369db465fd9';
  const secret = 'unit-test-only';
  const raw = Buffer.from(JSON.stringify(template));
  const signature = 'sha256=' + createHmac('sha256', secret).update(raw).digest('hex');
  const previousEnv = {};
  const updates = {
    VERCEL_ENV: 'production', ZAPPY_INBOUND_ENABLED: 'true',
    SUPABASE_URL: 'https://unit-test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fake-unit-key',
    CRM_THIAGO_USER_ID: owner, ZAPPY_INSTANCE_ID: instance, ZAPPY_WEBHOOK_SECRET: secret
  };
  for (const [key,value] of Object.entries(updates)) {
    previousEnv[key] = process.env[key];
    process.env[key] = value;
  }
  const oldFetch = globalThis.fetch;
  let createdMessages = 0;
  let createdLeads = 0;
  const mockResponse = (status, data) => ({
    ok: status >= 200 && status < 300, status,
    json: async () => {
      if (data === undefined) throw new SyntaxError('Unexpected end of JSON input');
      return data;
    }
  });
  globalThis.fetch = async (url, options) => {
    const path = String(url);
    if (path.includes('crm_pilot_leads?')) return mockResponse(200, []);
    if (path.endsWith('crm_pilot_leads') && options.method === 'POST') {
      createdLeads += 1;
      return mockResponse(201, [{ id: 'a00fba56-2c7e-4748-bd5d-87f6e3643756', owner_consultant_id: owner }]);
    }
    if (path.includes('crm_pilot_messages?')) return mockResponse(200, []);
    if (path.endsWith('crm_pilot_messages') && options.method === 'POST') {
      assert.equal(options.headers.Prefer, 'return=minimal');
      createdMessages += 1;
      return mockResponse(201, undefined); // PostgREST retorna corpo vazio
    }
    throw new Error('Endpoint inesperado em teste: ' + path);
  };
  const req = {
    method: 'POST',
    headers: { 'x-webhook-signature': signature, 'content-length': String(raw.length) },
    async *[Symbol.asyncIterator]() { yield raw; }
  };
  const res = {
    statusCode: 200, setHeader() { return this; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
    end() { return this; }
  };
  try {
    await handler(req, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { received: true, status: 'stored' });
    assert.equal(createdLeads, 1);
    assert.equal(createdMessages, 1);
  } finally {
    globalThis.fetch = oldFetch;
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('mídia mantém legenda e nome do documento sem dados de download',()=>{
  const event=clone();
  event.payload.message.type='document';
  event.payload.message.caption='Orçamento da sala';
  event.payload.message.filename='orcamento.pdf';
  event.payload.message.direct_path='/v/private/path';
  event.payload.message.media_key='secret-should-not-be-stored';
  delete event.payload.message.text;
  const value=normalizeEvent(event,instance);
  assert.equal(value.body,'Orçamento da sala');
  assert.equal(value.mediaName,'orcamento.pdf');
  assert.equal(JSON.stringify(value).includes('secret-should-not-be-stored'),false);
});


test('captura metadados privados de imagem recebida sem incluir em campos visíveis do CRM',()=>{
  const event=clone();
  event.payload.message.type='image';
  event.payload.message.caption='Foto sala';
  event.payload.message.mimetype='image/jpeg';
  event.payload.message.file_length=1024;
  event.payload.message.direct_path='/v/t62-private/';
  event.payload.message.media_key='unit-test-private-key';
  event.payload.message.file_sha256='unit-test-hash';
  delete event.payload.message.text;
  const value=normalizeEvent(event,instance);
  assert.equal(value.kind,'image');
  assert.equal(value.body,'Foto sala');
  assert.equal(value.mediaDownload.direct_path,'/v/t62-private/');
  assert.equal(value.mediaDownload.media_key,'unit-test-private-key');
  assert.equal(value.mimeType,'image/jpeg');
  assert.equal(value.mediaLength,1024);
  assert.ok(!value.body.includes('unit-test-private-key'));
});
