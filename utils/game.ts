export const GAME_TITLE = "Fun Games";
export const GAME_SUBTITLE = "By Technology & Development Team";
export const ROUND_SECONDS = 60;
export const COUNTDOWN_SECONDS = 15;

export const CHALLENGE_PARAGRAPH =
  "In a data-driven digital environment, professionals must process and communicate information with speed and precision. Tasks like drafting reports, debugging code, or writing emails demand accuracy, where even a small mistake in punctuation or symbols (!, @, #, $, %) can change meaning. For example, expressions like (a+b)^2 or values such as 45% and 78.9% require careful typing. Maintaining consistency while switching between uppercase, lowercase, and special characters is essential. Those who type accurately under pressure gain a clear advantage in productivity and efficiency.";

export const DEFAULT_ADVANCEMENT_PERCENT = 30;
export const LEVEL_2_SECONDS_PER_QUESTION = 20;
export const EMAIL_DOMAIN = "@aristasystems.in";

export const LEVEL_2_QUESTIONS = [
  { hint: "Subah uthne ka biggest enemy 😴", pattern: "_ L A _ M", answer: "ALARM" },
  { hint: "Garmi me sabse bada savior 🧊", pattern: "_ O L D _ R I N _", answer: "COLDDRINK" },
  { hint: "Office me bina iske kaam ruk jata hai 💻", pattern: "_ N T E _ N E T", answer: "INTERNET" },
  { hint: "Kaam karne ka jagah 🏢", pattern: "_ F F I _ E", answer: "OFFICE" },
  { hint: "Time dekhne ke liye ⏰", pattern: "_ L O _ K", answer: "CLOCK" },
  { hint: "Khane ke baad sabko chahiye 🍰", pattern: "_ E S _ E R T", answer: "DESSERT" },
  { hint: "Paise rakhne ka jagah 👛", pattern: "_ A L L _ T", answer: "WALLET" },
  { hint: "Travel ka best partner ✈️", pattern: "_ U I _ C A S E", answer: "SUITCASE" },
  { hint: "Jab kaam zyada ho jata hai 😵", pattern: "_ T R E _ S", answer: "STRESS" },
  { hint: "TV ya phone me dekhte hai 🎬", pattern: "_ O V I _", answer: "MOVIE" },
  { hint: "Road pe chalane ke liye 🚗", pattern: "_ E H I _ L E", answer: "VEHICLE" },
  { hint: "Paise kamaane ka main reason 💼", pattern: "_ A R _ E R", answer: "CAREER" },
  { hint: "Ghar me sabka favorite jagah 🛏️", pattern: "_ E D R _ O M", answer: "BEDROOM" },
  { hint: "Mobile charge karne ke liye 🔌", pattern: "_ H A _ G E R", answer: "CHARGER" },
  { hint: "Future ke liye planning 📊", pattern: "_ T R A _ E G Y", answer: "STRATEGY" }
] as const;

export type GameState =
  | "WAITING"
  | "LEVEL1_RUNNING"
  | "LEVEL1_DONE"
  | "LEVEL2_RUNNING"
  | "ENDED";

export type PlayerStatus = "Waiting" | "Ready" | "Playing" | "Finished";

export type Player = {
  id: string;
  name: string;
  email: string;
  status: PlayerStatus;
  joinedAt: number;
  updatedAt: number;
  progress: number;
  wpm: number;
  accuracy: number;
  score: number;
  level1Score: number;
  qualified: boolean;
  level2Eligible: boolean;
  level2Progress: number;
  level2Score: number;
  level2Correct: number;
  tabSwitchCount: number;
  suspiciousActivity: boolean;
};

export type GameSnapshot = {
  gameState: GameState;
  level1StartedAt: number | null;
  level2StartedAt: number | null;
  countdownEndsAt: number | null;
  roundEndsAt: number | null;
  advancementPercent: number;
  selectedCount: number | null;
  serverNow: number;
  players: Player[];
};

export type TypingMetrics = {
  correctChars: number;
  totalTypedChars: number;
  wpm: number;
  accuracy: number;
  score: number;
  progress: number;
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getCorrectChars(target: string, typed: string) {
  let correct = 0;
  const limit = Math.min(target.length, typed.length);

  for (let index = 0; index < limit; index += 1) {
    if (typed[index] === target[index]) {
      correct += 1;
    }
  }

  return correct;
}

export function calculateTypingMetrics(
  target: string,
  typed: string,
  elapsedSeconds: number,
): TypingMetrics {
  const safeElapsed = Math.max(elapsedSeconds, 1);
  const correctChars = getCorrectChars(target, typed);
  const totalTypedChars = typed.length;
  const wpm = (correctChars / 5 / (safeElapsed / 60));
  const accuracy = totalTypedChars === 0 ? 100 : (correctChars / totalTypedChars) * 100;
  const score = wpm * 0.6 + accuracy * 0.4;
  const progress = (correctChars / target.length) * 100;

  return {
    correctChars,
    totalTypedChars,
    wpm: Number(wpm.toFixed(1)),
    accuracy: Number(clamp(accuracy, 0, 100).toFixed(1)),
    score: Number(score.toFixed(1)),
    progress: Number(clamp(progress, 0, 100).toFixed(1)),
  };
}

export function getPlayerStatusCounts(players: Player[]) {
  return {
    total: players.length,
    ready: players.filter((player) => player.status === "Ready").length,
    playing: players.filter((player) => player.status === "Playing").length,
    finished: players.filter((player) => player.status === "Finished").length,
  };
}

export function sortLeaderboard(players: Player[]) {
  return [...players].sort((a, b) => {
    const aScore = a.level1Score || a.score;
    const bScore = b.level1Score || b.score;
    if (bScore !== aScore) return bScore - aScore;
    if (b.wpm !== a.wpm) return b.wpm - a.wpm;
    return b.accuracy - a.accuracy;
  });
}

export function getTopLevel1Players(players: Player[], topPercent = DEFAULT_ADVANCEMENT_PERCENT) {
  const ranked = sortLeaderboard(players).filter((player) => (player.level1Score || player.score) > 0);
  const topCount = Math.max(1, Math.ceil(ranked.length * (topPercent / 100)));
  return ranked.slice(0, topCount);
}

export function getTopLevel1PlayersByCount(players: Player[], count: number) {
  const ranked = sortLeaderboard(players).filter((player) => (player.level1Score || player.score) > 0);
  return ranked.slice(0, Math.max(0, Math.min(count, ranked.length)));
}

export function isLevel2AnswerCorrect(answer: string, input: string) {
  return answer.trim().toUpperCase() === input.trim().toUpperCase();
}

export function getLevel2QuestionScore(wasCorrect: boolean, timeTakenSeconds: number) {
  if (!wasCorrect) return 0;
  return Math.max(0, Math.ceil((LEVEL_2_SECONDS_PER_QUESTION - timeTakenSeconds) * 10));
}

export function sortLevel2Leaderboard(players: Player[]) {
  return [...players]
    .filter((player) => player.level2Eligible || player.level2Score > 0)
    .sort((a, b) => {
      if (b.level2Score !== a.level2Score) return b.level2Score - a.level2Score;
      if (b.level2Correct !== a.level2Correct) return b.level2Correct - a.level2Correct;
      return b.score - a.score;
    });
}

export function getTopLevel2Players(players: Player[], topPercent = DEFAULT_ADVANCEMENT_PERCENT) {
  const ranked = sortLevel2Leaderboard(players).filter((player) => player.level2Score > 0);
  const topCount = Math.max(1, Math.ceil(ranked.length * (topPercent / 100)));
  return ranked.slice(0, topCount);
}

export function getTopLevel2PlayersByCount(players: Player[], count: number) {
  const ranked = sortLevel2Leaderboard(players).filter((player) => player.level2Score > 0);
  return ranked.slice(0, Math.max(0, Math.min(count, ranked.length)));
}

export function normalizeEmailInput(input: string) {
  const username = input.trim().toLowerCase().replace(EMAIL_DOMAIN, "");
  return `${username}${EMAIL_DOMAIN}`;
}

export function isValidAristaUsername(input: string) {
  const username = input.trim().toLowerCase().replace(EMAIL_DOMAIN, "");
  return /^[a-z0-9._-]+$/.test(username) && username.length >= 2;
}
