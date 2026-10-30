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
 const h=html.indexOf('function f2RubricCriteria(');
 const hEnd=html.indexOf('function renderPendingLessonExams(',h);
 assert.ok(h>=0&&hEnd>h,'Normalizacao da rubrica F2 ausente');
 runInNewContext(html.slice(h,hEnd)+html.slice(a,b),ctx);
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

test('Marco 30 envia duas simulacoes ao servidor, sem aceitar caso incompleto',async()=>{
 const {ctx,calls,fields}=setup();
 ctx.profile.role='admin';ctx.user.id='admin';
 ctx.cache.ls[0].code='F1-D30-A01';
 const evidence='Simulacao observada: medidas, uso, arquiteto, investimento e proximo passo com data confirmada.';
 fields['exam-case-project-score-e1']={value:'9'};
 fields['exam-case-piece-score-e1']={value:'8'};
 fields['exam-case-project-critical-e1']={checked:false};
 fields['exam-case-piece-critical-e1']={checked:false};
 fields['exam-case-project-evidence-e1']={value:evidence};
 fields['exam-case-piece-evidence-e1']={value:evidence};
 await ctx.managerReviewExam('e1','approve');
 const rpc=calls.find(x=>x[0]==='rpc');
 assert.ok(rpc,'RPC do Marco 30 deve ser chamada');
 assert.equal(rpc[2].p_practice_score,8);
 assert.equal(rpc[2].p_practice_cases.length,2);
 assert.equal(rpc[2].p_practice_cases[0].case,'project');
 assert.equal(rpc[2].p_practice_cases[1].case,'piece');
});
test('Marco 30 com erro critico nao envia aprovacao ao servidor',async()=>{
 const {ctx,calls,fields}=setup();
 ctx.profile.role='admin';ctx.user.id='admin';
 ctx.cache.ls[0].code='F1-D30-A01';
 fields['exam-case-project-score-e1']={value:'9'};
 fields['exam-case-piece-score-e1']={value:'8'};
 fields['exam-case-project-critical-e1']={checked:true};
 fields['exam-case-piece-critical-e1']={checked:false};
 fields['exam-case-project-evidence-e1']={value:'Evidencia detalhada de projeto com medidas, escuta, arquiteto e cronograma confirmados.'};
 fields['exam-case-piece-evidence-e1']={value:'Evidencia detalhada de peca avulsa com foto, circulacao e retorno com data definida.'};
 await ctx.managerReviewExam('e1','approve');
 assert.equal(calls.filter(x=>x[0]==='rpc').length,0);
 assert.match(calls.at(-1)[1],/duas simulações/);
});

test('F2 exige cinco competencias de 0 a 2 e envia soma ao RPC',async()=>{
 const {ctx,calls,fields}=setup();
 ctx.profile.role='admin';ctx.user.id='admin';
 ctx.cache.ls[0].code='F2-D34-A01';
 ctx.cache.ls[0].content={manager_practical_rubric:{criteria:['comparacao','projeto','pendencias','alcada','retorno']}};
 for(let i=0;i<5;i++)fields['exam-f2-criterion-'+i+'-e1']={value:i===4?'1':'2'};
 fields['exam-observed-critical-e1']={checked:false};
 fields['exam-observed-evidence-e1']={value:'Pratica observada com comparacao por ambiente, respeito ao projeto, alcada e retorno confirmado.'};
 await ctx.managerReviewExam('e1','approve');
 const rpc=calls.find(x=>x[0]==='rpc');
 assert.ok(rpc,'Aprovacao com cinco notas deve chegar ao servidor');
 assert.equal(rpc[2].p_practice_score,9);
 assert.equal(JSON.stringify(rpc[2].p_practice_cases[0].criteria_scores),'[2,2,2,2,1]');
});
test('F2 sem rubrica homologada nao envia aprovacao',async()=>{
 const {ctx,calls}=setup();
 ctx.profile.role='admin';ctx.user.id='admin';
 ctx.cache.ls[0].code='F2-D35-A01';
 await ctx.managerReviewExam('e1','approve');
 assert.equal(calls.filter(x=>x[0]==='rpc').length,0);
});
