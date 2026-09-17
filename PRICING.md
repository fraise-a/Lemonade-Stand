# September 2026 price estimates

These are rounded design estimates for a 250–300 ml glass sold at a small neighbourhood lemonade stand. They are not live prices, exchange-rate conversions, or claims about national averages. EUR represents a broad euro-area estimate because no single country was selected.

| Currency | Starting cash | Glass: days 1–2 | Glass: days 3–6 | Glass: days 7–14 | Paper sign | Typical selling price |
|---|---:|---:|---:|---:|---:|---:|
| GBP | £20.00 | 25p | 30p | 35p | 50p | £1.50 |
| USD | $25.00 | 35¢ | 40¢ | 50¢ | 75¢ | $2.00 |
| EUR | €22.00 | 30¢ | 35¢ | 40¢ | 60¢ | €1.75 |
| CAD | $35.00 | 45¢ | 55¢ | 65¢ | $1.00 | $2.50 |
| AUD | $40.00 | 50¢ | 60¢ | 75¢ | $1.20 | $3.00 |

The player chooses their own selling price. The typical price calibrates the original demand curve; it is also the starting suggestion. The maximum remains ten times this reference price, preserving the old game's relative price range. Starting cash covers a modest first batch, signs, and a reserve.

## Estimation method

A glass uses a fraction of a lemon (or equivalent juice/mix), sugar, water/ice, and an inexpensive serving cup. Signs mean paper/card and a share of marker or printing costs, not professionally printed outdoor boards. UK costs are estimated around 20–25p for juice, cup, and water/ice, plus about 5p for sugar; the day-7 increase adds a 5p supply-cost shock. Other profiles use independent rounded local-currency budgets for the same basket. The sugar and mix events remain on days 3 and 7, but their monetary increments no longer reproduce 1979 prices.

As a Canadian ingredient sanity check, [Walmart Canada’s single lemon listing](https://www.walmart.ca/en/ip/lemon/6000191268551) displayed 87¢ when checked for this update, while its [2 lb bag](https://www.walmart.ca/en/ip/seort/6000199360630) displayed $4.44. A fraction of a lemon plus a disposable cup, sugar, and water makes a 45–65¢ production budget plausible. Store and regional prices vary. These examples inform the estimates; they do not establish every price in the table.

The other profiles are explicit estimates, not retailer-derived quotations. Their selling prices represent a casual stand rather than a café, and their sign prices reflect homemade materials. Adjust the table in `economy.js` if a different local market or serving size is preferred.

## Currency behaviour

The selector identifies the country/currency outside the game. In-game dollar amounts use `$` for USD, CAD, and AUD. Amounts below one unit use `p` for GBP and `¢` for the other currencies, including negative profits. A game keeps its selected price list for all 14 days; choosing another currency is available before the next game. This prevents mid-game repricing from altering already-submitted decisions or accounting.
