// A conclusão fica apenas neste navegador, sem servidor ou dados pessoais.
const CHAVE='universo-tayane:jornada-concluida:v1';
export function jaConcluiu(storage){
 try{return (storage??globalThis.localStorage).getItem(CHAVE)==='1';}catch{return false;}
}
export function salvarConclusao(storage){
 try{(storage??globalThis.localStorage).setItem(CHAVE,'1');return true;}catch{return false;}
}
