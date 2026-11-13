import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
export function criarSol(mesh,mapa,esfera,centro,raio){
 const antigo=mesh.material;
 const time={value:0};
 mesh.material=new THREE.ShaderMaterial({uniforms:{mapa:{value:mapa},tempo:time},vertexShader:`varying vec2 vUv; varying vec3 vN; varying vec3 vP; void main(){vUv=uv;vN=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);vP=p.xyz;gl_Position=projectionMatrix*p;}`,fragmentShader:`uniform sampler2D mapa;uniform float tempo;varying vec2 vUv;varying vec3 vN;varying vec3 vP;void main(){vec2 uv=vUv;uv.x=fract(uv.x+.0015*sin(uv.y*65.+tempo*.35));vec3 tex=texture2D(mapa,uv).rgb;float pulse=.96+.04*sin(uv.x*90.+uv.y*45.+tempo*.6);float limb=.64+.36*pow(max(0.,dot(normalize(vN),normalize(-vP))),.45);vec3 c=(tex*vec3(1.12,1.12,.99)+vec3(.16,.13,.065))*pulse*limb;gl_FragColor=vec4(c*2.8,1.);
 #include <colorspace_fragment>
 }`});antigo.dispose();
 const corona=new THREE.Mesh(esfera,new THREE.ShaderMaterial({uniforms:{tempo:time},vertexShader:`varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);vP=p.xyz;gl_Position=projectionMatrix*p;}`,fragmentShader:`uniform float tempo;varying vec3 vN;varying vec3 vP;void main(){float edge=pow(1.-abs(dot(normalize(vN),normalize(-vP))),5.);float a=edge*.48*(.88+.12*sin(atan(vN.y,vN.x)*19.+tempo*.4));gl_FragColor=vec4(2.0,1.35,.62,a);}`,side:THREE.BackSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));corona.scale.setScalar(raio*1.065);centro.add(corona);
 // Halo óptico procedural em plano voltado à câmera; centro transparente para não lavar a fotosfera.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 const ctx=canvas.getContext('2d'),img=ctx.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const dx=(x+.5-128)/128,dy=(y+.5-128)/128,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
  const edge=.48, d=Math.max(0,r-edge), gate=Math.min(1,Math.max(0,(r-.44)/.045));
  const rays=.72+.18*Math.sin(a*19+2*Math.sin(a*7))+.10*Math.sin(a*47);
  const alpha=gate*(.48*Math.exp(-d*29)+.14*Math.exp(-d*9)*rays)*Math.max(0,1-r)**.65;
  const i=(y*256+x)*4;img.data[i]=255;img.data[i+1]=Math.round(210+35*Math.exp(-d*20));img.data[i+2]=Math.round(115+110*Math.exp(-d*20));img.data[i+3]=Math.round(255*alpha);
 }ctx.putImageData(img,0,0);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));glow.scale.set(raio*4.15,raio*4.15,1);centro.add(glow);
 return dt=>{time.value+=dt;glow.material.opacity=.93+.07*Math.sin(time.value*.35);};
}
