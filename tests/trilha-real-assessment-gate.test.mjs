// Regressao offline do bloqueio de conclusao no painel autenticado.
// Nao acessa Supabase, nao usa credenciais e nao escreve progresso real.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('function requiresLessonAssessment(l){');
const end = html.indexOf('\nlet lessonExamSubmitting=false;', start);
assert.ok(start > 0 && end > start, 'Gate de avaliacao ausente');
const requiresLessonAssessment = runInNewContext('(' + html.slice(start, end) + ')');

test('aulas historicas sem prova continuam no fluxo anterior', () => {
  assert.equal(requiresLessonAssessment({ content: { body: 'Aula historica', mission: 'Pratica' } }), false);
  assert.equal(requiresLessonAssessment({ content: {} }), false);
  assert.ok(html.includes("sb.from('lesson_progress').upsert({user_id:user.id,lesson_id:id"));
});

test('qualquer prova ou reteste cadastrado bloqueia conclusao direta', () => {
  for (const content of [
    { questions_a: [] }, { questions_b: [] }, { exam_required: true }, { minimum_score: 8 }, { retest_rule: 'Revisao escrita' }
  ]) assert.equal(requiresLessonAssessment({ content }), true);
});

test('botao de concluir e evidencia ficam ocultos para aulas com prova', () => {
  assert.ok(html.includes("noEvidence||requiresLessonAssessment(l)?''"));
  assert.ok(html.includes("requiresLessonAssessment(l)?renderLessonExam(l)"));
});

test('tentativa direta de concluir aula com prova nao escreve no banco', async () => {
  const begin = html.indexOf('async function completeLesson(');
  const finish = html.indexOf('\nfunction trackAIUsage(', begin);
  assert.ok(begin > 0 && finish > begin);
  const calls = [];
  const ctx = {
    cache: { less: [{ id: 'nova', content: { questions_a: [], minimum_score: 8 } }] },
    lessonCompleting: false,
    requiresLessonAssessment,
    toast: message => calls.push(['toast', message]),
    sb: { from: () => { throw new Error('Tentativa indevida de acesso ao banco'); } },
    $: () => { throw new Error('Tentativa indevida de acessar formulario'); }
  };
  runInNewContext(html.slice(begin, finish), ctx);
  await ctx.completeLesson('nova', '', true);
  assert.equal(calls.length, 1);
  assert.match(calls[0][1], /conclusão bloqueada/i);
  assert.equal(ctx.lessonCompleting, false);
});
