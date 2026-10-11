# Class Routine
Live link:  https://akibaronno.github.io/Class-Routine/

A mobile-first weekly class routine web app built with plain **HTML, CSS and JavaScript**. No framework, no build step, no dependencies. Open `index.html` and it works.

It shows which class is running right now, what comes next, and the full week at a glance, in a light or dark theme.

## Folder structure

```
class-routine/
├── index.html    # Page structure
├── style.css     # All styling (light + dark theme, responsive)
├── script.js     # Routine data + all the logic
└── README.md
```

## How to run

1. Keep `index.html`, `style.css` and `script.js` together in one folder.
2. Double-click `index.html` to open it in a browser.

To use it on your phone, host the folder on any static host (GitHub Pages, Netlify, Vercel) and open the link. You can also add the page to your home screen.

> Fonts (Bricolage Grotesque and DM Sans) load from Google Fonts. Offline, the app falls back to the system font and everything else still works.

## Features

- **Live status card** at the top of the page:
  - *Happening now*: current class, minutes left, and a progress ring
  - *Up next*: the next class and a countdown
  - *Lunch break*, *Done for today*, and *Weekend* states
- **Day tabs** (Sat, Sun, Mon, Tue, Wed, Week). Colored dots under each day show how many classes it has and which subjects they are. Today's tab is marked and opens by default.
- **Day timeline** with:
  - class cards (Theory or Lab badge, number of periods, end time)
  - lunch break and free periods
  - the running class highlighted with a progress bar
  - finished classes dimmed
- **Week view**: the full routine as one table, with merged cells for multi-period classes. It scrolls sideways on small screens.
- **Swipe left or right** to change the day on touch devices. The left and right arrow keys work on the tabs.
- **Dark / light mode** toggle. The choice is saved in `localStorage` under the key `routine-theme`, and the system theme is used on first visit.
- **Mobile-friendly:** safe-area support for notched phones, `100dvh`, large touch targets, and reduced-motion support.
- The live status refreshes every 30 seconds and when you return to the tab.

On Thursday and Friday (no classes), the Saturday tab opens and the status card shows the next class.

## Customizing the routine

All routine data is at the top of `script.js`.

### 1. Subjects

```js
const SUBJECTS = {
  dip:   { name: 'Digital Image Processing',   color: '#7b5cfa' },
  oc:    { name: 'Optical Communication',      color: '#f2a100' },
  dm:    { name: 'Data Mining',                color: '#12b5a6' },
  cyber: { name: 'Cryptography and Cyber Law', color: '#ec4f86' }
};
```

Add a subject by giving it a short key, a name and a color.

### 2. Time slots

```js
const SLOTS = [
  { s: 540, e: 590 },  // 9:00  – 9:50
  { s: 600, e: 650 },  // 10:00 – 10:50
  ...
  { s: 770, e: 820 },  // 12:50 – 1:40  (lunch)
  ...
];
const LUNCH = 4;       // index of the lunch slot
```

Times are **minutes from midnight** (`9:00` = `9 × 60 = 540`). `LUNCH` must match the index of the lunch slot.

### 3. Classes per day

```js
{ name: 'Monday', short: 'Mon', classes: [
  { sub: 'oc', slot: 0, span: 1 },              // Optical Communication, 9:00–9:50
  { sub: 'dm', slot: 5, span: 1, lab: true }    // Data Mining Lab, 1:45–2:25
]}
```

| Field  | Meaning                                                       |
|--------|---------------------------------------------------------------|
| `sub`  | Subject key from `SUBJECTS`                                   |
| `slot` | Index of the first time slot (0 is the first column)          |
| `span` | How many consecutive periods the class covers (2 is a double) |
| `lab`  | `true` for a lab class (optional)                             |

A class must not cross the lunch slot. Periods with no class are shown as free periods automatically.

### 4. Colors and theme

Colors are CSS variables at the top of `style.css`. Light theme values are in `:root`, dark theme values in `[data-theme="dark"]`. Change `--brand` and `--hero` to re-color the whole app.

## Browser support

Works on current Chrome, Edge, Safari and Firefox. The styles use `color-mix()` and `dvh` units, so you need roughly Chrome 111+, Safari 16.2+ or Firefox 113+.

## Tech notes

- No external JavaScript. Only the Google Fonts stylesheet is loaded from outside.
- The page is rendered from the data in `script.js`, so `index.html` stays small.
- Today's day is mapped from `Date.getDay()`: Sat=0, Sun=1, Mon=2, Tue=3, Wed=4. Thursday and Friday have no routine.
