import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

// Navegação orbital sem dependências adicionais. Compatível com criarSistemaSolar().
export function criarCamera(camera, canvas, sistema, {onSelect=()=>{}, onFocus=()=>{}, canSelect=()=>true}={}) {
  const target=new THREE.Vector3(), desired=new THREE.Vector3();
  const offset=new THREE.Spherical(105,Math.PI/3,Math.PI/4);
  const ray=new THREE.Raycaster(), pointer=new THREE.Vector2();
  const fingers=new Map(); let focused=null, gesture=null, flight=null, disposed=false;
  const clamp=THREE.MathUtils.clamp;
  const home=(final=false)=>{for(const id of fingers.keys()){if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}fingers.clear();gesture=null;focused=null; flight={elapsed:0,duration:1.25,start:target.clone(),radius:offset.radius,endRadius:105,final,theta:offset.theta,phi:offset.phi};};
  function focar(id){
    const astro=sistema.astros.get(id); if(!astro)return false;
    focused=id; flight={elapsed:0,duration:1.35,start:target.clone(),radius:offset.radius,endRadius:Math.max(astro.raio*(id==='saturno'?7:4.8),1.8)};
    return true;
  }
  function minRadius(){return focused?Math.max(sistema.astros.get(focused).raio*1.35,.5):5;}
  function zoom(factor){flight=null;offset.radius=clamp(offset.radius*factor,minRadius(),180);}
  function rotate(dx,dy){flight=null;offset.theta-=dx*.006;offset.phi=clamp(offset.phi-dy*.006,.08,Math.PI-.08);}
  function atualizar(dt=0){
    if(disposed)return;
    if(focused)sistema.posicao(focused,desired);else desired.set(0,0,0);
    if(flight){flight.elapsed+=Math.max(0,Math.min(dt,.1));const t=clamp(flight.elapsed/flight.duration,0,1),e=t*t*(3-2*t);target.copy(flight.start).lerp(desired,e);if(flight.final){offset.theta=THREE.MathUtils.lerp(flight.theta,Math.PI/4,e);offset.phi=THREE.MathUtils.lerp(flight.phi,Math.PI/3,e); }offset.radius=THREE.MathUtils.lerp(flight.radius,flight.endRadius,e);if(t===1){flight=null;if(focused)onFocus(focused);}}
    else target.copy(desired);
    camera.position.setFromSpherical(offset).add(target);camera.lookAt(target);
  }
  function pick(x,y){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;pointer.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);camera.updateMatrixWorld();ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(sistema.alvos,false)[0];if(hit){const id=hit.object.userData.astroId;if(canSelect(id)&&focar(id))onSelect(id);}}
  function down(e){if(e.pointerType==='mouse'&&e.button!==0)return;canvas.setPointerCapture(e.pointerId);fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(fingers.size===1)gesture={x:e.clientX,y:e.clientY,moved:false};else if(gesture)gesture.moved=true;}
  function move(e){const old=fingers.get(e.pointerId);if(!old)return;const next={x:e.clientX,y:e.clientY};if(fingers.size===1){if(gesture&&Math.hypot(next.x-gesture.x,next.y-gesture.y)>7)gesture.moved=true;if(gesture?.moved)rotate(next.x-old.x,next.y-old.y);}else if(fingers.size===2){const other=[...fingers.entries()].find(([id])=>id!==e.pointerId)[1];const a=Math.hypot(old.x-other.x,old.y-other.y),b=Math.hypot(next.x-other.x,next.y-other.y);if(a>5&&b>5)zoom(a/b);}fingers.set(e.pointerId,next);}
  function up(e){if(!fingers.has(e.pointerId))return;const tap=e.type==='pointerup'&&fingers.size===1&&gesture&&!gesture.moved&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)<=7;fingers.delete(e.pointerId);if(!fingers.size)gesture=null;if(tap)pick(e.clientX,e.clientY);}
  function wheel(e){e.preventDefault();zoom(Math.exp(clamp(e.deltaY,-300,300)*.0015));}
  const previousTouch=canvas.style.touchAction;canvas.style.touchAction='none';
  const events=[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up],['lostpointercapture',up],['wheel',wheel]];
  for(const [name,fn] of events)canvas.addEventListener(name,fn,{passive:false});
  function destruir(){disposed=true;for(const [name,fn] of events)canvas.removeEventListener(name,fn);canvas.style.touchAction=previousTouch;fingers.clear();}
  atualizar();
  return {atualizar,focar,home,zoom,destruir,get foco(){return focused;}};
}
