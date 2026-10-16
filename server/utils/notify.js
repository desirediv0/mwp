import sendEmail from "./sendEmail.js";
import { getNoticeTemplate } from "../email/temp/EmailTemplate.js";

// Email helpers that never throw: a mail problem must not break an order flow.

export const adminEmailAddress = () => process.env.ADMIN_EMAIL || process.env.SMTP_USER || process.env.STORE_EMAIL || null;

export async function emailUser(email, subject, notice) {
  if (!email) return false;
  try {
    await sendEmail({ email, subject, html: getNoticeTemplate(notice) });
    return true;
  } catch (err) {
    console.error(`Email "${subject}" to customer failed:`, err.message);
    return false;
  }
}

export async function notifyAdmin(subject, notice) {
  const to = adminEmailAddress();
  if (!to) return false;
  try {
    await sendEmail({ email: to, subject, html: getNoticeTemplate({ accent: "Admin alert", ...notice }) });
    return true;
  } catch (err) {
    console.error(`Admin alert "${subject}" failed:`, err.message);
    return false;
  }
}
