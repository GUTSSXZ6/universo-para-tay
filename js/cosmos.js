import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { ASTROS } from "./planetas.js";
export function criarCosmos(scene,{baixo=false,pixelRatio=1}={}){
 const root=new THREE.Group();scene.add(root);scene.background=new THREE.Color(0x030511);
 const sky=new THREE.Mesh(new THREE.SphereGeometry(395,32,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vDir;float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}void main(){vec3 d=normalize(vDir);float band=exp(-pow(abs(dot(d,normalize(vec3(-.32,1.,.45))))*3.8,2.));float n=noise(d*9.)*.55+noise(d*22.)*.3+noise(d*55.)*.15;float cloud=band*pow(n,1.7);vec3 c=vec3(.012,.019,.043)+cloud*mix(vec3(.12,.17,.32),vec3(.24,.12,.24),noise(d*5.));gl_FragColor=vec4(pow(max(c,vec3(0.)),vec3(2.2)),1.);}`}));sky.renderOrder=-100;root.add(sky);
 let seed=7123;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const tau=Math.PI*2;const gaussian=()=>Math.sqrt(-2*Math.log(Math.max(rand(),1e-6)))*Math.cos(tau*rand());
 const materials=[];
 function points(pos,col,sizes,opacity=1){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('tint',new THREE.Float32BufferAttribute(col,3));g.setAttribute('size',new THREE.Float32BufferAttribute(sizes,1));
  const m=new THREE.ShaderMaterial({uniforms:{time:{value:0},ratio:{value:pixelRatio},opacity:{value:opacity}},vertexShader:`attribute vec3 tint;attribute float size;varying vec3 vTint;varying float vPhase;uniform float ratio;void main(){vTint=tint;vPhase=position.x*.37+position.y*.19;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size*ratio;}`,fragmentShader:`varying vec3 vTint;varying float vPhase;uniform float time;uniform float opacity;void main(){float d=length(gl_PointCoord-.5);float a=exp(-15.*d*d)*(1.-smoothstep(.38,.5,d));gl_FragColor=vec4(pow(max(vTint,vec3(0.)),vec3(2.2)),a*opacity*(.84+.16*sin(time*(.65+fract(vPhase)*1.2)+vPhase)));}`,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});materials.push(m);const p=new THREE.Points(g,m);root.add(p);return p;
 }
 for(let layer=0;layer<3;layer++){
  const pos=[],col=[],sizes=[];const count=(baixo?[3200,4800,6000]:[6500,9000,12000])[layer];
  for(let i=0;i<count;i++){const y=rand()*2-1,a=tau*rand(),r=[190,270,350][layer]+rand()*30,q=Math.sqrt(1-y*y);pos.push(r*q*Math.cos(a),r*y,r*q*Math.sin(a));const b=.42+rand()*.58;const warm=rand();col.push(b*(warm>.8?1:.83),b*.91,b*(warm>.8?.73:1));sizes.push((1.25+Math.pow(rand(),2)*2.3)*(layer===0?1.35:1));}points(pos,col,sizes,1.);
 }
 for(let k=0;k<(baixo?3:5);k++){
  const pos=[],col=[],sizes=[];const a=k*tau/5+.4;const center=new THREE.Vector3(Math.cos(a)*300,Math.sin(k*2.1)*95,Math.sin(a)*300);const rotation=new THREE.Euler(.6+k*.7,k*.9,k*.4);const count=baixo?350:850;
  for(let i=0;i<count;i++){const r=Math.pow(rand(),1.6)*13;const t=(i%2)*Math.PI+r*.55+gaussian()*.25;const v=new THREE.Vector3(Math.cos(t)*r,gaussian()*.5,Math.sin(t)*r).applyEuler(rotation).add(center);pos.push(v.x,v.y,v.z);const b=.2+.5*(1-r/13);col.push(b,b*.83,b*.95);sizes.push(.8+rand()*.8);}points(pos,col,sizes,.65);
 }
 // Faixa estelar difusa: uma concentração natural, não uma textura de fundo.
 {
 const pos=[],col=[],sizes=[];const tilt=new THREE.Euler(.48,0,.36);
 for(let i=0;i<(baixo?5500:11000);i++){
 const a=rand()*tau,r=310+rand()*75,y=gaussian()*25;
 const v=new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r).applyEuler(tilt);
 pos.push(v.x,v.y,v.z);const b=.35+Math.pow(rand(),2)*.65;col.push(b*.85,b*.92,b);sizes.push(1.15+rand()*1.25);
 }points(pos,col,sizes,.9);
 }
 // Poeira orbital: faixas irregulares com falhas, sem linhas sólidas.
 const dustPos=[],dustCol=[],dustSize=[];
 for(const astro of ASTROS.filter(a=>a.orbita&&!a.pai)){
 const count=baixo?650:1250;
 for(let i=0;i<count;i++){
 const a=rand()*tau;const density=.55+.25*Math.sin(a*3+astro.orbita)+.15*Math.cos(a*7);
 if(rand()>density)continue;
 const r=astro.orbita+gaussian()*(.45+astro.orbita*.023);
 dustPos.push(Math.cos(a)*r,gaussian()*(.12+astro.orbita*.004),Math.sin(a)*r);
 const b=.42+rand()*.5;dustCol.push(b,b*.96,b*(.84+rand()*.16));dustSize.push(1.1+rand()*1.1);
 }}
 const dust=points(dustPos,dustCol,dustSize,.72);
 const n=baixo?24:48,positions=new Float32Array(n*3),colors=new Float32Array(n*3);for(let i=0;i<n;i++){const b=Math.pow(1-i/n,2);colors.set([b*.65,b*.83,b],i*3);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));const tail=new THREE.Line(geo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending}));tail.frustumCulled=false;root.add(tail);tail.visible=false;
 const head=points([0,0,0],[.8,.9,1],[4],.9);head.visible=false;const start=new THREE.Vector3(),dir=new THREE.Vector3();let elapsed=0,wait=20+rand()*40,age=-1;
 function atualizar(dt,camera){dt=Math.min(.1,Math.max(0,dt));elapsed+=dt;if(camera)sky.position.copy(camera.position);dust.rotation.y+=dt*.012;for(const m of materials)m.uniforms.time.value=elapsed;
 if(age<0){wait-=dt;if(wait>0||!camera)return;camera.updateMatrixWorld();const forward=new THREE.Vector3();camera.getWorldDirection(forward);const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0);const up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1);start.copy(camera.position).addScaledVector(forward,160).addScaledVector(right,-90).addScaledVector(up,35+rand()*20);dir.copy(right).addScaledVector(up,-.25).normalize();age=0;head.visible=tail.visible=true;}
 age+=dt;head.position.copy(start).addScaledVector(dir,age*35);for(let i=0;i<n;i++){const d=i/(n-1)*23;positions[i*3]=head.position.x-dir.x*d;positions[i*3+1]=head.position.y-dir.y*d;positions[i*3+2]=head.position.z-dir.z*d;}geo.attributes.position.needsUpdate=true;const fade=Math.min(1,age*2,(6-age)*2);tail.material.opacity=.75*Math.max(0,fade);head.material.uniforms.opacity.value=.9*Math.max(0,fade);if(age>=6){age=-1;wait=20+rand()*40;head.visible=tail.visible=false;}}
 function destruir(){root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});scene.remove(root);}
 return {atualizar,destruir,setPixelRatio(ratio){for(const m of materials)m.uniforms.ratio.value=ratio;}};
}
