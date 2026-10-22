// Homologação: gravação explícita e releitura independente.
import {confirmarRegistroPersistido} from "./trilha-90-confirmacao.mjs";
export async function gravarEConfirmar(sb,usuario,dia,registro){
 const tabela="homologacao_trilha_90_progresso";
 const esperado={...registro,user_id:usuario,dia};
 const {error}=await sb.from(tabela).upsert(esperado,{onConflict:"user_id,dia"});
 if(error)throw error;
 const {data,error:readError}=await sb.from(tabela).select("user_id,dia,pratica_texto,simulacao_texto,respostas,tentativa,nota_provisoria,aprovado_provisorio,etapa").eq("user_id",usuario).eq("dia",dia).single();
 if(readError)throw Error("Releitura não confirmada.");
 if(!confirmarRegistroPersistido(esperado,data))throw Error("Dados divergentes após gravação.");
 return data;
}
