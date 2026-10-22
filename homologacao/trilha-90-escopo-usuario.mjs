/* Homologação: isolamento adicional no cliente. A segurança definitiva depende da RLS no Supabase. */
export const CAMPOS_PROGRESSO="user_id,dia,pratica_texto,simulacao_texto,respostas,tentativa,nota_provisoria,aprovado_provisorio,etapa,atualizado_em";
export function exigirUsuario(usuario){
 const id=usuario?.id;
 if(typeof id!=="string"||!id.trim())throw Error("Sessão autenticada obrigatória.");
 return id;
}
export function validarLeituraUsuario(registros,userId){
 if(!Array.isArray(registros))throw Error("Resposta de progresso inválida.");
 if(registros.some(r=>!r||r.user_id!==userId))throw Error("Leitura de progresso de outra conta bloqueada.");
 return registros.filter(r=>Number.isInteger(r.dia)&&r.dia>=1&&r.dia<=4);
}
export function validarGravacaoUsuario(registro,userId,dia){
 if(!registro||registro.user_id!==userId||registro.dia!==dia)throw Error("Confirmação de gravação não corresponde ao aluno e dia.");
 return registro;
}
