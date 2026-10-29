import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const begin=html.indexOf('let lessonExamSubmitting=false;');
const end=html.indexOf('\nwindow.openLesson=id=>',begin);
assert.ok(begin>0&&end>begin,'Motor real de prova ausente');
const questions=(criticalIndex=2)=>Array.from({length:10},(_,i)=>['Pergunta '+(i+1),['A','B','C'],i%3,i===criticalIndex]);
function setup(opts={}){
 const rows=[],events=[],lesson={id:'aula-nova',code:'F1-D29-A01',content:{questions_a:questions(),questions_b:questions(5),minimum_score:8,aprender:'Estudo'}};
 const cache={less:[lesson],subs:[]};
 const state={answers:Array(10).fill(0),evidence:'Resposta consultiva segura, sem prometer descontos e com pendências, responsáveis e data de retorno acordados.',review:''};
 const dom={querySelector(sel){const i=Number(sel.match(/_(\d+)"/)?.[1]);return Number.isInteger(i)&&i<10?{value:String(state.answers[i])}:null}};
 const elements={lessonExamEvidence:{value:state.evidence},lessonExamReview:{value:state.review},lessonExamSubmit:{disabled:false}};
 const chain=()=>({eq(){return this},then(resolve){resolve({data:rows.map(x=>({...x})),error:null})}});
 const sb={from(table){events.push('from:'+table);assert.equal(table,'submissions','Nao gravar progresso ou notas');
  return{select(){return chain()},insert:async row=>{rows.push({...row,id:'attempt-'+rows.length,submitted_at:new Date(2026,9,29,12,0,rows.length).toISOString()});return{error:null}}};
 }};
 const ctx={cache,user:{id:'thiago'},document:dom,$:id=>elements[id],sb,toast:t=>events.push('toast:'+t),esc:x=>String(x),window:{openLesson:id=>events.push('open:'+id)},console};
 runInNewContext(html.slice(begin,end),ctx);
 return{ctx,rows,events,lesson,state,elements};
}
test('corrige 10 questoes, exige 8 e reprova por erro critico',()=>{
 const {ctx}=setup();
 const perfect=questions().map(q=>q[2]);
 assert.equal(ctx.gradeLessonExam(questions(),perfect).passed,true);
 const eight=perfect.slice();eight[0]=2;eight[1]=2;
 assert.equal(ctx.gradeLessonExam(questions(),eight).passed,true);
 const critical=perfect.slice();critical[2]=0;
 assert.equal(ctx.gradeLessonExam(questions(),critical).passed,false);
 assert.equal(ctx.gradeLessonExam(questions(),critical).critical,1);
 assert.equal(ctx.gradeLessonExam(questions(),perfect.slice(1)).valid,false);
});
test('renderiza prova A, reteste B com revisao, e estado pendente',()=>{
 const {ctx,lesson,rows}=setup();
 assert.match(ctx.renderLessonExam(lesson),/Prova A/);
 assert.match(ctx.renderLessonExam(lesson),/lessonExamEvidence/);
 assert.match(ctx.renderLessonExam(lesson),/Questão 10\/10/);
 rows.push({lesson_id:lesson.id,submission_type:'lesson_exam_a',submitted_at:'2026-10-29T12:00:00Z',text_content:JSON.stringify({answers:Array(10).fill(0)})});
 ctx.cache.subs=rows.slice();
 assert.match(ctx.renderLessonExam(lesson),/Reteste B/);
 assert.match(ctx.renderLessonExam(lesson),/lessonExamReview/);
 rows[0].text_content=JSON.stringify({answers:questions().map(q=>q[2])});
 ctx.cache.subs=rows.slice();
 assert.match(ctx.renderLessonExam(lesson),/Registro enviado para análise/);
 assert.doesNotMatch(ctx.renderLessonExam(lesson),/lessonExamSubmit/);
});
test('prova A exige evidencia e todas as respostas antes de qualquer escrita',async()=>{
 const {ctx,rows,state,events}=setup();
 state.evidence='curta';
 await ctx.submitLessonExam('aula-nova','a');
 assert.equal(rows.length,0);
 assert.equal(events.filter(e=>e==='from:submissions').length,0);
 state.evidence='Resposta consultiva segura, sem prometer descontos e com pendências, responsáveis e data de retorno acordados.';
 state.answers=questions().map(q=>q[2]);
 await ctx.submitLessonExam('aula-nova','a');
 assert.equal(rows.length,1);
 assert.equal(rows[0].submission_type,'lesson_exam_a');
 assert.equal(rows[0].status,'pending');
 assert.equal(JSON.parse(rows[0].text_content).preview_passed,true);
 assert.equal(ctx.cache.subs.length,1);
 await ctx.submitLessonExam('aula-nova','a');
 assert.equal(rows.length,1,'Nao duplicar prova A');
});
test('reteste B exige reprova A, revisao escrita e nao conclui aula',async()=>{
 const {ctx,rows,state,events}=setup();
 state.answers=Array(10).fill(0);
 await ctx.submitLessonExam('aula-nova','a');
 assert.equal(rows.length,1);
 assert.equal(JSON.parse(rows[0].text_content).preview_passed,false);
 state.answers=questions(5).map(q=>q[2]);
 await ctx.submitLessonExam('aula-nova','b');
 assert.equal(rows.length,1,'Sem revisao nao permite reteste');
 state.review='Identifiquei que não devo prometer condição comercial sem aprovação; vou confirmar a intenção do cliente, registrar pendências e consultar o gestor antes de responder.';
 await ctx.submitLessonExam('aula-nova','b');
 assert.equal(rows.length,2);
 assert.equal(rows[1].submission_type,'lesson_exam_b');
 assert.equal(rows[1].status,'pending');
 assert.equal(JSON.parse(rows[1].text_content).preview_passed,true);
 assert.equal(events.some(e=>e==='from:lesson_progress'),false);
});
test('indicadores de aulas sao dinamicos; fluxo historico de conclusao mantido',()=>{
 assert.ok(html.includes('done.size}/${cache.less.length} concluídas'));
 assert.ok(html.includes('pct(c,ls.length)'));
 assert.ok(html.includes("sb.from('lesson_progress').upsert({user_id:user.id,lesson_id:id"));
 assert.ok(html.includes("if(!lesson||requiresLessonAssessment(lesson))return toast"));
});
