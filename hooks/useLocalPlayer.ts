"use client";

import { useCallback, useEffect, useState } from "react";
import { Player, PlayerStatus } from "@/utils/game";

const PLAYER_ID_KEY = "fun-friday-player-id";

export function useLocalPlayer() {
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(PLAYER_ID_KEY);
    if (raw) {
      setPlayer((current) => current ?? ({ id: raw } as Player));
    }
  }, []);

  const join = useCallback(async (name: string) => {
    const response = await fetch("/api/player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, status: "Waiting" }),
    });

    if (!response.ok) {
      throw new Error("Unable to join game");
    }

    const data = (await response.json()) as { player: Player };
    window.localStorage.setItem(PLAYER_ID_KEY, data.player.id);
    setPlayer(data.player);
    return data.player;
  }, []);

  const syncPlayer = useCallback(
    async (payload: {
      status?: PlayerStatus;
      progress?: number;
      wpm?: number;
      accuracy?: number;
      score?: number;
      level2Progress?: number;
      level2Score?: number;
      level2Correct?: number;
    }) => {
      if (!player?.id) return null;

      const response = await fetch("/api/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: player.id, name: player.name, ...payload }),
      });

      if (!response.ok) return null;
      const data = (await response.json()) as { player: Player };
      setPlayer(data.player);
      return data.player;
    },
    [player?.id, player?.name],
  );

  return { player, setPlayer, join, syncPlayer };
}
