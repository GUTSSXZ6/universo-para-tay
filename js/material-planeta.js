import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
const profiles={mercurio:[1.25,.08,0],venus:[1.12,0,.12],terra:[1.12,0,.18],lua:[1.25,.09,0],marte:[1.12,.035,.04],jupiter:[1.2,0,.08],saturno:[1.18,0,.08],urano:[.96,0,.12],netuno:[.88,0,.13],plutao:[1.25,.06,0]};
export function materialPlaneta(id,mapa,baixo){
 const [contraste,relevo,borda]=profiles[id]||[1,0,0];
 const cor=new THREE.Color(({terra:0x398dff,venus:0xffd5a0,marte:0xe6a079,jupiter:0xe9c7a0,saturno:0xe9d1a1,urano:0x8de5e9,netuno:0x668dff})[id]||0xffffff);
 return new THREE.ShaderMaterial({uniforms:{mapa:{value:mapa},contraste:{value:contraste},relevo:{value:baixo?relevo*.65:relevo},borda:{value:borda},cor:{value:cor}},vertexShader:`varying vec2 vUv;varying vec3 vP;varying vec3 vN;void main(){vUv=uv;vec4 p=modelViewMatrix*vec4(position,1.);vP=p.xyz;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*p;}`,fragmentShader:`uniform sampler2D mapa;uniform float contraste,relevo,borda;uniform vec3 cor;varying vec2 vUv;varying vec3 vP,vN;
 void main(){vec3 base=texture2D(mapa,vUv).rgb;vec3 n=normalize(vN);vec3 l=normalize((viewMatrix*vec4(0.,0.,0.,1.)).xyz-vP);vec3 v=normalize(-vP);
 float lum=dot(base,vec3(.2126,.7152,.0722));
 if(relevo>0.){float dx=dFdx(lum),dy=dFdy(lum);vec3 px=dFdx(vP),py=dFdy(vP);vec3 r1=cross(py,n),r2=cross(n,px);float det=dot(px,r1);n=normalize(n-relevo*(sign(det)*(dx*r1+dy*r2))/max(abs(det),.000001));}
 float nd=dot(n,l);float dia=smoothstep(-.16,.45,nd);float dif=max(nd,0.);base=pow(max(base,vec3(.0001)),vec3(.86));base=max(vec3(0.),mix(vec3(dot(base,vec3(.2126,.7152,.0722))),base,contraste));
 vec3 c=base*(.16+.55*dia+.95*dif)*mix(vec3(.79,.87,1.),vec3(1.,.97,.91),dia);float rim=pow(1.-max(dot(normalize(vN),v),0.),3.);c+=cor*rim*borda*(.12+.88*dia); c=c/(1.+.10*c);gl_FragColor=vec4(c,1.);
 #include <colorspace_fragment>
 }`});
}
