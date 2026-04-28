import {
  COUNTDOWN_SECONDS,
  DEFAULT_ADVANCEMENT_PERCENT,
  GameSnapshot,
  GameState,
  getTopLevel1Players,
  Player,
  PlayerStatus,
  ROUND_SECONDS,
} from "@/utils/game";

type InternalGame = {
  gameState: GameState;
  countdownEndsAt: number | null;
  roundEndsAt: number | null;
  advancementPercent: number;
  selectedCount: number | null;
  players: Map<string, Player>;
};

const globalForGame = globalThis as typeof globalThis & {
  __funFridayGame?: InternalGame;
};

function createGame(): InternalGame {
  return {
    gameState: "WAITING",
    countdownEndsAt: null,
    roundEndsAt: null,
    advancementPercent: DEFAULT_ADVANCEMENT_PERCENT,
    selectedCount: null,
    players: new Map(),
  };
}

const game = globalForGame.__funFridayGame ?? createGame();
globalForGame.__funFridayGame = game;

function effectiveState(now = Date.now()) {
  if (game.gameState === "LEVEL1_RUNNING" && game.countdownEndsAt && now >= game.countdownEndsAt) {
    game.roundEndsAt = game.roundEndsAt ?? now + ROUND_SECONDS * 1000;
    for (const player of game.players.values()) {
      if (player.status === "Ready") {
        player.status = "Playing";
        player.updatedAt = now;
      }
    }
  }

  if (game.gameState === "LEVEL1_RUNNING" && game.roundEndsAt && now >= game.roundEndsAt) {
    game.gameState = "LEVEL1_DONE";
    for (const player of game.players.values()) {
      if (player.status === "Playing") {
        player.status = "Finished";
        player.updatedAt = now;
      }
    }
  }

  return game.gameState;
}

export function getSnapshot(): GameSnapshot {
  const serverNow = Date.now();
  const gameState = effectiveState(serverNow);

  return {
    gameState,
    level1StartedAt: game.countdownEndsAt,
    level2StartedAt: null,
    countdownEndsAt: game.countdownEndsAt,
    roundEndsAt: game.roundEndsAt,
    advancementPercent: game.advancementPercent,
    selectedCount: game.selectedCount,
    serverNow,
    players: [...game.players.values()].sort((a, b) => a.joinedAt - b.joinedAt),
  };
}

export function upsertPlayer(input: {
  id?: string;
  name: string;
  status?: PlayerStatus;
  progress?: number;
  wpm?: number;
  accuracy?: number;
  score?: number;
}) {
  const now = Date.now();
  const id = input.id || crypto.randomUUID();
  const current = game.players.get(id);

  const player: Player = {
    id,
    name: input.name.trim(),
    email: input.name.trim().toLowerCase(),
    status: input.status ?? current?.status ?? "Waiting",
    joinedAt: current?.joinedAt ?? now,
    updatedAt: now,
    progress: input.progress ?? current?.progress ?? 0,
    wpm: input.wpm ?? current?.wpm ?? 0,
    accuracy: input.accuracy ?? current?.accuracy ?? 100,
    score: input.score ?? current?.score ?? 0,
    level1Score: input.score ?? current?.level1Score ?? current?.score ?? 0,
    qualified: current?.qualified ?? false,
    level2Eligible: current?.level2Eligible ?? false,
    level2Progress: current?.level2Progress ?? 0,
    level2Score: current?.level2Score ?? 0,
    level2Correct: current?.level2Correct ?? 0,
    tabSwitchCount: current?.tabSwitchCount ?? 0,
    suspiciousActivity: current?.suspiciousActivity ?? false,
  };

  game.players.set(id, player);
  return player;
}

export function updatePlayer(input: {
  id: string;
  status?: PlayerStatus;
  progress?: number;
  wpm?: number;
  accuracy?: number;
  score?: number;
  level1Score?: number;
  level2Progress?: number;
  level2Score?: number;
  level2Correct?: number;
}) {
  const player = game.players.get(input.id);
  if (!player) return null;

  const updated: Player = {
    ...player,
    status: input.status ?? player.status,
    progress: input.progress ?? player.progress,
    wpm: input.wpm ?? player.wpm,
    accuracy: input.accuracy ?? player.accuracy,
    score: input.score ?? player.score,
    level1Score: input.level1Score ?? input.score ?? player.level1Score,
    level2Progress: input.level2Progress ?? player.level2Progress,
    level2Score: input.level2Score ?? player.level2Score,
    level2Correct: input.level2Correct ?? player.level2Correct,
    updatedAt: Date.now(),
  };

  game.players.set(input.id, updated);
  return updated;
}

export function adminAction(
  action: "start" | "end" | "reset" | "startLevel2" | "endLevel2",
  options?: { advancementPercent?: number },
) {
  const now = Date.now();

  if (action === "start") {
    game.gameState = "LEVEL1_RUNNING";
    game.countdownEndsAt = now + COUNTDOWN_SECONDS * 1000;
    game.roundEndsAt = game.countdownEndsAt + ROUND_SECONDS * 1000;
    for (const player of game.players.values()) {
      if (player.status !== "Finished") {
        player.status = "Ready";
        player.updatedAt = now;
      }
    }
  }

  if (action === "end") {
    game.gameState = "LEVEL1_DONE";
    game.roundEndsAt = now;
    for (const player of game.players.values()) {
      if (player.status === "Playing" || player.status === "Ready") {
        player.status = "Finished";
        player.updatedAt = now;
      }
    }
  }

  if (action === "startLevel2") {
    game.gameState = "LEVEL2_RUNNING";
    game.countdownEndsAt = null;
    game.roundEndsAt = null;
    game.advancementPercent = normalizeAdvancementPercent(options?.advancementPercent);
    const eligibleIds = new Set(
      getTopLevel1Players([...game.players.values()], game.advancementPercent).map((player) => player.id),
    );

    for (const player of game.players.values()) {
      player.level2Eligible = eligibleIds.has(player.id);
      player.qualified = eligibleIds.has(player.id);
      player.level2Progress = 0;
      player.level2Score = 0;
      player.level2Correct = 0;
      player.status = player.level2Eligible ? "Playing" : "Finished";
      player.updatedAt = now;
    }
  }

  if (action === "endLevel2") {
    game.gameState = "ENDED";
    for (const player of game.players.values()) {
      if (player.level2Eligible && player.status === "Playing") {
        player.status = "Finished";
        player.updatedAt = now;
      }
    }
  }

  if (action === "reset") {
    game.gameState = "WAITING";
    game.countdownEndsAt = null;
    game.roundEndsAt = null;
    game.advancementPercent = DEFAULT_ADVANCEMENT_PERCENT;
    game.selectedCount = null;
    game.players.clear();
  }

  return getSnapshot();
}

function normalizeAdvancementPercent(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_ADVANCEMENT_PERCENT;
  if (value <= 30) return 30;
  if (value <= 50) return 50;
  return 100;
}
