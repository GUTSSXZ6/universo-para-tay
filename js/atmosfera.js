import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
export function atmosfera(esfera,raio,cor,forca,espessura){
 const m=new THREE.ShaderMaterial({uniforms:{cor:{value:new THREE.Color(cor)},forca:{value:forca},ratio:{value:1/(1+espessura)}},vertexShader:`varying vec3 p,c,n;void main(){vec4 q=modelViewMatrix*vec4(position,1.);p=q.xyz;c=(modelViewMatrix*vec4(0.,0.,0.,1.)).xyz;n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*q;}`,fragmentShader:`uniform vec3 cor;uniform float forca,ratio;varying vec3 p,c,n;void main(){vec3 V=normalize(-p),N=normalize(n),L=normalize((viewMatrix*vec4(0.,0.,0.,1.)).xyz-c);float mu=max(dot(N,V),0.);float b=sqrt(max(0.,1.-mu*mu));float outer=sqrt(max(0.,1.-b*b));float inner=sqrt(max(0.,ratio*ratio-b*b));float path=b<ratio?outer-inner:2.*outer;float density=1.-exp(-path*4.);float rim=smoothstep(.55,ratio,b);float lit=.12+.88*smoothstep(-.25,.55,dot(N,L));float alpha=density*rim*lit*forca;gl_FragColor=vec4(cor*1.3,clamp(alpha,0.,.85));
#include <colorspace_fragment>
}`,transparent:true,depthWrite:false,side:THREE.FrontSide,blending:THREE.AdditiveBlending});
 const h=new THREE.Mesh(esfera,m);h.scale.setScalar(raio*(1+espessura));return h;
}
