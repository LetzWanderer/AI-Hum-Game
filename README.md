# AI in Humanitarian Action — offline game

A phone-friendly decision game about the trade-offs in AI decisions. Plain HTML, CSS and JavaScript: no libraries, no AI, no internet needed, no tracking. Progress is saved only in the player's own browser.

## 1. Run the game
You need a current browser: Chrome, Edge, Firefox, or Safari. Nothing to install, no account, and no internet connection after the file is open. The game does not send scores, votes, or stories anywhere. Progress stays in this browser only.
### First time
A fresh copy of this folder does not include the playable file. Build it once:
1. Open `tools/build.html` in your browser.
2. Click **Choose game folder** and pick this project folder — the one that contains `content` and `app`. Allow the browser to read the folder if it asks.
3. Click **Try it first** to play in a temporary tab, or **Download START-HERE.html** and save that file into this same folder. `app/shell.html` on its own is not the game. It has no stories until the builder packs them in.
### Open it
Double-click `START-HERE.html`, or drag that file onto a browser window. You can also email it, put it on a USB stick, or upload it to any website (rename it `index.html` if the host expects that name).
Titles use Montserrat and the story uses Open Sans. If those files do not load, the page uses Arial.

### What you do
1. Choose a language. English, Swedish, French, Spanish and Arabic are included. Arabic lays the page out right to left.
2. Choose **Play on my own** or **Run a group workshop**.
3. Open a scenario. Read your role and the situation, then start.
4. Each scenario is four decisions, with three options each. Tap an option, then **Confirm decision**.
5. Read what happened, why it matters, and the effect on the principles. Open **The options that were not taken** to see the other two choices.
6. After the fourth decision, the debrief shows an overall verdict and a meter for each principle. **Replay** starts the same scenario again. **Choose another scenario** returns home.
A check mark on the home screen means that scenario is finished. An in-progress label means a draft is saved. Open the card to resume. Leaving for home keeps confirmed steps. An option you have only tapped, and not confirmed, is not saved.
On a phone, scroll the situation, then use the button fixed to the bottom of the screen to confirm.

### Run a workshop
Choose **Run a group workshop** and put one screen where everyone can see it. The home screen then shows a short facilitator guide.
For each decision the group gets the same five discussion questions, a timer (3 minutes, adjustable from 1 to 15), and + / − counters for a show of hands. The option with the most votes is selected. You can still tap a different option before confirming. Nothing is uploaded.
At the debrief, **Copy workshop summary** or **Download summary**. Copy needs the clipboard, which some browsers block for a file opened from a folder. 
Download writes a `.txt` file and works either way.
### Saved on this device
Language, solo or workshop mode, finished scenarios, and drafts are stored in this browser under the key `hai-game-v1`. Another browser, another computer, or a cleared site-data setting starts fresh. There is no account to sign in to.
### If it does not open
- You opened `app/shell.html` or a folder of JSON files. Build `START-HERE.html` and open that file.
- The builder says a file is missing. Choose the folder that contains both `content` and `app`, not a folder inside it.
- The page is blank. Reload it. If you edited the JSON, open `tools/check.html`, pick the same folder, and fix anything listed in red before building 
again.

## 2. What's in the folder
| Folder / file | What it is | Edit it? |
| --- | --- | --- |
| `START-HERE.html` | The ready-to-play game, after you build it | No — it is rebuilt from the files below |
| `content/settings.json` | Principle weightings and scoring thresholds | Yes |
| `content/scenarios-xx.json` | Scenario stories, options and scores, one file per language | Yes |
| `content/i18n-xx.json` | Buttons, headings, principle names and descriptions | Yes |
| `content/scenario-template.json` | A copy-and-fill example scenario | Copy from it |
| `app/game.js`, `app/styles.css`, `app/shell.html` | The game's code and look | Only if you know HTML/CSS/JS |
| `tools/check.html` | Checks your edits for mistakes | Open in a browser |
| `tools/build.html` | Makes a fresh `START-HERE.html` | Open in a browser |

Use any plain text editor (Notepad, TextEdit in plain-text mode, VS Code). Save files as UTF-8.

## 3. The edit → check → build loop
1. Edit files in `content/`.
2. Open `tools/check.html`, click **Choose game folder**, and pick this project folder (the one that contains `content` and `app`). Fix anything listed in red.
3. Open `tools/build.html`, pick the same folder, click **Try it first**, then **Download START-HERE.html** and save it over the old one.

No installs or command line needed. Works in Chrome, Edge, Firefox and Safari.

## 4. Change the principle weightings
Open `content/settings.json`:
```json
"weights": { "humanity": 1, "impartiality": 1, "neutrality": 1, "independence": 1, "doNoHarm": 1 },
"strongShare": 0.5
```
- Each choice's score for a principle is multiplied by its weight. `2` = counts double, `0.5` = half, `0` = ignored.
  Example: set `"doNoHarm": 1.5` to give energy, environmental and safety harms more weight.
- The "best possible" and "worst possible" in each meter are weighted the same way, so meters stay fair.
- `strongShare` is how much of the best possible score a player needs for a **Strong** rating (0.5 = half). Below that but 0 or above is **Mixed**; below 0 is **At risk**.
- To change *one* choice instead, edit its `"impacts"` in the scenario file (−2 to +2).

## 5. Add a scenario
1. Open `content/scenario-template.json` and copy the block inside `"scenario": { … }`.
2. In `content/scenarios-en.json`, put a comma after the last scenario's closing `}` and paste your block before the final `]`.
3. Give it a unique `id`, and unique step/option ids (e.g. `tr-1`, `tr-1a`).
4. Optional: translate it by adding the same block (same ids and impacts, translated text) to `scenarios-sv.json` etc. Untranslated scenarios show in English.
5. Check, then build.

To remove a scenario, delete its block from every scenarios file. Order in `scenarios-en.json` = order on the home screen.

## 6. Add a language
1. Copy `content/i18n-en.json` to `content/i18n-xx.json` (e.g. `i18n-de.json`) and translate the text (not the keys). Optionally add `"languageName": "Deutsch"`.
2. Optionally add `content/scenarios-xx.json`.
3. Check and build — the language appears in the menu automatically. Arabic, Farsi, Hebrew and Urdu display right-to-left.

## 7. Workshop mode
Choose **Run a group workshop** on the home screen and put the game on one shared screen. Each decision shows discussion questions, a timer and + / − counters for a show of hands. The summary at the end can be copied or downloaded. Nothing is sent anywhere.

## 8. Scoring in short
Score per principle = sum of (impact × weight) over the player's choices, shown against the best and worst achievable in that scenario. The leadership record adds up all finished scenarios.
