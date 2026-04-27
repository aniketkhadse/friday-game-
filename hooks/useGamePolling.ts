"use client";

import { useEffect, useRef, useState } from "react";
import { GameSnapshot } from "@/utils/game";

export function useGamePolling(intervalMs = 900) {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    let active = true;

    async function load() {
      if (inFlight.current) return;
      inFlight.current = true;

      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to sync game state");
        const data = (await response.json()) as GameSnapshot;
        if (active) {
          setSnapshot(data);
          setError(null);
          setIsLoading(false);
        }
      } catch (caught) {
        if (active) {
          setError(caught instanceof Error ? caught.message : "Sync failed");
          setIsLoading(false);
        }
      } finally {
        inFlight.current = false;
      }
    }

    void load();
    const timer = window.setInterval(load, intervalMs);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [intervalMs]);

  return { snapshot, isLoading, error, setSnapshot };
}
