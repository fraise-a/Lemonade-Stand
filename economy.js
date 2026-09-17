// September 2026 neighbourhood-stand estimates; values are integer minor units.
export const ECONOMIES = Object.freeze(Object.fromEntries(Object.entries({
  GBP: { symbol:'£', minor:'p', region:'United Kingdom', startingCash:2000, glassCosts:[25,30,35], signCost:50, referencePrice:150 },
  USD: { symbol:'$', minor:'¢', region:'United States', startingCash:2500, glassCosts:[35,40,50], signCost:75, referencePrice:200 },
  EUR: { symbol:'€', minor:'¢', region:'Euro area', startingCash:2200, glassCosts:[30,35,40], signCost:60, referencePrice:175 },
  CAD: { symbol:'$', minor:'¢', region:'Canada', startingCash:3500, glassCosts:[45,55,65], signCost:100, referencePrice:250 },
  AUD: { symbol:'$', minor:'¢', region:'Australia', startingCash:4000, glassCosts:[50,60,75], signCost:120, referencePrice:300 },
}).map(([currency, values]) => [currency, Object.freeze({ ...values, currency, glassCosts:Object.freeze(values.glassCosts), maxPrice:values.referencePrice*10 })])));
export function economyFor(currency='GBP') {
  if (!Object.hasOwn(ECONOMIES, currency)) throw new Error('Unsupported currency.');
  return ECONOMIES[currency];
}
export function formatMoney(amount, currency='GBP') {
  if (!Number.isSafeInteger(amount)) return '—';
  const {symbol,minor} = economyFor(currency), absolute = Math.abs(amount), sign = amount < 0 ? '-' : '';
  if (absolute < 100) return `${sign}${absolute}${minor}`;
  return `${sign}${symbol}${(absolute/100).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
}
export function parseMoney(input, currency='GBP') {
  const {symbol,minor} = economyFor(currency);
  let value = String(input).trim();
  if (value.endsWith(minor)) { value=value.slice(0,-1).trim(); return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : NaN; }
  if (value.startsWith(symbol)) value=value.slice(symbol.length).trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d{1,2})?$/.test(value) || !/\d/.test(value)) return NaN;
  const [whole='0',fraction=''] = value.replaceAll(',','').split('.');
  const amount=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  return Number.isSafeInteger(amount) ? amount : NaN;
}
