// Gate de regressao do painel REAL. Teste estatico, offline e somente leitura.
// Nao consulta Supabase, nao cria usuario e nao modifica progresso ou notas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const painel = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('consultor visualiza somente modulos e aulas publicados', () => {
  assert.ok(painel.includes("sb.from('modules').select('*').eq('is_published',true)"),
    'Modulo nao publicado nao pode aparecer na trilha real');
  assert.ok(painel.includes("sb.from('lessons').select('*').eq('is_published',true)"),
    'Aula nao publicada nao pode aparecer na trilha real');
});

test('progresso e entregas do consultor continuam restritos ao usuario autenticado', () => {
  assert.ok(painel.includes("sb.from('lesson_progress').select('*').eq('user_id',user.id)"));
  assert.ok(painel.includes("sb.from('submissions').select('*').eq('user_id',user.id)"));
});

test('biblioteca editorial de homologacao nao e importada pelo painel real', () => {
  assert.ok(!painel.includes('modules/trilha-90-dias'),
    'Importar a biblioteca editorial no painel real exige revisao e migracao explicita');
  assert.ok(!painel.includes('homologacao/trilha-90-dias'),
    'A pagina editorial nao deve substituir o treinamento autenticado');
});

test('conclusao real permanece vinculada a lesson_id, sem mapa implicito por dia editorial', () => {
  assert.ok(painel.includes("sb.from('lesson_progress').upsert({user_id:user.id,lesson_id:id"),
    'Mudanca de identificadores requer auditoria de integridade do progresso');
});

test('56 aulas legadas com minimum_score/retest_rule nao exigem prova A/B', () => {
  const start=painel.indexOf('function requiresLessonAssessment(');
  const end=painel.indexOf('let lessonExamSubmitting=',start);
  assert.ok(start>=0 && end>start,'Detector de prova ausente');
  const predicate=runInNewContext(painel.slice(start,end)+'\nrequiresLessonAssessment',{});
  assert.equal(predicate({content:{body:'Aula historica',minimum_score:8,retest_rule:'reforco orientado'}}),false);
  assert.equal(predicate({content:{body:'Aula historica'}}),false);
  assert.equal(predicate({content:{exam_required:true}}),true);
  assert.equal(predicate({content:{questions_a:[['Pergunta', ['A','B'],0,true]]}}),true);
  assert.equal(predicate({content:{questions_b:[['Pergunta', ['A','B'],0,true]]}}),true);
});
