import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
// HDR + bloom em resolução reduzida. Sem dependências além do Three.js.
export function criarRenderizacao(renderer,{baixo=false}={}){
 const hdr=renderer.capabilities.isWebGL2&&renderer.extensions.has('EXT_color_buffer_float');
 const type=hdr?THREE.HalfFloatType:THREE.UnsignedByteType;
 const target=(depthBuffer=false)=>new THREE.WebGLRenderTarget(1,1,{type,depthBuffer,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
 const main=target(true),a=target(),b=target(),c=target();
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2));quad.frustumCulled=false;scene.add(quad);
 const shader=(uniforms,fragmentShader)=>new THREE.ShaderMaterial({uniforms,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader,depthTest:false,depthWrite:false,toneMapped:false});
 const extract=shader({image:{value:main.texture},threshold:{value:hdr?1.05:.72}},`varying vec2 vUv;uniform sampler2D image;uniform float threshold;void main(){vec3 c=texture2D(image,vUv).rgb;float m=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*smoothstep(threshold,threshold+.35,m),1.);}`);
 const blur=shader({image:{value:a.texture},stepUV:{value:new THREE.Vector2()}},`varying vec2 vUv;uniform sampler2D image;uniform vec2 stepUV;void main(){vec3 c=texture2D(image,vUv).rgb*.227027;c+=(texture2D(image,vUv+stepUV*1.384615).rgb+texture2D(image,vUv-stepUV*1.384615).rgb)*.316216;c+=(texture2D(image,vUv+stepUV*3.230769).rgb+texture2D(image,vUv-stepUV*3.230769).rgb)*.070270;gl_FragColor=vec4(c,1.);}`);
 const final=shader({image:{value:main.texture},glow:{value:a.texture},wide:{value:c.texture},strength:{value:hdr?.32:.18}},`varying vec2 vUv;uniform sampler2D image,glow,wide;uniform float strength;void main(){vec3 base=texture2D(image,vUv).rgb;vec3 col=base+strength*(texture2D(glow,vUv).rgb*.65+texture2D(wide,vUv).rgb*.55);float peak=max(col.r,max(col.g,col.b));if(peak>.65){float mapped=.65+.35*(1.-exp(-(peak-.65)/.35));col*=mapped/peak;}gl_FragColor=vec4(col,1.);
#include <colorspace_fragment>
}`);
 function pass(mat,dest){quad.material=mat;renderer.setRenderTarget(dest);renderer.render(scene,camera);}
 function resize(w,h){const ratio=renderer.getPixelRatio();w=Math.max(1,Math.floor(w*ratio));h=Math.max(1,Math.floor(h*ratio));main.setSize(w,h);const divisor=baixo?4:3;for(const t of [a,b,c])t.setSize(Math.max(1,Math.floor(w/divisor)),Math.max(1,Math.floor(h/divisor)));}
 function render(world,view){renderer.setRenderTarget(main);renderer.render(world,view);pass(extract,a);blur.uniforms.image.value=a.texture;blur.uniforms.stepUV.value.set(1/a.width,0);pass(blur,b);blur.uniforms.image.value=b.texture;blur.uniforms.stepUV.value.set(0,1/a.height);pass(blur,a);blur.uniforms.image.value=a.texture;blur.uniforms.stepUV.value.set(3/a.width,0);pass(blur,b);blur.uniforms.image.value=b.texture;blur.uniforms.stepUV.value.set(0,3/a.height);pass(blur,c);pass(final,null);}
 return {resize,render,hdr};
}
