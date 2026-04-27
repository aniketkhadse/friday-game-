export const GAME_TITLE = "Fun Friday Challenge 🎯";
export const GAME_SUBTITLE = "By Technology & Development Team";
export const ROUND_SECONDS = 30;
export const COUNTDOWN_SECONDS = 5;

export const CHALLENGE_PARAGRAPH =
  "Precision under pressure reveals disciplined engineering habits: resilient teams communicate clearly, measure trade-offs quickly, and transform complex problems into reliable products without losing focus on the people who use them every day.";

export const DEFAULT_ADVANCEMENT_PERCENT = 30;
export const LEVEL_2_SECONDS_PER_QUESTION = 10;

export const LEVEL_2_QUESTIONS = [
  {
    hint: "Morning ka hero, bina iske aankh nahi khulti ☕",
    pattern: "_ O F F _ E",
    answer: "COFFEE",
  },
  {
    hint: "Sabka favorite fast food, diet ka dushman 🍕",
    pattern: "_ I Z Z _",
    answer: "PIZZA",
  },
  {
    hint: "Office me sabka sabse bada tension… Monday morning 😭",
    pattern: "_ E E _ I _ G",
    answer: "MEETING",
  },
  {
    hint: "Iske bina salary ka kya fayda 💸",
    pattern: "_ H O _ P I _ G",
    answer: "SHOPPING",
  },
  {
    hint: "Ghar ka sabse powerful remote control 😅",
    pattern: "_ A M I _ Y",
    answer: "FAMILY",
  },
  {
    hint: "Boss paas ho toh ye automatically badh jata hai 😬",
    pattern: "_ R E _ S U _ E",
    answer: "PRESSURE",
  },
  {
    hint: "Weekend ka best part 😎",
    pattern: "_ N T E _ T A _ N M E N T",
    answer: "ENTERTAINMENT",
  },
  {
    hint: "Shaadi ho ya party 💃",
    pattern: "_ E L E _ R A _ I O N",
    answer: "CELEBRATION",
  },
  {
    hint: "Password bhoolne ke baad yaad aata hai 😵",
    pattern: "_ E M E _ B _ A N C E",
    answer: "REMEMBRANCE",
  },
  {
    hint: "Life ka asli struggle ⚖️",
    pattern: "_ E S P O N _ I B I _ I T Y",
    answer: "RESPONSIBILITY",
  },
] as const;

export type GameState =
  | "WAITING"
  | "INSTRUCTIONS"
  | "READY"
  | "COUNTDOWN"
  | "STARTED"
  | "ENDED"
  | "LEVEL2_STARTED"
  | "LEVEL2_ENDED";

export type PlayerStatus = "Waiting" | "Ready" | "Playing" | "Finished";

export type Player = {
  id: string;
  name: string;
  status: PlayerStatus;
  joinedAt: number;
  updatedAt: number;
  progress: number;
  wpm: number;
  accuracy: number;
  score: number;
  level2Eligible: boolean;
  level2Progress: number;
  level2Score: number;
  level2Correct: number;
};

export type GameSnapshot = {
  gameState: GameState;
  countdownEndsAt: number | null;
  roundEndsAt: number | null;
  advancementPercent: number;
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
  const score = wpm * 0.7 + accuracy * 0.3;
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
    if (b.score !== a.score) return b.score - a.score;
    if (b.wpm !== a.wpm) return b.wpm - a.wpm;
    return b.accuracy - a.accuracy;
  });
}

export function getTopLevel1Players(players: Player[], topPercent = DEFAULT_ADVANCEMENT_PERCENT) {
  const ranked = sortLeaderboard(players).filter((player) => player.score > 0);
  const topCount = Math.max(1, Math.ceil(ranked.length * (topPercent / 100)));
  return ranked.slice(0, topCount);
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
