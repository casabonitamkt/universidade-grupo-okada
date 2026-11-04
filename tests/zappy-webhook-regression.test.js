'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const { normalizeEvent, verifySignature } = require('../api/zappy-inbound.js');
const instance = 'synthetic-instance';
function event(type, overrides = {}) {
  return { event: type, payload: { instance_id: instance, message: {
    id: 'synthetic_123', type: 'text', text: 'Mensagem de teste',
    from: '5511999999999@s.whatsapp.net', to: '5511888888888@s.whatsapp.net',
    is_from_me: type === 'message.sent', timestamp: '2026-11-04T12:00:00Z',
    ...overrides
  } } };
}
test('incoming and outgoing events use correct contact and direction', () => {
  const incoming = normalizeEvent(event('message.received'), instance);
  const outgoing = normalizeEvent(event('message.sent'), instance);
  assert.equal(incoming.direction, 'entrada');
  assert.equal(incoming.phone, '5511999999999');
  assert.equal(outgoing.direction, 'saida');
  assert.equal(outgoing.phone, '5511888888888');
});
test('phone-number JID fallback works when primary identifier is LID', () => {
  const msg = normalizeEvent(event('message.received', {
    from: '123456@lid', sender_pn: '5511777777777@s.whatsapp.net'
  }), instance);
  assert.equal(msg.phone, '5511777777777');
});
test('group, LID-only and wrong instance are rejected', () => {
  assert.equal(normalizeEvent(event('message.received', { is_group: true }), instance), null);
  assert.equal(normalizeEvent(event('message.received', { from: '123@lid' }), instance), null);
  assert.equal(normalizeEvent(event('message.received'), 'other-instance'), null);
});
test('media is metadata-only and never inserts secret in body', () => {
  const msg = normalizeEvent(event('message.received', {
    type: 'image', caption: 'Legenda', direct_path: '/encrypted',
    media_key: 'synthetic-private-key', mimetype: 'image/jpeg'
  }), instance);
  assert.equal(msg.body, 'Legenda');
  assert.equal(msg.kind, 'image');
  assert.equal(msg.mediaDownload.media_key, 'synthetic-private-key');
  assert.equal(msg.body.includes('synthetic-private-key'), false);
});
test('signature verification authenticates exact raw bytes', () => {
  const raw = Buffer.from('{"event":"message.received"}');
  const secret = 'synthetic-secret';
  const sig = 'sha256=' + createHmac('sha256', secret).update(raw).digest('hex');
  assert.equal(verifySignature(raw, sig, secret), true);
  assert.equal(verifySignature(Buffer.from('changed'), sig, secret), false);
  assert.equal(verifySignature(raw, sig, 'wrong-secret'), false);
});
