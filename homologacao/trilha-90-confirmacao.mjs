/* Homologação: verificação determinística de releitura após escrita. Não autentica nem altera o banco. */
export const CAMPOS_CONFIRMADOS=["user_id","dia","pratica_texto","simulacao_texto","respostas","tentativa","nota_provisoria","aprovado_provisorio","etapa"];
export function equivalentePersistido(a,b){
 if(a===b)return true;
 if(a===null||b===null||typeof a!==typeof b)return false;
 if(typeof a!=="object")return false;
 if(Array.isArray(a)!==Array.isArray(b))return false;
 const ka=Object.keys(a).sort(),kb=Object.keys(b).sort();
 return ka.length===kb.length&&ka.every((k,i)=>k===kb[i]&&equivalentePersistido(a[k],b[k]));
}
export function confirmarRegistroPersistido(esperado,relido){
 if(!esperado||!relido||typeof relido!=="object")return false;
 if(!CAMPOS_CONFIRMADOS.every(k=>Object.hasOwn(esperado,k)&&Object.hasOwn(relido,k)))return false;
 if(!Number.isInteger(relido.dia)||relido.dia<1||relido.dia>90)return false;
 if(!Number.isInteger(relido.tentativa)||relido.tentativa<0)return false;
 if(relido.nota_provisoria!==null&&(!Number.isFinite(Number(relido.nota_provisoria))||Number(relido.nota_provisoria)<0||Number(relido.nota_provisoria)>10))return false;
 if(relido.aprovado_provisorio===true&&!(Number(relido.nota_provisoria)>=8&&relido.tentativa>0&&String(relido.pratica_texto).trim().length>=60&&String(relido.simulacao_texto).trim().length>=60))return false;
 return CAMPOS_CONFIRMADOS.every(k=>{
  if(k==="nota_provisoria")return esperado[k]===null?relido[k]===null:Number(esperado[k])===Number(relido[k]);
  return equivalentePersistido(esperado[k],relido[k]);
 });
}

// A comparação não substitui a autenticação ou as políticas RLS.
