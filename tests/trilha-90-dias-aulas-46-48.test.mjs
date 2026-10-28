// Regressão editorial offline: conteúdo 46–48 não altera treinamento nem CRM real.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AULAS_46_48 } from '../modules/trilha-90-dias-aulas-46-48.mjs';
import { planoDia } from '../modules/trilha-90-dias.mjs';

test('46–48: três aulas completas com exemplos, prática e oito questões únicas', () => {
  assert.deepEqual(Object.keys(AULAS_46_48), ['46','47','48']);
  const enunciados = [];
  for (const dia of [46,47,48]) {
    const aula = AULAS_46_48[dia];
    assert.ok(aula.objetivo.length > 85);
    assert.equal(aula.aprender.length, 5);
    assert.ok(aula.aprender.every(x => x.length >= 270));
    for (const campo of ['certo','errado','porQue']) assert.ok(aula.demonstrar[campo].length > 70);
    for (const campo of ['cenario','tarefa']) assert.ok(aula.praticar[campo].length > 90);
    assert.equal(aula.provar.criterios.length, 6);
    assert.equal(aula.provar.perguntas.length, 8);
    for (const q of aula.provar.perguntas) {
      assert.equal(q.length,5);
      assert.equal(new Set(q.slice(1).map(x => x.toLocaleLowerCase('pt-BR'))).size,4);
      assert.ok(q.every(x => typeof x === 'string' && x.length > 8));
      enunciados.push(q[0]);
    }
    assert.equal(planoDia(dia).estado, 'planejado');
    assert.equal(planoDia(dia).conteudo, null);
  }
  assert.equal(new Set(enunciados).size, 24);
});
test('46–48: sem rede, banco, WhatsApp, credenciais ou persistência', async () => {
  const src = await readFile(new URL('../modules/trilha-90-dias-aulas-46-48.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(src,/supabase|fetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|service_role|z-api|zappy|wa\.me\//i);
  assert.doesNotMatch(src,/\bimport\s+.*from\s+['"]https?:/i);
});
