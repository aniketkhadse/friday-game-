"use client";

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  COUNTDOWN_SECONDS,
  DEFAULT_ADVANCEMENT_PERCENT,
  GameSnapshot,
  GameState,
  getTopLevel1Players,
  getTopLevel1PlayersByCount,
  Player,
  PlayerStatus,
  ROUND_SECONDS,
} from "@/utils/game";

const GAME_DOC = "current";
const PLAYER_ID_KEY = "fun-friday-player-id";

type GameDoc = {
  gameState?: GameState;
  countdownEndsAt?: number | null;
  roundEndsAt?: number | null;
  advancementPercent?: number;
  selectedCount?: number | null;
  updatedAt?: number;
};

export type AdvancementMode = "percent" | "count";

const defaultGameDoc: Required<Omit<GameDoc, "updatedAt">> = {
  gameState: "WAITING",
  countdownEndsAt: null,
  roundEndsAt: null,
  advancementPercent: DEFAULT_ADVANCEMENT_PERCENT,
  selectedCount: null,
};

export function getLocalPlayerId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PLAYER_ID_KEY);
}

export function saveLocalPlayerId(id: string) {
  window.localStorage.setItem(PLAYER_ID_KEY, id);
}

export function clearLocalPlayerId() {
  window.localStorage.removeItem(PLAYER_ID_KEY);
}

export function subscribeGameSnapshot(callback: (snapshot: GameSnapshot) => void, onError: (message: string) => void) {
  if (!db || !isFirebaseConfigured) {
    onError("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* values.");
    callback({ ...defaultGameDoc, serverNow: Date.now(), players: [] });
    return () => undefined;
  }

  let gameDoc = defaultGameDoc;
  let players: Player[] = [];
  let gameLoaded = false;
  let playersLoaded = false;

  const emit = () => {
    if (!gameLoaded || !playersLoaded) return;

    callback({
      gameState: gameDoc.gameState,
      countdownEndsAt: gameDoc.countdownEndsAt,
      roundEndsAt: gameDoc.roundEndsAt,
      advancementPercent: gameDoc.advancementPercent,
      selectedCount: gameDoc.selectedCount,
      serverNow: Date.now(),
      players,
    });
  };

  const unsubscribeGame = onSnapshot(
    doc(db, "games", GAME_DOC),
    (snapshot) => {
      if (!snapshot.exists()) {
        gameLoaded = true;
        void ensureGameDocument();
        emit();
        return;
      }

      const data = snapshot.data() as GameDoc;
      gameDoc = {
        gameState: data.gameState ?? "WAITING",
        countdownEndsAt: data.countdownEndsAt ?? null,
        roundEndsAt: data.roundEndsAt ?? null,
        advancementPercent: data.advancementPercent ?? DEFAULT_ADVANCEMENT_PERCENT,
        selectedCount: data.selectedCount ?? null,
      };
      gameLoaded = true;
      emit();
    },
    (error) => onError(error.message),
  );

  const unsubscribePlayers = onSnapshot(
    query(collection(db, "players"), orderBy("joinedAt", "asc")),
    (snapshot) => {
      players = snapshot.docs.map((playerDoc) => normalizePlayer(playerDoc.id, playerDoc.data()));
      playersLoaded = true;
      emit();
    },
    (error) => onError(error.message),
  );

  return () => {
    unsubscribeGame();
    unsubscribePlayers();
  };
}

export async function joinPlayer(name: string) {
  assertDb();
  await ensureGameDocument();
  const id = crypto.randomUUID();
  const now = Date.now();
  const player: Player = {
    id,
    name: name.trim(),
    status: "Waiting",
    joinedAt: now,
    updatedAt: now,
    progress: 0,
    wpm: 0,
    accuracy: 100,
    score: 0,
    level1Score: 0,
    qualified: false,
    level2Eligible: false,
    level2Progress: 0,
    level2Score: 0,
    level2Correct: 0,
  };

  await setDoc(doc(db!, "players", id), player);
  saveLocalPlayerId(id);
  return player;
}

export async function updatePlayer(
  id: string,
  payload: Partial<Pick<Player, "status" | "progress" | "wpm" | "accuracy" | "score" | "level1Score" | "level2Progress" | "level2Score" | "level2Correct">>,
) {
  assertDb();
  const nextPayload = {
    ...payload,
    updatedAt: Date.now(),
  };

  if (payload.level1Score != null || payload.score != null) {
    nextPayload.level1Score = payload.level1Score ?? payload.score;
  }

  await setDoc(doc(db!, "players", id), removeUndefined(nextPayload), { merge: true });
}

export async function setPlayerReady(id: string) {
  await updatePlayer(id, { status: "Ready" });
}

export async function startLevel1() {
  assertDb();
  await ensureGameDocument();
  const now = Date.now();
  const countdownEndsAt = now + COUNTDOWN_SECONDS * 1000;
  const batch = writeBatch(db!);

  batch.set(
    doc(db!, "games", GAME_DOC),
    {
      gameState: "LEVEL1_RUNNING",
      countdownEndsAt,
      roundEndsAt: countdownEndsAt + ROUND_SECONDS * 1000,
      updatedAt: now,
    },
    { merge: true },
  );

  const players = await getDocs(collection(db!, "players"));
  players.forEach((playerDoc) => {
    batch.set(playerDoc.ref, { status: "Ready", updatedAt: now }, { merge: true });
  });

  await batch.commit();
}

export async function endLevel1() {
  assertDb();
  const now = Date.now();
  const batch = writeBatch(db!);
  batch.set(
    doc(db!, "games", GAME_DOC),
    { gameState: "LEVEL1_DONE", roundEndsAt: now, updatedAt: now },
    { merge: true },
  );

  const players = await getDocs(collection(db!, "players"));
  players.forEach((playerDoc) => {
    batch.set(playerDoc.ref, { status: "Finished", updatedAt: now }, { merge: true });
  });

  await batch.commit();
}

export async function selectLevel2Players(input: { mode: AdvancementMode; value: number }) {
  assertDb();
  const playersSnapshot = await getDocs(collection(db!, "players"));
  const players = playersSnapshot.docs.map((playerDoc) => normalizePlayer(playerDoc.id, playerDoc.data()));
  const selected =
    input.mode === "count"
      ? getTopLevel1PlayersByCount(players, input.value)
      : getTopLevel1Players(players, input.value);
  const selectedIds = new Set(selected.map((player) => player.id));
  const now = Date.now();
  const batch = writeBatch(db!);

  playersSnapshot.docs.forEach((playerDoc) => {
    const qualified = selectedIds.has(playerDoc.id);
    batch.set(
      playerDoc.ref,
      {
        qualified,
        level2Eligible: qualified,
        level2Progress: 0,
        level2Score: 0,
        level2Correct: 0,
        status: "Finished",
        updatedAt: now,
      },
      { merge: true },
    );
  });

  batch.set(
    doc(db!, "games", GAME_DOC),
    {
      advancementPercent: input.mode === "percent" ? normalizePercent(input.value) : DEFAULT_ADVANCEMENT_PERCENT,
      selectedCount: input.mode === "count" ? Math.max(0, Math.floor(input.value)) : null,
      updatedAt: now,
    },
    { merge: true },
  );

  await batch.commit();
}

export async function startLevel2() {
  assertDb();
  const now = Date.now();
  const batch = writeBatch(db!);
  batch.set(
    doc(db!, "games", GAME_DOC),
    { gameState: "LEVEL2_RUNNING", countdownEndsAt: null, roundEndsAt: null, updatedAt: now },
    { merge: true },
  );

  const players = await getDocs(collection(db!, "players"));
  players.forEach((playerDoc) => {
    const player = normalizePlayer(playerDoc.id, playerDoc.data());
    batch.set(
      playerDoc.ref,
      { status: player.qualified ? "Playing" : "Finished", updatedAt: now },
      { merge: true },
    );
  });

  await batch.commit();
}

export async function endLevel2() {
  assertDb();
  const now = Date.now();
  const batch = writeBatch(db!);
  batch.set(doc(db!, "games", GAME_DOC), { gameState: "ENDED", updatedAt: now }, { merge: true });

  const players = await getDocs(collection(db!, "players"));
  players.forEach((playerDoc) => {
    batch.set(playerDoc.ref, { status: "Finished", updatedAt: now }, { merge: true });
  });

  await batch.commit();
}

export async function resetGame() {
  assertDb();
  const players = await getDocs(collection(db!, "players"));
  const batch = writeBatch(db!);

  players.docs.forEach((playerDoc) => batch.delete(playerDoc.ref));
  batch.set(doc(db!, "games", GAME_DOC), { ...defaultGameDoc, updatedAt: Date.now() });
  await batch.commit();
}

async function ensureGameDocument() {
  if (!db) return;
  await runTransaction(db, async (transaction) => {
    const ref = doc(db!, "games", GAME_DOC);
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      transaction.set(ref, { ...defaultGameDoc, updatedAt: Date.now() });
    }
  });
}

function normalizePlayer(id: string, data: Record<string, unknown>): Player {
  const score = numberValue(data.score);
  const level1Score = numberValue(data.level1Score, score);

  return {
    id,
    name: stringValue(data.name, "Player"),
    status: statusValue(data.status),
    joinedAt: numberValue(data.joinedAt, Date.now()),
    updatedAt: numberValue(data.updatedAt, Date.now()),
    progress: numberValue(data.progress),
    wpm: numberValue(data.wpm),
    accuracy: numberValue(data.accuracy, 100),
    score,
    level1Score,
    qualified: booleanValue(data.qualified) || booleanValue(data.level2Eligible),
    level2Eligible: booleanValue(data.level2Eligible) || booleanValue(data.qualified),
    level2Progress: numberValue(data.level2Progress),
    level2Score: numberValue(data.level2Score),
    level2Correct: numberValue(data.level2Correct),
  };
}

function normalizePercent(value: number) {
  if (value <= 30) return 30;
  if (value <= 50) return 50;
  return 100;
}

function assertDb() {
  if (!db) {
    throw new Error("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* values.");
  }
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function booleanValue(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function statusValue(value: unknown): PlayerStatus {
  return value === "Ready" || value === "Playing" || value === "Finished" ? value : "Waiting";
}

function removeUndefined<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
