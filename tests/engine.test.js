import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame,forecast,glassCost,customerDemand,validatePlan,settleDay,DAYS } from '../engine.js';
import { ECONOMIES,economyFor,formatMoney,parseMoney } from '../economy.js';
import { WeatherGate } from '../weather-gate.js';
import { weatherNotes,themeDuration,WeatherMusic,REPORT_DATA } from '../audio.js';
const sequence=(...values)=>()=>{assert.ok(values.length);return values.shift();};
const sunny={type:'sunny',factor:1,roadworks:false,crewBuyout:false,rainChance:0};
const plan=(glasses=30,signs=0,price=150)=>({glasses,signs,price});
test('minor amounts, zero, negatives, boundaries and dollar symbols',()=>{
  assert.equal(formatMoney(7),'7p');assert.equal(formatMoney(99),'99p');assert.equal(formatMoney(100),'£1.00');assert.equal(formatMoney(-7),'-7p');assert.equal(formatMoney(0),'0p');
  for(const code of ['USD','CAD','AUD']){assert.equal(formatMoney(7,code),'7¢');assert.equal(formatMoney(100,code),'$1.00');}
  assert.equal(formatMoney(50,'EUR'),'50¢');assert.equal(formatMoney(175,'EUR'),'€1.75');
  assert.equal(formatMoney(NaN),'—');assert.throws(()=>economyFor('xxx'));
});
test('human price entry is exact and rejects malformed or ambiguous input',()=>{
  for(const code of Object.keys(ECONOMIES)) for(const amount of [0,7,50,99,100,105,999,1500]) assert.equal(parseMoney(formatMoney(amount,code),code),amount);
  assert.equal(parseMoney('1.50'),150);assert.equal(parseMoney('.07'),7);assert.equal(parseMoney(' 7p '),7);
  for(const invalid of ['', '£', '.', '-1', '£1.001', '1e3', 'Infinity', '1,50', '2p3', '$1.50', '7¢','£7p']) assert.ok(Number.isNaN(parseMoney(invalid)),invalid);
});
test('regional costs, starting cash and demand reference are applied consistently',()=>{
  for(const [currency,e] of Object.entries(ECONOMIES)){
    const game=createGame(['A','B'],currency);assert.equal(game.players[0].cash,e.startingCash);
    assert.deepEqual([1,2,3,6,7,14].map(day=>glassCost(day,e)),[e.glassCosts[0],e.glassCosts[0],e.glassCosts[1],e.glassCosts[1],e.glassCosts[2],e.glassCosts[2]]);
    assert.equal(customerDemand(e.referencePrice,0,1,e.referencePrice),30);
    const result=settleDay(game,[plan(30,1,e.referencePrice),plan(30,1,e.referencePrice)],sunny);
    assert.deepEqual(result.rows[0],result.rows[1]);assert.equal(result.rows[0].expenses,30*e.glassCosts[0]+e.signCost);
    assert.equal(game.players[0].cash,e.startingCash+30*e.referencePrice-result.rows[0].expenses);
  }
});
test('original weather probabilities and early-day ordering',()=>{
  assert.equal(forecast(1,sequence(.99)).type,'hot');assert.equal(forecast(2,sequence(.99)).roadworks,false);
  assert.equal(forecast(3,sequence(.1,.1,.1)).factor,.1);
  assert.equal(forecast(4,sequence(.6,0)).rainChance,30);assert.equal(forecast(4,sequence(.79,.99)).rainChance,70);
  assert.equal(forecast(4,sequence(.8)).factor,2);assert.equal(forecast(4,sequence(.1,.1,.8)).crewBuyout,true);
});
test('demand retains the original curve after scaling prices',()=>{
  assert.equal(customerDemand(150,0,1),30);assert.equal(customerDemand(75,0,1),42);assert.equal(customerDemand(300,0,1),7);
  assert.equal(customerDemand(0,0,1),54);assert.equal(customerDemand(150,1,1),41);assert.equal(customerDemand(150,0,2),60);assert.equal(customerDemand(150,0,.1),3);
});
test('overspending, fractional quantities and oversized prices are rejected',()=>{
  assert.equal(validatePlan(plan(80),2000,1),'');assert.ok(validatePlan(plan(81),2000,1));assert.ok(validatePlan(plan(80,1),2000,1));
  for(const invalid of [null,plan(-1),plan(1.5),plan(NaN),plan(1001),plan(0,51),plan(0,0,1501),plan(0,0,-1)])assert.ok(validatePlan(invalid,100000,1));
});
test('storm destroys both batches but preparation is paid; no storm at .25',()=>{
  const game=createGame(['A','B']);const result=settleDay(game,[plan(40,1),plan(30,2)],{...sunny,type:'cloudy'},sequence(.249));
  assert.equal(result.storm,true);assert.deepEqual(result.rows.map(r=>r.sold),[0,0]);assert.deepEqual(game.players.map(p=>p.cash),[950,1150]);
  const dry=settleDay(createGame(['A','B']),[plan(),plan()],{...sunny,type:'cloudy',factor:.3},sequence(.25));assert.equal(dry.storm,false);assert.equal(dry.rows[0].sold,9);
});
test('sunny and hot weather never trigger storms or consume a storm roll',()=>{
  for(const type of ['sunny','hot']){
    const result=settleDay(createGame(['A','B']),[plan(),plan()],{...sunny,type},()=>{throw new Error('Unexpected storm roll');});
    assert.equal(result.storm,false);
  }
});
test('road crew buys entire batch irrespective of high price',()=>{
  const result=settleDay(createGame(['A','B']),[plan(80,0,1500),plan(50,0,1500)],{...sunny,roadworks:true,crewBuyout:true});assert.deepEqual(result.rows.map(r=>r.sold),[80,50]);
});
test('bankruptcy is permanent at the original exact-cost boundary',()=>{
  const game=createGame(['A','B']);settleDay(game,[plan(79,0,0),plan(80,0,0)],sunny);
  assert.deepEqual(game.players.map(p=>p.cash),[25,0]);assert.ok(game.players.every(p=>p.bankrupt));game.day++;
  assert.deepEqual(settleDay(game,[plan(0),plan(0)],sunny).rows.map(r=>r.sold),[0,0]);
});
test('invalid and duplicate settlements cannot partially change balances',()=>{
  const game=createGame(['A','B']),before=structuredClone(game);assert.throws(()=>settleDay(game,[plan(),plan(1000)],sunny));assert.deepEqual(game,before);
  assert.throws(()=>settleDay(game,new Array(2),sunny));settleDay(game,[plan(),plan()],sunny);assert.throws(()=>settleDay(game,[plan(),plan()],sunny));
});
test('all five currencies complete fourteen days with balanced books',()=>{
  for(const currency of Object.keys(ECONOMIES)){
    const game=createGame(['A','B'],currency),e=game.economy;
    for(let day=1;day<=DAYS;day++){game.day=day;settleDay(game,[plan(30,0,e.referencePrice),plan(20,0,e.referencePrice)],sunny);}
    assert.equal(game.history.length,14);assert.ok(game.players[0].cash>game.players[1].cash);
    for(const p of game.players)assert.equal(p.cash,e.startingCash+p.revenue-p.expenses);
    game.day=15;assert.throws(()=>settleDay(game,[plan(),plan()],sunny));
  }
});
test('gate cannot finish early and counts no time in background tabs',()=>{
  const gate=new WeatherGate(5000,0);assert.equal(gate.ready(4999),false);assert.equal(gate.ready(5000),true);
  const paused=new WeatherGate(5000,0);paused.pause(1000);assert.equal(paused.ready(100000),false);paused.resume(100000);assert.equal(paused.ready(103999),false);assert.equal(paused.ready(104000),true);
});
test('Apple II pitch is decoded in its original register, with rests and distinct cues',()=>{
  assert.ok(Math.abs(weatherNotes('sunny')[0].frequency-525)<5);
  assert.ok(Math.abs(weatherNotes('cloudy')[0].frequency-334)<5);
  assert.equal(weatherNotes('hot')[3].frequency,0);
  assert.ok(weatherNotes('storm')[0].frequency>0); // Original zero delay wraps to 256, not a rest.
  for(const type of ['sunny','cloudy','hot','storm']) {assert.ok(themeDuration(type)>2);assert.ok(themeDuration(type)<8);assert.ok(weatherNotes(type).every(n=>n.duration>0));}
});
test('muting and resuming cannot restart a weather track from its beginning',()=>{
  const music=new WeatherMusic();const calls=[];music.context={currentTime:10};music.playback={type:'sunny',start:8};music.schedule=(type,offset)=>calls.push({type,offset});
  music.setEnabled(false);assert.deepEqual(calls,[]);music.context.currentTime=11;music.setEnabled(true);assert.deepEqual(calls,[{type:'sunny',offset:3}]);
});
test('financial report preserves the original five notes and fits before the figures',()=>{
  assert.deepEqual(REPORT_DATA,[[152,80],[128,160],[152,40],[144,80],[128,200]]);
  const notes=weatherNotes('report');assert.equal(notes.length,5);
  assert.deepEqual(notes.map(n=>Math.round(n.frequency)),[333,395,333,352,395]);
  assert.deepEqual(notes.map(n=>n.duration/notes[0].duration),[1,2,.5,1,2.5]);
  assert.ok(themeDuration('report')>1.4&&themeDuration('report')<2);
});
test('player names are trimmed, bounded and distinct',()=>{
  assert.deepEqual(createGame([' A ',' B ']).players.map(p=>p.name),['A','B']);
  for(const names of [['A','a'],['','B'],['A'],['x'.repeat(25),'B']])assert.throws(()=>createGame(names));
});
test('weather streak cap handles every forecast and the opening clear-or-hot rule',()=>{
  for(const roll of [0,.3,.6,.75,.99]){
    const history=[];
    for(let day=1;day<=100;day++){
      const weather=forecast(day,()=>roll,history);history.push({weather});
      if(day<=3)assert.ok(['sunny','hot'].includes(weather.type));
      if(day>=3)assert.ok(new Set(history.slice(-3).map(r=>r.weather.type)).size>1);
    }
  }
  for(const type of ['sunny','cloudy','hot'])assert.notEqual(forecast(8,()=>.5,[{weather:{type}},{weather:{type}}]).type,type);
});
test('two to eight stands settle atomically; missing and sparse plans cannot lose a player',()=>{
  for(let count=2;count<=8;count++){
    const game=createGame(Array.from({length:count},(_,i)=>`Player ${i}`)),before=structuredClone(game);
    assert.throws(()=>settleDay(game,new Array(count),sunny));assert.deepEqual(game,before);
    assert.throws(()=>settleDay(game,Array.from({length:count-1},()=>plan()),sunny));assert.deepEqual(game,before);
    const result=settleDay(game,Array.from({length:count},()=>plan()),sunny);assert.equal(result.rows.length,count);
  }
  assert.throws(()=>createGame(new Array(3)));assert.throws(()=>createGame(Array.from({length:9},(_,i)=>String(i))));assert.throws(()=>createGame(['A','B','b']));
});
test('storm melody uses one continuous softer oscillator with all original pitches',()=>{
  const music=new WeatherMusic(),voices=[],frequencies=[];
  music.context={state:'running',currentTime:5,destination:{},createOscillator(){const voice={frequency:{setValueAtTime(value,time){frequencies.push({value,time});},linearRampToValueAtTime(value,time){frequencies.push({value,time});}},connect(){},disconnect(){},start(){},stop(){}};voices.push(voice);return voice;},createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}};}};
  music.play('storm');assert.equal(voices.length,1);assert.equal(voices[0].type,'triangle');
  for(const note of weatherNotes('storm').filter(n=>n.frequency))assert.ok(frequencies.some(f=>f.value===note.frequency));
  assert.ok(frequencies.every(f=>Number.isFinite(f.time)&&f.time>=5));music.stop();assert.equal(music.voices.length,0);
});
