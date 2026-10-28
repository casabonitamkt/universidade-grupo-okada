// Inventario unificado apenas editorial/offline: nenhuma integracao ao aluno real.
import test from 'node:test';
import assert from 'node:assert/strict';
import { AULAS_PILOTO, planoDia } from '../modules/trilha-90-dias.mjs';
import { AULAS_40_42 } from '../modules/trilha-90-dias-aulas-40-42.mjs';
import { AULAS_43_45 } from '../modules/trilha-90-dias-aulas-43-45.mjs';
import { AULAS_46_48 } from '../modules/trilha-90-dias-aulas-46-48.mjs';
import { AULAS_49_51 } from '../modules/trilha-90-dias-aulas-49-51.mjs';
import { AULAS_52_54 } from '../modules/trilha-90-dias-aulas-52-54.mjs';
import { AULAS_55_57 } from '../modules/trilha-90-dias-aulas-55-57.mjs';
import { AULAS_58_60 } from '../modules/trilha-90-dias-aulas-58-60.mjs';
import { AULAS_61_63 } from '../modules/trilha-90-dias-aulas-61-63.mjs';
import { AULAS_64_66 } from '../modules/trilha-90-dias-aulas-64-66.mjs';
import { AULAS_67_69 } from '../modules/trilha-90-dias-aulas-67-69.mjs';
import { AULAS_70_72 } from '../modules/trilha-90-dias-aulas-70-72.mjs';
import { AULAS_73_75 } from '../modules/trilha-90-dias-aulas-73-75.mjs';
import { AULAS_76_78 } from '../modules/trilha-90-dias-aulas-76-78.mjs';
import { AULAS_79_81 } from '../modules/trilha-90-dias-aulas-79-81.mjs';
import { AULAS_82_84 } from '../modules/trilha-90-dias-aulas-82-84.mjs';
import { AULAS_85_87 } from '../modules/trilha-90-dias-aulas-85-87.mjs';
import { AULAS_88_90 } from '../modules/trilha-90-dias-aulas-88-90.mjs';

const dias = (inicio, fim) => Array.from({length:fim-inicio+1}, (_,i)=>inicio+i);
const bibliotecas = [AULAS_40_42, AULAS_43_45, AULAS_46_48, AULAS_49_51, AULAS_52_54, AULAS_55_57, AULAS_58_60, AULAS_61_63, AULAS_64_66, AULAS_67_69, AULAS_70_72, AULAS_73_75, AULAS_76_78, AULAS_79_81, AULAS_82_84, AULAS_85_87, AULAS_88_90];

test('90 dias disponiveis editorialmente sem integrar dias 40-90 ao treinamento real', () => {
  const centrais = Object.keys(AULAS_PILOTO).map(Number).sort((a,b)=>a-b);
  assert.deepEqual(centrais, dias(1,39));
  const entradas = bibliotecas.flatMap(grupo => Object.entries(grupo));
  assert.equal(entradas.length, 51, '51 aulas editoriais isoladas dos dias 40-90');
  const isoladas = new Map(entradas.map(([dia,aula]) => [Number(dia), aula]));
  assert.equal(isoladas.size, entradas.length, 'Nenhum dia duplicado');
  assert.deepEqual([...isoladas.keys()].sort((a,b)=>a-b), dias(40,90));
  for (const dia of dias(1,39)) {
    assert.equal(planoDia(dia).estado, 'conteudo_para_revisao');
    assert.ok(planoDia(dia).conteudo);
  }
  for (const dia of dias(40,90)) {
    const plano = planoDia(dia);
    const aula = isoladas.get(dia);
    assert.equal(plano.estado, 'planejado', 'Biblioteca nao implica aula real publicada');
    assert.equal(plano.conteudo, null, 'Sem integracao ao aluno');
    if (dia >= 43) assert.equal(aula.titulo, plano.titulo, 'Tema divergente no dia '+dia);
    assert.equal(aula.aprender.length, 5, 'Aprender incompleto no dia '+dia);
    assert.equal(aula.provar.perguntas.length, 8, 'Prova incompleta no dia '+dia);
    assert.equal(aula.provar.criterios.length, 6, 'Rubrica incompleta no dia '+dia);
  }
  assert.equal(new Set([...centrais, ...isoladas.keys()]).size, 90);
});

test('marco final depende do gestor, nao da cobertura editorial', () => {
  const marco = planoDia(90);
  assert.equal(marco.estado, 'planejado');
  assert.equal(marco.conteudo, null);
  assert.ok(marco.marco.exige.some(item => /gestor/i.test(item)));
});
