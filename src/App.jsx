import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CATEGORIES from "./data";

/* ─── Monetisation ─── */
const FREE_CATEGORIES = 2;          // first 2 categories (Alphabets, Small Words) are always free
const STORAGE_KEY = "sharpstar_unlocked";

/* ─── Twemoji: convert emoji char to local SVG path ─── */
function emojiToTwemoji(emoji) {
  const codepoints = [...emoji]
    .map((c) => c.codePointAt(0).toString(16))
    .filter((cp) => cp !== "fe0f")
    .join("-");
  return `/emoji/${codepoints}.svg`;
}

/* ─── Text-to-Speech helper ─── */
function speak(text) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.1;
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }
}

/* ─── Kids shouting "Hurray!" then cheer message ─── */
function playCelebration(cheerText) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    // First: excited kid shout
    const shout = new SpeechSynthesisUtterance("Hurray!");
    shout.rate = 0.9;
    shout.pitch = 2.0;
    shout.volume = 1.0;
    shout.lang = "en-US";
    window.speechSynthesis.speak(shout);
    // Then: excited cheer message (queued after hurray)
    if (cheerText) {
      const cheer = new SpeechSynthesisUtterance(cheerText);
      cheer.rate = 1.0;
      cheer.pitch = 1.4;
      cheer.volume = 1.0;
      cheer.lang = "en-US";
      window.speechSynthesis.speak(cheer);
    }
  }
}

/* ─── Cheer voice (for every 5 cards) ─── */
function speakCheer(text) {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.5;
    utterance.volume = 1.0;
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  }
}

/* ─── Encouragement phrases ─── */
const CHEERS = [
  "Yay!", "Super!", "Great job!", "Awesome!", "Wow!",
  "Amazing!", "You're a star!", "Fantastic!", "Brilliant!",
  "Well done!", "Hurray!", "Wonderful!", "Keep going!",
  "You rock!", "So smart!",
];
function randomCheer() {
  return CHEERS[Math.floor(Math.random() * CHEERS.length)];
}

/* Unlock audio on iOS — must be called from a user tap */
function unlockAudio() {
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance("");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  }
}

/* ─── Shape SVGs for the shapes category ─── */
function ShapeDisplay({ shape }) {
  const cls = "w-32 h-32";
  switch (shape) {
    case "circle":
      return <div className={`${cls} rounded-full bg-blue-500`} />;
    case "square":
      return <div className={`${cls} rounded-lg bg-red-500`} />;
    case "triangle":
      return (
        <svg viewBox="0 0 100 100" className={cls}>
          <polygon points="50,10 90,90 10,90" fill="#22C55E" />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 100 100" className={cls}>
          <polygon points="50,5 63,38 98,38 70,60 80,95 50,73 20,95 30,60 2,38 37,38" fill="#EAB308" />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 100 100" className={cls}>
          <path d="M50,88 C25,65 5,50 5,30 A22,22,0,0,1,50,30 A22,22,0,0,1,95,30 C95,50 75,65 50,88Z" fill="#EC4899" />
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox="0 0 100 100" className={cls}>
          <polygon points="50,5 95,50 50,95 5,50" fill="#A855F7" />
        </svg>
      );
    default:
      return null;
  }
}

/* ─── Card back content (picture side) ─── */
function CardBack({ card }) {
  if (card.image) {
    return (
      <img
        src={card.image}
        alt={card.name}
        className="h-full w-full object-contain rounded-3xl"
      />
    );
  }
  if (card.hex) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-full">
        <div
          className="w-32 h-32 rounded-2xl border-4 border-white/30 shadow-lg"
          style={{ backgroundColor: card.hex }}
        />
        <span className="text-4xl font-bold text-white/80">{card.name}</span>
      </div>
    );
  }
  if (card.shape) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-full">
        <ShapeDisplay shape={card.shape} />
      </div>
    );
  }
  if (card.display) {
    if (card.bigLetter) {
      return (
        <div className="flex items-center justify-center h-full">
          <span className="text-[14rem] font-extrabold text-white leading-none">{card.display}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-full p-8">
        <img src={emojiToTwemoji(card.display)} alt={card.name} className="w-48 h-48 drop-shadow-lg" />
      </div>
    );
  }
  return null;
}

/* ─── Single Flashcard ─── */
function Flashcard({ card, flipped, onFlip }) {
  return (
    <div
      className="relative w-full aspect-[3/4] max-w-xs mx-auto cursor-pointer"
      style={{ perspective: 1000 }}
      onClick={onFlip}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front — Name */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white shadow-xl border-4 border-slate-100"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="text-center px-6">
            <h2 className="text-5xl font-extrabold text-slate-800 tracking-tight">
              {card.name}
            </h2>
          </div>
        </div>

        {/* Back — Picture */}
        <div
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-xl overflow-hidden"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <CardBack card={card} />
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Flashcard Deck (within a category) ─── */
function FlashcardDeck({ category, onDone }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const cards = category.cards;
  const timerRef = useRef(null);

  // Intro: "Let's do Fruits!" then auto-start
  useEffect(() => {
    if (showIntro) {
      speak(`Let's do ${category.label}!`);
      timerRef.current = setTimeout(() => setShowIntro(false), 1500);
      return () => clearTimeout(timerRef.current);
    }
  }, [showIntro, category.label]);

  // Card auto-play
  useEffect(() => {
    if (showIntro) return;
    setFlipped(false);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setFlipped(true);
      // Every 5 cards, add encouragement after the name
      if (index > 0 && index % 5 === 0) {
        speak(cards[index].name);
        timerRef.current = setTimeout(() => {
          speakCheer(randomCheer());
          timerRef.current = setTimeout(() => {
            if (index < cards.length - 1) {
              setIndex((i) => i + 1);
            } else {
              onDone();
            }
          }, 1200);
        }, 800);
      } else {
        speak(cards[index].name);
        timerRef.current = setTimeout(() => {
          if (index < cards.length - 1) {
            setIndex((i) => i + 1);
          } else {
            onDone();
          }
        }, 1000);
      }
    }, 500);
    return () => clearTimeout(timerRef.current);
  }, [index, cards, showIntro, onDone]);

  if (showIntro) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <span className="text-7xl block mb-4">{category.emoji}</span>
          <h1 className={`text-3xl font-extrabold bg-gradient-to-r ${category.color} bg-clip-text text-transparent`}>
            Let's do {category.label}!
          </h1>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center px-4 py-3">
        <h1 className="text-lg font-bold text-slate-800">
          {category.emoji} {category.label}
        </h1>
      </div>

      {/* Progress */}
      <div className="px-4 mb-2">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>{index + 1} / {cards.length}</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-200">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${category.color}`}
            animate={{ width: `${((index + 1) / cards.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-xs"
          >
            <Flashcard
              card={cards[index]}
              flipped={flipped}
              onFlip={() => {}}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Done Screen ─── */
function DoneScreen({ onRestart }) {
  useEffect(() => {
    playCelebration("Yay! Great job! You finished everything! You are a super star!");
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.span
          className="text-8xl block mb-4"
          animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
        >🎉</motion.span>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Yay! Great Job!</h1>
        <p className="text-slate-500 mb-2">You finished all the cards!</p>
        <p className="text-2xl mb-6">👏👏👏 🌟⭐🌟</p>
        <button
          onClick={onRestart}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg"
        >
          Start Again
        </button>
      </motion.div>
    </div>
  );
}

/* ─── Celebration Screen (between categories) ─── */
function CelebrationScreen({ category, onContinue }) {
  useEffect(() => {
    const cheer = randomCheer();
    playCelebration(`${cheer} You finished ${category.label}!`);
    const t = setTimeout(onContinue, 7000);
    return () => clearTimeout(t);
  }, [category, onContinue]);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.span
          className="text-7xl block mb-4"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 0.6, repeat: 3 }}
        >👏</motion.span>
        <h1 className={`text-3xl font-extrabold bg-gradient-to-r ${category.color} bg-clip-text text-transparent mb-2`}>
          {randomCheer()}
        </h1>
        <p className="text-slate-500 text-lg">You finished {category.label}!</p>
        <p className="text-3xl mt-3">🌟⭐🎉⭐🌟</p>
      </motion.div>
    </div>
  );
}

/* ─── Category Selection Screen ─── */
function CategoryGrid({ onSelect }) {
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            🌟 Sharp Star™
          </h1>
          <p className="mt-1 text-sm text-slate-500">Pick a category to start learning!</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(cat)}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br ${cat.color} p-6 text-white shadow-lg hover:shadow-xl transition-shadow`}
            >
              <span className="text-4xl">{cat.emoji}</span>
              <span className="text-sm font-semibold">{cat.label}</span>
              <span className="text-xs opacity-80">{cat.cards.length} cards</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Unlock / Paywall Screen ─── */
function UnlockScreen({ onBuy, onRestore, onLater }) {
  const lockedCount = CATEGORIES.length - FREE_CATEGORIES;
  const lockedLabels = CATEGORIES.slice(FREE_CATEGORIES)
    .map((c) => c.label)
    .join(", ");

  useEffect(() => {
    speak("Unlock all categories for just 99 cents!");
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm mx-auto"
      >
        <motion.span
          className="text-7xl block mb-4"
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
        >
          🔓
        </motion.span>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">
          Unlock All Categories!
        </h1>
        <p className="text-slate-500 mb-3">
          You've finished the free categories. Unlock{" "}
          <span className="font-bold text-indigo-600">{lockedCount} more</span> including{" "}
          {lockedLabels}!
        </p>
        <button
          onClick={onBuy}
          className="w-full px-6 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xl font-bold shadow-lg active:scale-95 transition-transform mb-3"
        >
          🌟 Unlock All — $0.99
        </button>
        <button
          onClick={onRestore}
          className="w-full px-6 py-2 rounded-full border border-slate-300 text-slate-600 text-sm font-medium mb-4 active:scale-95 transition-transform"
        >
          Restore Purchase
        </button>
        <button onClick={onLater} className="text-slate-400 text-sm underline">
          Maybe later
        </button>
      </motion.div>
    </div>
  );
}

/* ─── App Root — auto-flows through all categories ─── */
export default function App() {
  const [started, setStarted] = useState(false);
  const [catIndex, setCatIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "true"
  );
  const [showPaywall, setShowPaywall] = useState(false);

  const handleStart = useCallback(() => {
    unlockAudio();
    setStarted(true);
  }, []);

  const handleCategoryDone = useCallback(() => {
    setCelebrating(true);
  }, []);

  const handleCelebrationDone = useCallback(() => {
    setCelebrating(false);
    const nextIndex = catIndex + 1;
    if (nextIndex >= CATEGORIES.length) {
      setDone(true);
    } else if (nextIndex >= FREE_CATEGORIES && !unlocked) {
      setShowPaywall(true);
    } else {
      setCatIndex(nextIndex);
    }
  }, [catIndex, unlocked]);

  const handlePurchase = useCallback(() => {
    // ─────────────────────────────────────────────────────────────────────
    // TODO: Replace the two lines below with the real store IAP call:
    //   • Android  → Google Play Billing via Capacitor/In-App-Purchases plugin
    //   • iOS      → Apple StoreKit via Capacitor/In-App-Purchases plugin
    //   • Web-only → Stripe Checkout redirect
    // Only call the lines below AFTER the store confirms payment success.
    // ─────────────────────────────────────────────────────────────────────
    localStorage.setItem(STORAGE_KEY, "true");
    setUnlocked(true);
    setShowPaywall(false);
    setCatIndex(FREE_CATEGORIES); // continue from first locked category
  }, []);

  const handleRestore = useCallback(() => {
    // TODO: Replace with store restore-purchases API call.
    // Check localStorage as a fallback for web / dev mode.
    const already = localStorage.getItem(STORAGE_KEY) === "true";
    if (already) {
      setUnlocked(true);
      setShowPaywall(false);
      setCatIndex(FREE_CATEGORIES);
    } else {
      speak("No purchase found.");
    }
  }, []);

  const handleRestart = useCallback(() => {
    setCatIndex(0);
    setDone(false);
    setCelebrating(false);
    setShowPaywall(false);
  }, []);

  if (!started) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <span className="text-8xl block mb-4">🌟</span>
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2">Sharp Star™</h1>
          {unlocked ? (
            <p className="text-slate-500 mb-8">All categories unlocked! 🎉</p>
          ) : (
            <p className="text-slate-500 mb-2">
              {FREE_CATEGORIES} free categories · Unlock all for{" "}
              <span className="font-bold text-indigo-600">$0.99</span>
            </p>
          )}
          <button
            onClick={handleStart}
            className={`px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xl font-bold shadow-lg active:scale-95 transition-transform ${unlocked ? "" : "mb-4"}`}
          >
            ▶ Start
          </button>
          {!unlocked && (
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => { unlockAudio(); handlePurchase(); }}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-base font-bold shadow active:scale-95 transition-transform"
              >
                🌟 Unlock All — $0.99
              </button>
              <button
                onClick={handleRestore}
                className="text-slate-400 text-sm underline"
              >
                Restore Purchase
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  if (showPaywall) {
    return (
      <UnlockScreen
        onBuy={handlePurchase}
        onRestore={handleRestore}
        onLater={handleRestart}
      />
    );
  }

  if (done) {
    return <DoneScreen onRestart={handleRestart} />;
  }

  if (celebrating) {
    return (
      <CelebrationScreen
        category={CATEGORIES[catIndex]}
        onContinue={handleCelebrationDone}
      />
    );
  }

  return (
    <FlashcardDeck
      key={catIndex}
      category={CATEGORIES[catIndex]}
      onDone={handleCategoryDone}
    />
  );
}
