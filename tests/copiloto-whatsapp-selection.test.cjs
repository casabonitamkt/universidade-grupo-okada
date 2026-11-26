const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const folder = path.join(__dirname, '../extensions/copiloto-whatsapp');

test('reads a single private chat ID without treating it as a phone', () => {
  let ids = ['true_123456789@lid_A'];
  const title = { getAttribute: () => 'Bruno' };
  const main = {
    querySelector: () => ({ querySelector: () => title }),
    querySelectorAll: () => ids.map(id => ({ getAttribute: () => id })),
  };
  const context = vm.createContext({
    chrome: { runtime: { onMessage: { addListener() {} } } },
    document: { querySelector: () => main, querySelectorAll: () => [] },
  });
  vm.runInContext(fs.readFileSync(path.join(folder, 'active-chat.js'), 'utf8'), context);
  const read = () => vm.runInContext('readActiveChat()', context);
  assert.equal(read().privateId, '123456789@lid');
  assert.equal(read().phone, undefined);

  ids.push('false_987654321@lid_B');
  assert.equal(read().reason, 'ambiguous');
  assert.equal(read().privateId, undefined);

  ids = ['false_123456-123@g.us_C'];
  assert.equal(read().reason, 'unsupported');
});

test('remembers an explicitly linked chat and keeps live advice when switching', async () => {
  const linked = {};
  const elements = {};
  const timers = {};
  let activeChat = { privateId: '123456789@lid', label: 'Bruno', reason: 'private-id' };
  const element = id => elements[id] ??= {
    value: '',
    dataset: {},
    checked: ['follow-whatsapp', 'live-enabled'].includes(id),
    events: {},
    replaceChildren() { this.value = ''; },
    querySelector() { return element('submit'); },
    addEventListener(event, handler) { this.events[event] = handler; },
  };
  const chrome = {
    tabs: { query: async () => [{ id: 1 }], sendMessage: async () => activeChat },
    storage: {
      session: {
        get: async () => ({
          okadaCopilotSession: { accessToken: 'test', userId: 'pilot', expiresAt: Date.now() + 5000 },
        }),
      },
      local: {
        get: async key => ({ [key]: linked[key] }),
        set: async values => Object.assign(linked, values),
        remove: async key => { delete linked[key]; },
      },
    },
  };
  const context = {
    chrome,
    document: { getElementById: element },
    confirm: () => true,
    Option: function () {},
    URLSearchParams,
    AbortSignal,
    supabaseUrl: 'https://example.test',
    publicKey: 'fake',
    setInterval: (handler, interval) => { timers[interval] = handler; },
    fetch: async url => ({
      ok: true,
      json: async () => {
        if (url.includes('_leads')) return [
          { id: 'bruno', display_name: 'Bruno' },
          { id: 'lucas', display_name: 'Lucas', phone: '5544999992222' },
        ];
        if (url.includes('_messages')) return [{ id: url, kind: 'text', body: 'Teste interno' }];
        return { analysis: 'Próximo passo: combinar retorno.' };
      },
    }),
  };
  const source = fs.readFileSync(path.join(folder, 'panel.js'), 'utf8').split('\n').slice(1).join('\n');
  vm.runInNewContext(source, context);
  const flush = () => new Promise(setImmediate);
  await flush();
  assert.equal(element('contact').value, '');

  element('contact').value = 'bruno';
  element('contact').events.change();
  await flush();
  assert.match(element('live-advice').textContent, /combinar retorno/);
  await element('link-chat').events.click();
  await flush();
  assert.equal(linked['okadaChatLink:pilot:123456789@lid'], 'bruno');

  activeChat = { phone: '5544999992222' };
  await timers[900]();
  await flush();
  assert.equal(element('contact').value, 'lucas');

  activeChat = { privateId: '987654321@lid', label: 'Bruno' };
  await timers[900]();
  assert.equal(element('contact').value, '');
  assert.equal(element('live-advice').hidden, true);

  activeChat = { privateId: '123456789@lid', label: 'Bruno' };
  await timers[900]();
  await flush();
  assert.equal(element('contact').value, 'bruno');
  assert.match(element('live-advice').textContent, /combinar retorno/);
  assert.equal(element('unlink-chat').hidden, false);
  await element('unlink-chat').events.click();
  assert.equal(linked['okadaChatLink:pilot:123456789@lid'], undefined);
  assert.equal(element('contact').value, '');
  assert.equal(element('live-advice').hidden, true);
  assert.equal(element('unlink-chat').hidden, true);
});
