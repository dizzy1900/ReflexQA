"use client";

import dynamic from "next/dynamic";

/* The fixtures read window.React at import time, so they can only load in the browser. */
const FixtureHost = dynamic(() => import("./FixtureHost").then((m) => m.FixtureHost), { ssr: false });

export function ReactQaHarness() {
  return <FixtureHost />;
}
