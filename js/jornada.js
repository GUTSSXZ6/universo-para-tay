export function criarJornada(ids){
 const nomes={plutao:'Plutão',netuno:'Netuno',urano:'Urano',saturno:'Saturno',jupiter:'Júpiter',marte:'Marte',venus:'Vênus',mercurio:'Mercúrio',lua:'Lua',terra:'Terra',sol:'Sol'};
 ids=[...new Set(ids)];
 const livres=ids.filter(id=>id!=='terra'&&id!=='sol'),visitados=new Set();
 let modoLivre=false;
 function ativarModoLivre(){modoLivre=true;return true;}
 const faltam=()=>modoLivre?[]:livres.filter(id=>!visitados.has(id));
 const permitido=id=>ids.includes(id)&&(modoLivre|| (id==='terra'?faltam().length===0:id==='sol'?faltam().length===0&&visitados.has('terra'):true));
 function visitar(id){if(!permitido(id))return false;visitados.add(id);return true;}
 const lista=()=>faltam().map(id=>nomes[id]||id).join(', ');
 function dica(){if(modoLivre)return 'Todos os astros estão liberados. Revisite qualquer memória, na ordem que quiser.';if(visitados.has('sol'))return 'Todas as memórias foram descobertas.';if(permitido('sol'))return 'O último capítulo espera por você no Sol.';if(permitido('terra'))return 'Agora, encontre a Terra. Uma história especial espera por você.';return `Memórias: ${livres.length-faltam().length}/${livres.length} · Falta descobrir: ${lista()}`;}
 function mensagem(id){if(faltam().length)return `${id==='terra'?'A Terra':'O Sol'} ainda guarda um segredo. ${dica()}`;return 'Antes do Sol, descubra a história especial da Terra.';}
 return {permitido,visitar,mensagem,dica,ativarModoLivre,get modoLivre(){return modoLivre;},get faltam(){return faltam();},get livres(){return [...livres];},get visitados(){return [...visitados];},get progresso(){return modoLivre?1:visitados.size/ids.length;},get completo(){return visitados.has('sol');}};
}
