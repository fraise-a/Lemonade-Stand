# Lemonade Stand

A modern HTML5/JavaScript tribute to the Apple II game, created by [Fraise Aurora](https://github.com/fraise-a). Two to eight named players share one device and compete for fourteen days inside a 4:3 illustrated game frame.

Make lemonade, advertise your stand, set your price, and see whose business earns the most. Watch the weather: heat waves bring thirsty customers, roadworks disrupt passing traffic, and thunderstorms can ruin the day's stock.

- Illustrated scenery, gradients, animated rain, and lightning.
- Reconstructed Apple II weather melodies and the daily financial-report tune.
- Private player handoffs, individual daily reports, and final standings.
- UK and US English, with British pounds as the default and four other currency options.
- Runs directly in a web browser, with no installation required for players.

## Starting and playing

Choose a language and currency on the title screen, then press **Start**. The welcome page leads to a player-count field (2–8), individual names, and two instruction pages. The welcome, instructions, notices, and individual financial reports use Fraise Aurora's supplied wording, with dynamic names, prices, and language choices.

Daily weather plays before costs or decisions. Each player enters a new batch size, sign count, and price into blank fields. Decisions remain hidden during handoff. After the last player's submission, any storm is revealed, and each stand receives its own financial report. Every report starts with its title and a two-second delay before the figures appear. After day fourteen, a ranked results table shows the winner or all tied winners.

The logo opens an in-game restart confirmation. Cancel preserves progress; confirming returns to the title and unlocks settings. The browser's generic leave-page confirmation is requested while a game is active. Browser support and user-interaction requirements govern whether that native warning appears; no custom leave-page message is supplied. Progress lives in memory, so leaving or reloading loses it.

## Language and currency

**English (United Kingdom)** is the default: **Lemonshire · England**, “mum,” and “roadworks.” **English (United States)** uses **Lemonsville · California**, “mom,” and “roadwork.” Both use Oxford commas in lists of three or more names. Language locks immediately after the title screen. Currency locks once the named game begins. Locked settings have hover and keyboard-focus explanations.

GBP is the default currency. GBP, USD, EUR, CAD, and AUD use separate contemporary price estimates; see [PRICING.md](PRICING.md). Language and currency are independent. Amounts below one major unit use `p` or `¢`, dollar currencies use `$` without country prefixes inside the game, and losses use a leading ASCII minus (`-25p`, `-$1.50`). Values are stored as integer minor units. Price entry accepts decimals, currency symbols, and explicit minor amounts, such as `1.50`, `£1.50`, or `50p`.

## Weather and rules

Requested house rules override the original game's opening forecast sequence:

- Days 1–3 choose only **sunny** or **hot and dry** (75% / 25% before streak restrictions).
- No forecast repeats more than twice consecutively, including across day 3 into day 4.
- Later days use sunny/cloudy/hot weights of 60/20/20, excluding and renormalising any forecast blocked by the streak limit.
- Cloudy forecasts announce a 30–70% chance of light rain and cooler weather. That number reduces demand. A separate 25% storm roll occurs only after every player submits on a cloudy day, as in the Apple II rules.
- Heat waves double demand. Street work can reduce traffic or lead to the crew buying the whole batch. Sugar and mix costs increase on days 3 and 7.

The Apple II's price-sensitive demand, diminishing advertising returns, independent stand sales, discarded leftovers, preparation expenses during storms, and permanent bankruptcy are retained, with modern prices and the requested player/day limits. Source reference: [Applesoft BASIC listing](https://gist.github.com/mreider/c7cf24ee3cccd509f76217154af2ae49). The old `RND(-1)` roadworks branch uses an ordinary random choice rather than interpreter reseeding.

Each weather has a distinct illustrated sky that persists through decisions and reports. Storms run across the game frame with lightning and two seamless layers of gradient droplets. Forecasts are unskippable for at least five seconds; storms last at least 7.2 seconds. Muting does not bypass the timer. Switching tabs pauses the timer and animations. Reduced-motion settings remove moving rain and flashing lightning.

## Sound

The original five-note financial-report cue (BASIC lines 1140–1148) plays once per day during the pause before the first stand's figures appear, including after a storm. Later stands retain their two-second report pause without repeating the tune. The cue respects mute, pauses with a hidden tab, and stops when restarting.

Weather melodies use the original Apple II note data, with reconstructed pitch and approximate timing. Sunny, cloudy, and hot cues use a softened square wave. The storm uses a single continuous triangle-wave voice, smooth pitch transitions, and the original rests; it no longer restarts an oscillator or chops the volume envelope at every note. This is a modern reconstruction, not cycle-accurate Apple II speaker emulation.

## Credits

Modern game and presentation: **[Fraise Aurora](https://github.com/fraise-a)**.

Inspired by **Lemonade Stand**, originally by Bob Jamison / MECC, adapted for Apple II by Charlie Kellner in 1979.
