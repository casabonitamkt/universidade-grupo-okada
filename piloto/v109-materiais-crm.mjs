// V109 — extensão não destrutiva do piloto V93. Somente dados fictícios, sem acesso a clientes.
import {STAGES,canAnalyze,authorize,edit,validateLoss,analyze,sierraReadiness} from './v93-copiloto-seguro.mjs';
export {STAGES,canAnalyze,authorize,edit,validateLoss,sierraReadiness};
export const LESSON15={day:15,title:'Materiais: consultar especificações reais',duration:15,competency:'Conferência de especificações e fidelidade ao projeto'};
export function analyzeV109(lead,actor,now=new Date()){
 const base=analyze(lead,actor,now);
 const missing=[...base.missing],findings=[...base.findings],studies=[...base.studies];
 if(lead.kind==='projeto'||lead.materialQuestion){
   if(!String(lead.materialSource||'').trim()){missing.push('fonte técnica autorizada do material');findings.push('Não afirmar composição, acabamento, manutenção ou prazo sem fonte técnica');studies.push(15);}
   if(lead.materialChangeRequested&&!lead.architectApproval){findings.push('Mudança de material exige aprovação do cliente e, quando aplicável, do arquiteto');studies.push(15);}
 }
 const next=missing.includes('fonte técnica autorizada do material')?'Solicitar ficha ou catálogo oficial antes de afirmar características':base.next;
 const reply=missing.includes('fonte técnica autorizada do material')
  ?'Olá! Para confirmar a especificação com segurança, vou consultar a ficha técnica oficial e validar a opção com você e com o arquiteto, quando houver. Assim que tivermos a informação confirmada, combinamos o próximo passo.'
  :base.reply;
 return {...base,missing:[...new Set(missing)],findings:[...new Set(findings)],studies:[...new Set(studies)],next,reply,source:'regras locais; dados fictícios; revisão humana obrigatória'};
}
export const EXAM_A=[
 ['Antes de informar a composição de um tecido, você deve:', ['Confiar na memória','Consultar ficha oficial atualizada','Inferir pela aparência'],1,false,'fonte'],
 ['Cliente pede trocar acabamento previsto pelo arquiteto:', ['Trocar para agilizar','Solicitar validação das pessoas responsáveis','Alterar sem registrar'],1,true,'autorização'],
 ['A ficha técnica não está disponível:', ['Admitir pendência e consultar fonte oficial','Afirmar com base em similar','Prometer qualquer prazo'],0,true,'fonte'],
 ['Como registrar a especificação?', ['Somente nome genérico','Produto, referência e fonte verificada','Apenas fotografia'],1,false,'registro'],
 ['Cliente pergunta manutenção:', ['Inventar instrução','Usar recomendação oficial do fabricante','Copiar de concorrente'],1,true,'fonte'],
 ['Há divergência entre projeto e catálogo:', ['Ignorar','Registrar divergência e pedir validação','Substituir a peça'],1,true,'autorização'],
 ['Em orçamento, material não confirmado deve:', ['Ser descrito como confirmado','Ser tratado como pendência explícita','Ser ocultado'],1,false,'registro'],
 ['Qual é o próximo passo após consulta?', ['Registrar resposta e confirmação com cliente','Aguardar sem data','Prometer fechamento'],0,false,'próximo passo'],
 ['A IA copiloto pode:', ['Definir material automaticamente','Sugerir perguntas para verificação humana','Enviar mensagem sem revisão'],1,true,'limites'],
 ['Um bom diagnóstico identifica:', ['Somente cor favorita','Uso, projeto, medidas e restrições','Apenas preço'],1,false,'diagnóstico']
];
export const EXAM_B=[
 ['Cliente apresenta imagem sem código do material:', ['Identificar pela aparência','Pedir referência e conferir catálogo','Informar garantia presumida'],1,false,'fonte'],
 ['Pedido de mudança de tecido em projeto assinado:', ['Validar com envolvidos antes de alterar','Trocar sem comunicar','Aceitar só por áudio informal'],0,true,'autorização'],
 ['Catálogo de coleção anterior:', ['Usar como garantia atual','Checar a versão vigente com a marca','Ignorar revisão'],1,false,'fonte'],
 ['Como tratar limpeza do revestimento?', ['Repetir dica de internet','Seguir instrução oficial específica','Garantir qualquer produto'],1,true,'fonte'],
 ['Material semelhante de outra linha:', ['Declarar equivalente','Verificar diferenças antes de propor','Alterar orçamento'],1,true,'fonte'],
 ['O que enviar ao gestor?', ['Informação não confirmada como certa','Referência, fonte e pendência identificada','Somente foto'],1,false,'registro'],
 ['Falta ficha oficial para uma dúvida:', ['Consultar fabricante e combinar retorno','Inventar resposta','Ocultar pergunta'],0,true,'fonte'],
 ['Antes de fechar proposta:', ['Conferir especificação aprovada','Remover referência','Assumir aprovação'],0,false,'registro'],
 ['IA sugere substituição:', ['Aplicar automaticamente','Solicitar validação humana e autorização','Alterar preço'],1,true,'limites'],
 ['Registro útil contém:', ['Apenas nome do cliente','Fonte técnica, aprovações e próximo contato','Somente valor'],1,false,'registro']
];
export function gradeExam(exam,answers,practiceText,reviewText='',retest=false){
 const qs=exam==='B'?EXAM_B:EXAM_A;
 const correct=qs.reduce((s,q,i)=>s+(Number(answers?.[i])===q[2]?1:0),0);
 const errors=qs.flatMap((q,i)=>Number(answers?.[i])===q[2]?[]:[{number:i+1,topic:q[4],critical:q[3]}]);
 const practiceOk=String(practiceText||'').trim().length>=80;
 const reviewOk=!retest||String(reviewText||'').trim().length>=60;
 return {score:correct,criticalError:errors.some(x=>x.critical),errors,practiceOk,reviewOk,passed:correct>=8&&!errors.some(x=>x.critical)&&practiceOk&&reviewOk,theoryOnly:true};
}
export function milestoneReady(milestones,managerApproved,authorizedSierraContent){
 return sierraReadiness(milestones,managerApproved,authorizedSierraContent);
}
