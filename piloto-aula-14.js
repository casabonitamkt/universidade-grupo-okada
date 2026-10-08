const banks=[
[
["Abertura de ligação com projeto?",["Vender direto","Confirmar objetivo e projeto","Prometer desconto"],1,0],
["Medida não validada?",["Confirmar pelo vídeo","Solicitar confirmação","Assumir padrão"],1,1],
["Arquiteta participa?",["Ignorar","Validar com todos","Trocar sem aprovação"],1,1],
["Escuta ativa?",["Interromper","Resumir e confirmar","Falar sem parar"],1,0],
["Prazo Sierra sem fonte?",["Prometer","Estimar","Consultar e retornar"],2,1]
],
[
["Registro pós-chamada?",["Decisões, pendências e retorno","Só nome","Nada"],0,0],
["Alteração do projeto?",["Trocar","Pedir autorização","Assumir aprovação"],1,1],
["Planta e medida divergem?",["Adotar maior","Usar primeira","Confirmar documentado"],2,1],
["Objeção de investimento?",["Investigar valor","Dar desconto","Pressionar"],0,0],
["Encerramento?",["Prometer prazo","Não combinar","Confirmar próximo passo"],2,0]
]];
let round=0;
function show(){const b=banks[round];document.querySelector('#quiz').innerHTML=b.map((q,i)=>'<fieldset><legend>'+(i+1)+'. '+q[0]+(q[3]?' (crítica)':'')+'</legend>'+q[1].map((a,j)=>'<label><input type="radio" name="q'+i+'" value="'+j+'"> '+a+'</label>').join('')+'</fieldset>').join('');document.querySelector('#grade').disabled=false;document.querySelector('#retest').disabled=true;document.querySelector('#result').textContent='Prova '+(round?'B':'A')+' aguardando respostas.'}
function grade(){let score=0,critical=false,gaps=[];for(let i=0;i<5;i++){const a=document.querySelector('input[name="q'+i+'"]:checked');if(!a){document.querySelector('#result').textContent='Responda às cinco questões.';return}if(+a.value===banks[round][i][2])score+=2;else{gaps.push(banks[round][i][0]);critical ||= !!banks[round][i][3]}}const pass=score>=8&&!critical;document.querySelector('#result').textContent='Nota '+score+'/10. '+(pass?'Aprovado somente na simulação.':'Revisão obrigatória.')+(critical?' Erro crítico.':'')+(gaps.length?' Revisar: '+gaps.join('; '):'')+' Exercício escrito exige avaliação do gestor.';document.querySelector('#grade').disabled=true;document.querySelector('#retest').disabled=pass||round===1}
document.querySelector('#grade').onclick=grade;document.querySelector('#retest').onclick=()=>{round=1;show()};show();
