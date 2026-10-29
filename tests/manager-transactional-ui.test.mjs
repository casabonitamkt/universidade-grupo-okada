import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const a=html.indexOf('async function managerReviewExam(');
const b=html.indexOf('function renderReviews(',a);
assert.ok(a>=0&&b>a,'Fluxo gerencial autenticado ausente');

function setup(){
 const calls=[],fields={
  'exam-practice-e1':{value:'9'},
  'exam-verified-e1':{checked:true},
  'exam-feedback-e1':{value:'Pratica ficticia validada pessoalmente pelo gestor.'}
 };
 const ctx={
  profile:{role:'consultant'},user:{id:'consultant'},cache:{
   su:[{id:'e1',lesson_id:'l1'}],ls:[{id:'l1',content:{}}]
  },
  auditLessonExamSubmission:()=>({valid:true,passed:true}),checkExamGrade:async()=>({valid:true,passed:true}),
  $:id=>fields[id],toast:msg=>calls.push(['toast',msg]),
  sb:{rpc:async(name,args)=>{calls.push(['rpc',name,args]);return{error:null}}},
  loadAdmin:async()=>{calls.push(['refresh'])}
 };
 runInNewContext(html.slice(a,b),ctx);
 return {ctx,calls,fields};
}
test('consultor nao recebe acesso ao RPC pelo painel',async()=>{
 const {ctx,calls}=setup();
 await ctx.managerReviewExam('e1','approve');
 assert.equal(calls.filter(x=>x[0]==='rpc').length,0);
 assert.match(calls[0][1],/gestor autenticado/);
});
test('gestor envia nota pratica e confirmacao para RPC, sem update direto',async()=>{
 const {ctx,calls}=setup();
 ctx.profile.role='admin';ctx.user.id='admin';
 await ctx.managerReviewExam('e1','approve');
 const rpc=calls.find(x=>x[0]==='rpc');
 assert.equal(rpc[1],'training_review_exam');
 assert.equal(rpc[2].p_submission_id,'e1');
 assert.equal(rpc[2].p_decision,'approve');
 assert.equal(rpc[2].p_practice_score,9);
 assert.equal(rpc[2].p_practice_approved,true);
 assert.equal(calls.filter(x=>x[0]==='refresh').length,1);
 const section=html.slice(a,b);
 assert.doesNotMatch(section,/\.from\(['"](?:submissions|lesson_progress)['"]\)\.(?:update|upsert|insert)/);
});
test('gestor nao aprova sem pratica observada e nota minima',async()=>{
 const {ctx,calls,fields}=setup();
 ctx.profile.role='admin';
 fields['exam-verified-e1'].checked=false;
 await ctx.managerReviewExam('e1','approve');
 assert.equal(calls.filter(x=>x[0]==='rpc').length,0);
});
