import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const a=html.indexOf('function gradeLessonExam('),b=html.indexOf('function renderLessonExam(',a);
const c=html.indexOf('function auditLessonExamSubmission('),d=html.indexOf('function renderReviews(',c);
assert.ok(a>=0&&b>a&&c>b&&d>c,'Correção independente do gestor ausente');
const questions=Array.from({length:10},(_,i)=>['Pergunta '+i,['Certa','Errada'],0,i===2]);
function fixture(){
 const lesson={id:'l1',code:'F2-D34-A01',content:{questions_a:questions,questions_b:questions,minimum_score:8}};
 const payload={version:1,stage:'a',requires_manager_validation:true,answers:Array(10).fill(0),evidence:'Prática fictícia com contexto, especificações confirmadas, pendências e data de retorno com responsável definido.',preview_score:1,preview_critical_errors:3,preview_passed:false};
 const exam={id:'e1',user_id:'u1',lesson_id:'l1',submission_type:'lesson_exam_a',text_content:JSON.stringify(payload),submitted_at:'2026-10-29T01:00:00Z',status:'pending'};
 const cache={su:[exam],ps:[{id:'u1',full_name:'Consultor'}],ls:[lesson]};
 const ctx={cache,esc:x=>String(x).replaceAll('<','&lt;'),console};
 runInNewContext(html.slice(a,b)+'\n'+html.slice(c,d),ctx);
 return{ctx,exam,lesson,payload,cache};
}
test('gestor recalcula gabarito e detecta nota preliminar falsificada',()=>{
 const {ctx,exam,lesson}=fixture(),audit=ctx.auditLessonExamSubmission(exam,lesson);
 assert.equal(audit.valid,true);assert.equal(audit.score,10);assert.equal(audit.critical,0);
 assert.equal(audit.passed,true);assert.equal(audit.previewMismatch,true);
 const rendered=ctx.renderPendingLessonExams();
 assert.match(rendered,/Correção independente:/);
 assert.match(rendered,/nota preliminar enviada difere/);
 assert.match(rendered,/10\/10/);
 assert.doesNotMatch(rendered,/onclick="review\('/);
});
test('reprova respostas incompletas, erro crítico e evidência curta',()=>{
 const {ctx,exam,lesson,payload}=fixture();
 payload.answers=[0,0];exam.text_content=JSON.stringify(payload);
 assert.equal(ctx.auditLessonExamSubmission(exam,lesson).valid,false);
 payload.answers=Array(10).fill(0);payload.answers[2]=1;exam.text_content=JSON.stringify(payload);
 assert.equal(ctx.auditLessonExamSubmission(exam,lesson).passed,false);
 payload.answers[2]=0;payload.evidence='curta';exam.text_content=JSON.stringify(payload);
 assert.equal(ctx.auditLessonExamSubmission(exam,lesson).valid,false);
});
test('reteste B exige prova A válida e reprovada',()=>{
 const {ctx,exam,lesson,payload,cache}=fixture();
 const b={...exam,id:'e2',submission_type:'lesson_exam_b',text_content:JSON.stringify({...payload,stage:'b',review:'Revisei a conduta e não prometerei prazo nem condição sem aprovação; vou confirmar as especificações e registrar o próximo contato.'})};
 cache.su.push(b);
 assert.equal(ctx.auditLessonExamSubmission(b,lesson).valid,false);
 payload.answers[2]=1;exam.text_content=JSON.stringify(payload);
 assert.equal(ctx.auditLessonExamSubmission(b,lesson).valid,true);
});
test('bloqueia prova com metadados alterados ou tentativa duplicada',()=>{
 const {ctx,exam,lesson,payload,cache}=fixture();
 payload.stage='b';exam.text_content=JSON.stringify(payload);
 assert.equal(ctx.auditLessonExamSubmission(exam,lesson).valid,false);
 payload.stage='a';payload.requires_manager_validation=false;exam.text_content=JSON.stringify(payload);
 assert.equal(ctx.auditLessonExamSubmission(exam,lesson).valid,false);
 payload.requires_manager_validation=true;exam.text_content=JSON.stringify(payload);
 assert.equal(ctx.auditLessonExamSubmission(exam,lesson).valid,true);
 cache.su.push({...exam,id:'e1-duplicada'});
 const audit=ctx.auditLessonExamSubmission(exam,lesson);
 assert.equal(audit.valid,false);
 assert.match(audit.reason,/duplicada/);
});
test('gestor recebe gabarito oficial sem permitir conclusão automática',()=>{
 assert.ok(html.includes("sb.from('lessons').select('id,code,title,content')"));
 assert.ok(html.includes('function auditLessonExamSubmission(s,l)'));
 const manager=html.slice(c,d);
 assert.ok(!manager.includes("sb.from('lesson_progress')"));
 assert.ok(!manager.includes("sb.from('submissions').update"));
 assert.ok(!manager.includes('certification'));
});
