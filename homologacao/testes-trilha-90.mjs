import assert from 'node:assert/strict';
import {planoDia,questoesPara,corrigirProva,avaliarMarco} from '../modules/trilha-90-dias.mjs';

// Testes de lógica local: NÃO substituem teste autenticado aluno/gestor ou gravação Supabase.
let checks=0;
for(let dia=1;dia<=4;dia++){
  const aula=planoDia(dia);
  assert.ok(aula.conteudo,'aula '+dia+' disponível');
  assert.deepEqual(aula.etapas,['APRENDER','DEMONSTRAR','PRATICAR','PROVAR']);
  for(let versao=0;versao<6;versao++){
    const qs=questoesPara(dia,versao);
    assert.equal(qs.length,8);
    assert.equal(new Set(qs.map(x=>x.enunciado)).size,8);
    const gabarito=qs.map((_,i)=>(versao+i)%4);
    const nota10=corrigirProva(dia,gabarito,versao);
    assert.equal(nota10.nota,10);
    assert.equal(nota10.aprovado,true);
    const nota88=[...gabarito];nota88[0]=(nota88[0]+1)%4;
    const aprovado=corrigirProva(dia,nota88,versao);
    assert.equal(aprovado.nota,8.8);
    assert.equal(aprovado.aprovado,true);
    const nota75=[...nota88];nota75[1]=(nota75[1]+1)%4;
    const reprovado=corrigirProva(dia,nota75,versao);
    assert.equal(reprovado.nota,7.5);
    assert.equal(reprovado.aprovado,false);
    const novo=questoesPara(dia,versao+1);
    assert.notEqual(qs[0].enunciado,novo[0].enunciado,'reteste consecutivo precisa mudar');
    checks++;
  }
}
assert.equal(planoDia(90).conteudo,null,'dia 90 ainda não homologado');
assert.equal(avaliarMarco(90,{}).certificado,false);
console.log('OK: '+checks+' cenários de provas em 4 aulas e validações de certificação.');
console.log('PENDENTE: E2E com login real, persistência e painel do gestor.');
