export const GAME_TITLE = "Fun Games";
export const GAME_SUBTITLE = "By Technology & Development Team";
export const ROUND_SECONDS = 120;
export const COUNTDOWN_SECONDS = 15;

export const CHALLENGE_PARAGRAPH =
  "On 01/05/2026 at exactly 3:00 p.m., the entire office went silent as the long-awaited Appraisal_Sheet_vFinal(3).xlsx finally arrived. Everyone refreshed Outlook every 10-15 seconds, pretending to work at 99.99% efficiency. Chandu opened the sheet with trembling hands, calculating: \"If rating = A+, hike >= 30%?\" Suddenly, someone whispered, \"Check row #27!!\" while another typed Ctrl+C Ctrl+V like a pro. Within 0.5 seconds, reactions exploded - smiles, shock, and one quiet \":')\". Meanwhile, the server lagged, coffee spilled, and reality loaded slower than expectations.";

export const DEFAULT_ADVANCEMENT_PERCENT = 30;
export const LEVEL_2_SECONDS_PER_QUESTION = 20;
export const EMAIL_DOMAIN = "@aristasystems.in";

export const LEVEL_2_QUESTIONS = [
  {
    hint: "Monday se hi sab isi ka wait karne lagte hain 🥳",
    pattern: "W _ _ _ E _ D",
    answer: "WEEKEND"
  },
  {
    hint: "Sabke desktop par hota hai... par time par kuch milta nahi hai 📂",
    pattern: "F _ _ D _ R",
    answer: "FOLDER"
  },
  {
    hint: "Month end mein sabse pehle isi ka message wait karte hain 💸",
    pattern: "S _ _ A _ Y",
    answer: "SALARY"
  },
  {
    hint: "Kaam start karne se pehle sab yahi open karte hai 💻",
    pattern: "_ R O W _ E R",
    answer: "BROWSER"
  },
  {
    hint: "Kaam ke beech me sabka favourite escape 😄",
    pattern: "_ E E _",
    answer: "REEL"
  },
  {
    hint: "Sab ke paas hota hai… par share karne ka mann nahi karta 😏",
    pattern: "_ A S S _ O R D",
    answer: "PASSWORD"
  },
  {
    hint: "Office me sabko chahiye… par milta kam hai 😴",
    pattern: "_ E S _",
    answer: "REST"
  },
  {
    hint: "2-minute noodles iske bina adhure hain! 🍜",
    pattern: "_ O R K",
    answer: "FORK"
  },
  {
    hint: "Naam sunke thoda risky lagta hai… par matlab sirf unpredictable hota hai 😏",
    pattern: "_ _ N D O M",
    answer: "RANDOM"
  },
  {
    hint: "Jab system slow ho jata hai… sab isi ko blame karte hai Arista mai 😄",
    pattern: "_ A T _ N",
    answer: "JATIN"
  },
  {
    hint: "Jab kaam zyada ho jaye toh ye hi chahiye hota hai 😴",
    pattern: "_ L E E _",
    answer: "SLEEP"
  },
  {
    hint: "Kaam start karne se pehle sab yahi karte hai 😏",
    pattern: "_ L A _",
    answer: "PLAN"
  },
  {
    hint: "Jab system hang ho jaye toh sabse pehla step 🔄",
    pattern: "_ E S T A _ T",
    answer: "RESTART"
  },
  {
    hint: "Office me bina iske kaam ruk jata hai 💻",
    pattern: "_ O G I _",
    answer: "LOGIN"
  },
  {
    hint: "Late hone ka sabse common excuse 😏",
    pattern: "_ R A F _ I C",
    answer: "TRAFFIC"
  }
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
  level3Selected: boolean;
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
