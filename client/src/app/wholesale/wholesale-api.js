import { API_URL } from "@/lib/utils";

// Wholesale portal calls: own cookie (wholesaleToken), no customer-account token refresh, no caching.
export async function wsFetch(path, { method = "GET", body, form } = {}) {
  const res = await fetch(`${API_URL}/wholesale${path}`, {
    method,
    credentials: "include",
    cache: "no-store",
    headers: form ? undefined : body ? { "Content-Type": "application/json" } : undefined,
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  if (!res.ok) {
    const err = new Error(json?.message || "Something went wrong. Please try again.");
    err.status = res.status;
    throw err;
  }
  return json?.data ?? {};
}

export const money = (n) => Number(n || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
