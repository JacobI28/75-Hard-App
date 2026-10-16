# 75 Hard Duo

A shared 75 Hard tracker for two people. Each of you sets your own daily tasks, sees the other
tick theirs off live, and the app keeps a running tab of who owes who.

This is a standalone web app in its own folder. It doesn't touch the Expo app in the repo root.

## What it does

- **Landing page:** both people's tasks for today, day number, streak, a countdown to midnight, and the net amount owed.
- **Your own tasks:** add, rename, reorder and remove them. There are one-tap suggestions for the classic 75 Hard list.
- **Live sync:** when your partner ticks something off, your screen updates and shows a notification.
- **Two rule sets** (a shared toggle under *Setup*):
  - **Traditional:** miss any task and you go back to day 1, *and* you owe the penalty for every task you missed.
  - **Forgiving:** you owe the penalty per missed task, but you keep your day count. The challenge ends after 75 days.
- **Adjustable penalty:** £10 per missed task by default.
- **Nudges:** tap 👊 Nudge on your partner's card to send a preset or custom message. It pops up on their screen straight away if the app is open, or the next time they open it.
- **Notes:** after ticking a task, tap ✎ to add a note (e.g. "Bench PB 100kg"). Your partner sees it under the task, gets a pop-up, and it shows up in History.
- **Celebrations:** confetti when you finish the day, and a full-screen moment at 7, 14, 21, 30, 40, 50, 60 and 75-day streaks.
- **Daily race:** whoever ticks their last task first wins the day. A tug-of-war bar on the Today page shows it live, and History keeps the days-won score.
- **Gap bonus (optional, Setup):** at the end, whoever won fewer daily races pays a set amount (default £2) per day of difference, e.g. 45–30 at £2 = £30. The race closes when the first of you completes 75 Hard, and the bonus is then added to the pot.
- **Settle up:** record payments. The headline figure nets both people's penalties and payments into one "X owes Y" number.
- **History:** a day-by-day grid for each person, plus a ledger of every missed day and payment.
- **Fair-play locks:** once day 1 has passed, task and rule changes only apply from tomorrow, so nobody can delete a task to get out of it. Past days are never recalculated.

**24-hour grace period:** forgot to tick something? Yesterday's tasks stay tickable until midnight tonight.
A day only locks in (and charges, or resets you) once that grace period ends. Times use the phone's local clock.

## Setup (about 10 minutes, free)

### 1. Create the shared database (Firebase)

1. Go to <https://console.firebase.google.com>, click **Create a project** and give it any name. You can turn Analytics off.
2. In the left menu open **Build → Firestore Database → Create database**. Pick a location near you (e.g. `europe-west2` London) and start in **production mode**.
3. Open the **Rules** tab, replace the contents with what's in [`firestore.rules`](./firestore.rules), and click **Publish**.
4. Go to **Project settings** (gear icon) → **Your apps** → the **`</>`** (Web) icon. Register an app (no hosting needed) and copy the `firebaseConfig` values.
5. Paste them into [`src/firebaseConfig.ts`](./src/firebaseConfig.ts) and commit. These values identify your project; they aren't secret.

Until you do this, the app runs in **demo mode**: everything stays on one device, which is useful for trying it out.

### 2. Put it online (GitHub Pages)

1. On GitHub, open the repo's **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push any change under `duo/` (or run the *Deploy 75 Hard Duo* workflow by hand from the **Actions** tab).
3. The app goes live at <https://jacobi28.github.io/75-Hard-App/>.

### 3. Install it on both phones

- **iPhone:** open the link in Safari → Share → **Add to Home Screen**.
- **Android:** open the link in Chrome → ⋮ menu → **Add to Home screen** / **Install app**.

It then opens full-screen like a normal app.

### 4. Start the challenge

1. One of you taps **Start a challenge**, enters both names, the day 1 date, the rules and the penalty.
2. Tap **Share invite** and send the link (or the 8-character code) to your partner.
3. Your partner opens the link, picks their name, and you're connected.
4. Each of you adds your tasks under **Setup**.

Lost your phone or cleared your browser? Join again with the same code and pick your name. Nothing is lost.

## Development

```bash
cd duo
npm install
npm run dev     # local dev server
npm test        # unit tests for the streak / debt rules
npm run build   # production build into dist/
```

The code is laid out as follows:

- `src/lib/logic.ts`: all challenge rules (streaks, resets, penalties, balance). These are pure functions and are unit tested.
- `src/lib/store.ts`: the sync layer (Firestore, or localStorage in demo mode).
- `src/lib/actions.ts`: every write the app makes.
- `src/screens/`: Today, History, Setup and the Welcome/onboarding screens.
