import { Suspense } from "react";
import { TargetHarness } from "./TargetHarness";

export const metadata = { title: "Hyperscale · Checkout" };

export default function TargetPage() {
  return (
    <Suspense>
      <TargetHarness />
    </Suspense>
  );
}
