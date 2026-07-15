"use client";

import * as React from "react";
import { syncData } from "@/lib/offline/sync";

export function SyncOnLoad() {
  React.useEffect(() => {
    if (navigator.onLine) {
      syncData().catch(() => {});
    }

    const handleOnline = () => {
      syncData().catch(() => {});
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return null;
}
