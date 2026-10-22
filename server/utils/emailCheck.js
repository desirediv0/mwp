import { promises as dns } from "node:dns";

// Rejects typo'd, throwaway and non-existent email domains at checkout.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const DISPOSABLE = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "10minutemail.com", "10minutemail.net", "tempmail.com", "temp-mail.org",
  "temp-mail.io", "trashmail.com", "yopmail.com", "yopmail.net", "getnada.com", "sharklasers.com", "throwawaymail.com", "dispostable.com",
  "fakeinbox.com", "maildrop.cc", "mailnesia.com", "mintemail.com", "mohmal.com", "moakt.com", "emailondeck.com", "tempinbox.com",
  "spamgourmet.com", "mytemp.email", "tempail.com", "burnermail.io", "discard.email", "anonaddy.me", "mailcatch.com", "inboxkitten.com",
  "example.com", "example.org", "example.net", "test.com", "email.com.test",
]);

const TYPOS = {
  "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gamil.com": "gmail.com", "gmail.con": "gmail.com", "gmail.co": "gmail.com",
  "hotmial.com": "hotmail.com", "yaho.com": "yahoo.com", "yahoo.con": "yahoo.com", "outlok.com": "outlook.com", "icloud.con": "icloud.com",
};

const cache = new Map(); // domain -> { ok, at }

async function domainReceivesMail(domain) {
  const hit = cache.get(domain);
  if (hit && Date.now() - hit.at < 6 * 3600 * 1000) return hit.ok;
  let ok = false;
  try {
    const mx = await Promise.race([dns.resolveMx(domain), new Promise((_, r) => setTimeout(() => r(new Error("timeout")), 4000))]);
    ok = Array.isArray(mx) && mx.some((m) => m.exchange && m.exchange !== ".");
  } catch (e) {
    if (e.message === "timeout" || ["ECONNREFUSED", "ETIMEOUT", "ESERVFAIL"].includes(e.code)) return true; // DNS trouble is not the customer's fault
    ok = false;
    try {
      const a = await dns.resolve4(domain); // no MX: mail falls back to the A record
      ok = a.length > 0;
    } catch {}
  }
  cache.set(domain, { ok, at: Date.now() });
  return ok;
}

// Returns an error message, or null when the address looks real.
export async function checkEmail(raw) {
  const email = String(raw || "").toLowerCase().trim();
  if (!EMAIL_RE.test(email) || email.length > 254) return "Enter a valid email address";
  const domain = email.split("@")[1];
  if (TYPOS[domain]) return `Did you mean ${email.split("@")[0]}@${TYPOS[domain]}?`;
  if (DISPOSABLE.has(domain)) return "Please use a real email address, not a temporary one. Your order confirmation is sent there.";
  if (!(await domainReceivesMail(domain))) return "That email domain does not look real. Please check the spelling.";
  return null;
}
