import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { checkEmail } from "../utils/emailCheck.js";
import { normalizeUsPhone } from "../utils/usValidation.js";
import { emailUser } from "../utils/notify.js";
import { generateAccessAndRefreshTokens, setCookies } from "../helper/generateAccessAndRefreshTokens.js";
import { generateOTP, isValidOTP, isExpiredOTP } from "../helper/generateOTP.js";

// Guest checkout: a new email gets an account and is signed in straight away; an
// existing email must prove it owns the address with a one-time code first, so
// nobody can enter someone else's email at checkout and land in their account.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_ATTEMPTS = 5;
const attempts = new Map(); // email -> wrong tries on the current code

const publicUser = (u) => {
  const { password, otp, otpVerifiedExpiry, ...rest } = u;
  return { ...rest, hasPassword: !!password };
};

const referralFor = (id) => `REF${id.slice(-6).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

async function signIn(res, user) {
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);
  setCookies(res, accessToken, refreshToken);
  return accessToken;
}

async function sendLoginCode(user) {
  const code = generateOTP();
  const expiry = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.user.update({ where: { id: user.id }, data: { otp: code, otpVerifiedExpiry: expiry } });
  attempts.delete(user.email);
  const sent = await emailUser(user.email, "Your MWP Supplements checkout code", {
    title: "Your sign-in code",
    accent: "Checkout",
    greeting: `Hi ${user.name || "there"},`,
    rows: [["Your code", code]],
    paragraphs: [
      "Use this code to continue your checkout. It works for 10 minutes.",
      "If you did not try to check out, you can ignore this email.",
    ],
  });
  return sent;
}

export const guestStart = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const name = String(req.body.name || "").trim().slice(0, 80);
  if (!EMAIL_RE.test(email)) throw new ApiError(400, "Enter a valid email address");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (!existing.isActive) throw new ApiError(403, "This account is disabled. Please contact support.");
    if (existing.role !== "CUSTOMER") throw new ApiError(403, "Please sign in from the login page.");
    if (!(await sendLoginCode(existing))) {
      throw new ApiError(503, "We could not send the code email right now. Please try again in a few minutes or contact support.");
    }
    return res.status(200).json(new ApiResponsive(200, { needsCode: true, email }, "We emailed you a code"));
  }

  const emailProblem = await checkEmail(email);
  if (emailProblem) throw new ApiError(400, emailProblem);
  if (name.length < 2) throw new ApiError(400, "Enter your full name");
  const phone = normalizeUsPhone(req.body.phone);
  if (!phone) throw new ApiError(400, "Enter a valid US phone number, like (562) 524-3557");

  let user = await prisma.user.create({ data: { name, email, phone, password: null, otpVerified: false } });
  user = await prisma.user.update({ where: { id: user.id }, data: { referralCode: referralFor(user.id) } }).catch(() => user);
  const accessToken = await signIn(res, user);
  return res.status(201).json(new ApiResponsive(201, { created: true, user: publicUser(user), accessToken }, "Account created"));
});

export const guestVerify = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const code = String(req.body.code || "").trim();
  if (!EMAIL_RE.test(email) || !isValidOTP(code)) throw new ApiError(400, "Enter the 6 digit code from your email");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || user.role !== "CUSTOMER" || !user.otp || !user.otpVerifiedExpiry) {
    throw new ApiError(400, "That code is not valid. Request a new one.");
  }
  if (isExpiredOTP(user.otpVerifiedExpiry, 0)) throw new ApiError(400, "That code has expired. Request a new one.");

  if (user.otp !== code) {
    const n = (attempts.get(email) || 0) + 1;
    attempts.set(email, n);
    if (n >= MAX_ATTEMPTS) {
      await prisma.user.update({ where: { id: user.id }, data: { otp: null, otpVerifiedExpiry: null } });
      attempts.delete(email);
      throw new ApiError(429, "Too many wrong codes. Request a new one.");
    }
    throw new ApiError(400, "Incorrect code");
  }

  attempts.delete(email);
  const verified = await prisma.user.update({ where: { id: user.id }, data: { otp: null, otpVerifiedExpiry: null, otpVerified: true } });
  const accessToken = await signIn(res, verified);
  return res.status(200).json(new ApiResponsive(200, { user: publicUser(verified), accessToken }, "Signed in"));
});
