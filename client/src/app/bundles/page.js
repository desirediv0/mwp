import { redirect } from "next/navigation";

// Bundles / Stacks are hidden from the storefront for now.
// Any direct visit is bounced to the main shop.
export default function BundlesPage() {
  redirect("/products");
}
