export const GAME_TITLE = "Fun Games";
export const GAME_SUBTITLE = "By Technology & Development Team";
export const ROUND_SECONDS = 120;
export const COUNTDOWN_SECONDS = 15;

export const CHALLENGE_PARAGRAPH =
  "In every office, a strange rule exists: work increases exactly at 5:00 PM (not 4:59, not 5:01 😄). Suddenly, emails start popping like notifications@100%, meetings get scheduled (#urgent), and someone confidently says, “It will take just 2 minutes!” which actually means 25–30 mins. You open 3 tabs, switch between tasks, and still wonder how nothing is complete. Meanwhile, your brain is at 10% battery, but your manager expects 200% output. The keyboard becomes your battlefield—sometimes typing fast, sometimes producing errors like “asdf@123!!”. Coffee level = high, productivity = questionable. Deadlines chase you like a boss-level enemy, and your mind keeps calculating: “If I leave at 6:30, I can still reach by 7:45… maybe 😅.” In the end, surviving the day without pressing Ctrl+Alt+Delete on life itself feels like a real achievement!";

export const DEFAULT_ADVANCEMENT_PERCENT = 30;
export const LEVEL_2_SECONDS_PER_QUESTION = 20;
export const EMAIL_DOMAIN = "@aristasystems.in";

export const LEVEL_2_QUESTIONS = [
  {
    hint: "Jab system slow ho jata hai… sab isi ko blame karte hai Arista mai 😄",
    pattern: "_ A T _ N",
    answer: "JATIN"
  },
  {
    hint: "Naam sunke thoda risky lagta hai… par matlab sirf unpredictable hota hai 😏",
    pattern: "_ _ N D O M",
    answer: "RANDOM"
  },
  {
    hint: "Sunne me bold lagta hai… par actually traditional music se related hai 😄",
    pattern: "F _ _ K",
    answer: "FOLK"
  },
  {
    hint: "Meeting me sab bolte hai… par sunta kaun hai 😄",
    pattern: "_ I S _ E N",
    answer: "LISTEN"
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
    hint: "Har kisi ke paas hota hai… par sabka alag hota hai 😅",
    pattern: "_ A S _ W O R D",
    answer: "PASSWORD"
  },
  {
    hint: "Jab kaam boring ho jaye… tab ye hi karte ho 😄",
    pattern: "_ C R O _ L",
    answer: "SCROLL"
  },
  {
    hint: "Meeting ke baad sab bolte hai ‘ye toh hona hi tha’ 😏",
    pattern: "_ E S U _ T",
    answer: "RESULT"
  },
  {
    hint: "Office me sabko chahiye… par milta kam hai 😴",
    pattern: "_ E S _",
    answer: "REST"
  },
  {
    hint: "Kaam ke beech me sabka favourite distraction 😂",
    pattern: "_ H A T",
    answer: "CHAT"
  },
  {
    hint: "Jab kaam zyada ho jaye toh ye hi bolte hai 😅",
    pattern: "_ E L P",
    answer: "HELP"
  },
  {
    hint: "Office me sabse zyada use hota hai… par naam alag alag hota hai 📂",
    pattern: "_ I L E",
    answer: "FILE"
  },
  {
    hint: "Kaam complete hone ke baad ye feeling aati hai 😌",
    pattern: "_ E L I E _",
    answer: "RELIEF"
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
