import { DAYS, glassCost, createGame, forecast, validatePlan, settleDay } from './engine.js';
import { WeatherMusic, themeDuration } from './audio.js';
import { economyFor, formatMoney, parseMoney } from './economy.js';
import { WeatherGate } from './weather-gate.js';
import { languageFor, instructionPages, joinNames } from './language.js';
const $=selector=>document.querySelector(selector);
const screen=$('#screen'),gameBox=$('#game'),music=new WeatherMusic();
let currency='GBP',language='en-GB',phase='title',game=null,weather=null,report=null;
let playerCount=2,draftNames=[],playerIndex=0,reportIndex=0,plans=[],currentPlan={};
let gate=null,timer=null,generation=0,leaveGuard=false;
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=value=>formatMoney(value,currency),words=()=>languageFor(language);
const economy=()=>game?.economy||economyFor(currency),cost=()=>glassCost(game?.day||1,economy());
const isWeather=()=>phase==='weather'||phase==='storm';
const arrow='<span aria-hidden="true">↗</span>';
const weatherNames={sunny:'Sunny',cloudy:'Cloudy',hot:'Hot and dry',storm:'Thunderstorms!'};
const weatherIcons={sunny:'☀',cloudy:'☁',hot:'☀',storm:'ϟ'};
function stopTimer(){clearInterval(timer);timer=null;gate=null;}
function beforeLeave(event){event.preventDefault();event.returnValue='';}
function syncLeaveGuard(){
  const needed=!!game && phase!=='results';
  if(needed===leaveGuard)return;
  window[needed?'addEventListener':'removeEventListener']('beforeunload',beforeLeave);
  leaveGuard=needed;
}
function setPhase(next){
  phase=next;render();screen.scrollTop=0;
  const heading=screen.querySelector('h1,h2');
  if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
}
function resetGame(){
  generation++;stopTimer();music.stop();game=null;weather=null;report=null;plans=[];draftNames=[];playerCount=2;playerIndex=0;reportIndex=0;currentPlan={};
  $('#help-dialog').close();$('#restart-dialog').close();setPhase('title');
}
function button(id,text){return `<button id="${id}" class="primary">${text} ${arrow}</button>`;}
function rulesMarkup(){return instructionPages(words(),money,economy()).join('');}
function scores(){return `<div class="score-strip">${game.players.map((p,i)=>`<div class="score-chip"><small>Stand ${i+1} · ${escape(p.name)}</small><strong>${money(p.cash)}</strong></div>`).join('')}</div>`;}
function tradingCopy(){return `<section class="scene-copy trading-copy"><span class="eyebrow">DAY ${game.day} · ${words().town.toUpperCase()}</span><h1>Your lemonade<br><em>stand.</em></h1>${scores()}</section>`;}
function notices(){
  const items=[];
  if(game.day===3)items.push(`Your ${words().mum} quit giving you free sugar. Review the revised cost of lemonade.`);
  if(game.day===7)items.push('The price of lemonade mix just went up. Review the revised cost of lemonade.');
  if(weather.roadworks)items.push('The street department is working today. There will be no traffic on your street.');
  return items.map(text=>`<div class="notice">${text}</div>`).join('');
}
async function startWeather(storm=false){
  if(isWeather())return;
  stopTimer();music.stop();
  if(!storm && !weather)weather=forecast(game.day,Math.random,game.history);
  const type=storm?'storm':weather.type,run=generation;
  gate=new WeatherGate(Math.max(storm?7200:5000,(themeDuration(type)+.7)*1000));gate.pause();
  const thisGate=gate;setPhase(storm?'storm':'weather');
  await music.unlock();
  if(run!==generation || gate!==thisGate || !isWeather())return;
  music.play(type);if(document.hidden)void music.pause();else gate.resume();
  gameBox.setAttribute('data-weather-paused',String(document.hidden));
  timer=setInterval(updateWeather,100);updateWeather();
}
function updateWeather(){
  if(!isWeather()||!gate)return;
  const remaining=gate.update(),next=$('#weather-continue');if(!next)return;
  next.disabled=remaining>0;
  next.textContent=remaining>0?`Weather report · ${Math.ceil(remaining/1000)}s`:(phase==='storm'?'See the financial reports':'Continue');
  $('#weather-status').textContent=remaining>0?'Please watch the full report.':'Weather report complete.';
  if(!remaining){clearInterval(timer);timer=null;}
}
function renderWeather(){
  const type=phase==='storm'?'storm':weather.type;
  const descriptions={sunny:`Clear skies over ${words().town}.`,cloudy:`Cooler weather today, with a ${weather.rainChance}% chance of light rain.`,hot:'A heat wave is predicted for today!',storm:`A severe thunderstorm struck ${words().town} while the stands were being set up. All the lemonade was ruined.`};
  screen.innerHTML=`<section class="weather-card"><span class="eyebrow">${words().town.toUpperCase()} WEATHER REPORT</span><span class="weather-symbol" aria-hidden="true">${weatherIcons[type]}</span><h1>${weatherNames[type]}</h1><p>${descriptions[type]}</p><div class="weather-wait"><span id="weather-status" role="status">Please watch the full report.</span><button id="weather-continue" class="primary" disabled>Weather report</button></div></section>`;
  $('#weather-continue').onclick=()=>{if(!gate?.ready())return;const storm=phase==='storm';stopTimer();music.stop();if(storm)beginReport(0);else setPhase('costs');};
  updateWeather();
}
function render(){
  const backdrop=!game||phase==='rules-one'||phase==='rules-two'||phase==='results'?'sunny':phase==='storm'||report?.storm?'storm':weather?.type||'sunny';
  gameBox.className=`game phase-${phase} ${backdrop}`;
  gameBox.setAttribute('data-weather-paused',String(!!gate?.paused));
  document.documentElement.lang=language;
  $('#location').textContent=`${words().town.toUpperCase()} · ${words().region.toUpperCase()}`;
  $('#currency').disabled=!!game;$('#language').disabled=phase!=='title';
  for(const [id,locked] of [['currency',!!game],['language',phase!=='title']]){
    const label=id[0].toUpperCase()+id.slice(1),tip=locked?`${label} is locked. Start a new game to change it.`:`Choose your ${id}.`;
    $(`#${id}-control`).title=tip;$(`#${id}-control`).setAttribute('data-locked',String(locked));
    $(`#${id}-control`).setAttribute('tabindex',locked?'0':'-1');$(`#${id}-tooltip`).textContent=tip;$(`#${id}`).title=tip;
  }
  $('#help').disabled=isWeather();
  $('#day-label').textContent=game?`DAY ${String(game.day).padStart(2,'0')} / ${DAYS}`:'A LITTLE SUMMER RIVALRY';
  $('#progress-label').textContent=game?`${game.history.length} OF ${DAYS} DAYS COMPLETE`:'2–8 PLAYERS · 14 DAYS';
  $('#footer-hint').textContent=isWeather()?`${words().town} Weather Service`:'A classic, freshly squeezed.';
  syncLeaveGuard();
  if(phase==='title'){
    screen.innerHTML=`<section class="title-card"><span class="eyebrow">FOURTEEN DAYS IN ${words().town.toUpperCase()}</span><div class="title-lemon" aria-hidden="true"><img src="./lemon.svg" alt=""></div><h1>Lemonade<br><em>Stand.</em></h1><p>The classic summer business.<br>A fresh squeeze of friendly competition.</p>${button('start','Start')}<span class="title-details">2–8 PLAYERS <i>·</i> ONE DEVICE <i>·</i> 14 DAYS</span></section>`;
    $('#start').onclick=()=>setPhase('welcome');
  }else if(phase==='welcome'){
    screen.innerHTML=`<section class="wide-screen welcome-screen"><span class="eyebrow">WELCOME TO YOUR SUMMER JOB</span><h1>Hi! Welcome to ${words().town}, ${words().region}!</h1><p>In this small town, you are in charge of running your own lemonade stand. You can compete with as many other people as you wish, but how much profit you make is up to you (the other stands' sales will not affect your business in any way). If you make the most money, you're the winner!</p><h2>Begin a new game?</h2>${button('begin','Begin')}</section>`;
    $('#begin').onclick=()=>setPhase('players');
  }else if(phase==='players'){
    screen.innerHTML=`<section class="wide-screen setup-screen"><span class="eyebrow">YOUR SUMMER RIVALS</span><h1>How many people will be playing?</h1><form id="players-form"><label for="player-count">Number of players (2–8)</label><input id="player-count" type="number" min="2" max="8" step="1" required value="${playerCount}"><p class="error" id="count-error" aria-live="polite"></p>${button('choose-players','Continue')}</form></section>`;
    $('#players-form').onsubmit=event=>{event.preventDefault();const count=Number($('#player-count').value);if(!Number.isInteger(count)||count<2||count>8){$('#count-error').textContent='Choose between 2 and 8 players.';return;}playerCount=count;draftNames=Array.from({length:count},(_,i)=>draftNames[i]||'');setPhase('names');};
  }else if(phase==='names'){
    screen.innerHTML=`<section class="wide-screen setup-screen"><span class="eyebrow">${playerCount} STANDS · 14 DAYS</span><h1>Who will be playing?</h1><form id="setup-form"><div class="name-grid">${draftNames.map((name,i)=>`<label class="player-field" for="player-${i+1}"><span>Player ${i+1}</span><input id="player-${i+1}" type="text" maxlength="24" required autocomplete="off" value="${escape(name)}"></label>`).join('')}</div><p id="name-error" class="error" aria-live="polite"></p>${button('save-names','Continue')}</form><button id="change-count" class="small-button">Change the number of players</button></section>`;
    $('#setup-form').oninput=()=>{draftNames=draftNames.map((_,i)=>$(`#player-${i+1}`).value);};
    $('#setup-form').onsubmit=event=>{event.preventDefault();const names=draftNames.map((_,i)=>$(`#player-${i+1}`).value.trim());try{game=createGame(names,currency);}catch(error){$('#name-error').textContent=error.message;return;}draftNames=names;weather=null;report=null;plans=[];setPhase('rules-one');};
    $('#change-count').onclick=()=>setPhase('players');
  }else if(phase==='rules-one'||phase==='rules-two'){
    const first=phase==='rules-one';
    screen.innerHTML=`<section class="wide-screen rules-screen"><span class="eyebrow">HOW TO RUN YOUR STAND · ${first?'1':'2'} / 2</span><h2>${first?'Your daily decisions':'Your business accounts'}</h2>${instructionPages(words(),money,economy())[first?0:1]}${button('rules-continue','Continue')}</section>`;
    $('#rules-continue').onclick=()=>first?setPhase('rules-two'):startWeather();
  }else if(isWeather())renderWeather();
  else if(phase==='costs'){
    screen.innerHTML=`${tradingCopy()}<section class="panel"><span class="eyebrow">BEFORE YOU OPEN</span><h2>Day ${game.day}</h2><p>On day ${game.day}, the cost of lemonade is <strong>${money(cost())}</strong> a glass.</p><div class="cost-row"><span>One advertising sign</span><strong>${money(economy().signCost)}</strong></div>${notices()}${button('begin-turn','Make your decisions')}</section>`;
    $('#begin-turn').onclick=()=>{playerIndex=0;plans=[];beginPlan();};
  }else if(phase==='planning')renderPlan();
  else if(phase==='handoff'){
    screen.innerHTML=`${tradingCopy()}<section class="panel"><span class="eyebrow">PASS THE DEVICE</span><h2>${escape(game.players[playerIndex].name)}'s stand</h2><p>${escape(game.players[playerIndex-1].name)}'s decisions are saved.</p>${button('take-turn','I’m ready')}</section>`;
    $('#take-turn').onclick=beginPlan;
  }else if(phase==='report-wait'||phase==='report')renderReport();
  else if(phase==='results')renderResults();
}
function renderPlan(){
  const player=game.players[playerIndex],last=playerIndex===game.players.length-1;
  screen.innerHTML=`${tradingCopy()}<section class="panel planning"><span class="eyebrow">STAND ${playerIndex+1} OF ${game.players.length}</span><h2>${escape(player.name)}'s stand</h2><div class="turn-line">Assets <strong>${money(player.cash)}</strong></div>${player.bankrupt?`<p>You are bankrupt. No decisions for you to make.</p>${button('skip-turn','Continue')}`:`<form id="plan-form">${inputRow('glasses','Glasses of lemonade to make',`${money(cost())} per glass`,1000)}${inputRow('signs','Advertising signs to make',`${money(economy().signCost)} per sign`,50)}${inputRow('price','Price to charge per glass',`e.g. ${money(economy().referencePrice)} or ${money(50)}`,economy().maxPrice)}<div class="budget"><div class="money-row"><span>Expenses</span><strong id="spending"></strong></div><div class="money-row"><span>Assets left before sales</span><strong id="remaining"></strong></div></div><p id="plan-error" class="error" aria-live="polite"></p>${button('submit-plan',last?'Open all stands':'Save & pass to the next player')}</form><p class="fine-print">Your decisions stay hidden until every stand is ready.</p>`}</section>`;
  if(player.bankrupt){$('#skip-turn').onclick=()=>commitPlan({glasses:0,signs:0,price:0});return;}
  $('#plan-form').oninput=updateBudget;
  screen.querySelectorAll('[data-step]').forEach(control=>{control.onclick=()=>{const input=document.getElementById(control.dataset.target),price=input.id==='price';const old=price?parseMoney(input.value,currency):Number(input.value);const value=Math.max(0,Math.min(price?economy().maxPrice:Number(input.max),(Number.isFinite(old)?old:0)+Number(control.dataset.step)));input.value=price?money(value):value;updateBudget();};});
  $('#plan-form').onsubmit=event=>{event.preventDefault();updateBudget();if(!validatePlan(currentPlan,player.cash,game.day,economy()))commitPlan({...currentPlan});};
  updateBudget();
}
function inputRow(id,title,note,max){const price=id==='price';return `<div class="entry-row"><label for="${id}">${title}<small>${note}</small></label><div class="number-control ${price?'price-control':''}"><button type="button" data-target="${id}" data-step="${price?-5:-1}" aria-label="Decrease ${title.toLowerCase()}">−</button><input id="${id}" type="${price?'text':'number'}" ${price?'':`min="0" max="${max}" step="1"`} inputmode="${price?'decimal':'numeric'}" required autocomplete="off" value=""><button type="button" data-target="${id}" data-step="${price?5:1}" aria-label="Increase ${title.toLowerCase()}">+</button></div></div>`;}
function beginPlan(){currentPlan={};setPhase('planning');}
function updateBudget(){
  currentPlan=Object.fromEntries(['glasses','signs'].map(key=>[key,$(`#${key}`).value===''?NaN:Number($(`#${key}`).value)]));currentPlan.price=parseMoney($('#price').value,currency);
  const spent=currentPlan.glasses*cost()+currentPlan.signs*economy().signCost,remaining=game.players[playerIndex].cash-spent;
  $('#spending').textContent=money(spent);$('#remaining').textContent=money(remaining);$('#remaining').className=remaining<0?'negative':'';
  const error=validatePlan(currentPlan,game.players[playerIndex].cash,game.day,economy());
  const incomplete=['glasses','signs','price'].some(id=>$(`#${id}`).value==='');
  $('#plan-error').textContent=incomplete?'':error && (!Number.isInteger(currentPlan.price)||currentPlan.price>economy().maxPrice)?`Enter a price from ${money(0)} to ${money(economy().maxPrice)}.`:error;
  $('#submit-plan').disabled=!!error;
}
function commitPlan(plan){
  if(phase!=='planning'||plans[playerIndex])return;
  plans[playerIndex]=plan;
  if(playerIndex<game.players.length-1){playerIndex++;setPhase('handoff');}
  else{report=settleDay(game,plans,weather);if(report.storm)void startWeather(true);else beginReport(0);}
}
function beginReport(index){
  stopTimer();music.stop();reportIndex=index;
  // The original report cue plays once per day, before the first stand's figures.
  gate=new WeatherGate(index===0?Math.max(2000,themeDuration('report')*1000):2000);
  if(document.hidden)gate.pause();setPhase('report-wait');
  if(index===0)music.play('report');
  timer=setInterval(updateReport,50);
}
function updateReport(){if(phase==='report-wait'&&gate?.ready()){stopTimer();music.stop();setPhase('report');}}
function renderReport(){
  const row=report.rows[reportIndex],player=game.players[reportIndex],last=reportIndex===game.players.length-1;
  const title=`${words().town} Daily Financial Report`;
  if(phase==='report-wait'){
    screen.innerHTML=`<section class="wide-screen stand-report"><h2>${title}</h2><p class="report-loading" role="status">Preparing ${escape(player.name)}'s report…</p><div class="report-loader" aria-hidden="true"></div></section>`;return;
  }
  const note=report.storm?'A thunderstorm ruined all the lemonade. No sales today.':weather.crewBuyout?'The street crews bought all your lemonade at lunchtime!':weather.roadworks?`${words().roadworks} kept passing traffic away.`:'';
  screen.innerHTML=`<section class="wide-screen stand-report"><h2>${title}</h2><p class="report-stand">Day ${game.day} <span>│</span> Stand ${reportIndex+1} · ${escape(player.name)}</p>${note?`<p class="report-note">${note}</p>`:''}<div class="stand-numbers"><div><p><strong>${row.sold}</strong> glasses sold</p><p><strong>${money(row.price)}</strong> per glass</p></div><div><p><strong>${row.glasses}</strong> glasses made</p><p><strong>${row.signs}</strong> signs made</p></div></div><div class="report-accounts"><p>Income: <strong>${money(row.revenue)}</strong></p><p>Expenses: <strong>${money(row.expenses)}</strong></p></div><div class="report-totals"><p>Profit: <strong class="${row.profit<0?'negative':'positive'}">${money(row.profit)}</strong></p><p>Assets: <strong>${money(row.cash)}</strong></p></div>${row.bankrupt?`<p class="report-note">You don't have enough money left to stay in business. You're bankrupt!</p>`:''}${button('next-report',last?(game.day===DAYS?'See the final results':`Continue to Day ${game.day+1}`):`${escape(game.players[reportIndex+1].name)}'s stand`)}</section>`;
  $('#next-report').onclick=()=>{if(!last)beginReport(reportIndex+1);else if(game.day===DAYS)setPhase('results');else{game.day++;report=null;weather=null;void startWeather();}};
}
function renderResults(){
  const ranking=game.players.map((p,i)=>({...p,stand:i+1})).sort((a,b)=>b.cash-a.cash);
  const winners=ranking.filter(p=>p.cash===ranking[0].cash),names=joinNames(winners.map(p=>escape(p.name)));
  const title=winners.length===1?`${names} wins!`:`It's a tie!`;
  screen.innerHTML=`<section class="wide-screen results-screen"><span class="eyebrow">FOURTEEN DAYS IN ${words().town.toUpperCase()}</span><h1 class="winner-text">${title}</h1><p>${winners.length===1?names:`${names} finish joint first`} ${winners.length===1?'finishes':'with'} ${winners.length===1?'with ':''}<strong>${money(ranking[0].cash)}</strong>${winners.length>1?' each':''}.</p><div class="table-scroll"><table class="report-table"><thead><tr><th scope="col">Stand</th><th scope="col">Player</th><th scope="col">Glasses sold</th><th scope="col">Net profit</th><th scope="col">Final assets</th></tr></thead><tbody>${ranking.map(p=>`<tr><td>${p.stand}</td><th scope="row">${escape(p.name)}</th><td>${p.sold}</td><td class="${p.cash<economy().startingCash?'negative':'positive'}">${money(p.cash-economy().startingCash)}</td><td><strong>${money(p.cash)}</strong></td></tr>`).join('')}</tbody></table></div>${button('restart','Try again')}</section>`;
  $('#restart').onclick=resetGame;
}
$('#brand').onclick=event=>{event.preventDefault();$('#restart-dialog').showModal();};
$('#cancel-restart').onclick=()=>$('#restart-dialog').close();
$('#confirm-restart').onclick=resetGame;
$('#currency').onchange=event=>{if(game){event.target.value=currency;return;}currency=event.target.value;render();};
$('#language').onchange=event=>{if(phase!=='title'){event.target.value=language;return;}language=event.target.value;render();};
$('#sound').onclick=async()=>{const enabled=!music.enabled;if(enabled)music.enabled=true;else music.setEnabled(false);$('#sound').setAttribute('aria-pressed',String(enabled));$('#sound').innerHTML=`${enabled?'♫':'♪'} <span>Sound ${enabled?'on':'off'}</span>`;if(enabled){await music.unlock();if(music.enabled)music.setEnabled(true);}};
$('#help').onclick=()=>{if(isWeather())return;$('#help-rules').innerHTML=rulesMarkup();$('#help-dialog').showModal();};
document.querySelectorAll('.dialog-close').forEach(control=>control.onclick=()=>$('#help-dialog').close());
document.addEventListener('visibilitychange',()=>{if(document.hidden){gate?.pause();void music.pause();}else{gate?.resume();void music.resume();}gameBox.setAttribute('data-weather-paused',String(document.hidden));updateWeather();updateReport();});
render();
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  const tools=[{
    name:'read_lemonade_game',description:'Read public game state without exposing pending decisions.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},
    execute(){return {phase,day:game?.day??null,currency,language,players:game?.players.map(({name,cash,bankrupt})=>({name,cash,bankrupt}))??[],forecast:weather?{type:weather.type,rainChance:weather.rainChance,roadworks:weather.roadworks}:null,activePlayer:phase==='planning'?playerIndex+1:null,reportPlayer:phase==='report'||phase==='report-wait'?reportIndex+1:null};}
  },{
    name:'submit_lemonade_plan',description:'Submit the active player’s plan. Price is in integer minor currency units. Only available during planning. The final player opens all stands.',inputSchema:{type:'object',properties:{glasses:{type:'integer',minimum:0,maximum:1000},signs:{type:'integer',minimum:0,maximum:50},price:{type:'integer',minimum:0,maximum:3000}},required:['glasses','signs','price'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute(input){if(phase!=='planning'||!game||game.players[playerIndex].bankrupt)throw new Error('No active player can submit a plan here.');if(!input||typeof input!=='object'||Object.keys(input).some(key=>!['glasses','signs','price'].includes(key)))throw new Error('Provide glasses, signs, and price only.');const error=validatePlan(input,game.players[playerIndex].cash,game.day,economy());if(error)throw new Error(error);const player=playerIndex+1;commitPlan({glasses:input.glasses,signs:input.signs,price:input.price});return {submitted:true,player,phase,day:game.day};}
  }];
  for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
