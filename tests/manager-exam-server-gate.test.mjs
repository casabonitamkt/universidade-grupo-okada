import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const sql=readFileSync(new URL('../security/manager_exam_gate.sql',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('provas novas nao podem ser alteradas, removidas ou concluidas diretamente',()=>{
 assert.match(sql,/CREATE TRIGGER lesson_exam_submission_guard/);
 assert.match(sql,/BEFORE INSERT OR UPDATE OR DELETE ON public\.submissions/);
 assert.match(sql,/CREATE TRIGGER exam_lesson_progress_guard/);
 assert.match(sql,/BEFORE INSERT OR UPDATE ON public\.lesson_progress/);
 assert.match(sql,/current_user <> 'postgres'/);
 assert.match(sql,/CREATE UNIQUE INDEX IF NOT EXISTS submissions_one_exam_stage_per_lesson/);
 assert.match(sql,/WHERE submission_type IN \('lesson_exam_a','lesson_exam_b'\)/);
});
test('fluxo gerencial usa autorizacao real e reconta gabarito no banco',()=>{
 assert.match(sql,/SECURITY DEFINER SET search_path = ''/);
 assert.match(sql,/FROM public\.profiles WHERE id=manager_id AND role='admin'/);
 assert.match(sql,/grade:=public\.grade_exam_answers/);
 assert.match(sql,/prior_grade:=public\.grade_exam_answers/);
 assert.match(sql,/IF grade->'passed'='true'::jsonb AND p_practice_approved THEN/);
 assert.match(sql,/ON CONFLICT\(user_id,lesson_id\) DO UPDATE/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.manager_review_lesson_exam\(uuid,boolean,text\) FROM PUBLIC,anon/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.manager_review_lesson_exam\(uuid,boolean,text\) TO authenticated/);
});
test('painel so registra decisao via RPC, sem escrita direta de conclusao',()=>{
 const start=html.indexOf('window.reviewLessonExam=async(id)=>');
 const end=html.indexOf('\nfunction renderReviews(){',start);
 assert.ok(start>0&&end>start);
 const fn=html.slice(start,end);
 assert.match(fn,/sb\.rpc\('manager_review_lesson_exam'/);
 assert.doesNotMatch(fn,/sb\.from\('lesson_progress'\)/);
 assert.doesNotMatch(fn,/sb\.from\('submissions'\)/);
});
test('gestor envia pratica e feedback ao RPC, sem aceitar feedback curto',async()=>{
 const start=html.indexOf('window.reviewLessonExam=async(id)=>');
 const end=html.indexOf('\nfunction renderReviews(){',start);
 const calls=[],ctx={
  cache:{su:[{id:'exam-1',status:'pending'}]},
  $:id=>id.startsWith('exam-practice-')?{checked:true}:{value:'Pratica observada, sem promessas nao autorizadas.'},
  confirm:()=>true,
  sb:{rpc:async(name,payload)=>{calls.push({name,payload});return{data:{decision:'approved'},error:null}}},
  toast:message=>calls.push({message}),
  loadAdmin:async()=>calls.push({loaded:true})
 };
 runInNewContext(html.slice(start,end),ctx);
 await ctx.reviewLessonExam('exam-1');
 assert.equal(calls[0].name,'manager_review_lesson_exam');
 assert.equal(calls[0].payload.p_practice_approved,true);
 assert.equal(calls[0].payload.p_submission_id,'exam-1');
 assert.equal(calls[0].payload.p_feedback,'Pratica observada, sem promessas nao autorizadas.');
});
