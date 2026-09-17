// Player-facing copy supplied by Fraise Aurora, with UK/US place and word choices.
export const LANGUAGES = Object.freeze({
  'en-GB': { town:'Lemonshire', region:'England', mum:'mum', roadworks:'Roadworks' },
  'en-US': { town:'Lemonsville', region:'California', mum:'mom', roadworks:'Roadwork' },
});
export function languageFor(code='en-GB') { return LANGUAGES[code] || LANGUAGES['en-GB']; }
export function joinNames(names) {
  if(names.length<3)return names.join(' and ');
  return `${names.slice(0,-1).join(', ')}, and ${names.at(-1)}`;
}
export function instructionPages(words, money, economy) {
  return [
    `<p>To manage your lemonade stand, you will need to make these decisions every day:</p><ol class="rules-list"><li>How many glasses of lemonade to make (only one batch is made each morning).</li><li>How many advertising signs to make (the signs cost ${money(economy.signCost)} each).</li><li>What price to charge for each glass.</li></ol><p>You will begin with <strong>${money(economy.startingCash)}</strong> cash (assets).</p><p>Because your ${words.mum} gave you some sugar, your cost to make lemonade is <strong>${money(economy.glassCosts[0])}</strong> a glass (this may change in the future).</p>`,
    `<p>Your expenses are the sum of the cost of the lemonade and the cost of the signs.</p><p>Your profits are the difference between the income from sales and your expenses.</p><p>The number of glasses you sell each day depends on the price you charge and on the number of advertising signs you use.</p><p>Keep track of your assets, because you can't spend more money than you have!</p>`,
  ];
}
