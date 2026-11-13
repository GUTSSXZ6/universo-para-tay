import { criarJornada } from './jornada.js';
import { criarCoracao } from './coracao.js';
import { criarRenderizacao } from './renderizacao.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { criarSistemaSolar } from './planetas.js';
import { criarCosmos } from './cosmos.js';
import { criarCamera } from './camera.js';
import { createAudioController } from './audio.js';
const $=id=>document.getElementById(id);
const loading=$('loading'), status=$('loading-status'), dialog=$('chapter');
const barra=$('loading-progress');
function progresso(valor,mensagem){barra.value=Math.max(barra.value,Math.min(100,valor));status.textContent=mensagem;}
const proximoQuadro=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));
async function prepararFotos(capitulos){
 const urls=[...new Set([...capitulos.values()].map(c=>c.foto).filter(Boolean))];
 let feitos=0;const falhas=[];
 // Dois downloads por vez: evita picos de memória no celular. O cache do navegador é reutilizado.
 async function worker(){while(urls.length){const url=urls.shift();try{
  await new Promise((resolve,reject)=>{const img=new Image();let timer;
   const fim=(erro)=>{clearTimeout(timer);img.onload=img.onerror=null;erro?reject(erro):resolve();};
   timer=setTimeout(()=>{fim(new Error('Tempo limite'));img.removeAttribute('src');},8000);
   img.onerror=()=>fim(new Error('Imagem indisponível'));
   img.onload=()=>{if(typeof img.decode==='function')img.decode().then(()=>fim(),fim);else fim();};
   img.src=url;
  });
 }catch{falhas.push(url);}finally{feitos++;progresso(65+15*feitos/total,`Preparando fotografias: ${feitos}/${total}`);}}}
 const total=urls.length;if(total)await Promise.all([worker(),worker()]);return falhas;
}
// Conteúdo literário: preserva a ordem do texto, depoimentos e encerramento.
function renderizarTexto(container,c){
 container.replaceChildren();
 const bloco=(texto)=>{const div=document.createElement('div');div.className='chapter-prose';div.textContent=texto;return div;};
 container.append(bloco(c.texto||'Texto definitivo ainda pendente.'));
 if(Array.isArray(c.depoimentos)&&c.depoimentos.length){
  const section=document.createElement('section');section.className='chapter-voices';
  const heading=document.createElement('h3');heading.textContent='Pelos seus olhos';section.append(heading);
  for(const d of c.depoimentos){
   const figure=document.createElement('figure');figure.className='chapter-voice';
   const quote=document.createElement('blockquote');quote.textContent=d.texto;
   const credit=document.createElement('figcaption');credit.textContent=d.credito;
   figure.append(quote,credit);section.append(figure);
  }
  container.append(section);
 }
 if(c.texto_final){const end=bloco(c.texto_final);end.classList.add('chapter-prose-end');container.append(end);}
}
async function iniciar(){
 progresso(5,'Carregando nossas memórias…');
 const response=await fetch(new URL('../data/capitulos.json',import.meta.url));
 if(!response.ok)throw new Error('Não foi possível carregar os capítulos.');
 const capitulos=new Map((await response.json()).map(c=>[c.id,c]));
 const mobile=matchMedia('(pointer: coarse)').matches||matchMedia('(max-width: 760px)').matches;
 const baixo=mobile||(navigator.deviceMemory||4)<=4||(navigator.hardwareConcurrency||4)<=4;
 const scene=new THREE.Scene();
 const renderer=new THREE.WebGLRenderer({antialias:!baixo,powerPreference:'low-power'});
 const ratioMax=Math.min(devicePixelRatio||1,mobile ? .95 : baixo ? 1 : 1.75);
 const ratioMin=Math.min(ratioMax,mobile ? .65 : .75);
 renderer.setPixelRatio(ratioMax);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 $('scene').append(renderer.domElement);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer.setAnimationLoop(null);loading.hidden=false;$('loading-enter').hidden=true;status.textContent='Renderização interrompida. Recarregue a página.';$('loading-retry').hidden=false;});
 const pipeline=criarRenderizacao(renderer,{baixo});
 const camera=new THREE.PerspectiveCamera(55,1,.05,500);
 const sistema=criarSistemaSolar(scene,{baixo,mobile,onProgress:(n,total)=>{progresso(10+55*n/Math.max(total,1),`Carregando texturas: ${n}/${total}`);}});
 const cosmos=criarCosmos(scene,{baixo,pixelRatio:renderer.getPixelRatio()});
 const coracao=criarCoracao(scene,{baixo,pixelRatio:renderer.getPixelRatio()});
 const jornada=criarJornada([...capitulos.keys()]);
 let avisoTimer;
 const painel=document.createElement('details');painel.className='jornada-painel';painel.hidden=true;
 const resumo=document.createElement('summary');painel.append(resumo);
 const lista=document.createElement('div');lista.className='jornada-lista';painel.append(lista);
 document.body.append(painel);
 const rever=document.createElement('button');rever.id='revisit-button';rever.type='button';rever.textContent='Rever tudo novamente';
 rever.title='Liberar todos os capítulos sem precisar repetir a jornada';
 rever.addEventListener('click',e=>{
  e.stopPropagation();if(!ready||jornada.modoLivre||!jornada.ativarModoLivre())return;
  clearTimeout(avisoTimer);coracao.progresso(1,true);atualizarJornada();$('hint').textContent=jornada.dica();resumo.focus({preventScroll:true});
 });
 function atualizarJornada(){
  const faltam=jornada.faltam;resumo.textContent=jornada.modoLivre?'Memórias · modo livre':`Memórias · ${jornada.livres.length-faltam.length}/${jornada.livres.length}`;
  lista.replaceChildren();
  for(const id of jornada.livres){const item=document.createElement('span');const feito=!faltam.includes(id);item.textContent=`${feito?'✓':'○'} ${capitulos.get(id)?.astro||id}`;item.className=feito?'feito':'pendente';lista.append(item);}
  const nota=document.createElement('p');nota.textContent=jornada.dica();lista.append(nota);
  if(!jornada.modoLivre)lista.append(rever);
 }
 atualizarJornada();
 function permitir(id){if(!ready)return false;if(jornada.permitido(id))return true;painel.open=true;clearTimeout(avisoTimer);$('hint').textContent=jornada.mensagem(id);avisoTimer=setTimeout(()=>{$('hint').textContent=jornada.dica();},5500);return false;}
 const audio=createAudioController();
 let pending=null, ready=false;
 const controls=criarCamera(camera,renderer.domElement,sistema,{
  canSelect:permitir,
  onSelect:id=>{if(!ready)return;pending=id;void audio.openChapter(id);},
  onFocus:id=>{if(pending===id){pending=null;abrir(id);}}
 });
 function abrir(id){
  const c=capitulos.get(id);if(!c)return;
  dialog.dataset.astro=id;
  if(!jornada.visitar(id))return;coracao.progresso(jornada.progresso);atualizarJornada();painel.open=false;clearTimeout(avisoTimer);$('hint').textContent=jornada.dica();
  $('chapter-number').textContent=c.rotulo||`Capítulo ${c.numero} · ${c.astro}`;
  $('chapter-title').textContent=c.titulo||c.astro;
  $('chapter-subtitle').textContent=c.subtitulo||'';
  renderizarTexto($('chapter-text'),c);
  const photo=$('chapter-photo');photo.hidden=!c.foto;photo.alt=c.foto?'Fotografia deste capítulo':'';
  photo.parentElement.hidden=!c.foto;
  photo.onerror=()=>{photo.hidden=true;photo.parentElement.hidden=true;};
  if(c.foto)photo.src=c.foto;else photo.removeAttribute('src');
  const ref=$('chapter-reference');ref.textContent=[c.versiculo,c.referencia].filter(Boolean).join('\n\n');ref.hidden=!ref.textContent;
  if(!dialog.open)dialog.showModal();dialog.scrollTop=0;
 }
 dialog.addEventListener('close',()=>{pending=null;void audio.closeChapter();controls.home(jornada.completo);});
 const home=document.createElement('button');home.textContent='Visão geral';home.type='button';home.id='overview-button';home.hidden=true;document.body.append(home);
 home.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();pending=null;painel.open=false;clearTimeout(avisoTimer);$('hint').textContent=jornada.dica();controls.home(true);void audio.closeChapter();});
 // Rótulos ancorados nos astros tornam os menores selecionáveis por toque.
 const labels=new Map(), projected=new THREE.Vector3();
 for(const [id,a] of sistema.astros){const b=document.createElement('button');b.type='button';b.textContent=a.nome;b.className='astro-label';b.hidden=true;document.body.append(b);labels.set(id,b);b.addEventListener('click',()=>{if(!permitir(id))return;pending=id;void audio.openChapter(id);controls.focar(id);});}
 function resize(){const w=$('scene').clientWidth,h=$('scene').clientHeight;camera.aspect=w/Math.max(h,1);camera.fov=w<h?75:55;camera.updateProjectionMatrix();renderer.setSize(w,h);pipeline.resize(w,h);if(ready&&dialog.open)pipeline.render(scene,camera);}
 addEventListener('resize',resize);resize();
 // Texturas carregadas antes de compilar e enviar os recursos à GPU.
 const result=await sistema.pronto;
 progresso(65,'Preparando fotografias…');
 const falhasFotos=await prepararFotos(capitulos);
 progresso(82,'Preparando a luz das estrelas…');await proximoQuadro();await proximoQuadro();
 for(const t of sistema.texturas){if(t.image&&typeof renderer.initTexture==='function')renderer.initTexture(t);}
 cosmos.atualizar(0,camera);coracao.atualizar(0);scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 if(typeof renderer.compileAsync==='function')await renderer.compileAsync(scene,camera);else renderer.compile(scene,camera);
 progresso(94,'Finalizando nosso universo…');await proximoQuadro();await proximoQuadro();
 pipeline.render(scene,camera); // Inclui a compilação dos passes de bloom e a primeira imagem completa.
 if(renderer.getContext().isContextLost())throw new Error('Contexto gráfico interrompido.');
 renderer.getContext().finish(); // Uma única vez, durante o loading, nunca durante a exploração.
 progresso(100,'Tudo pronto.');await proximoQuadro();
 // A música começa ligada. Se o navegador bloquear autoplay, o próprio
 // botão de entrada libera o áudio por um gesto, sem exigir outro toque.
 const entrar=$('loading-enter');
 function liberarUniverso(){
  if(ready||renderer.getContext().isContextLost())return;
  ready=true;entrar.hidden=true;painel.hidden=false;loading.hidden=true;home.hidden=false;$('hint').hidden=false;$('hint').textContent=jornada.dica();
  if(result.erros.length){$('hint').textContent=`${result.erros.length} textura(s) não carregada(s). Confira os arquivos.`;console.warn(result.erros);}
  if(falhasFotos.length)console.warn('Fotos não pré-carregadas; serão tentadas novamente ao abrir o capítulo.',falhasFotos);
 }
 entrar.addEventListener('click',()=>{
  if(ready||renderer.getContext().isContextLost())return;
  // play() é chamado imediatamente no gesto, antes de qualquer await.
  void audio.setEnabled(true);
  liberarUniverso();
 });
 status.textContent='Tudo pronto. Entre no nosso universo.';
 entrar.hidden=false;
 void audio.setEnabled(true).then(tocando=>{if(tocando)liberarUniverso();});
 let previous=performance.now(),lastLabels=0,windowStart=previous,frames=0,slowWindows=0,fastWindows=0;
 function ajustarRatio(r){renderer.setPixelRatio(r);cosmos.setPixelRatio(r);coracao.setPixelRatio(r);resize();}
 function resetMedicao(now){windowStart=now;frames=0;slowWindows=0;fastWindows=0;}
 document.addEventListener('visibilitychange',()=>{previous=performance.now();resetMedicao(previous);});
 renderer.setAnimationLoop(now=>{
  const dt=Math.min(.05,Math.max(0,(now-previous)/1000));previous=now;
  // Durante a leitura o universo permanece visível atrás do painel, mas não é renderizado a cada frame.
  if(!ready||document.hidden||dialog.open){resetMedicao(now);return;}
  sistema.atualizar(dt);controls.atualizar(dt);cosmos.atualizar(dt,camera);coracao.atualizar(dt);pipeline.render(scene,camera);
  const ocultarPainel=!ready||dialog.open||!!controls.foco;if(painel.hidden!==ocultarPainel)painel.hidden=ocultarPainel;
  if(now-lastLabels>=(mobile?33:16)){
   lastLabels=now;
   for(const [id,b] of labels){sistema.posicao(id,projected);projected.y+=sistema.astros.get(id).raio*1.2;projected.project(camera);const visible=ready&&!dialog.open&&!controls.foco&&projected.z>-1&&projected.z<1&&Math.abs(projected.x)<.95&&Math.abs(projected.y)<.78;if(b.hidden===visible)b.hidden=!visible;if(visible){b.style.left=`${(projected.x+1)*50}%`;b.style.top=`${(1-projected.y)*50}%`;}}
  }
  if(mobile){frames++;const elapsed=now-windowStart;if(elapsed>=2000){const fps=frames*1000/elapsed;windowStart=now;frames=0;
   if(fps<38){slowWindows++;fastWindows=0;}else if(fps>55){fastWindows++;slowWindows=0;}else{slowWindows=0;fastWindows=0;}
   const r=renderer.getPixelRatio();if(slowWindows>=2&&r>ratioMin+.01){ajustarRatio(Math.max(ratioMin,r-.10));resetMedicao(now);}else if(fastWindows>=5&&r<ratioMax-.01){ajustarRatio(Math.min(ratioMax,r+.05));resetMedicao(now);}
  }}
 });
}
iniciar().catch(error=>{console.error(error);loading.hidden=false;status.textContent='Não foi possível iniciar o sistema solar. '+error.message;$('loading-retry').hidden=false;});
