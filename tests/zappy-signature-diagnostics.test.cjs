'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const handler = require('../api/zappy-inbound.js');

// Known-answer HMAC vector from RFC 4231, independent of JSON serialization.
test('HMAC matches RFC 4231 case 2 and rejects a changed body', () => {
  const expected = 'sha256=5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843';
  assert.equal(handler.verifySignature(Buffer.from('what do ya want for nothing?'), expected, 'Jefe'), true);
  assert.equal(handler.verifySignature(Buffer.from('what do ya want for nothing?\n'), expected, 'Jefe'), false);
});

for (const [label,secret,flags] of [
  ['normal','fictitious-secret-alpha',[false,false,false]],
  ['outer whitespace',' fictitious-secret-alpha\n',[true,false,false]],
  ['quotes','"fictitious-secret-alpha"',[false,true,false]],
  ['variable name','ZAPPY_WEBHOOK_SECRET',[false,false,true]]
]) {
  test('invalid signature remains blocked; safe diagnostics: '+label, async () => {
    const updates = {
      VERCEL_ENV:'production',ZAPPY_INBOUND_ENABLED:'true',
      SUPABASE_URL:'https://test.invalid',SUPABASE_SERVICE_ROLE_KEY:'fake-key',
      CRM_THIAGO_USER_ID:'ff819b24-a03e-4e24-a37b-8369db465fd9',
      ZAPPY_INSTANCE_ID:'fictional-instance',ZAPPY_WEBHOOK_SECRET:secret
    };
    const previous = Object.fromEntries(Object.keys(updates).map(k=>[k,process.env[k]]));
    const oldFetch = globalThis.fetch, oldWarn=console.warn;
    const logs=[];let calls=0;
    Object.assign(process.env,updates);
    globalThis.fetch=async()=>{calls++;throw Error('Network forbidden in signature test');};
    console.warn=(...args)=>logs.push(args);
    const raw=Buffer.from(JSON.stringify({event:'message.received',timestamp:1794320000,payload:{message:{text:'FICTIONAL PRIVATE MESSAGE'}}}));
    const signature='sha256='+createHmac('sha256','different-fictitious-secret').update(raw).digest('hex');
    const req={method:'POST',headers:{'x-webhook-signature':signature,'content-length':String(raw.length)},async *[Symbol.asyncIterator](){yield raw;}};
    const res={setHeader(){},status(n){this.statusCode=n;return this;},json(body){this.body=body;return this;}};
    try {
      await handler(req,res);
      assert.equal(res.statusCode,401);
      assert.deepEqual(res.body,{error:'invalid_signature'});
      assert.equal(calls,0);
      assert.equal(logs.length,1);
      const info=logs[0][1];
      assert.deepEqual([info.secret_outer_whitespace,info.secret_wrapping_quotes,info.secret_is_variable_name],flags);
      const serialized=JSON.stringify(logs);
      assert.equal(serialized.includes(secret),false);
      assert.equal(serialized.includes(signature),false);
      assert.equal(serialized.includes('FICTIONAL PRIVATE MESSAGE'),false);
      assert.equal(serialized.includes('fictitious-secret-alpha'),false);
    } finally {
      globalThis.fetch=oldFetch;console.warn=oldWarn;
      for(const [k,v] of Object.entries(previous)){if(v===undefined)delete process.env[k];else process.env[k]=v;}
    }
  });
}
