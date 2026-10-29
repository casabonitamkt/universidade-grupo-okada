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
