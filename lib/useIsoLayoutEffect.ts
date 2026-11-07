import { useEffect, useLayoutEffect } from "react";

/** `useLayoutEffect` on the client, `useEffect` during SSR to avoid the server warning. */
export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
