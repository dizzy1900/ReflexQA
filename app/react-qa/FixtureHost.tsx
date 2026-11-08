"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import "../../vendor/react-fixtures/style.css";

type Loader = () => Promise<{ default: ComponentType }>;

/** The vendored react/react fixture sets the agent can test. */
export const FIXTURE_LOADERS: Record<string, Loader> = {
  buttons: () => import("../../vendor/react-fixtures/fixtures/buttons/index.js"),
  selects: () => import("../../vendor/react-fixtures/fixtures/selects/index.js"),
  textareas: () => import("../../vendor/react-fixtures/fixtures/textareas/index.js"),
  "text-inputs": () => import("../../vendor/react-fixtures/fixtures/text-inputs/index.js"),
  "number-inputs": () => import("../../vendor/react-fixtures/fixtures/number-inputs/index.js"),
  "password-inputs": () => import("../../vendor/react-fixtures/fixtures/password-inputs/index.js"),
  "email-inputs": () => import("../../vendor/react-fixtures/fixtures/email-inputs/index.js"),
  "input-change-events": () => import("../../vendor/react-fixtures/fixtures/input-change-events/index.js"),
};

type FixtureWindow = Window & { React?: typeof React; ReactDOM?: typeof ReactDOM };

export function FixtureHost() {
  const params = useSearchParams();
  const fixture = params.get("fixture") ?? "selects";
  const caseParam = params.get("case");
  const [Fixture, setFixture] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const w = window as FixtureWindow;
    w.React = React;
    w.ReactDOM = ReactDOM;
    const load = FIXTURE_LOADERS[fixture];
    if (!load) {
      setError(`Unknown fixture "${fixture}"`);
      return;
    }
    load()
      .then((m) => setFixture(() => m.default))
      .catch((e: unknown) => setError(String(e)));
  }, [fixture]);

  // Isolate one test case so it fits the agent's 1280×800 viewport.
  useEffect(() => {
    if (!Fixture) return;
    const id = window.requestAnimationFrame(() => {
      const cases = Array.from(document.querySelectorAll<HTMLElement>(".test-case"));
      cases.forEach((el, i) => {
        el.dataset.caseIndex = String(i);
        if (caseParam !== null) el.style.display = String(i) === caseParam ? "" : "none";
      });
      document.body.dataset.fixtureReady = "true";
    });
    return () => window.cancelAnimationFrame(id);
  }, [Fixture, caseParam]);

  return (
    <main data-react-fixture={fixture} style={{ background: "#fff", color: "#222", minHeight: "100dvh" }}>
      {error ? <p role="alert">{error}</p> : Fixture ? <Fixture /> : null}
    </main>
  );
}
