import { Suspense } from "react";
import { ReactQaHarness } from "./ReactQaHarness";

export const metadata = { title: "react/react · DOM fixtures" };

/**
 * React's own manual DOM QA suite (react/react fixtures/dom), served one test case at a time
 * for the live agent: /react-qa?fixture=selects&case=0. Without `case`, every test case renders (catalog discovery).
 */
export default function ReactQaPage() {
  return (
    <Suspense>
      <ReactQaHarness />
    </Suspense>
  );
}
