import { redirect } from "next/navigation";

// older link: the dashboard now lives at /wholesale
export default function WholesaleOrderRedirect() {
  redirect("/wholesale");
}
