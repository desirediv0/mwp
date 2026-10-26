import { Suspense } from "react";
import SubscribeClient from "./SubscribeClient";

export const metadata = {
  title: "Subscribe monthly",
  robots: { index: false, follow: false },
};

export default function SubscribePage() {
  return (
    <Suspense fallback={null}>
      <SubscribeClient />
    </Suspense>
  );
}
