/* Integration test of the actual app movement/state machine. Rendering is stubbed;
   this intentionally does not claim browser layout, touch-device or GPU coverage. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as rules from '../engine.js';
const node={textContent:'',value:0,classList:{toggle(){},add(){},remove(){}},style:{},remove(){},append(){},setAttribute(){}};
const context=vm.createContext({...rules,console,Math,Set,Promise,document:{querySelector:()=>node,querySelectorAll:()=>[],body:node,addEventListener(){}},window:{addEventListener(){}},localStorage:{getItem:()=>null},matchMedia:()=>({matches:false}),setTimeout,clearTimeout,setInterval,clearInterval,requestAnimationFrame(){},devicePixelRatio:1});
let source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('savePrefs();requestAnimationFrame(frame);preload();','');
vm.runInContext(source,context);
vm.runInContext(`renderTravel=()=>{};renderInventory=()=>{};renderRouteHelp=()=>{};updateHUD=()=>{};note=()=>{};sfx=()=>{};transition=()=>{mode='transition';};finish=()=>{mode='end';result=breakdown(s);};`,context);
let runs=0;
for(let band=0;band<6;band++)for(const route of Object.keys(rules.ROUTES))for(const emptyMeters of [false,true]){
 vm.runInContext(`s=createState(${band},'Test Explorer');s.route=${JSON.stringify(route)};lock(s);s.energy=${emptyMeters?0:100};s.health=${emptyMeters?0:100};s.injured=${emptyMeters};s.round=2;section=0;roundStart=0;startTravel();`,context);
 let guard=0;
 while(vm.runInContext('mode',context)==='travel'){
  if(vm.runInContext('!g.target',context))vm.runInContext('detour()',context);
  vm.runInContext('s.elapsed+=.05;step(.05)',context);assert.ok(++guard<50000,'Round 2 reaches its transition');
 }
 assert.equal(vm.runInContext('s.progress',context),300);
 vm.runInContext(`s.round=3;roundStart=s.elapsed;eventList=[ROUTES[s.route].event,...Array(BANDS[s.band].events[1]-1).fill('injury')];eventIndex=0;s.routeChangesTarget=BANDS[s.band].changes[1];startTravel();`,context);
 guard=0;
 while(vm.runInContext('mode',context)==='travel'){
  if(vm.runInContext('!g.target',context))vm.runInContext('detour()',context);
  vm.runInContext('s.elapsed+=.05;step(.05)',context);assert.ok(++guard<100000,'Round 3 reaches Lighthouse despite repeated injuries');
 }
 assert.equal(vm.runInContext('mode',context),'end');assert.equal(vm.runInContext('s.progress',context),600);assert.ok(vm.runInContext('Number.isFinite(result.total)',context));runs++;
}
// Keyboard-equivalent direct movement selects the actual physical fork.
for(const route of Object.keys(rules.ROUTES)){
 vm.runInContext(`s=createState(0);lock(s);s.round=2;section=0;startTravel(true);chooseRoute(${JSON.stringify(route)});`,context);
 let guard=0;while(vm.runInContext('g.fork',context)){vm.runInContext('step(.05)',context);assert.ok(++guard<2000);}
 assert.equal(vm.runInContext('s.route',context),route);
}
// At the obstacle, the relevant reusable item opens the direct path exactly once.
for(const route of Object.keys(rules.ROUTES)){
 vm.runInContext(`s=createState(5);s.route=${JSON.stringify(route)};pack(s,ROUTES[s.route].gear);lock(s);s.round=2;section=0;startTravel();g.x=350;g.y=350;activate(ROUTES[s.route].gear);`,context);
 assert.equal(vm.runInContext('g.blocked',context),false);assert.equal(vm.runInContext('s.resource',context),20);assert.equal(vm.runInContext('s.adaptation',context),50);
 vm.runInContext('activate(ROUTES[s.route].gear)',context);assert.equal(vm.runInContext('s.resource',context),20);
}
console.log(JSON.stringify({passed:true,fullGameNavigationRuns:runs,coverage:'all bands × all routes × full/zero meters, repeated injury rescues, changing fallback paths, physical forks, gear opening, no repeat reward'}));
