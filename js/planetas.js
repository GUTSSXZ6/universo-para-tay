import { atmosfera } from './atmosfera.js';
import { materialPlaneta } from './material-planeta.js';
import { criarSol } from './solar.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

// Escalas artísticas; velocidades em radianos por segundo.
export const ASTROS = [
 {id:'sol',nome:'Sol',raio:6.4,orbita:0,vel:0,giro:.045,inclinacao:7.25},
 {id:'mercurio',nome:'Mercúrio',raio:1.15,orbita:9,vel:.12,giro:.025,inclinacao:0.03},
 {id:'venus',nome:'Vênus',raio:1.85,orbita:13,vel:.09,giro:-.012,inclinacao:177.4},
 {id:'terra',nome:'Terra',raio:2.05,orbita:18,vel:.07,giro:.25,inclinacao:23.44},
 {id:'lua',nome:'Lua',raio:0.65,orbita:3.2,vel:.35,giro:.35,inclinacao:6.68,pai:'terra'},
 {id:'marte',nome:'Marte',raio:1.55,orbita:24,vel:.055,giro:.24,inclinacao:25.2},
 {id:'jupiter',nome:'Júpiter',raio:4.4,orbita:33,vel:.032,giro:.5,inclinacao:3.13},
 {id:'saturno',nome:'Saturno',raio:3.35,orbita:45,vel:.023,giro:.45,inclinacao:26.73},
 {id:'urano',nome:'Urano',raio:2.75,orbita:56,vel:.016,giro:.32,inclinacao:97.77},
 {id:'netuno',nome:'Netuno',raio:2.65,orbita:65,vel:.012,giro:.35,inclinacao:28.32},
 {id:'plutao',nome:'Plutão',raio:1.0,orbita:73,vel:.009,giro:.04,inclinacao:119.6}
];
const BASE = new URL('../assets/texturas/', import.meta.url);

export function criarSistemaSolar(scene, {baixo = (navigator.deviceMemory || 4) <= 4, mobile = false, onProgress = ()=>{}} = {}) {
 const manager = new THREE.LoadingManager();
 const erros = [];
 manager.onProgress = (url,loaded,total)=>onProgress(loaded,total,url);
 manager.onError = url=>erros.push(url);
 let resolver;
 const pronto = new Promise(resolve=>{resolver=resolve;});
 manager.onLoad = ()=>resolver({erros:[...erros]});
 const loader = new THREE.TextureLoader(manager);
 const texturas = new Set();
 const mobileMaps = new Set(['tex_mercurio.jpg', 'tex_venus.jpg', 'tex_lua.jpg', 'tex_marte.jpg', 'tex_urano.jpg', 'tex_netuno.jpg', 'tex_plutao.jpg', 'tex_terra_nuvens.jpg']);
 function textura(nome, cor=true){
   const caminho=mobile&&mobileMaps.has(nome)?`mobile/${nome}`:nome;
   const t=loader.load(new URL(caminho,BASE).href); t.colorSpace=cor?THREE.SRGBColorSpace:THREE.NoColorSpace;
   t.anisotropy=baixo?2:8; texturas.add(t); return t;
 }
 const raiz = new THREE.Group(); scene.add(raiz);
 const astros = new Map(), alvos = [];
 const segmentos = baixo?40:72;
 const esfera = new THREE.SphereGeometry(1,segmentos,Math.floor(segmentos*2/3));
 const ambiente = new THREE.AmbientLight(0xb5c9ff,.48); raiz.add(ambiente);
 const luz = new THREE.PointLight(0xfff5e8,2.8,0,0); raiz.add(luz);
 function orbita(raio,pai){
   const pts=Array.from({length:128},(_,i)=>{const a=i/128*Math.PI*2;return new THREE.Vector3(Math.cos(a)*raio,0,Math.sin(a)*raio);});
   const linha=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x899ac2,transparent:true,opacity:.19})); pai.add(linha);
 }
 for(const [i,d] of ASTROS.entries()){
   const pai=d.pai?astros.get(d.pai).centro:raiz;
   const centro=new THREE.Group(); pai.add(centro);
   const eixo=new THREE.Group(); eixo.rotation.z=THREE.MathUtils.degToRad(d.inclinacao); centro.add(eixo);
   const mapa=textura(`tex_${d.id}.jpg`);
   const material=d.id==='sol'?new THREE.MeshBasicMaterial({map:mapa}):materialPlaneta(d.id,mapa,baixo);
   const mesh=new THREE.Mesh(esfera,material); mesh.scale.setScalar(d.raio); mesh.userData.astroId=d.id; eixo.add(mesh); alvos.push(mesh);
   const item={...d,centro,eixo,mesh,angulo:i*2.399963}; astros.set(d.id,item);
   // Órbitas calculadas sem linhas visíveis.
   if(d.id==='terra'){
     const nuvens=new THREE.Mesh(esfera,new THREE.MeshStandardMaterial({color:0xffffff,alphaMap:textura('tex_terra_nuvens.jpg',false),transparent:true,opacity:.82,depthWrite:false,roughness:1}));
     nuvens.scale.setScalar(d.raio*1.012); eixo.add(nuvens); item.nuvens=nuvens;
     centro.add(atmosfera(esfera,d.raio,0x65baff,.38,.032));
   }
   if(d.id==='sol'){
     item.solar=criarSol(mesh,mapa,esfera,centro,d.raio);
   }
   const atmosferas={venus:[0xffd3a1,.23],marte:[0xe4a17a,.13],jupiter:[0xe4c8a4,.12],saturno:[0xf2d6a4,.12],urano:[0x9bdcdd,.27],netuno:[0x83aaff,.30]};
   if(atmosferas[d.id]){const [cor,forca]=atmosferas[d.id];centro.add(atmosfera(esfera,d.raio,cor,forca*.65,.022));}

   if(d.id==='saturno'){
     const inner=d.raio*1.25,outer=d.raio*2.25;
     const geo=new THREE.RingGeometry(inner,outer,baixo?64:96);
     const pos=geo.attributes.position,uv=geo.attributes.uv;
     // A imagem dos anéis é uma faixa radial horizontal, não um disco.
     for(let j=0;j<pos.count;j++){const r=Math.hypot(pos.getX(j),pos.getY(j));uv.setXY(j,(r-inner)/(outer-inner),.5);}
     uv.needsUpdate=true;
     const ring=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:textura('tex_saturno_aneis.png'),color:0xffefd9,roughness:1,metalness:0,emissive:0x9c8262,emissiveIntensity:.48,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
     ring.rotation.x=-Math.PI/2; eixo.add(ring); ring.userData.astroId=d.id; alvos.push(ring);
   }
 }
 const fundoAnterior=scene.background; const fundo=new THREE.Color(0x020309); scene.background=fundo;
 function atualizar(dt=0){
   dt=Math.max(0,Math.min(dt,.05));
   for(const a of astros.values()){
     a.angulo+=a.vel*dt;
     if(a.orbita)a.centro.position.set(Math.cos(a.angulo)*a.orbita,0,Math.sin(a.angulo)*a.orbita);
     a.mesh.rotation.y+=a.giro*dt;
     if(a.nuvens)a.nuvens.rotation.y+=a.giro*1.12*dt;
     if(a.solar)a.solar(dt);
   }
 }
 atualizar();
 function posicao(id,destino=new THREE.Vector3()){const a=astros.get(id);return a?a.centro.getWorldPosition(destino):null;}
 function destruir(){
   const geos=new Set(),mats=new Set(); raiz.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material){mats.add(o.material);if(o.material.map)texturas.add(o.material.map);}});
   geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());texturas.forEach(t=>t.dispose());
   if(scene.background===fundo)scene.background=fundoAnterior;scene.remove(raiz);
 }
 return {raiz,astros,alvos,pronto,texturas,atualizar,posicao,destruir};
}
