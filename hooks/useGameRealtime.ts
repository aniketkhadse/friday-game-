"use client";

import { useEffect, useState } from "react";
import { subscribeGameSnapshot } from "@/store/firestore-game";
import { GameSnapshot } from "@/utils/game";

export function useGameRealtime() {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeGameSnapshot(
      (nextSnapshot) => {
        setSnapshot(nextSnapshot);
        setIsLoading(false);
        setError(null);
      },
      (message) => {
        setError(message);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { snapshot, isLoading, error };
}
