# Lemonade Stand

A modern HTML5/JavaScript tribute to the Apple II game, created by [Fraise Aurora](https://github.com/fraise-a). Two to eight named players share one device and compete for fourteen days inside a 4:3 illustrated game frame.

Make lemonade, advertise your stand, set your price, and see whose business earns the most. Watch the weather: heat waves bring thirsty customers, roadworks disrupt passing traffic, and thunderstorms can ruin the day's stock.

- Illustrated scenery, gradients, animated rain, and lightning.
- Reconstructed Apple II weather melodies and the daily financial-report tune.
- Private player handoffs, individual daily reports, and final standings.
- UK and US English, with British pounds as the default and four other currency options.
- Runs directly in a web browser, with no installation required for players.

## Publish on GitHub Pages

### Upload the game

1. Extract `lemonade-stand.zip` on your computer.
2. Sign in to GitHub and create a **public** repository. `lemonade-stand` is a suitable name. Leave GitHub's “Add a README” option off: this project already includes one.
3. On the new repository page, choose **uploading an existing file** (or **Add file → Upload files** in an existing repository).
4. Drag in the **contents** of the extracted folder, including the `tests` folder. Do not upload the ZIP itself or nest the project inside another folder. `index.html` and `README.md` must appear directly in the repository's main file list.
5. Include `.nojekyll` and `.gitignore`. On a Mac, press **Command + Shift + .** in Finder to show these hidden files. Do not upload `.DS_Store`.
6. Commit the uploaded files to `main`.

### Enable the playable website

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select **main**, choose **/(root)**, and click **Save**.
4. Wait for deployment to finish. The **Actions** tab shows progress; **Settings → Pages** provides the published website link.

If the account is `fraise-a` and the repository is named `lemonade-stand`, the default address will be **https://fraise-a.github.io/lemonade-stand/**. This address becomes available after publication; change the repository portion if you choose a different name.

Official instructions: [uploading files](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository) and [configuring GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

### Share and update it

Share the **Pages website link** for people to play. The `github.com` repository link shows the source code and this README. Add the published Pages URL to the repository's **About → Website** field so visitors can find the game easily.

For a prominent play link in this README, add the following after the introduction once your site is live (adjust the address if needed):

```markdown
**[Play Lemonade Stand](https://fraise-a.github.io/lemonade-stand/)**
```

To publish an update, upload and commit the changed project files to `main`; Pages will redeploy. If changing JavaScript source modules, rebuild `app.js` first using the development instructions below. Uploading the already-built project requires no commands.

People who want the source can use GitHub's **Code → Download ZIP**. For ordinary players, the website link is all they need.

Visitors need no terminal, installation, server, account, or build step. All game logic runs in their browser. Relative asset URLs support project Pages sites. Keep `.nojekyll` in the repository.

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

## Development

The published site needs `index.html`, `styles.css`, `app.js`, `rain.svg`, `scene.svg`, `scene-hot.svg`, `scene-cloudy.svg`, `scene-storm.svg`, `lemon.svg`, and `.nojekyll`. Generated assets are checked in. No npm dependencies are required.

Edit `game-source.js`, `language.js`, `engine.js`, `economy.js`, `audio.js`, or `weather-gate.js`, then rebuild. Weather scene variants are generated from `scene.svg`. Do not edit generated `app.js` or scene variants directly.

```sh
npm run build
npm test
npm run check
npm run dev
```

The last command rebuilds and starts an optional developer preview at `http://127.0.0.1:4173`. Restart after source edits. Tests reject stale generated assets. If the game script fails to load, a visible recovery message and Reload button remain on the page.

## Verification

Automated tests exercise the published bundle through fourteen-day games with every player count from 2 to 8, both languages, all five currencies, player validation, empty and invalid decisions, private handoffs, two-second individual reports, storms after all submissions, bankruptcy, multi-player ties, the Oxford comma, restart cancellation/confirmation, native leave-warning registration/removal, forecast streak limits, accounting, and continuous storm-note scheduling. Asset checks cover the standalone bundle and locally linked files.

Browser checks cover the new title screen, UK/US place names and instruction text, eight-name layout, the in-game restart dialog, setting locks, blank decisions, and the individual report flow. A fresh browser run on 17 September 2026 also checked the opening weather sequence, a cloudy-day storm after all submissions, the gradient rain layers, and a negative-profit report. No browser errors were reported during that run. Speaker output has not been independently assessed; audio scheduling and the note sequence are checked in code.

## Credits

Modern game and presentation: **[Fraise Aurora](https://github.com/fraise-a)**.

Inspired by **Lemonade Stand**, originally by Bob Jamison / MECC, adapted for Apple II by Charlie Kellner in 1979. This is an independent tribute.
