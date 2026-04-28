"use client";

import { useCallback, useEffect, useState } from "react";
import { Player, PlayerStatus } from "@/utils/game";
import {
  clearLocalPlayerId,
  getLocalPlayerId,
  joinPlayer,
  setPlayerReady,
  updatePlayer,
} from "@/store/firestore-game";

export function useLocalPlayer() {
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    const raw = getLocalPlayerId();
    if (raw) {
      setPlayer((current) => current ?? ({ id: raw } as Player));
    }
  }, []);

  const join = useCallback(async (name: string) => {
    const nextPlayer = await joinPlayer(name);
    setPlayer(nextPlayer);
    return nextPlayer;
  }, []);

  const syncPlayer = useCallback(
    async (payload: {
      status?: PlayerStatus;
      progress?: number;
      wpm?: number;
      accuracy?: number;
      score?: number;
      level1Score?: number;
      level2Progress?: number;
      level2Score?: number;
      level2Correct?: number;
    }) => {
      if (!player?.id) return null;
      await updatePlayer(player.id, payload);
      return null;
    },
    [player?.id],
  );

  const ready = useCallback(async () => {
    if (!player?.id) return;
    await setPlayerReady(player.id);
  }, [player?.id]);

  const clearPlayer = useCallback(() => {
    clearLocalPlayerId();
    setPlayer(null);
  }, []);

  return { player, setPlayer, join, syncPlayer, ready, clearPlayer };
}
