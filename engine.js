/* Shared game rules. Pure model used by the game and exhaustive tests. */
export const ITEMS=[
 ['water','Water Bottle',2,'💧','Restore 30 Energy. One use.'],['food','Food Pack',1,'🥭','Restore 20 Energy. One use.'],
 ['rope','Rope',2,'🪢','Cross gaps, bridges and rivers.'],['compass','Compass',1,'🧭','Reveal an alternate path.'],
 ['light','Flashlight',1,'🔦','Light a safe path through darkness.'],['aid','First-Aid Kit',2,'🩹','Restore 50 Health. One use.'],
 ['jacket','Rain Jacket',1,'🧥','Protect yourself in a storm.'],['shoes','Extra Shoes',2,'🥾','Move more easily on rough ground.'],
 ['fuel','Torch Fuel',1,'🏮','Extend your carried Flashlight’s light.'],['machete','Machete',2,'🌿','Clear a path through vegetation.'],
 ['raft','Small Raft',3,'🛶','Cross water and coastal shortcuts.'],['matches','Dry Matches',1,'🔥','Light a fire at a camp point.'],
 ['blanket','Emergency Blanket',1,'🧣','Keep warm through a storm.'],['repair','Repair Kit',2,'🛠️','Repair a bridge or damaged route object.']
].map(([id,name,slots,icon,effect])=>({id,name,slots,icon,effect}));
export const BANDS=[
 {name:'1–2',capacity:6,pool:8,times:[90,150,80],events:[2,2],changes:[0,0]},
 {name:'3–4',capacity:7,pool:10,times:[75,140,95],events:[3,3],changes:[1,1]},
 {name:'5–6',capacity:8,pool:12,times:[60,130,110],events:[4,4],changes:[2,2]},
 {name:'7–8',capacity:8,pool:14,times:[55,120,120],events:[4,5],changes:[2,3]},
 {name:'9–10',capacity:7,pool:14,times:[50,110,130],events:[5,5],changes:[3,3]},
 {name:'11–12',capacity:7,pool:14,times:[45,100,140],events:[5,6],changes:[3,4]}
];
export const ROUTES={
 jungle:{name:'Jungle',desc:'Longer · thick vegetation',event:'tree',gear:'machete',length:1.2,color:'#32794d'},
 cliff:{name:'Cliff',desc:'Shorter · gaps & steep climbs',event:'bridge',gear:'rope',length:.9,color:'#b77e54'},
 cave:{name:'Cave',desc:'Shortest · dark passages',event:'dark',gear:'light',length:.75,color:'#555d7b'},
 coastal:{name:'Coastal',desc:'Medium · water & weather',event:'river',gear:'raft',length:1.05,color:'#309ba2'}
};
export const EVENTS={
 tree:{name:'Fallen Tree',gear:['machete'],hint:'A machete would clear this path.',detour:'Walk around the tree'},
 bridge:{name:'Broken Bridge',gear:['rope','repair'],hint:'A rope or repair kit would make this easier.',detour:'Take the hillside path'},
 dark:{name:'Dark Passage',gear:['light','fuel'],hint:'A flashlight would light the way.',detour:'Follow the daylight path'},
 river:{name:'River Crossing',gear:['raft','rope'],hint:'A raft or rope would help you cross.',detour:'Take the longer land route'},
 storm:{name:'Storm',gear:['jacket','blanket'],hint:'A rain jacket would help in this weather.',detour:'Walk through the shelter'},
 injury:{name:'Injury',gear:['aid'],hint:'A first-aid kit would restore lost health.',detour:'Keep moving carefully'}
};
export function createState(band=0,name='Explorer') {return {band,name,inventory:[],locked:false,energy:100,health:100,route:null,progress:0,adaptation:0,resource:0,penalties:0,rescueSeconds:0,fatigued:false,rescues:0,log:[],used:new Set(),eventSerial:0,activeGear:new Set(),round:1,elapsed:0,injured:false,delayedDrain:0};}
export function capacity(s){return s.inventory.reduce((n,id)=>n+ITEMS.find(i=>i.id===id).slots,0);}
export function pack(s,id){if(s.locked)return false;const item=ITEMS.slice(0,BANDS[s.band].pool).find(i=>i.id===id);if(!item)return false;const at=s.inventory.indexOf(id);if(at>=0){s.inventory.splice(at,1);return true;}if(capacity(s)+item.slots>BANDS[s.band].capacity)return false;s.inventory.push(id);return true;}
export function lock(s){s.locked=true;}
export function score(s,kind,amount,label){s[kind]+=amount;s.log.push({kind,amount,label});}
export function drain(s,amount){const before=s.energy;s.energy=Math.max(0,s.energy-amount);if(before>0&&s.energy===0){score(s,'penalties',100,'Energy reached zero');s.fatigued=true;}}
export function damage(s,amount){s.health=Math.max(0,s.health-amount);s.injured=s.health<100;if(s.health===0){score(s,'penalties',75,'Safe checkpoint rescue');s.rescueSeconds+=20;s.rescues++;/* Rescue leaves Health at zero. A safe checkpoint and a speed floor keep all paths playable. */return true;}return false;}
export function enterEvent(s,event){s.eventSerial++;s.activeGear.clear();if(event==='injury')return damage(s,50);return false;}
export function meaningful(s,id,context){
 if(id==='water')return s.energy<=70;
 if(id==='food')return s.energy<=80;
 if(id==='aid')return s.health<=50;
 if(id==='shoes')return ['bridge','tree'].includes(context);
 if(id==='compass')return !!context;
 if(id==='matches')return context==='camp';
 if(id==='fuel')return context==='dark'&&s.inventory.includes('light');
 return EVENTS[context]?.gear.includes(id)??false;
}
export function useItem(s,id,context){
 if(!s.locked||!s.inventory.includes(id))return {ok:false};
 const once=['water','food','aid'].includes(id);const key=`${s.eventSerial}:${id}`;
 if(!once&&s.used.has(key))return {ok:false,repeat:true};
 const good=meaningful(s,id,context);
 if(good){score(s,'resource',20,`Meaningful ${id}`);s.activeGear.add(id);}else score(s,'penalties',30,`Unnecessary ${id}`);
 if(id==='water')s.energy=Math.min(100,s.energy+30);
 if(id==='food')s.energy=Math.min(100,s.energy+20);
 if(id==='aid'){s.health=Math.min(100,s.health+50);s.injured=s.health<100;}
 s.fatigued=s.energy===0;
 if(once)s.inventory.splice(s.inventory.indexOf(id),1);else if(good)s.used.add(key);
 return {ok:true,good,opens:good&&(EVENTS[context]?.gear.includes(id)??false)};
}
export function shortcut(s,rng=Math.random){const route=ROUTES[s.route];const success=rng()<(s.inventory.includes(route.gear)?.9:.5);if(success)score(s,'adaptation',75,'Risky shortcut');else damage(s,25);return success;}
export function eventSequence(s,rng=Math.random){const b=BANDS[s.band],n=b.events[0]+Math.floor(rng()*(b.events[1]-b.events[0]+1));const first=ROUTES[s.route].event;const all=Object.keys(EVENTS);const sequence=[first];for(let i=1;i<n;i++){const candidates=all.filter(e=>e!==sequence[i-1]);const weighted=candidates.flatMap(e=>['storm','injury'].includes(e)?[e,e,e,e]:[e]);sequence.push(weighted[Math.floor(rng()*weighted.length)]);}return sequence;}
export function breakdown(s,seconds=s.elapsed){const target=BANDS[s.band].times.reduce((a,b)=>a+b,0),time=seconds+s.rescueSeconds;const progress=Math.min(600,s.progress),resource=Math.min(300,s.resource),adaptation=Math.min(200,s.adaptation),timeBonus=Math.round(150*Math.max(0,Math.min(1,1-(time-target)/(target*.25))));return {progress,resource,adaptation,timeBonus,penalties:s.penalties,total:progress+resource+adaptation+timeBonus-s.penalties,seconds:time};}
export function speedFactor(s){return (s.energy===0?.5:1)*(s.injured?.8:1);}
export const WORLD={start:{x:80,y:350},finish:{x:930,y:350},barrier:{left:415,right:535,top:225,bottom:475},detour:[{x:340,y:350},{x:340,y:150},{x:620,y:150},{x:620,y:350},{x:930,y:350}]};
export function canMove(x,y,blocked){return x>=35&&x<=965&&y>=80&&y<=535&&(!blocked||x<WORLD.barrier.left||x>WORLD.barrier.right||y<WORLD.barrier.top||y>WORLD.barrier.bottom);}
