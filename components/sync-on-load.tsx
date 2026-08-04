"use client";

import * as React from "react";
import { syncData } from "@/lib/offline/sync";

export function SyncOnLoad() {
  React.useEffect(() => {
    if (navigator.onLine) {
      syncData().catch((error) =>
        console.error("Initial sync failed:", error),
      );
    }

    const handleOnline = () => {
      syncData().catch((error) =>
        console.error("Online sync failed:", error),
      );
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return null;
}
