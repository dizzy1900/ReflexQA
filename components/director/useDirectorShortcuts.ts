"use client";

import { useEffect, useRef, useState } from "react";

export type ShortcutKey = "golden" | "playPause" | "reset" | "pr";

export interface DirectorShortcutHandlers {
  golden: () => void;
  playPause: () => void;
  reset: () => void;
  pr: () => void;
}

const KEY_MAP: Record<string, ShortcutKey> = { g: "golden", r: "reset", p: "pr", " ": "playPause" };
const FLASH_MS = 260;

/**
 * True when the key press belongs to whatever has focus, not to the presenter.
 * `keyboardFocus` says the focused control was reached with Tab rather than a click.
 */
function belongsToFocusedControl(event: KeyboardEvent, keyboardFocus: boolean): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return true;
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target.closest("input, textarea, select, [role=textbox], [role=listbox], [role=menu]")) return true;
  // A button reached by Tab keeps Space. After a click it does not, so Space still pauses the demo.
  return event.key === " " && keyboardFocus && target.matches("button, a[href], summary, [role=button]");
}

/**
 * Global presenter keys: `G` golden demo, `Space` play/pause, `R` reset, `P` self-heal pull request.
 * Returns the key that fired in the last moment, so the UI can flash its hint.
 */
export function useDirectorShortcuts(handlers: DirectorShortcutHandlers): ShortcutKey | null {
  const [pressed, setPressed] = useState<ShortcutKey | null>(null);
  const latest = useRef(handlers);
  latest.current = handlers;

  useEffect(() => {
    let flashTimer: ReturnType<typeof setTimeout> | undefined;
    // Decided on keydown: pressing a key makes a focused button match :focus-visible, so keyup cannot re-derive it.
    let swallowSpaceUp = false;
    // Browsers flip :focus-visible on at the first key press, so track how focus arrived ourselves.
    let keyboardModality = false;
    let keyboardFocus = false;

    const onPointerDown = () => {
      keyboardModality = false;
    };
    const onFocusIn = () => {
      keyboardFocus = keyboardModality;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") keyboardModality = true;
      const shortcut = KEY_MAP[event.key.toLowerCase()];
      if (!shortcut || belongsToFocusedControl(event, keyboardFocus)) return;
      event.preventDefault();
      if (event.key === " ") swallowSpaceUp = true;
      if (event.repeat) return;

      latest.current[shortcut]();
      setPressed(shortcut);
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => setPressed(null), FLASH_MS);
    };

    // Space on a focused button clicks it on keyup. Cancelling keyup keeps the press from firing twice.
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key !== " " || !swallowSpaceUp) return;
      swallowSpaceUp = false;
      event.preventDefault();
    };

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("focusin", onFocusIn, true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("focusin", onFocusIn, true);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      clearTimeout(flashTimer);
    };
  }, []);

  return pressed;
}
