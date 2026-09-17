import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ECONOMIES,formatMoney } from '../economy.js';
import { weatherNotes } from '../audio.js';
function harness({audio=false}={}) {
  let time=0,serial=0;const timers=new Map(),tools=new Map(),listeners=new Map(),staticElements=new Map(),dynamicElements=new Map();let buttons=[];
  const decode=s=>s.replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&#39;',"'");
  class Element {
    constructor(id='',attrs=''){this.id=id;this.value='';this.disabled=false;this.textContent='';this.className='';this.events={};this.dataset={};this.html='';
      for(const [,key,value] of attrs.matchAll(/([\w-]+)="([^"]*)"/g)){if(key.startsWith('data-'))this.dataset[key.slice(5)]=decode(value);else this[key==='class'?'className':key]=decode(value);}
      this.disabled=/\sdisabled(?:\s|$)/.test(attrs);
    }
    set innerHTML(html){this.html=html;if(this.id!=='screen')return;dynamicElements.clear();buttons=[];for(const [,tag,attrs] of html.matchAll(/<(\w+)\b([^>]*)>/g)){const id=attrs.match(/\bid="([^"]+)"/)?.[1]||'';const el=new Element(id,attrs);if(id)dynamicElements.set(id,el);if(tag==='button')buttons.push(el);}}
    get innerHTML(){return this.html;}
    addEventListener(type,fn){this.events[type]=fn;}
    setAttribute(key,value){this[key]=value;}
    querySelector(selector){return selector==='.primary'?buttons.find(b=>b.className.includes('primary')):null;}
    querySelectorAll(selector){return selector==='[data-step]'?buttons.filter(b=>b.dataset.step):[];}
    focus(){}showModal(){this.open=true;}close(){this.open=false;}
  }
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(const [,id] of html.matchAll(/\bid="([^"]+)"/g))staticElements.set(id,new Element(id));
  const get=id=>dynamicElements.get(id)||staticElements.get(id);
  const document={documentElement:{lang:"en-GB"},hidden:false,modelContext:{registerTool(tool){tools.set(tool.name,tool);}},getElementById:get,querySelector(selector){if(selector==='#setup-form button')return buttons.find(b=>b.className.includes('primary'));return get(selector.slice(1));},querySelectorAll(){return[];},addEventListener(type,fn){listeners.set(type,fn);}};
  const originals={document:globalThis.document,window:globalThis.window,performance:globalThis.performance,setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval,random:Math.random};
  const windowListeners=new Map();let confirmResult=false;
  globalThis.document=document;globalThis.window={addEventListener(type,fn){windowListeners.set(type,fn);},removeEventListener(type){windowListeners.delete(type);},confirm(){return confirmResult;}};globalThis.performance={now:()=>time};globalThis.setInterval=fn=>{timers.set(++serial,fn);return serial;};globalThis.clearInterval=id=>timers.delete(id);Math.random=()=>.5;
  const voices=[];
  if(audio)window.AudioContext=class {
    state='running';destination={};elapsed=0;resumedAt=time;
    get currentTime(){return (this.elapsed+(this.state==='running'?time-this.resumedAt:0))/1000;}
    async resume(){if(this.state!=='running'){this.resumedAt=time;this.state='running';}}
    async suspend(){if(this.state==='running'){this.elapsed+=time-this.resumedAt;this.state='suspended';}}
    createOscillator(){const voice={frequency:{},connect(){},disconnect(){},start(at){this.started=at;},stop(at){this.stopped=at;}};voices.push(voice);return voice;}
    createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}};}
  };
  return {get,tools,document,windowListeners,voices,confirm(value){confirmResult=value;},read:()=>tools.get('read_lemonade_game').execute(),markup:()=>get('screen').innerHTML,
    async event(id,type){const el=get(id);assert.ok(el,`Missing ${id}`);const fn=el[`on${type}`]||el.events[type];assert.equal(typeof fn,'function',`Missing ${type} handler on ${id}`);await fn({target:el,preventDefault(){}});await Promise.resolve();},
    tick(ms){time+=ms;for(const fn of [...timers.values()])fn();},visibility(hidden){document.hidden=hidden;listeners.get('visibilitychange')();},
    cleanup(){Object.assign(globalThis,{document:originals.document,window:originals.window,performance:originals.performance,setInterval:originals.setInterval,clearInterval:originals.clearInterval});Math.random=originals.random;},
  };
}
let serial=0;
async function start(h,count=2,language='en-GB',currency='GBP'){
  await import(`../app.js?flow=${++serial}`);
  assert.equal(h.read().phase,'title');assert.ok(h.get('start'));assert.equal(h.get('language').disabled,false);
  h.get('language').value=language;await h.event('language','change');h.get('currency').value=currency;await h.event('currency','change');
  await h.event('start','click');assert.equal(h.read().phase,'welcome');assert.equal(h.get('language').disabled,true);assert.equal(h.get('currency').disabled,false);
  assert.match(h.markup(),/In this small town/);assert.match(h.markup(),new RegExp(language==='en-GB'?'Lemonshire, England':'Lemonsville, California'));
  await h.event('begin','click');h.get('player-count').value=String(count);await h.event('players-form','submit');
  for(let i=1;i<=count;i++)h.get(`player-${i}`).value=i===1?'<A & B>':`Player ${i}`;
  await h.event('setup-form','submit');assert.equal(h.read().phase,'rules-one');assert.equal(h.get('currency').disabled,true);
  assert.match(h.get('currency-control').title,/Currency is locked/);assert.match(h.get('language-control').title,/Language is locked/);
  assert.match(h.markup(),new RegExp(language==='en-GB'?'your mum':'your mom'));assert.ok(h.windowListeners.has('beforeunload'));
  await h.event('rules-continue','click');assert.equal(h.read().phase,'rules-two');assert.match(h.markup(),/Your profits are the difference/);
  await h.event('rules-continue','click');assert.equal(h.read().phase,'weather');
}
async function finishWeather(h){
  assert.equal(h.get('weather-continue').disabled,true);await h.event('weather-continue','click');assert.ok(['weather','storm'].includes(h.read().phase));
  h.tick(10000);await h.event('weather-continue','click');
}
async function fillPlan(h,glasses=20){
  assert.equal(h.get('glasses').value,'');assert.equal(h.get('signs').value,'');assert.equal(h.get('price').value,'');assert.equal(h.get('submit-plan').disabled,true);
  h.get('glasses').value=String(glasses);h.get('signs').value='0';h.get('price').value=formatMoney(ECONOMIES[h.read().currency].referencePrice,h.read().currency);
  await h.event('plan-form','input');assert.equal(h.get('submit-plan').disabled,false);await h.event('plan-form','submit');
}
async function reports(h,count){
  for(let i=0;i<count;i++){
    assert.equal(h.read().phase,'report-wait');assert.doesNotMatch(h.markup(),/report-totals|Income:|Expenses:|Assets:/);
    h.tick(1999);assert.equal(h.read().phase,'report-wait');h.tick(1);assert.equal(h.read().phase,'report');assert.equal(h.read().reportPlayer,i+1);
    assert.match(h.markup(),/Daily Financial Report/);assert.doesNotMatch(h.markup(),/CA\$|A\$/);
    await h.event('next-report','click');
  }
}
for(let count=2;count<=8;count++)test(`${count} players: complete 14 days, private turns, delayed individual reports, standings, and restart`,async()=>{
  const h=harness();try{
    const currencies=Object.keys(ECONOMIES),currency=currencies[(count-2)%currencies.length],language=count%2?'en-US':'en-GB';
    await start(h,count,language,currency);const forecasts=[];
    for(let day=1;day<=14;day++){
      assert.equal(h.read().phase,'weather');assert.equal(h.read().day,day);forecasts.push(h.read().forecast.type);
      if(day<=3)assert.notEqual(h.read().forecast.type,'cloudy');
      if(day>=3)assert.ok(new Set(forecasts.slice(-3)).size>1);
      if(day===1){h.visibility(true);h.tick(60000);assert.equal(h.get('weather-continue').disabled,true);h.visibility(false);await h.event('sound','click');assert.equal(h.get('weather-continue').disabled,true);}
      await finishWeather(h);assert.equal(h.read().phase,'costs');
      if(day===3)assert.match(h.markup(),/quit giving you free sugar/);if(day===7)assert.match(h.markup(),/price of lemonade mix just went up/);
      await h.event('begin-turn','click');
      for(let player=0;player<count;player++){
        assert.equal(h.read().activePlayer,player+1);await fillPlan(h,player===0?30:20);
        if(player<count-1){assert.equal(h.read().phase,'handoff');assert.ok(!h.get('price'));await h.event('take-turn','click');}
      }
      if(h.read().phase==='storm')await finishWeather(h);
      await reports(h,count);
    }
    assert.equal(h.read().phase,'results');assert.match(h.markup(),/&lt;A &amp; B&gt; wins!/);assert.equal(h.windowListeners.has('beforeunload'),false);
    await h.event('restart','click');assert.equal(h.read().phase,'title');assert.equal(h.get('language').disabled,false);assert.equal(h.get('currency').disabled,false);assert.deepEqual(h.read().players,[]);
  }finally{h.cleanup();}
});
test('storm waits for every player and locks the financial reports',async()=>{
  const h=harness();try{
    await start(h,8);for(let day=1;day<=4;day++){
      await finishWeather(h);await h.event('begin-turn','click');
      for(let i=0;i<8;i++){
        if(day===4){assert.equal(h.read().phase,'planning');assert.match(h.get('game').className,/cloudy$/);Math.random=()=>.1;}
        await fillPlan(h);if(i<7){assert.equal(h.read().phase,'handoff');await h.event('take-turn','click');}
      }
      if(day===4){assert.equal(h.read().phase,'storm');assert.match(h.markup(),/struck Lemonshire/);assert.doesNotMatch(h.markup(),/£|Assets:|stand-report/);h.tick(7000);assert.ok(h.get('weather-continue').disabled);h.tick(300);await h.event('weather-continue','click');h.tick(2000);assert.match(h.markup(),/No sales today/);assert.match(h.markup(),/-£/);}
      else{if(day===3)Math.random=()=>.7;await reports(h,8);}
    }
  }finally{h.cleanup();}
});
test('restart cancellation preserves state; confirmation clears timers, locks, and leave warning',async()=>{
  const h=harness();try{
    await start(h);const before=h.read();await h.event('brand','click');assert.equal(h.get('restart-dialog').open,true);await h.event('cancel-restart','click');assert.deepEqual(h.read(),before);
    let prevented=false;const event={preventDefault(){prevented=true;}};h.windowListeners.get('beforeunload')(event);assert.equal(prevented,true);assert.equal(event.returnValue,'');
    await h.event('brand','click');await h.event('confirm-restart','click');h.tick(60000);assert.equal(h.read().phase,'title');assert.equal(h.windowListeners.has('beforeunload'),false);assert.equal(h.get('language').disabled,false);
  }finally{h.cleanup();}
});
test('invalid count, duplicate names, malformed prices, and empty plans are rejected',async()=>{
  const h=harness();try{
    await import(`../app.js?flow=${++serial}`);await h.event('start','click');await h.event('begin','click');
    for(const value of ['1','9','2.5','']){h.get('player-count').value=value;await h.event('players-form','submit');assert.equal(h.read().phase,'players');}
    h.get('player-count').value='3';await h.event('players-form','submit');h.get('player-1').value='A';h.get('player-2').value='B';h.get('player-3').value='a';await h.event('setup-form','submit');assert.equal(h.read().phase,'names');
    h.get('player-3').value='C';await h.event('setup-form','submit');await h.event('rules-continue','click');await h.event('rules-continue','click');await finishWeather(h);await h.event('begin-turn','click');
    await h.event('plan-form','submit');assert.equal(h.read().phase,'planning');h.get('glasses').value='1';h.get('signs').value='0';h.get('price').value='7p';await h.event('plan-form','input');assert.equal(h.get('submit-plan').disabled,false);
    h.get('price').value='1.234';await h.event('plan-form','input');assert.equal(h.get('submit-plan').disabled,true);
    assert.throws(()=>h.tools.get('submit_lemonade_plan').execute({glasses:1000,signs:50,price:150}));
  }finally{h.cleanup();}
});
test('joint winners include every tied player and use the Oxford comma',async()=>{
  const h=harness();try{
    await start(h,3);
    for(let day=1;day<=14;day++){
      await finishWeather(h);await h.event('begin-turn','click');
      for(let i=0;i<3;i++){await fillPlan(h,0);if(i<2)await h.event('take-turn','click');}
      await reports(h,3);
    }
    assert.equal(h.read().phase,'results');assert.match(h.markup(),/It's a tie!/);assert.match(h.markup(),/&lt;A &amp; B&gt;, Player 2, and Player 3 finish joint first/);
  }finally{h.cleanup();}
});
test('bankrupt players can skip blank decisions and still receive individual reports',async()=>{
  const h=harness();try{
    await start(h,3);await finishWeather(h);await h.event('begin-turn','click');
    for(let i=0;i<3;i++){
      h.get('glasses').value='80';h.get('signs').value='0';h.get('price').value='0';await h.event('plan-form','submit');if(i<2)await h.event('take-turn','click');
    }
    await reports(h,3);await finishWeather(h);await h.event('begin-turn','click');
    for(let i=0;i<3;i++){assert.match(h.markup(),/You are bankrupt/);assert.ok(!h.get('price'));await h.event('skip-turn','click');if(i<2)await h.event('take-turn','click');}
    await reports(h,3);assert.equal(h.read().day,3);
  }finally{h.cleanup();}
});
test('report tune plays once per day before the first figures and stops on restart',async()=>{
  const h=harness({audio:true});try{
    await start(h,3);
    for(let day=1;day<=2;day++){
      await finishWeather(h);await h.event('begin-turn','click');
      for(let i=0;i<2;i++){await fillPlan(h);await h.event('take-turn','click');}
      const before=h.voices.length;await fillPlan(h);
      assert.equal(h.read().phase,'report-wait');assert.doesNotMatch(h.markup(),/report-totals/);
      const cue=h.voices.slice(before);assert.equal(cue.length,5);
      assert.deepEqual(cue.map(v=>v.frequency.value),weatherNotes('report').map(n=>n.frequency));
      for(let i=1;i<cue.length;i++)assert.ok(Math.abs(cue[i].started-cue[i-1].started-weatherNotes('report')[i-1].duration)<1e-10);
      if(day===1){
        h.tick(500);h.visibility(true);h.tick(60000);assert.equal(h.read().phase,'report-wait');h.visibility(false);h.tick(1499);assert.equal(h.read().phase,'report-wait');h.tick(1);assert.equal(h.read().phase,'report');
        for(let i=1;i<3;i++){await h.event('next-report','click');h.tick(2000);assert.equal(h.read().phase,'report');assert.equal(h.voices.length,before+5);}
        await h.event('next-report','click');
      }else{
        await h.event('brand','click');await h.event('confirm-restart','click');
        assert.ok(cue.every(v=>v.stopped===undefined));h.tick(60000);assert.equal(h.read().phase,'title');
      }
    }
  }finally{h.cleanup();}
});
test('muted report keeps its delay; unmuting resumes only the remaining notes',async()=>{
  const h=harness({audio:true});try{
    await start(h);await finishWeather(h);await h.event('sound','click');await h.event('begin-turn','click');await fillPlan(h);await h.event('take-turn','click');
    const before=h.voices.length;await fillPlan(h);assert.equal(h.voices.length,before);
    h.tick(600);assert.equal(h.read().phase,'report-wait');await h.event('sound','click');
    assert.equal(h.voices.length-before,3); // The first two original notes have already elapsed.
    h.tick(1399);assert.equal(h.read().phase,'report-wait');h.tick(1);assert.equal(h.read().phase,'report');
    await h.event('next-report','click');assert.equal(h.voices.length-before,3);
  }finally{h.cleanup();}
});
