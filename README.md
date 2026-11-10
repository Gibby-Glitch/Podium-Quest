# Xcel Spin

A gamified conditioning randomizer for USA Gymnastics Developmental Level 1 & 2 (ages about 4-7) and Xcel (Silver, Gold, Platinum, Diamond). Spin the wheel, get a random workout with numbers for each level, earn XP and badges. Works on iPhone, iPad and Android, and works offline in the gym once it has been opened.

## What's inside

- **Conditioning tab**: Upper Body, Lower Body, Mix It Up, Body Positions, Bars and Beam.
- **Acro tab**: Solo Acro, Tumbling, Partner Acro (base and top) and Acro Mix. Partner skills that need a spot are marked **Coach spot**, and skills above a level are left out automatically.
- **Timed blocks**: pick 10, 15, 20 or 30 minutes. The spin fills the block with moves (rounds repeat if needed), and a block clock counts down during the workout.
- **Solo or Team (up to 20 athletes)**: everyone sees the number for their own level, grouped by level. The coach taps anyone who did not finish.
- **Two separate groups**: Developmental (Level 1 & 2) and Xcel. They never train together. Level 1 and 2 can share a group; Silver through Diamond share the Xcel group.
- **Little gymnasts**: Developmental moves come with a "Say it to little gymnasts" kid-friendly explanation, plus moves like Bunny Hops, Flamingo Balance and Monkey Hang.
- **Quick roster**: paste a list like `Ava, Mia, Zoe` to add a whole class at once.
- **Coach dial**: Easier (75%), Standard, Harder (125%).
- **Band toggle**: shows band-assisted versions of pull-ups, chin holds and pullovers.
- **Game stuff**: XP, ranks (Rookie to Legend), golden cards worth 2x XP, 2 swaps per workout, streaks, badges, leaderboard, confetti.
- **Game tab: Road to the Podium**: a team board game for 1 to 6 teams (see below).
- **Moves tab**: the full library of 100+ moves with how-to and coach cues, searchable, with numbers for each level.

## Quick Spin (no names needed)

The Conditioning tab opens on **Quick Spin**, made for practice days when you don't know who will be there.

1. Pick **Developmental** or **Xcel** and what to work on (Conditioning mix, Upper body, Bars, Beam and so on).
2. Pick **Solo** (each gymnast spins for herself) or **Teams** and tap how many teams (2 to 6). The app shows whose turn it is and keeps the points.
3. Tap **SPIN**. The big wheel has 15 slices, including one **Gold Card**: a 15-second water or rest station.
4. The result shows the number for every level in the group, so each gymnast reads her own.
5. For holds, tap your level's **Start timer**. The timer moves to a tray at the bottom of the screen and keeps counting, so the next person can spin right away. Tap a timer to clear it.

The old roster-based workout planner is still there under **Workout builder**.

Road to the Podium, Gym-Zee Dice and Card Draw also have a **no names** option (Quick teams / Quick turns), and it is the default. Every card then shows the number for each level in the group.

## Road to the Podium (board game)

1. On the **Team** tab, check in who is at practice.
2. On the **Game** tab, pick the group (Xcel or Developmental), 1 to 6 teams, board length, an optional 20 or 30 minute game clock, and whether pieces move by themselves or the team taps to move. Teams are split fairly by level; tap an athlete to move them, tap a name to rename a team.
3. On each turn the team taps **Draw a move card**, like Candy Land: "Move to the next Skill square" or "Double! 2nd Conditioning square".
4. Where they land decides the card:
   - **Conditioning** (pink): an upper, lower or core move. Each athlete gets the number for their level.
   - **Skill** (teal): a skill drill from that part of the board: Bar Jungle, Beam Bridge, Tumble Track and more.
   - **Chance** (yellow): Coach for a Day (pick a conditioning card for another team), Springboard, Chalk Spill, Switcheroo, Everybody Up, Double Dare, Stick the Landing, Judge's Bonus or a Water Break.
5. Finish the card to keep your spot. "Not this time" slides the team back 1.
6. **Springboards** launch a team ahead; **foam pits** sink them back.
7. First team to **The Podium** wins. If the game clock runs out, the team furthest along wins. Winners get +50 XP and the Podium Party badge.

With 1 team, the team races the board (and the clock, if it is on), and Coach for a Day lets them pick their own card. Close the game with ✕ to save it and resume later from the Game tab.

## Gym-Zee Dice and Card Draw (solo turns)

Pick these at the top of the **Game** tab. Athletes come up one at a time in the line-up order; tap a name in the line-up to send them to the back.

**Gym-Zee Dice**: three dice. The **Move d20** picks an exercise from the numbered 1-20 dice chart (tap "New chart" for a fresh one), the **How Many d20** says how many, and the **Multiplier** die makes it ×0, ×1 or ×2. Tap dice to keep them and re-roll the rest (0, 1 or 2 re-rolls per turn). Doubles on the two d20s is a **GYM-ZEE** for 2x XP; ×0 is a lucky free pass.

**Card Draw**: a real 54-card deck (or a half deck). Each suit is a type of move and every card has its own exercise. The card value is how many: Ace = 1 up to King = 13. Queens are buddy cards (pick someone from the line to join you), the Wild Joker lets you choose your move for 2x XP, and the Lucky Joker is a free pass.

In both games, the roll or card is the number for the top level (Diamond, or Level 2 for Developmental). Other levels get the same share of their normal numbers, holds count 2 seconds per point, and nobody ever goes over double their usual amount.

Progress is saved on each device (browser storage). No accounts, no server, no data leaves the device.

## Files

```
index.html            the app page (generated by build.py)
css/app.css           styles
js/data.js            exercise library: edit this to add or change moves and numbers
js/app.js             app logic
manifest.webmanifest  makes it installable as an app
sw.js                 offline support
icons/                app icons
vercel.json           Vercel settings
src/page.html         page source; run `python3 build.py` after editing it
preview.html          single-file version of the whole app (handy for sharing or testing)
```

## Put it on GitHub

1. Go to github.com, click **New repository**, name it `xcel-spin`, and create it.
2. Click **uploading an existing file**, drag in everything from this folder (keep the `css`, `js`, `icons` and `src` folders), and click **Commit changes**.

Or from a terminal:

```bash
cd xcel-spin
git init && git add . && git commit -m "Xcel Spin"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/xcel-spin.git
git push -u origin main
```

## Deploy on Vercel

1. Go to vercel.com and sign in with GitHub.
2. Click **Add New → Project**, pick the `xcel-spin` repo, and click **Import**.
3. Framework Preset: **Other**. Leave Build Command and Output Directory empty.
4. Click **Deploy**. You get a link like `https://xcel-spin.vercel.app`.

Every time you push to GitHub, Vercel updates the app automatically.

## Install on iPhone and iPad

1. Open your Vercel link in **Safari**.
2. Tap the **Share** button, then **Add to Home Screen**, then **Add**.
3. Open it from the home screen icon. It runs full screen like a regular app.

On Android, open the link in Chrome and tap **Install app** (or menu → Add to Home screen).

## Editing moves and numbers

Open `js/data.js`. Each move looks like this:

```js
{ id:"pushup", cat:"upper", name:"Push-Ups", unit:"reps", n:[6,10,14,18],
  how:"Start in a straight plank...", cue:"Body stays in one line..." }
```

- `n` is `[Silver, Gold, Platinum, Diamond]`. Use `0` to leave a level out.
- Developmental numbers are in `XCEL_DEV` at the bottom of the file: `pushup: [3, 5, "kid-friendly how-to"]` means Level 1 does 3, Level 2 does 5. Moves not listed there are never given to Level 1 or 2.
- `cat` is one of `upper, lower, core, bars, beam, acro, tumble, partner`.
- `unit` is `reps`, `sec`, `each` or `m`. Add `unitLabel:"sec each leg"` to customize the wording.
- Optional: `band:true` with `bandHow:"..."`, `partner:true`, `safety:true` (shows Coach spot), `minLevel:1` (Xcel only: 0 = Silver, 3 = Diamond).

After changing files, bump `VERSION` in `sw.js` (for example `xcel-spin-v2`) so installed apps pick up the update.

## Safety note

Numbers are starting points for healthy athletes and should be adjusted by the coach. Skills like back handspring drills, walkovers, aerial/front tuck drills and all partner balances must be done with a qualified coach, on mats, with spotting.
