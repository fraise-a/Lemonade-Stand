// Apple II demand and events, with currency-specific contemporary prices.
import { economyFor } from './economy.js';
export const DAYS = 14;
export const glassCost = (day, economy=economyFor()) => economy.glassCosts[day > 6 ? 2 : day > 2 ? 1 : 0];
export function createGame(names, currency='GBP') {
  if (!Array.isArray(names) || names.length < 2 || names.length > 8 || Array.from(names).some(name=>typeof name !== 'string' || !name.trim() || name.trim().length > 24)) throw new Error('Enter 2 to 8 names, up to 24 characters each.');
  names = names.map(name=>name.trim());
  if (new Set(names.map(name=>name.toLocaleLowerCase())).size !== names.length) throw new Error('Choose different player names.');
  const economy = economyFor(currency);
  return { day: 1, currency, economy, players: names.map(name => ({ name, cash: economy.startingCash, bankrupt: false, sold: 0, revenue: 0, expenses: 0 })), history: [] };
}
export function forecast(day, random = Math.random, history = []) {
  // Requested house rules: opening days are clear or hot, and never three
  // identical forecasts consecutively. Reweight eligible choices, without retries.
  const previous=history.slice(-2).map(entry=>entry.weather?.type ?? entry.type ?? entry);
  const blocked=previous.length===2 && previous[0]===previous[1] ? previous[0] : null;
  const choices=[['sunny',.6],['cloudy',.2],['hot',.2]].filter(([type])=>type!==blocked && (day>3 || type!=='cloudy'));
  let roll=random()*choices.reduce((total,[,weight])=>total+weight,0);
  let type=choices.at(-1)[0];
  for(const [candidate,weight] of choices){if(roll<weight){type=candidate;break;}roll-=weight;}
  const weather = { type, factor: 1, roadworks: false, crewBuyout: false, rainChance: 0 };
  if (type === 'cloudy') { weather.rainChance = 30 + Math.floor(random() * 5) * 10; weather.factor = 1 - weather.rainChance / 100; }
  else if (type === 'hot') weather.factor = 2;
  else if (day > 2 && random() < .25) { weather.roadworks = true; weather.crewBuyout = random() >= .5; weather.factor = weather.crewBuyout ? 1 : .1; }
  return weather;
}
export function validatePlan(plan, cash, day, economy=economyFor()) {
  if (!plan || typeof plan !== 'object') return 'Enter a plan for every stand.';
  for (const [key, max] of [['glasses', 1000], ['signs', 50], ['price', economy.maxPrice]]) {
    if (!Number.isInteger(plan[key]) || plan[key] < 0 || plan[key] > max) return `Enter a whole number from 0 to ${max} for ${key}.`;
  }
  if (plan.glasses * glassCost(day,economy) + plan.signs * economy.signCost > cash) return 'That costs more than you have. Make fewer glasses or signs.';
  return '';
}
export function customerDemand(price, signs, factor, referencePrice=150) {
  const base = price < referencePrice ? (referencePrice-price)/referencePrice*.8*30+30 : referencePrice**2*30/(price*price);
  return Math.floor(factor * base * (2 - Math.exp(-signs * .5)));
}
export function settleDay(game, plans, weather, random = Math.random) {
  if (game.day > DAYS || game.history.length !== game.day - 1) throw new Error('This day has already been settled.');
  if (!Array.isArray(plans) || plans.length !== game.players.length || Array.from(plans).some(plan=>!plan)) throw new Error('Every player must submit a plan.');
  const economy = game.economy;
  plans.forEach((plan, i) => { if (!game.players[i].bankrupt) { const error = validatePlan(plan, game.players[i].cash, game.day,economy); if (error) throw new Error(error); } });
  const storm = weather.type === 'cloudy' && random() < .25;
  const rows = game.players.map((player, i) => {
    const plan = player.bankrupt ? { glasses: 0, signs: 0, price: 0 } : plans[i];
    const sold = storm ? 0 : weather.crewBuyout ? plan.glasses : Math.min(plan.glasses, customerDemand(plan.price, plan.signs, weather.factor,economy.referencePrice));
    const expenses = plan.glasses * glassCost(game.day,economy) + plan.signs * economy.signCost;
    const revenue = sold * plan.price;
    const profit = revenue - expenses;
    player.cash += profit;
    player.sold += sold; player.revenue += revenue; player.expenses += expenses;
    // Preserve the original post-report <= current glass-cost bankruptcy check.
    player.bankrupt ||= player.cash <= glassCost(game.day,economy);
    return { ...plan, sold, unsold: plan.glasses - sold, expenses, revenue, profit, cash: player.cash, bankrupt: player.bankrupt };
  });
  const report = { day: game.day, weather: { ...weather }, storm, rows };
  game.history.push(report);
  return report;
}
