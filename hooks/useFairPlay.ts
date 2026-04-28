"use client";

import { useEffect, useState } from "react";

export function useFairPlay({
  enabled,
  onTabSwitch,
}: {
  enabled: boolean;
  onTabSwitch: () => void;
}) {
  const [tabWarning, setTabWarning] = useState(false);
  const [devToolsWarning, setDevToolsWarning] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setTabWarning(false);
      setDevToolsWarning(false);
      return;
    }

    const handleContextMenu = (event: MouseEvent) => event.preventDefault();
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && ["a", "c", "x"].includes(key)) {
        event.preventDefault();
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabWarning(true);
        onTabSwitch();
      }
    };
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "Game in progress. Are you sure?";
      return event.returnValue;
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    const devToolsTimer = window.setInterval(() => {
      const mayBeOpen = window.outerWidth - window.innerWidth > 160;
      if (mayBeOpen) {
        console.log("DevTools may be open");
      }
      setDevToolsWarning(mayBeOpen);
    }, 1500);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.clearInterval(devToolsTimer);
    };
  }, [enabled, onTabSwitch]);

  return { tabWarning, devToolsWarning };
}
