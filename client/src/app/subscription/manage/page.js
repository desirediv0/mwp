import { Suspense } from "react";
import ManageClient from "./ManageClient";

export const metadata = {
  title: "Manage your subscription",
  robots: { index: false, follow: false },
};

export default function ManagePage() {
  return (
    <Suspense fallback={null}>
      <ManageClient />
    </Suspense>
  );
}
