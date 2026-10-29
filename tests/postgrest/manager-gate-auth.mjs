// Teste HTTP autenticado em PostgREST + PostgreSQL 16 descartaveis.
// Nunca usa tokens, projetos, dados ou endpoints da producao.
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

const BASE = process.env.TEST_POSTGREST_URL || 'http://127.0.0.1:3000';
const SECRET = process.env.TEST_JWT_SECRET;
assert.ok(SECRET?.length >= 32, 'TEST_JWT_SECRET deve ser ficticio e ter >=32 caracteres');

const consultant='11111111-1111-4111-8111-111111111111';
const manager='22222222-2222-4222-8222-222222222222';
const exam='44444444-4444-4444-8444-444444444444';
const retest='66666666-6666-4666-8666-666666666666';
const exposed='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const milestone='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const strictScore='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const evidence='Pratica ficticia detalhada: acolhimento, diagnostico, investimento, prazo e retorno combinado.';

function token(sub, role='authenticated') {
 const head=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
 const body=Buffer.from(JSON.stringify({role,sub,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+1800})).toString('base64url');
 const sig=createHmac('sha256',SECRET).update(head+'.'+body).digest('base64url');
 return head+'.'+body+'.'+sig;
}
const consultantToken=token(consultant);
const managerToken=token(manager);
const noAuth=null;
async function api(path,method='GET',payload,auth=consultantToken){
 const headers={'Accept':'application/json','Content-Type':'application/json','Prefer':'return=representation'};
 if(auth)headers.Authorization='Bearer '+auth;
 const response=await fetch(BASE+path,{method,headers,body:payload===undefined?undefined:JSON.stringify(payload)});
 const raw=await response.text();
 let data;
 try{data=raw?JSON.parse(raw):null;}catch{data=raw;}
 return {status:response.status,data,raw};
}
function ok(r,label,expected){
 assert.ok(r.status>=200&&r.status<300,label+': HTTP '+r.status+' '+r.raw);
 if(expected!==undefined)assert.equal(r.status,expected,label+': HTTP inesperado');
 return r.data;
}
function blocked(r,label){
 assert.ok(r.status>=400&&r.status<500,label+' deveria ser bloqueado; HTTP '+r.status+' '+r.raw);
}
const rpc=(name,body,auth)=>api('/rpc/'+name,'POST',body,auth);
const aBody=(answers=[0,0,0,0,0,0,0,0,0,0])=>JSON.stringify({version:1,stage:'a',requires_manager_validation:true,answers,evidence});
const bBody=()=>JSON.stringify({version:1,stage:'b',requires_manager_validation:true,answers:[0,0,0,0,0,0,0,0,0,0],review:evidence+' Revi todos os erros e a conduta correta.'});
const review=(id,decision,score,approved,feedback,auth=managerToken)=>rpc('training_review_exam',{
 p_submission_id:id,p_decision:decision,p_practice_score:score,
 p_practice_approved:approved,p_feedback:feedback
},auth);

console.log('Iniciando homologacao HTTP JWT/RLS com dois usuarios ficticios');
let r=await api('/lessons?select=code,content&code=eq.EXAM-APROVA');
let lessons=ok(r,'Leitura de aula por consultor');
assert.equal(lessons.length,1);
assert.equal(lessons[0].content.exam_required,true);
assert.equal(lessons[0].content.questions_a,undefined);
assert.equal(lessons[0].content.questions_b,undefined);

// Regressao HTTP: aula legada com pass_score=9 nao pode aprovar 8/10.
r=await rpc('training_exam_questions',{p_lesson_id:strictScore,p_stage:'a'});
assert.equal(ok(r,'Questões da aula com nota minima 9').length,10);
r=await api('/submissions','POST',{
 user_id:consultant,lesson_id:strictScore,submission_type:'lesson_exam_a',status:'pending',
 text_content:aBody([0,0,0,0,0,0,0,0,1,1])
});
const strictExam=ok(r,'Prova de 8/10 contra pass_score 9',201)[0];
r=await rpc('training_exam_audit',{p_submission_id:strictExam.id},managerToken);
const strictGrade=ok(r,'Gestor audita limite 9/10');
assert.equal(strictGrade.score,8);
assert.equal(strictGrade.critical,0);
assert.equal(strictGrade.passed,false);
blocked(await review(strictExam.id,'approve',10,true,
 'Nota 8 nao pode ser aprovada quando a aula exige 9.'),'Limite 9/10 nao pode ser burlado');

blocked(await rpc('training_exam_questions',{p_lesson_id:exam,p_stage:'a'},noAuth),'Anonimo nao recebe questoes');
blocked(await rpc('training_exam_questions',{p_lesson_id:exposed,p_stage:'a'}),'Prova ja exposta');
blocked(await rpc('training_exam_questions',{p_lesson_id:retest,p_stage:null}),'Stage nulo');
blocked(await rpc('training_exam_questions',{p_lesson_id:retest,p_stage:'b'}),'Reteste prematuro');
r=await rpc('training_exam_questions',{p_lesson_id:exam,p_stage:'a'});
const questions=ok(r,'Consultor recebe apenas questoes A');
assert.equal(questions.length,10);
assert.ok(questions.every(q=>Array.isArray(q)&&q.length===2),'Questao nao pode incluir gabarito/criticidade');

blocked(await api('/profiles?id=eq.'+consultant,'PATCH',{role:'admin'}),'Escalada consultant->admin');
r=await api('/profiles?select=role&id=eq.'+consultant);
assert.equal(ok(r,'Perfil permanece consultant')[0].role,'consultant');

blocked(await api('/lesson_progress','POST',{user_id:consultant,lesson_id:exam,status:'completed',completed_at:new Date().toISOString()}),'Conclusao direta');
blocked(await api('/submissions','POST',{user_id:consultant,lesson_id:exam,submission_type:'lesson_exam_a',status:'approved',text_content:aBody()}),'Falsificar aprovacao');
blocked(await api('/submissions','POST',{user_id:manager,lesson_id:exam,submission_type:'lesson_exam_a',status:'pending',text_content:aBody()}),'Falsificar outro usuario');

r=await api('/submissions','POST',{user_id:consultant,lesson_id:exam,submission_type:'lesson_exam_a',status:'pending',text_content:aBody()});
const submitted=ok(r,'Enviar prova A legitima',201);
assert.equal(submitted.length,1);
const id=submitted[0].id;
blocked(await api('/submissions','POST',{user_id:consultant,lesson_id:exam,submission_type:'lesson_exam_a',text_content:aBody()}),'Duplicar prova A');
r=await api('/submissions?id=eq.'+id,'PATCH',{status:'approved',reviewer_feedback:'Falsificado'});
assert.ok(r.status<300||r.status===403,'PATCH do consultor retornou status inesperado: '+r.status);
r=await api('/submissions?select=status&id=eq.'+id);
assert.equal(ok(r,'Status de prova continua pendente')[0].status,'pending');
blocked(await rpc('training_exam_audit',{p_submission_id:id}),'Consultor nao pode consultar nota');
blocked(await review(id,'approve',10,true,'Tentativa de aprovar sem gestor. ',consultantToken),'Consultor nao pode aprovar');
blocked(await review(id,'approve',10,true,'JWT role nao equivale a perfil de gestor.',token(consultant,'authenticated')),'Perfil consultant nao vira gestor via token');
r=await rpc('training_exam_audit',{p_submission_id:id},managerToken);
assert.equal(ok(r,'Gestor audita teoria').passed,true);
r=await review(id,'approve',9,true,'Pratica observada e validada pelo gestor ficticio.');
assert.equal(ok(r,'Gestor conclui em transacao').completed,true);
r=await api('/lesson_progress?select=status,completed_at&lesson_id=eq.'+exam);
const progress=ok(r,'Consultor consulta conclusao');
assert.equal(progress[0].status,'completed');
assert.ok(progress[0].completed_at);
r=await api('/lesson_progress?lesson_id=eq.'+exam,'DELETE',undefined);
assert.ok(r.status<300||r.status===403,'DELETE inesperado: '+r.status);
r=await api('/lesson_progress?select=status&lesson_id=eq.'+exam);
assert.equal(ok(r,'Conclusao preservada apos DELETE negado por RLS')[0].status,'completed');
blocked(await review(id,'approve',9,true,'Tentativa duplicada de aprovar conclusao.'),'Gestor nao duplica decisao');

r=await api('/submissions','POST',{user_id:consultant,lesson_id:retest,submission_type:'lesson_exam_a',status:'pending',text_content:aBody([1,0,0,0,0,0,0,0,0,0])});
const failA=ok(r,'Enviar prova A com erro critico',201)[0];
r=await rpc('training_exam_audit',{p_submission_id:failA.id},managerToken);
const grade=ok(r,'Auditoria de erro critico');
assert.equal(grade.passed,false);
assert.equal(grade.critical,1);
blocked(await review(failA.id,'approve',10,true,'Tentativa indevida de aprovar erro critico.'),'Erro critico bloqueia aprovacao');
r=await review(failA.id,'needs_revision',6,false,'Revisao gerencial de erro critico, precisa refazer.');
assert.equal(ok(r,'Gestor libera reforco').status,'needs_revision');
r=await rpc('training_exam_questions',{p_lesson_id:retest,p_stage:'b'});
const bQuestions=ok(r,'Reteste B autorizado');
assert.equal(bQuestions.length,10);
assert.ok(bQuestions.every(q=>q.length===2));
r=await api('/submissions','POST',{user_id:consultant,lesson_id:retest,submission_type:'lesson_exam_b',status:'pending',text_content:bBody()});
const submittedB=ok(r,'Reteste B enviado',201)[0];
r=await review(submittedB.id,'approve',9,true,'Reteste B e pratica validados pelo gestor ficticio.');
assert.equal(ok(r,'Gestor aprova reteste B').completed,true);
r=await api('/lesson_progress?select=status&lesson_id=eq.'+retest);
assert.equal(ok(r,'Conclusao apos B')[0].status,'completed');

// Marco 30: duas simulacoes, notas individuais, evidencias e erro critico.
r=await api('/submissions','POST',{user_id:consultant,lesson_id:milestone,submission_type:'lesson_exam_a',status:'pending',text_content:aBody()});
const markA=ok(r,'Enviar prova A do Marco 30',201)[0];
blocked(await review(markA.id,'approve',9,true,'Sem duas simulacoes independentes.'),'Marco 30 sem casos');
const caseProject={case:'project',score:9,critical_error:false,evidence:evidence+' Projeto completo, arquiteto e circulacao validados.'};
const casePiece={case:'piece',score:8,critical_error:false,evidence:evidence+' Peca avulsa, medidas e uso confirmados.'};
blocked(await rpc('training_review_exam',{
 p_submission_id:markA.id,p_decision:'approve',p_practice_score:8,
 p_practice_approved:true,p_feedback:'Uma simulacao nao atende ao Marco 30.',
 p_practice_cases:[caseProject]
},managerToken),'Marco 30 com uma simulacao');
blocked(await rpc('training_review_exam',{
 p_submission_id:markA.id,p_decision:'approve',p_practice_score:8,
 p_practice_approved:true,p_feedback:'Erro critico em simulacao impede aprovacao.',
 p_practice_cases:[caseProject,{...casePiece,critical_error:true}]
},managerToken),'Marco 30 com erro critico');
r=await rpc('training_review_exam',{
 p_submission_id:markA.id,p_decision:'approve',p_practice_score:8,
 p_practice_approved:true,p_feedback:'Duas simulacoes observadas, ambas aprovadas pelo gestor.',
 p_practice_cases:[caseProject,casePiece]
},managerToken);
assert.equal(ok(r,'Marco 30 aprovado com duas simulacoes').completed,true);
r=await api('/lesson_progress?select=status&lesson_id=eq.'+milestone);
assert.equal(ok(r,'Conclusao Marco 30')[0].status,'completed');

blocked(await api('/exam_banks?select=*'),'Tabela privada nao exposta');
blocked(await rpc('training_exam_audit',{p_submission_id:id},noAuth),'Anonimo nao acessa auditoria');
const parts=consultantToken.split('.');
const badToken=parts[0]+'.'+parts[1]+'.'+(parts[2][0]==='a'?'b':'a')+parts[2].slice(1);
blocked(await api('/lessons?select=code','GET',undefined,badToken),'Assinatura JWT invalida');
console.log('GATE POSTGREST AUTENTICADO APROVADO: JWT consultant/admin, RLS, gabarito, A/B, pratica, imutabilidade e historico.');
