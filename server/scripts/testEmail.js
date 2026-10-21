// Email diagnostics. Run on the server (where the real .env is):
//   node -r dotenv/config scripts/testEmail.js you@example.com
// It prints the exact reason when mail does not work (wrong login, blocked IP, unverified sender...).
import nodemailer from "nodemailer";

const to = process.argv[2];
const port = Number(process.env.SMTP_PORT || 587);
const secure = process.env.SMTP_SECURE ? String(process.env.SMTP_SECURE).toLowerCase() === "true" : port === 465;
const from = process.env.FROM_EMAIL || process.env.STORE_EMAIL || process.env.SMTP_USER;

console.log("Mail settings in use");
console.log("  host     :", process.env.SMTP_SERVICE || process.env.SMTP_HOST || "(missing)");
console.log("  port     :", port, secure ? "(SSL)" : "(STARTTLS)");
console.log("  user     :", process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 4)}...` : "(missing)");
console.log("  password :", process.env.SMTP_PASSWORD ? "set" : "(missing)");
console.log("  from     :", from || "(missing)");

try {
  const ip = await (await fetch("https://api.ipify.org")).text();
  console.log("  this server's public IP:", ip, "(Brevo: Security > Authorised IPs must allow it, or be turned off)");
} catch {
  /* optional */
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
});

try {
  await transporter.verify();
  console.log("\nOK  login to the mail server works");
} catch (err) {
  console.error("\nFAIL  cannot log in to the mail server:", err.message);
  if (/Unauthorized IP/i.test(err.message)) console.error("      -> Brevo is blocking this server's IP. Add it in Brevo > Security > Authorised IPs (or deactivate IP blocking).");
  if (/Invalid login|535|authentication/i.test(err.message)) console.error("      -> Wrong SMTP login or key. Create a new SMTP key in Brevo > SMTP & API and update SMTP_USER / SMTP_PASSWORD.");
  process.exit(1);
}

if (to) {
  try {
    const info = await transporter.sendMail({ from, to, subject: "MWP email test", text: "If you can read this, order and OTP emails will work." });
    console.log("OK  test email accepted:", info.response);
    console.log("    If it does not arrive, check spam, and that the sender domain is verified in Brevo (SPF/DKIM).");
  } catch (err) {
    console.error("FAIL  sending:", err.message);
    if (/sender|from|not valid|not allowed|domain/i.test(err.message)) console.error("      -> Verify the sender email/domain in Brevo > Senders & IP.");
    process.exit(1);
  }
}
