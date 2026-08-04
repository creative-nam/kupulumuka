"use client";

import * as React from "react";

export function ServiceWorkerRegister() {
  React.useEffect(() => {
    const shouldRegister =
      process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_ENABLE_SW === "true";
    if (!shouldRegister) return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  return null;
}
