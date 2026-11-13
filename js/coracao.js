import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

// Formação estelar tridimensional, sem contorno desenhado ou textura externa.
export function criarCoracao(scene,{baixo=false,pixelRatio=1}={}){
 const root=new THREE.Group();scene.add(root);
 // Atrás do sistema solar na perspectiva inicial; permanece fixo no espaço.
 const normal=new THREE.Vector3( Math.sqrt(3/8),.5,Math.sqrt(3/8));
 root.position.copy(normal).multiplyScalar(-205);
 root.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
 const cloud=new THREE.Group();root.add(cloud);
 let seed=1947;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const gauss=()=>Math.sqrt(-2*Math.log(Math.max(rand(),1e-7)))*Math.cos(rand()*Math.PI*2);
 const pos=[],colors=[],sizes=[],phases=[],reveal=[];
 const palette=[[.83,.43,.68],[.59,.49,.88],[.93,.72,.48],[.76,.68,.92]];
 const count=baixo?2600:6200;
 for(let i=0;i<count;i++){
  const t=rand()*Math.PI*2;
  const r=.48+.52*Math.pow(rand(),.55);
  const x=16*Math.pow(Math.sin(t),3), y=13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t);
  const spread=rand()<.18?12:4.5;
  pos.push(x*5.7*r+gauss()*spread+4*Math.sin(t*3),y*5.7*r+gauss()*spread+8,gauss()*12+9*Math.sin(t*2));
  const c=palette[Math.floor(rand()*palette.length)],b=.45+rand()*.55;
  colors.push(...c.map(v=>Math.pow(v*b,2.2)));
  sizes.push(.8+Math.pow(rand(),3)*2.4);phases.push(rand()*6.283);reveal.push(rand());
 }
 const geo=new THREE.BufferGeometry();
 for(const [name,arr,n] of [['position',pos,3],['tint',colors,3],['size',sizes,1],['phase',phases,1],['reveal',reveal,1]])geo.setAttribute(name,new THREE.Float32BufferAttribute(arr,n));
 const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},progress:{value:0},ratio:{value:pixelRatio}},vertexShader:`attribute vec3 tint;attribute float size,phase,reveal;uniform float ratio;varying vec3 vTint;varying float vPhase,vReveal;void main(){vTint=tint;vPhase=phase;vReveal=reveal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size*ratio;}`,fragmentShader:`uniform float time,progress;varying vec3 vTint;varying float vPhase,vReveal;void main(){float d=length(gl_PointCoord-.5);float shape=exp(-12.*d*d)*(1.-smoothstep(.35,.5,d));float visible=smoothstep(vReveal-.12,vReveal+.12,.12+progress*1.02);float alpha=shape*(.045+visible*(.20+.30*progress))*(.88+.12*sin(time*.55+vPhase));gl_FragColor=vec4(vTint,alpha);}`});
 const points=new THREE.Points(geo,mat);cloud.add(points);
 let target=0,time=0;
 function progresso(p,imediato=false){target=THREE.MathUtils.clamp(p,0,1);if(imediato)mat.uniforms.progress.value=target;}
 function atualizar(dt){time+=dt;mat.uniforms.time.value=time;mat.uniforms.progress.value=THREE.MathUtils.lerp(mat.uniforms.progress.value,target,1-Math.exp(-dt*1.4));cloud.rotation.z=.065*Math.sin(time*.018);}
 return {progresso,atualizar,setPixelRatio(ratio){mat.uniforms.ratio.value=ratio;},destruir(){scene.remove(root);geo.dispose();mat.dispose();}};
}
