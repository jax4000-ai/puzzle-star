import React, { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PUZZLE_DATA = [
  { letter: "A", emoji: "🍎", word: "APPLE" },
  { letter: "B", emoji: "🏀", word: "BALL" },
  { letter: "C", emoji: "🐱", word: "CAT" },
  { letter: "D", emoji: "🐶", word: "DOG" },
  { letter: "E", emoji: "🐘", word: "ELEPHANT" },
  { letter: "F", emoji: "🐟", word: "FISH" },
  { letter: "G", emoji: "🍇", word: "GRAPE" },
  { letter: "H", emoji: "🏠", word: "HOUSE" },
  { letter: "I", emoji: "🍦", word: "ICE CREAM" },
  { letter: "J", emoji: "🍀", word: "JUNGLE" },
  { letter: "K", emoji: "🪁", word: "KITE" },
  { letter: "L", emoji: "🦁", word: "LION" },
  { letter: "M", emoji: "🐒", word: "MONKEY" },
  { letter: "N", emoji: "🥜", word: "NUT" },
  { letter: "O", emoji: "🐙", word: "OCTOPUS" },
  { letter: "P", emoji: "🍕", word: "PIZZA" },
  { letter: "Q", emoji: "👑", word: "QUEEN" },
  { letter: "R", emoji: "🌈", word: "RAINBOW" },
  { letter: "S", emoji: "⭐", word: "STAR" },
  { letter: "T", emoji: "🐯", word: "TIGER" },
  { letter: "U", emoji: "☂️", word: "UMBRELLA" },
  { letter: "V", emoji: "🍚", word: "VANILLA" },
  { letter: "W", emoji: "🐳", word: "WHALE" },
  { letter: "X", emoji: "🎵", word: "XYLOPHONE" },
  { letter: "Y", emoji: "🛶", word: "YACHT" },
  { letter: "Z", emoji: "🦓", word: "ZEBRA" },
];

const COLORS = [
  { from: "#f43f5e", to: "#ec4899" },
  { from: "#f97316", to: "#ef4444" },
  { from: "#eab308", to: "#f97316" },
  { from: "#22c55e", to: "#10b981" },
  { from: "#06b6d4", to: "#3b82f6" },
  { from: "#8b5cf6", to: "#6366f1" },
  { from: "#d946ef", to: "#ec4899" },
  { from: "#14b8a6", to: "#06b6d4" },
];

// Puzzle piece clip-paths (percentage-based)
const PIECE_L = "polygon(0% 0%, 75% 0%, 75% 28%, 100% 50%, 75% 72%, 75% 100%, 0% 100%)";
const PIECE_M = "polygon(25% 0%, 75% 0%, 75% 28%, 100% 50%, 75% 72%, 75% 100%, 25% 100%, 25% 72%, 0% 50%, 25% 28%)";
const PIECE_R = "polygon(25% 0%, 100% 0%, 100% 100%, 25% 100%, 25% 72%, 0% 50%, 25% 28%)";

const SZ = 150;    // puzzle row piece size
const OL = 22;     // overlap
const TILE = 155;  // draggable tile size (larger = easier to grab)

const CHEERS = [
  "Amazing work!", "You're so smart!", "Fantastic!", "Brilliant!",
  "You're a star!", "Wonderful!", "Keep it up!", "You rock!",
  "Super job!", "Awesome!", "Well done!", "You did it!",
  "That's incredible!", "I'm so proud of you!", "You're doing great!",
];

function speak(text) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.8; u.pitch = 1.3; u.lang = "en-US";
    window.speechSynthesis.speak(u);
  }
}

// Queue a cheer after the main phrase finishes speaking
function speakThen(main, cheer) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u1 = new SpeechSynthesisUtterance(main);
  u1.rate = 0.8; u1.pitch = 1.3; u1.lang = "en-US";
  const u2 = new SpeechSynthesisUtterance(cheer);
  u2.rate = 0.85; u2.pitch = 1.6; u2.lang = "en-US";
  window.speechSynthesis.speak(u1);
  window.speechSynthesis.speak(u2);
}

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function getChoices(i, key) {
  const correct = PUZZLE_DATA[i][key];
  const wrongs = shuffle(PUZZLE_DATA.filter((_, j) => j !== i).map(d => d[key])).slice(0, 3);
  return shuffle([correct, ...wrongs]);
}

// ─── Puzzle row pieces ──────────────────────────────────────────────────────

function LetterPiece({ letter, color }) {
  return (
    <motion.div
      key={letter}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      style={{
        width: SZ, height: SZ, flexShrink: 0, zIndex: 30,
        clipPath: PIECE_L,
        background: "linear-gradient(135deg," + color.from + "," + color.to + ")",
        filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.28))",
      }}
      className="flex items-center justify-center"
    >
      <span style={{ fontSize: 50, fontWeight: 900, color: "#fff",
                     paddingRight: 14, lineHeight: 1,
                     textShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>
        {letter}
      </span>
    </motion.div>
  );
}

// Active drop slot — data-dropzone="active" is what DragTile queries
function DropSlot({ clip, bg, active, flashing }) {
  return (
    <motion.div
      data-dropzone={active ? "active" : undefined}
      animate={{ background: flashing ? "#fca5a580" : bg + "30" }}
      transition={{ duration: 0.12 }}
      style={{ width: SZ, height: SZ, marginLeft: -OL, clipPath: clip,
               flexShrink: 0, zIndex: 1 }}
      className="flex items-center justify-center"
    >
      {active && (
        <motion.span
          animate={{ opacity: [0.5, 1, 0.5], y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 1.1 }}
          style={{ fontSize: 26, paddingLeft: 16 }}
        >
          👆
        </motion.span>
      )}
    </motion.div>
  );
}

function ImagePiece({ emoji }) {
  return (
    <motion.div
      key="img-p"
      initial={{ scale: 0.3, opacity: 0, y: -24 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 520, damping: 26 }}
      style={{ width: SZ, height: SZ, marginLeft: -OL, clipPath: PIECE_M,
               flexShrink: 0, zIndex: 20, background: "#fff",
               filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.22))" }}
      className="flex items-center justify-center"
    >
      <span style={{ fontSize: 50, lineHeight: 1 }}>{emoji}</span>
    </motion.div>
  );
}

function WordPiece({ word, color }) {
  // Usable text width inside PIECE_R at SZ=150: ~88px. Keep on one line.
  const fs = Math.max(8, Math.min(16, Math.floor(88 / word.length)));
  return (
    <motion.div
      key="word-p"
      initial={{ scale: 0.3, opacity: 0, y: -24 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 520, damping: 26 }}
      style={{ width: SZ, height: SZ, marginLeft: -OL, clipPath: PIECE_R,
               flexShrink: 0, zIndex: 10,
               background: "linear-gradient(135deg," + color.to + "," + color.from + ")",
               filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.22))" }}
      className="flex items-center justify-center"
    >
      <span style={{ fontSize: fs, fontWeight: 900, color: "#fff",
                     paddingLeft: 20, paddingRight: 6,
                     textAlign: "center", lineHeight: 1,
                     whiteSpace: "nowrap",
                     textShadow: "0 1px 4px rgba(0,0,0,0.28)" }}>
        {word}
      </span>
    </motion.div>
  );
}

// ─── Draggable tile ─────────────────────────────────────────────────────────
// Uses data-dropzone="active" query + center-distance check for reliable drop.
// Tiles are puzzle-shaped: image tiles = PIECE_M, word tiles = PIECE_R.

function DragTile({ value, isEmoji, color, onDrop }) {
  const clip = isEmoji ? PIECE_M : PIECE_R;
  const bg   = isEmoji
    ? "#ffffff"
    : "linear-gradient(135deg," + color.to + "88," + color.from + "88)";
  const fontSz = isEmoji ? 56 : Math.max(8, Math.min(16, Math.floor(82 / value.length)));
  const pl = isEmoji ? 4 : 26; // shift content away from left socket

  const handleDragEnd = useCallback((_, info) => {
    // Reliable drop: find active slot anywhere in DOM and use center-distance
    const slot = document.querySelector("[data-dropzone='active']");
    if (!slot) return;
    const rect = slot.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    // info.point is in client (viewport) coords, same as getBoundingClientRect
    const dist = Math.hypot(info.point.x - cx, info.point.y - cy);
    if (dist < 110) {   // 110 px generous radius for toddler fingers
      onDrop(value);
    }
  }, [value, onDrop]);

  return (
    <motion.div
      drag
      dragSnapToOrigin
      dragMomentum={false}
      dragElastic={0.08}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.28, zIndex: 200,
                   filter: "drop-shadow(0 16px 32px rgba(0,0,0,0.35))" }}
      whileTap={{ scale: 0.92 }}
      style={{
        width: TILE, height: TILE,
        clipPath: clip,
        background: bg,
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        cursor: "grab",
        flexShrink: 0,
        filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.18))",
      }}
      className="flex items-center justify-center"
    >
      <span style={{ fontSize: fontSz, fontWeight: 900, color: "#1e293b",
                     paddingLeft: pl, paddingRight: isEmoji ? 4 : 8,
                     textAlign: "center", lineHeight: 1,
                     whiteSpace: isEmoji ? undefined : "nowrap" }}>
        {value}
      </span>
    </motion.div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function LetterPuzzle() {
  const [index, setIndex]         = useState(0);
  const [step, setStep]           = useState("image"); // image | word | done
  const [slotFlash, setSlotFlash] = useState(false);

  const current      = PUZZLE_DATA[index];
  const color        = COLORS[index % COLORS.length];
  const imageChoices = useMemo(() => getChoices(index, "emoji"), [index]);
  const wordChoices  = useMemo(() => getChoices(index, "word"),  [index]);
  const progress     = (index / PUZZLE_DATA.length) * 100;

  useEffect(() => {
    const t = setTimeout(() => speak("Let's do " + current.letter + "!"), 400);
    return () => clearTimeout(t);
  }, [index]); // eslint-disable-line

  const flashWrong = useCallback(() => {
    setSlotFlash(true);
    speak("Try again!");
    setTimeout(() => setSlotFlash(false), 650);
  }, []);

  // Correct image drop → place piece immediately, advance to word step
  const handleImgDrop = useCallback((emoji) => {
    if (emoji === current.emoji) {
      speak(current.word);
      setStep("word");
    } else {
      flashWrong();
    }
  }, [current, flashWrong]);

  // Correct word drop → place piece immediately, go to done
  const handleWordDrop = useCallback((word) => {
    if (word === current.word) {
      const cheer = CHEERS[Math.floor(Math.random() * CHEERS.length)];
      speakThen(current.letter + " is for " + current.word + "!", cheer);
      setStep("done");
    } else {
      flashWrong();
    }
  }, [current, flashWrong]);

  const handleNext = useCallback(() => {
    setIndex(i => (i + 1) % PUZZLE_DATA.length);
    setStep("image");
    setSlotFlash(false);
  }, []);

  const choices    = step === "image" ? imageChoices : step === "word" ? wordChoices : [];
  const isEmoji    = step === "image";
  const handleDrop = step === "image" ? handleImgDrop : handleWordDrop;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-indigo-50 to-purple-100 flex flex-col select-none overflow-x-hidden">

      {/* Progress */}
      <div className="px-4 pt-4 pb-1">
        <div className="h-3 rounded-full bg-white/60 overflow-hidden shadow-inner">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(to right," + color.from + "," + color.to + ")" }}
            animate={{ width: progress + "%" }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-center text-slate-400 text-xs mt-1">{index + 1} / {PUZZLE_DATA.length}</p>
      </div>

      {/* Let's do A! */}
      <AnimatePresence mode="wait">
        <motion.div key={"h" + index}
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="text-center pt-3 pb-2"
        >
          <h2 className="text-3xl font-extrabold tracking-wide" style={{ color: color.from }}>
            Let's do {current.letter}!
          </h2>
          <button onClick={() => speak("Let's do " + current.letter + "!")}
            className="text-2xl mt-1 active:scale-90 transition-transform">
            🔊
          </button>
        </motion.div>
      </AnimatePresence>

      {/* ── Puzzle assembly row ── */}
      <div className="flex justify-center items-center px-2 mb-4" style={{ minHeight: SZ + 16 }}>

        <LetterPiece letter={current.letter} color={color} />

        <AnimatePresence mode="wait">
          {step === "image"
            ? <DropSlot key="img-slot" clip={PIECE_M} bg={color.from}
                        active={true} flashing={slotFlash} />
            : <ImagePiece key="img-piece" emoji={current.emoji} />
          }
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === "done"
            ? <WordPiece key="word-piece" word={current.word} color={color} />
            : <DropSlot key="word-slot" clip={PIECE_R} bg={color.to}
                        active={step === "word"} flashing={step === "word" && slotFlash} />
          }
        </AnimatePresence>

      </div>

      {/* ── Drag tiles or celebration ── */}
      <AnimatePresence mode="wait">

        {step !== "done" && (
          <motion.div key={"tiles-" + step}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-3 px-4"
          >
            <p className="font-bold text-base text-slate-600 text-center">
              {isEmoji
                ? <span>Drag the right picture to match <span style={{ color: color.from }} className="font-extrabold">{current.letter}</span>!</span>
                : <span>Now drag the right <span style={{ color: color.from }} className="font-extrabold">word</span> to complete the puzzle!</span>
              }
            </p>

            {/* 2-column grid of puzzle-piece tiles */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-3">
              {choices.map(value => (
                <DragTile
                  key={step + "-" + value}
                  value={value}
                  isEmoji={isEmoji}
                  color={color}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div key="done"
            initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="flex flex-col items-center px-6 gap-4 text-center"
          >
            <motion.span
              animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-6xl">
              🎉
            </motion.span>

            <div className="bg-white/90 rounded-3xl px-8 py-4 shadow-xl w-full max-w-xs">
              <p className="text-2xl font-extrabold tracking-wide mb-1" style={{ color: color.from }}>
                {current.letter} is for
              </p>
              <p className="text-4xl font-extrabold text-slate-800">{current.word}</p>
              <span className="text-5xl mt-2 block">{current.emoji}</span>
            </div>

            <p className="text-2xl font-bold text-green-600">Great job! 🌟</p>

            <motion.button onClick={handleNext} whileTap={{ scale: 0.94 }}
              className="px-10 py-4 rounded-full text-white text-xl font-bold shadow-xl"
              style={{ background: "linear-gradient(to right," + color.from + "," + color.to + ")" }}>
              {index + 1 < PUZZLE_DATA.length ? "Next →" : "Start Over! 🔄"}
            </motion.button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
