/* Universidade Casa Bonita + Móveis Modernos · integração segura V29.
   Somente apresentação e prática local. Não altera banco, RLS, avaliações oficiais ou mensagens. */
(function(){
'use strict';
if(window.CBV29)return;
const VIDEO_PAGE='https://app.heygen.com/videos/ad4b2aae4e512a579e4a654b880ecefd';
const MOTIV_PAGE='https://app.heygen.com/videos/cc58253e3af2d0ee8ba2417d6f8372c0';
const THEMES=[
'Postura de atendimento premium','Primeira abordagem sem pressão','Projeto completo ou peça avulsa','Solicitar foto, projeto e medidas','Identificar cidade e logística','Prazo e momento da obra','Orçamento com respeito','Confirmar participação de arquiteto','Entender uso do ambiente','Rotina e perfil da família','Materiais e preferências','Estética e referências','Escuta ativa e síntese','Confirmar entendimento do briefing','Erros comuns do diagnóstico','Construir primeira opção coerente','Apresentação sem excesso de alternativas','Proposta organizada por ambientes','Como explicar valor percebido','Registro correto no CRM','Definir próximo contato','Follow-up consultivo','Comunicação profissional no WhatsApp','Quando usar ligação ou vídeo','Objeções iniciais sem desconto','Pós-venda como continuidade','Solicitar indicação com elegância','Simulação completa de atendimento','Revisão direcionada das lacunas','MARCO 30: prova e simulação',
'Ler projeto e identificar necessidades','Reunião de alinhamento com arquiteto','Escopo por ambiente','Priorização de ambientes','Interpretação de medidas e restrições','Perguntas para eliminar ambiguidades','Organizar referências e materiais','Confirmar autorização de alterações','Mapear opções e justificativas','Solicitar orçamento concorrente quando adequado','Apresentação comparativa responsável','Roteiro de proposta consultiva','Storytelling de ambiente','Apresentação por ligação e vídeo','Negociação baseada em critérios','Objeção de preço','Objeção de prazo','Objeção de materiais','Objeção de concorrência','Cliente sem retorno após proposta','Plano de recuperação de oportunidades','Gestão de múltiplos decisores','Follow-up com arquiteto','Condução de oportunidades acima de R$50 mil','Registro de objeções e próxima ação','Previsibilidade do pipeline','Simulação de negociação avançada','Revisão de competências fracas','Estudo de caso com projeto completo','MARCO 60: avaliação prática',
'Padrão de atendimento Sierra: fontes autorizadas','Catálogos Sierra autorizados: navegação','Limites de conhecimento e confirmação','Briefing aplicado ao contexto Sierra','Projeto e especificação com arquiteto','Perguntas técnicas sem improvisação','Conferência de medidas do projeto','Confirmar acabamentos em fontes oficiais','Regras de proposta e autorização','Condições comerciais somente aprovadas','Preparar reunião de apresentação','Argumentação baseada no briefing','Conduzir dúvidas técnicas com segurança','Encaminhar pergunta não respondida','Cliente compara alternativas','Objeção de investimento sem inventar desconto','Objeção de prazo com verificação','Proposta por ambientes no padrão da loja','Condução do follow-up Sierra','Recuperar proposta sem resposta','Relacionamento com arquitetos parceiros','Registro completo e rastreável no CRM','Simulação com projeto autorizado','Simulação com peça avulsa','Avaliação técnica com fonte autorizada','Avaliação de negociação','Avaliação de pós-venda','Revisão individual dirigida','Banca prática do gestor','MARCO 90: decisão de prontidão Sierra'
];
const QUIZZES=[
[
['Qual a primeira atitude antes de sugerir um produto?',['Confirmar projeto ou fotos e medidas','Oferecer desconto','Enviar o catálogo inteiro'],0,1],
['O cliente tem arquiteto. Como proceder?',['Ignorar o projeto','Alinhar com o profissional e respeitar a especificação','Trocar por produto similar'],1,1],
['Qual pergunta define o escopo?',['É projeto completo ou peça específica?','Deseja parcelar?','Você conhece a loja?'],0,0],
['Por que perguntar a cidade?',['Para considerar logística e atendimento','Para limitar o atendimento','Não é necessário'],0,0],
['Como investigar investimento?',['Exigir valor exato','Perguntar com respeito sobre a faixa prevista','Adivinhar pelo perfil'],1,0],
['Se faltam medidas, a consultora deve...',['Prometer encaixe','Escolher a maior peça','Solicitar medidas antes de especificar'],2,1],
['O que demonstra escuta ativa?',['Resumir e confirmar o entendimento','Interromper para mostrar produto','Mudar de assunto'],0,0],
['Quando apresentar a primeira opção?',['Após diagnóstico validado','No primeiro segundo','Somente após desconto'],0,0],
['Qual é um próximo passo adequado?',['Registrar data e ação combinadas','Esperar sem prazo','Enviar mensagens automaticamente'],0,0],
['Concluir a aula significa...',['Estar certificado Sierra','Concluir uma etapa, sem certificação automática','Ter alçada de descontos'],1,1]
],
[
['O cliente pede alteração em peça especificada. Você...',['Troca sem consultar','Confirma autorização do cliente e profissional responsável','Promete qualquer acabamento'],1,1],
['Qual informação pertence ao briefing?',['Uso, cidade, prazo e projeto/medidas','Só o primeiro nome','Somente o estilo'],0,0],
['Sem projeto, qual caminho?',['Pedir fotos e medidas','Escolher por suposição','Encerrar o atendimento'],0,1],
['Qual a melhor abordagem para arquiteto?',['Ignorar','Alterar a especificação','Alinhar expectativas e validar alterações'],2,1],
['Para que serve a pergunta sobre prazo?',['Criar urgência falsa','Entender obra, mudança e expectativas','Prometer entrega'],1,0],
['Como abordar orçamento?',['Com cuidado, para selecionar opções coerentes','Com pressão','Não abordar nunca'],0,0],
['Como demonstrar valor?',['Oferecendo dezenas de peças','Conectando proposta ao uso e ao projeto','Improvisando desconto'],1,0],
['Se não conhece uma informação técnica...',['Inventa','Confirma em material autorizado','Ignora o cliente'],1,1],
['O que deve ser registrado?',['Contexto e próximo contato','Somente o nome','Nada'],0,0],
['Uma boa nota na prova libera Sierra automaticamente?',['Sim','Não, exige prática e validação gerencial','Sim, após 90 dias'],1,1]
]
];
function e(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n}
function getCache(){try{return typeof cache==='undefined'?null:cache}catch(_){return null}}
function getProfile(){try{return typeof profile==='undefined'?null:profile}catch(_){return null}}
function getDay(l){const m=String(l.code||'').match(/S1-D(\d+)-A01/);return m?Number(m[1]):null}
function renderMap(){
 const box=document.getElementById('plano'),data=getCache();if(!box||!data||box.querySelector('#cbv29-map'))return;
 const card=e('div','card');card.id='cbv29-map';card.style.marginTop='12px';
 card.append(e('h3','', 'Jornada de 90 dias · plano de formação e disponibilidade real'),e('p','mut','Os dias planejados não equivalem a aulas publicadas. Apenas os sete primeiros dias possuem módulos oficiais neste momento. A conclusão não concede certificação.'));
 const grid=e('div','cbv29-grid');
 for(let i=1;i<=90;i++){
   const l=(data.less||[]).find(x=>getDay(x)===i),item=e('div','feature cbv29-day'),phase=i<=30?'Fundamentos':i<=60?'Avançado':'Sierra';
   item.append(e('b','', 'Dia '+i+' · '+phase),e('p','mut',THEMES[i-1]));
   if(i===30||i===60||i===90)item.append(e('small','', 'Marco: nota ≥ 8, prática observada, sem falha crítica e validação do gestor.'));
   const btn=e('button','btn ghost tiny',l?'Abrir aula publicada':'Conteúdo planejado');btn.type='button';btn.disabled=!l;
   if(l)btn.addEventListener('click',()=>{window.showSec('aulas');window.openLesson(l.id)});
   item.append(btn);grid.append(item);
 }
 card.append(grid);box.append(card);
}
function addVideo(parent,page,label){
 const link=e('a','btn ghost tiny',label);link.href=page;link.target='_blank';link.rel='noopener noreferrer';parent.append(link);
}
function opening(){
 const box=document.getElementById('brunoOpening');if(!box||box.querySelector('#cbv29-opening-note'))return;
 const note=e('div','mut');note.id='cbv29-opening-note';note.style.marginTop='12px';
 note.append(e('p','', 'Vídeo real do Bruno disponível para assistir. A frase diária muda em texto; ainda não existe narração gerada para cada nova frase.'));
 addVideo(note,MOTIV_PAGE,'Assistir à mensagem real do Bruno');
 box.querySelector('div:last-child')?.append(note);
 const video=box.querySelector('video');if(video){video.autoplay=false;video.preload='none';video.removeAttribute('autoplay');}
}
function renderQuiz(host,attempt){
 host.replaceChildren();host.append(e('h3','', 'PROVAR · '+(attempt?'reteste diferente':'avaliação formativa')));
 host.append(e('p','mut','10 questões, nota mínima 8 e nenhum erro crítico. A prova é local e não registra aprovação oficial.'));
 const form=e('form');const questions=QUIZZES[attempt];
 questions.forEach((q,i)=>{const fs=e('fieldset','cbv29-question');fs.append(e('legend','',(i+1)+'. '+q[0]+(q[3]?' · CRÍTICA':'')));
 q[1].forEach((opt,j)=>{const label=e('label');const input=e('input');input.type='radio';input.name='q'+i;input.value=String(j);label.append(input,document.createTextNode(' '+opt));fs.append(label)});form.append(fs)});
 const b=e('button','btn','Corrigir avaliação');b.type='submit';form.append(b);
 form.addEventListener('submit',ev=>{ev.preventDefault();let score=0,critical=false,errors=[];for(let i=0;i<questions.length;i++){
  const q=questions[i],ans=form.querySelector('input[name="q'+i+'"]:checked');if(!ans){const old=host.querySelector('.cbv29-missing');if(!old)host.append(e('p','cbv29-missing','Responda todas as dez questões.'));return}
  if(Number(ans.value)===q[2])score++;else{errors.push((i+1)+'. Revisar: '+q[1][q[2]]);if(q[3])critical=true}
 }
 const ok=score>=8&&!critical;host.replaceChildren(e('h3','',score+'/10 · '+(ok?'Aprovado na prática local':'Revisão direcionada necessária')));
 host.append(e('p','mut',ok?'A nota local não substitui avaliação oficial nem certificação.':'Revise os conceitos antes de tentar novamente.'));
 errors.forEach(t=>host.append(e('p','',t)));
 if(!ok&&attempt===0){const retry=e('button','btn','Refazer com perguntas diferentes');retry.addEventListener('click',()=>renderQuiz(host,1));host.append(retry)}
 });
 host.append(form);
}
function enrichLesson(id){
 const box=document.getElementById('lessonBox'),data=getCache();if(!box||!data||box.querySelector('#cbv29-deep'))return;
 const l=(data.less||[]).find(x=>x.id===id);if(!l||String(l.code)!=='S1-D1-A01')return;
 const root=e('div','card');root.id='cbv29-deep';root.style.marginTop='14px';
 root.append(e('h3','', 'Aprofundamento da Aula 1 · 10–15 minutos de estudo e prática'));
 const video=e('div','feature');video.append(e('b','', 'Introdução real do Bruno · Dia 1'),e('p','mut','Vídeo gerado com o Digital Twin real. O link abre a gravação concluída; não substitui o conteúdo abaixo.'));addVideo(video,VIDEO_PAGE,'Assistir à introdução real');root.append(video);
 const blocks=[
 ['APRENDER · 4 minutos','Atendimento de alto padrão não começa com uma lista de produtos. Começa pelo entendimento do ambiente, do uso e do momento do cliente. Pergunte se ele procura uma peça específica ou um projeto completo. Solicite o projeto ou, na ausência dele, fotos e medidas. Identifique a cidade, o prazo, a faixa de investimento e a participação de arquiteto. Faça perguntas de modo natural, explicando por que cada resposta ajuda a selecionar uma primeira opção adequada. Não prometa preço, prazo ou material sem validação.'],
 ['DEMONSTRAR · 3 minutos','Cliente: “Gostei desse sofá, qual é o preço?” Resposta adequada: “Posso te ajudar. Antes, esse sofá é para um ambiente já pronto ou você está mobiliando um projeto? Se tiver uma foto ou o projeto com as medidas, consigo verificar a melhor opção para o seu espaço.” Errado: “Esse modelo tem desconto, quer fechar agora?” O segundo caminho tenta vender sem compreender as necessidades.'],
 ['CERTO × ERRADO · 2 minutos','Certo: confirmar se há arquiteto e respeitar a especificação. Errado: substituir uma peça por conta própria. Certo: perguntar sobre mudança e prazo para planejar. Errado: prometer entrega sem confirmação. Certo: resumir o briefing e validar com o cliente. Errado: enviar muitas alternativas sem curadoria.'],
 ['PRATICAR · 4 minutos','Cenário: uma cliente deseja mobiliar a sala e envia somente uma foto de referência. Escreva uma mensagem inicial que confirme escopo, solicite medidas ou projeto, investigue cidade e prazo e pergunte se há arquiteto. Depois escreva uma síntese do que você precisaria validar antes de sugerir a primeira opção. Compare sua resposta com as falas demonstradas e leve a prática para discussão com o gestor.'],
 ['ERROS COMUNS E REVISÃO · 2 minutos','Erro 1: avançar para produto sem projeto/foto e medidas → revisar diagnóstico. Erro 2: trocar especificação sem autorização → revisar relacionamento com arquiteto. Erro 3: apresentar condição comercial não autorizada → revisar alçada. Erro 4: não registrar próximo contato → revisar CRM e follow-up.'],
 ];
 blocks.forEach(([title,body])=>{const x=e('div','feature');x.style.marginTop='10px';x.append(e('h4','',title),e('p','',body));root.append(x)});
 const practice=e('textarea','input');practice.rows=5;practice.placeholder='Escreva sua mensagem inicial e síntese de diagnóstico (rascunho local, não enviado).';practice.setAttribute('aria-label','Exercício prático');root.append(practice);
 const quiz=e('div','feature');quiz.style.marginTop='12px';quiz.id='cbv29-quiz';root.append(quiz);renderQuiz(quiz,0);box.append(root);
}
let myDaySkill=null;
function showRecommendation(){
 const sec=document.getElementById('inicio');if(!sec||!myDaySkill)return;let card=sec.querySelector('#cbv29-recommendation');
 if(!card){card=e('div','card');card.id='cbv29-recommendation';card.style.marginBottom='12px';sec.insertBefore(card,sec.children[1]||null)}
 card.replaceChildren(e('b','', 'Meu Dia · revisão após atendimento autorizado'),e('p','mut',myDaySkill.reason));
 const b=e('button','btn ghost tiny','Abrir jornada e revisar');b.addEventListener('click',()=>window.showSec('plano'));card.append(b);
}
function afterCRM(id){
 if(!document.getElementById('crmConsent')?.checked)return;
 const data=getCache(),x=(data?.crm||[]).find(y=>y.id===id);if(!x)return;
 let m={};try{m=JSON.parse(x.result_note||'{}')}catch(_){}
 const brief=String(m.briefing||'');
 let day=3,reason='Dia 3: melhorar o diagnóstico, confirmar projeto ou foto, medidas, cidade, uso e arquiteto.';
 if(x.stage==='negotiation'||/desconto|contraproposta|condi[cç][aã]o/i.test(brief)){day=45;reason='Dia 45: revisar negociação, contraproposta do cliente, intenção de fechamento e limites de alçada.'}
 else if(['proposal','future'].includes(x.stage)||!x.next_action_date){day=22;reason='Dia 22: revisar follow-up com contexto e registrar próximo contato.'}
 myDaySkill={day,reason};showRecommendation();
}
function install(){
 const css=e('style');css.textContent='.cbv29-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.cbv29-day{min-width:0}.cbv29-day p{min-height:36px}.cbv29-day button:disabled{opacity:.5;cursor:default}.cbv29-question{border:1px solid #444;border-radius:10px;margin:12px 0;padding:12px}.cbv29-question label{display:block;padding:6px}.cbv29-question input{margin-right:6px}@media(max-width:900px){.cbv29-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:580px){.cbv29-grid{grid-template-columns:1fr}#brunoOpening{display:block!important}}';document.head.append(css);
 const oldRender=window.renderConsult;if(typeof oldRender==='function')window.renderConsult=function(){const r=oldRender.apply(this,arguments);renderMap();opening();showRecommendation();return r};
 const oldOpen=window.openLesson;if(typeof oldOpen==='function')window.openLesson=function(id){const r=oldOpen.apply(this,arguments);enrichLesson(id);return r};
 const oldCRM=window.crmAssist;if(typeof oldCRM==='function')window.crmAssist=function(id){const r=oldCRM.apply(this,arguments);afterCRM(id);return r};
 renderMap();opening();
}
window.CBV29={version:'29-homolog',themes:THEMES,install,renderMap,renderQuiz};
install();
})();