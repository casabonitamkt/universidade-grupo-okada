const app=document.getElementById('app');
app.replaceChildren();
const title=document.createElement('h2');title.textContent='CRM — teste sem dados reais';app.append(title);
const fields=['responsavel','loja','cidade','tipo','arquiteto','origem','briefing','valorProposto','proximoContato','ultimaInteracao','valorFechado','motivoPerda','etapa'];
const stages=['Lead','Diagnóstico/Projeto','Projeto recebido/Orçamento','Proposta','Follow-up','Negociação','Venda','Perda'];
const form=document.createElement('form'),elements={};
fields.forEach(k=>{const label=document.createElement('label');label.textContent=k+' ';const inp=k==='briefing'?document.createElement('textarea'):document.createElement('input');inp.name=k;if(k==='etapa'){const s=document.createElement('select');stages.forEach(x=>{const o=document.createElement('option');o.textContent=x;s.append(o)});elements[k]=s;label.append(s)}else{elements[k]=inp;label.append(inp)}form.append(label);form.append(document.createElement('br'))});
const submit=document.createElement('button');submit.textContent='Salvar somente nesta aba';form.append(submit);app.append(form);
const notice=document.createElement('p');app.append(notice);const records=document.createElement('div');app.append(records);const rows=[];
form.onsubmit=e=>{e.preventDefault();const row={};fields.forEach(k=>row[k]=elements[k].value.trim());if(!row.responsavel||!row.loja){notice.textContent='Preencha responsável e loja';return}if(row.etapa==='Perda'){notice.textContent='Perda requer validação do gestor';return}rows.push(row);notice.textContent='Registrado apenas em memória; não salvo na plataforma oficial.';const p=document.createElement('p');p.textContent=row.responsavel+' · '+row.loja+' · '+row.etapa;records.append(p)};

const heading=document.createElement('h2');heading.textContent='Copiloto comercial — sugestões por regras';app.insertBefore(heading,notice);
const guidance=document.createElement('p');app.insertBefore(guidance,notice);
const reply=document.createElement('textarea');reply.readOnly=true;reply.rows=3;reply.style.width='95%';app.insertBefore(reply,notice);
const copy=document.createElement('button');copy.type='button';copy.textContent='Copiar sugestão WhatsApp';app.insertBefore(copy,notice);
function advise(){const x={};fields.forEach(k=>x[k]=elements[k].value.trim());const missing=['cidade','tipo','origem','briefing','proximoContato'].filter(k=>!x[k]);const next=missing[0];let suggestion='Podemos confirmar os detalhes do seu projeto e combinar o melhor momento para conversarmos?';if(next==='cidade')suggestion='Em qual cidade será o ambiente? Assim consigo organizar seu atendimento.';if(next==='tipo')suggestion='Você procura uma peça específica ou o mobiliário para um projeto completo?';if(next==='briefing')suggestion='Pode compartilhar fotos ou projeto e medidas para estudarmos uma proposta alinhada?';guidance.textContent='Dados faltantes: '+(missing.join(', ')||'nenhum')+'. Próxima ação: '+(next?'completar briefing':'confirmar próximo contato')+'. Revisão humana obrigatória.';reply.value=suggestion}
form.oninput=advise;advise();
copy.onclick=async()=>{try{await navigator.clipboard.writeText(reply.value);notice.textContent='Texto copiado; revise antes de enviar manualmente.'}catch{notice.textContent='Copie o texto manualmente.'}};

const aiTitle=document.createElement('h2');aiTitle.textContent='Pré-atendimento: integração em validação';app.insertBefore(aiTitle,form);

const aiStatus=document.createElement('p');aiStatus.textContent='Conecte sua sessão da Universidade para usar a IA';app.insertBefore(aiStatus,form);
const chatBox=document.createElement('div');chatBox.style.cssText='max-height:260px;overflow:auto;border:1px solid #777;padding:10px;white-space:pre-wrap';app.insertBefore(chatBox,form);
const chatInput=document.createElement('textarea');chatInput.placeholder='Mensagem fictícia do cliente';chatInput.rows=2;app.insertBefore(chatInput,form);
const sendAI=document.createElement('button');sendAI.type='button';sendAI.textContent='Enviar para IA';sendAI.disabled=true;app.insertBefore(sendAI,form);
const handoff=document.createElement('button');handoff.type='button';handoff.textContent='Transferir briefing ao CRM';app.insertBefore(handoff,form);
const conversation=[];
function showChat(){chatBox.replaceChildren();conversation.forEach(m=>{const p=document.createElement('p');p.textContent=(m.role==='user'?'Cliente: ':'IA: ')+m.content;chatBox.append(p)})}
handoff.onclick=()=>{elements.briefing.value=conversation.map(m=>(m.role==='user'?'CLIENTE: ':'IA: ')+m.content).join('\n');advise();notice.textContent='Briefing transferido localmente; revise antes de salvar.'};
