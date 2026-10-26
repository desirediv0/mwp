import { redirect } from "next/navigation";

// The old profile page was replaced by the settings page under /account.
export default function ProfilePage({ searchParams }) {
  const tab = searchParams?.tab;
  const map = { orders: "/account/orders", addresses: "/account/addresses", returns: "/account/returns", wishlist: "/wishlist" };
  redirect(map[tab] || "/account");
}
