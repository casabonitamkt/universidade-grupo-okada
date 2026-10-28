// Auditoria offline: distingue aulas no plano central de bibliotecas isoladas em homologacao.
// Nao acessa rede, Supabase, CRM, WhatsApp, usuarios, notas ou progresso.
import test from 'node:test';
import assert from 'node:assert/strict';
import { AULAS_PILOTO, planoDia } from '../modules/trilha-90-dias.mjs';
import { AULAS_67_69 } from '../modules/trilha-90-dias-aulas-67-69.mjs';
import { AULAS_70_72 } from '../modules/trilha-90-dias-aulas-70-72.mjs';
import { AULAS_73_75 } from '../modules/trilha-90-dias-aulas-73-75.mjs';
import { AULAS_76_78 } from '../modules/trilha-90-dias-aulas-76-78.mjs';
import { AULAS_79_81 } from '../modules/trilha-90-dias-aulas-79-81.mjs';
import { AULAS_82_84 } from '../modules/trilha-90-dias-aulas-82-84.mjs';
import { AULAS_85_87 } from '../modules/trilha-90-dias-aulas-85-87.mjs';
import { AULAS_88_90 } from '../modules/trilha-90-dias-aulas-88-90.mjs';

const dias = (inicio, fim) => Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);
const bibliotecas = [AULAS_67_69, AULAS_70_72, AULAS_73_75, AULAS_76_78,
  AULAS_79_81, AULAS_82_84, AULAS_85_87, AULAS_88_90];

test('inventario local: 1-39 no plano central, 67-90 isolados e 40-66 fora deste HEAD', () => {
  const centrais = Object.keys(AULAS_PILOTO).map(Number).sort((a, b) => a - b);
  assert.deepEqual(centrais, dias(1, 39));

  const entradas = bibliotecas.flatMap(grupo => Object.entries(grupo));
  assert.equal(entradas.length, 24, '24 aulas Sierra esperadas nos modulos isolados');
  const isoladas = new Map(entradas.map(([dia, aula]) => [Number(dia), aula]));
  assert.equal(isoladas.size, entradas.length, 'Nenhum dia Sierra duplicado');
  assert.deepEqual([...isoladas.keys()].sort((a, b) => a - b), dias(67, 90));

  for (const dia of dias(1, 39)) {
    assert.equal(planoDia(dia).estado, 'conteudo_para_revisao');
    assert.ok(planoDia(dia).conteudo);
  }
  for (const dia of dias(40, 66)) {
    assert.equal(planoDia(dia).estado, 'planejado');
    assert.equal(planoDia(dia).conteudo, null);
  }
  for (const dia of dias(67, 90)) {
    const aula = isoladas.get(dia);
    assert.equal(planoDia(dia).estado, 'planejado', 'Biblioteca isolada nao equivale a integracao');
    assert.equal(planoDia(dia).conteudo, null);
    assert.equal(aula.titulo, planoDia(dia).titulo);
    assert.equal(aula.aprender.length, 5);
    assert.equal(aula.provar.perguntas.length, 8);
    assert.equal(aula.provar.criterios.length, 6);
  }
  const coberturaLocal = new Set([...centrais, ...isoladas.keys()]);
  assert.equal(coberturaLocal.size, 63);
  assert.deepEqual(dias(1, 90).filter(dia => !coberturaLocal.has(dia)), dias(40, 66));
});

test('inventario nao emite prontidao ou certificacao por contagem editorial', () => {
  const marco = planoDia(90);
  assert.equal(marco.estado, 'planejado');
  assert.equal(marco.conteudo, null);
  assert.ok(marco.marco.exige.some(item => /gestor/i.test(item)));
});
