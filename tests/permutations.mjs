import assert from 'node:assert/strict';
import {ITEMS,BANDS,ROUTES,EVENTS,WORLD,createState,capacity,pack,lock,score,drain,damage,enterEvent,useItem,shortcut,eventSequence,breakdown,speedFactor,canMove} from '../engine.js';
let cases=0,loadouts=0;
// Walk every legal loadout (including empty) × route × event at zero and full meters.
// The fallback is the same collision rectangle and waypoint path as the game.
function walkFallback(s){let {x,y}=WORLD.start;for(const goal of WORLD.detour){let limit=0;while(Math.hypot(goal.x-x,goal.y-y)>1){assert.ok(++limit<10000,'finite travel to waypoint');const dx=goal.x-x,dy=goal.y-y,dist=Math.hypot(dx,dy),step=Math.min(dist,3*speedFactor(s));x+=dx/dist*step;y+=dy/dist*step;assert.ok(canMove(x,y,true),'fallback intersects obstacle');}}assert.ok(x>=916&&Math.abs(y-350)<55,'reaches exit');}
for(let b=0;b<BANDS.length;b++){
 const band=BANDS[b];let strategies=new Set();
 for(let bits=0;bits<2**band.pool;bits++){
  const list=ITEMS.slice(0,band.pool).filter((_,i)=>bits&(1<<i));if(list.reduce((n,i)=>n+i.slots,0)>band.capacity)continue;
  loadouts++;
  for(const route of Object.keys(ROUTES))for(const event of Object.keys(EVENTS))for(const zero of [false,true]){
   const s=createState(b);for(const item of list)assert.ok(pack(s,item.id));lock(s);const before=[...s.inventory];assert.equal(pack(s,ITEMS[0].id),false);assert.deepEqual(s.inventory,before);s.route=route;s.energy=zero?0:100;s.health=zero?0:100;s.injured=zero;enterEvent(s,event);walkFallback(s);cases++;strategies.add(route);
  }
 }
 assert.equal(strategies.size,4,`four viable route strategies in band ${b}`);
 for(const route of Object.keys(ROUTES))for(let seed=1;seed<=50;seed++){
  let r=seed;const rng=()=>((r=(r*1664525+1013904223)>>>0)/2**32);const s=createState(b);s.route=route;const events=eventSequence(s,rng);assert.equal(events[0],ROUTES[route].event);assert.ok(events.length>=band.events[0]&&events.length<=band.events[1]);
 }
 // Single-item use permutations cover reusable and consumable behavior.
 for(const item of ITEMS.slice(0,band.pool))for(const event of Object.keys(EVENTS)){
  const s=createState(b);pack(s,item.id);lock(s);s.energy=50;s.health=50;enterEvent(s,event);const first=useItem(s,item.id,event);assert.ok(first.ok);const second=useItem(s,item.id,event);assert.equal(second.ok,!(['water','food','aid'].includes(item.id)||first.good),'consumables are gone and meaningful reuse cannot farm points');
 }
}
const s=createState();s.route='cliff';lock(s);drain(s,100);assert.equal(s.penalties,100);drain(s,10);assert.equal(s.penalties,100,'continuous zero does not repeat penalty');assert.equal(speedFactor(s),.5);assert.ok(damage(s,100));assert.equal(s.penalties,175);assert.equal(s.rescueSeconds,20);assert.ok(speedFactor(s)>0);s.progress=900;s.resource=900;s.adaptation=900;const target=BANDS[0].times.reduce((a,b)=>a+b);assert.deepEqual(breakdown(s,target-20),{progress:600,resource:300,adaptation:200,timeBonus:150,penalties:175,total:1075,seconds:target});assert.equal(breakdown(s,target*1.25-20).timeBonus,0);assert.equal(breakdown(s,target*1.125-20).timeBonus,75);assert.equal(breakdown(s,target*4).timeBonus,0);
const risk=createState();risk.route='cliff';assert.equal(shortcut(risk,()=>.49),true);assert.equal(shortcut(risk,()=>.5),false);risk.inventory=['rope'];assert.equal(shortcut(risk,()=>.89),true);assert.equal(shortcut(risk,()=>.9),false);
console.log(JSON.stringify({passed:true,legalLoadouts:loadouts,routeLoadoutEventMeterCases:cases,routeStrategiesPerBand:4,tests:'fallback collision reachability, pack lock, event mapping/counts, single use/reuse, soft failures, category caps, time taper, shortcut odds'},null,2));
