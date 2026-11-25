'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const { Readable } = require('node:stream');
const handler = require('../api/instagram-inbound.js');

const vars = {
  INSTAGRAM_WEBHOOK_ENABLED:'true',
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN:'test-token',
  INSTAGRAM_PILOT_ACCOUNT_ID:'100',
  INSTAGRAM_PILOT_TEST_SENDER_ID:'200',
  INSTAGRAM_APP_SECRET:'test-secret',
};
async function request(options) {
  const saved = Object.fromEntries(Object.keys(vars).map(key => [key,process.env[key]]));
  const originalLog = console.info;
  const logs = [];
  console.info = (...args) => logs.push(args);
  Object.assign(process.env,vars,options.env);
  const raw = options.raw ?? JSON.stringify(options.body ?? {});
  const req = Readable.from([Buffer.from(raw)]);
  req.method = options.method ?? 'POST';
  req.query = options.query ?? {};
  req.headers = {'x-hub-signature-256':options.signature ??
    'sha256='+createHmac('sha256',vars.INSTAGRAM_APP_SECRET).update(raw).digest('hex')};
  const res = {setHeader(){},status(code){this.code=code;return this},end(body){this.body=body;return this}};
  try {
    await handler(req,res);
    return {code:res.code,body:res.body,logs};
  } finally {
    console.info = originalLog;
    for (const [key,value] of Object.entries(saved)) {
      if(value===undefined) delete process.env[key];
      else process.env[key]=value;
    }
  }
}
const payload = (sender, extra={}) => ({
  object:'instagram',
  entry:[{id:'100',messaging:[{sender:{id:sender},recipient:{id:'100'},message:{mid:'internal-1',text:'Private content',...extra}}]}],
});
test('requires explicit enablement and validates the Meta challenge',async()=>{
  const query={'hub.mode':'subscribe','hub.verify_token':'test-token','hub.challenge':'123456'};
  assert.equal((await request({method:'GET',query,env:{INSTAGRAM_WEBHOOK_ENABLED:'false'}})).code,503);
  assert.deepEqual(await request({method:'GET',query}),{code:200,body:'123456',logs:[]});
  assert.equal((await request({method:'GET',query:{...query,'hub.verify_token':'wrong'}})).code,403);
});
test('rejects unsigned, oversized and invalid events',async()=>{
  assert.equal((await request({body:payload('200'),signature:'invalid'})).code,401);
  assert.equal((await request({raw:'{'})).code,400);
  assert.equal((await request({raw:' '.repeat(256*1024+1)})).code,413);
});
test('acknowledges signed events and logs only a test receipt without identifiers or text',async()=>{
  assert.deepEqual((await request({body:payload('200')})).logs,[['instagram_internal_direct_received']]);
  assert.deepEqual((await request({body:payload('201')})).logs,[]);
  assert.deepEqual((await request({body:payload('200',{is_echo:true})})).logs,[]);
});
