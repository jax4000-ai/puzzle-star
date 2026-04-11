# Sharp Star ⭐™

A flashcard app for toddlers. Shows emoji cards across 16 categories with text-to-speech, auto-play, and fun celebrations between categories.

**Live:** https://sharpstar.surge.sh

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm (comes with Node.js)

### Install & Run

```bash
# Install dependencies
npm install

# Start dev server (opens at http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Deploy

```bash
# Deploy to Surge
npx surge dist sharpstar.surge.sh

# Deploy to Firebase
npx firebase deploy
```

## How It Works

The app auto-plays through 16 emoji categories (20 cards each). Each card flips to reveal the emoji, speaks the name aloud, and moves to the next. Every 5 cards there's an encouraging cheer, and between categories there's an excited celebration with a cheer message. A final done screen appears at the end.

## Project Structure

```
sharp-star/
├── index.html          # Entry HTML — contains SVG star favicon and page title
├── package.json        # Dependencies and npm scripts
├── vite.config.js      # Vite bundler config with React plugin
├── postcss.config.js   # PostCSS config for Tailwind CSS
├── firebase.json       # Firebase Hosting configuration
├── .firebaserc         # Firebase project alias
├── .gitignore          # Files excluded from git (node_modules, dist)
├── public/
│   └── emoji/          # 199 self-hosted Twemoji SVGs (no CDN dependency)
└── src/
    ├── main.jsx        # App entry point — mounts React to the DOM
    ├── App.jsx         # All components and logic (see below)
    ├── data.js         # 16 categories with 20 emoji cards each
    └── index.css       # Tailwind CSS imports and global styles
```

## File Details

### `src/App.jsx`

The main application file containing all components and helpers:

- **`speak(text)`** — Text-to-speech for card names (Web Speech API)
- **`speakCheer(text)`** — Excited cheer voice for every-5-cards encouragement
- **`playCelebration(cheerText)`** — Excited celebration shout followed by a cheer message (used between categories and on the done screen)
- **`emojiToTwemoji(emoji)`** — Converts emoji characters to local Twemoji SVG paths (`/emoji/*.svg`)
- **`unlockAudio()`** — Unlocks audio on iOS Safari (requires user tap)
- **`randomCheer()`** — Picks a random encouragement phrase ("Yay!", "Super!", "Awesome!", etc.)
- **`ShapeDisplay`** — Renders SVG shapes (circle, square, triangle, star, heart, diamond)
- **`CardBack`** — Renders the back of a card: Twemoji SVG, color swatch, shape, or big letter
- **`Flashcard`** — Flip card with Framer Motion rotateY animation
- **`FlashcardDeck`** — Auto-plays through cards in a category with speech and cheers
- **`CelebrationScreen`** — Animated screen between categories with celebration cheer
- **`DoneScreen`** — Final celebration screen with bouncing confetti and restart button
- **`CategoryGrid`** — Grid of category buttons (used in manual mode)
- **`App`** — Root component managing start → play → celebrate → done flow

### `src/data.js`

Contains the `CATEGORIES` array with 16 categories, each having 20 cards. Categories in order:

Animals, Colors, Shapes, Family, Fruits, Baby Animals, Birds, Playground, Planets, Food, Countries, Cartoons, Small Words, Alphabets, Numbers

Each card has: `name`, `emoji`, `display` type, and optional properties like `hex` (colors), `shape` (shapes), or `bigLetter` (alphabets/numbers).

### `index.html`

HTML shell with a gold star SVG favicon, Apple touch icon (gold star on purple background), and the "Sharp Star™" title.

### `vite.config.js`

Vite configuration with the React plugin for JSX/fast refresh support.

### `postcss.config.js`

PostCSS pipeline with Tailwind CSS and Autoprefixer plugins.

## Tech Stack

- **React 19** — UI framework
- **Vite 8** — Build tool and dev server
- **Tailwind CSS 4** — Utility-first styling
- **Framer Motion** — Card flip animations
- **Web Speech API** — Text-to-speech for card names and cheers
- **Twemoji SVG** — 199 self-hosted SVGs in `public/emoji/` — zero external dependencies at runtime
