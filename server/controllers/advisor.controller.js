import jwt from "jsonwebtoken";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  DEFAULT_PROMPT,
  DEFAULT_GREETING,
  MODELS,
  EFFORTS,
  getAdvisorSettings,
  maskKey,
  encryptKey,
  askClaude,
  clientFor,
  hashIp,
  flagFor,
  startOfDay,
} from "../utils/advisor.js";
import { decrypt } from "../utils/encryption.js";

const ok = (res, data, message = "OK", code = 200) => res.status(code).json(new ApiResponsive(code, data, message));

const OFFLINE = "The advisor is not available right now. Please email support@mwpsupplements.com and the team will help you.";
const DISCLAIMER = "Chats are saved so our team can improve support. Please do not share personal health details, card numbers or passwords.";

/* ------------------------------ limits ------------------------------ */

// per visitor: slows down floods; the daily cap and the per-conversation cap protect the budget
export const advisorLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip || ""),
  message: { success: false, message: "You are sending messages too fast. Please wait a moment." },
});

/* ------------------------------ public ------------------------------ */

export const getConfig = asyncHandler(async (req, res) => {
  const s = await getAdvisorSettings();
  ok(res, { enabled: s.isEnabled && !!s.apiKeyEnc, greeting: s.greeting || DEFAULT_GREETING, disclaimer: DISCLAIMER });
});

// the signed-in customer (if any) is saved with the chat so the team knows who asked
async function optionalUser(req) {
  try {
    const token = req.cookies?.accessToken || req.headers?.authorization?.replace("Bearer ", "");
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.ACCESS_JWT_SECRET);
    return await prisma.user.findUnique({ where: { id: decoded.id }, select: { id: true, name: true, email: true } });
  } catch {
    return null;
  }
}

const validSession = (v) => typeof v === "string" && /^[A-Za-z0-9-]{16,64}$/.test(v);

export const getHistory = asyncHandler(async (req, res) => {
  const sessionId = String(req.query.sessionId || "");
  if (!validSession(sessionId)) return ok(res, { messages: [] });
  const conv = await prisma.advisorConversation.findUnique({
    where: { sessionId },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 60, select: { role: true, content: true } } },
  });
  ok(res, { messages: conv?.messages || [] });
});

export const chat = asyncHandler(async (req, res) => {
  const { sessionId, pageUrl } = req.body || {};
  const message = String(req.body?.message || "").trim();
  if (!validSession(sessionId)) throw new ApiError(400, "Invalid session");
  if (!message) throw new ApiError(400, "Type a message first");
  if (message.length > 600) throw new ApiError(400, "Please keep your message under 600 characters");

  const settings = await getAdvisorSettings();
  if (!settings.isEnabled || !settings.apiKeyEnc) return ok(res, { reply: OFFLINE, offline: true });

  // overall daily cap, so a flood can never run up the bill
  const today = await prisma.advisorMessage.count({ where: { role: "user", createdAt: { gte: startOfDay() } } });
  if (today >= settings.dailyMessageLimit) return ok(res, { reply: OFFLINE, offline: true });

  const user = await optionalUser(req);
  let conv = await prisma.advisorConversation.findUnique({ where: { sessionId } });
  if (!conv) {
    conv = await prisma.advisorConversation.create({
      data: {
        sessionId,
        userId: user?.id || null,
        userName: user?.name || null,
        userEmail: user?.email || null,
        pageUrl: typeof pageUrl === "string" ? pageUrl.slice(0, 300) : null,
        userAgent: String(req.headers["user-agent"] || "").slice(0, 300),
        ipHash: hashIp(req.ip),
      },
    });
  } else if (user && !conv.userId) {
    conv = await prisma.advisorConversation.update({ where: { id: conv.id }, data: { userId: user.id, userName: user.name, userEmail: user.email } });
  }

  const asked = await prisma.advisorMessage.count({ where: { conversationId: conv.id, role: "user" } });
  if (asked >= settings.maxUserMessages) {
    return ok(res, { reply: "We have talked a lot in this chat. For more help, please email support@mwpsupplements.com.", limit: true });
  }

  // history always comes from our database, never from the browser
  const prior = await prisma.advisorMessage.findMany({ where: { conversationId: conv.id }, orderBy: { createdAt: "asc" }, take: 24, select: { role: true, content: true } });

  const flag = flagFor(message);
  await prisma.advisorMessage.create({ data: { conversationId: conv.id, role: "user", content: message } });

  let answer;
  try {
    answer = await askClaude({ settings, history: prior, userMessage: message });
  } catch (err) {
    console.error("Advisor error:", err?.status || "", err?.message);
    await prisma.advisorMessage.create({ data: { conversationId: conv.id, role: "assistant", content: `[error] ${String(err?.message || "request failed").slice(0, 300)}`, model: settings.model } });
    return ok(res, { reply: OFFLINE, offline: true });
  }

  await prisma.$transaction([
    prisma.advisorMessage.create({
      data: { conversationId: conv.id, role: "assistant", content: answer.text, inputTokens: answer.inputTokens, outputTokens: answer.outputTokens, model: answer.model, toolsUsed: answer.toolsUsed },
    }),
    prisma.advisorConversation.update({
      where: { id: conv.id },
      data: {
        messageCount: { increment: 2 },
        lastMessageAt: new Date(),
        reviewed: flag ? false : conv.reviewed,
        ...(flag ? { flagged: true, flagReason: flag } : {}),
      },
    }),
    prisma.advisorSettings.update({
      where: { id: settings.id },
      data: { totalInputTokens: { increment: answer.inputTokens }, totalOutputTokens: { increment: answer.outputTokens } },
    }),
  ]);

  ok(res, { reply: answer.text });
});

/* ------------------------------ admin ------------------------------ */

const settingsOut = async (s) => ({
  isEnabled: s.isEnabled,
  hasKey: !!s.apiKeyEnc,
  keyMask: maskKey(s.apiKeyEnc),
  model: s.model,
  effort: s.effort,
  usesDefaultPrompt: !(s.systemPrompt && s.systemPrompt.trim()),
  systemPrompt: (s.systemPrompt && s.systemPrompt.trim()) || DEFAULT_PROMPT,
  greeting: s.greeting || "",
  defaultGreeting: DEFAULT_GREETING,
  maxUserMessages: s.maxUserMessages,
  dailyMessageLimit: s.dailyMessageLimit,
  totalInputTokens: Number(s.totalInputTokens),
  totalOutputTokens: Number(s.totalOutputTokens),
  messagesToday: await prisma.advisorMessage.count({ where: { role: "user", createdAt: { gte: startOfDay() } } }),
  models: MODELS,
  efforts: EFFORTS,
});

export const adminGetSettings = asyncHandler(async (req, res) => ok(res, { settings: await settingsOut(await getAdvisorSettings()) }));

export const adminSaveSettings = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const s = await getAdvisorSettings();
  const data = {};

  if (typeof b.apiKey === "string" && b.apiKey.trim()) {
    const key = b.apiKey.trim();
    if (!/^sk-ant-/.test(key) || key.length < 30) throw new ApiError(400, "That does not look like an Anthropic API key (it starts with sk-ant-).");
    data.apiKeyEnc = encryptKey(key);
  } else if (b.clearKey === true) {
    data.apiKeyEnc = null;
    data.isEnabled = false;
  }
  if (b.model !== undefined) {
    if (!MODELS.some((m) => m.id === b.model)) throw new ApiError(400, "Choose one of the listed models");
    data.model = b.model;
  }
  if (b.effort !== undefined) {
    if (!EFFORTS.includes(b.effort)) throw new ApiError(400, "Choose low, medium or high");
    data.effort = b.effort;
  }
  if (b.systemPrompt !== undefined) data.systemPrompt = String(b.systemPrompt).trim() === DEFAULT_PROMPT.trim() ? null : String(b.systemPrompt).slice(0, 60000) || null;
  if (b.greeting !== undefined) data.greeting = String(b.greeting).slice(0, 600) || null;
  if (b.maxUserMessages !== undefined) {
    const n = parseInt(b.maxUserMessages, 10);
    if (!(n >= 3 && n <= 200)) throw new ApiError(400, "Messages per chat must be between 3 and 200");
    data.maxUserMessages = n;
  }
  if (b.dailyMessageLimit !== undefined) {
    const n = parseInt(b.dailyMessageLimit, 10);
    if (!(n >= 10 && n <= 100000)) throw new ApiError(400, "Daily limit must be between 10 and 100000");
    data.dailyMessageLimit = n;
  }
  if (b.isEnabled !== undefined) {
    const want = b.isEnabled === true;
    if (want && !(data.apiKeyEnc || s.apiKeyEnc)) throw new ApiError(400, "Add an Anthropic API key before turning the advisor on");
    data.isEnabled = want && data.isEnabled !== false;
  }

  const saved = await prisma.advisorSettings.update({ where: { id: s.id }, data });
  ok(res, { settings: await settingsOut(saved) }, "Advisor settings saved");
});

export const adminTest = asyncHandler(async (req, res) => {
  const s = await getAdvisorSettings();
  const candidate = typeof req.body?.apiKey === "string" && req.body.apiKey.trim() ? req.body.apiKey.trim() : null;
  let key = candidate;
  if (!key) {
    if (!s.apiKeyEnc) throw new ApiError(400, "Add an API key first");
    key = decrypt(s.apiKeyEnc);
  }
  try {
    const r = await clientFor(key).messages.create({ model: s.model, max_tokens: 16, messages: [{ role: "user", content: "Reply with the single word OK." }] });
    ok(res, { working: true, model: r.model, reply: r.content.filter((b) => b.type === "text").map((b) => b.text).join("").slice(0, 40) }, "The key works");
  } catch (err) {
    const status = err?.status;
    const reason = status === 401 ? "The key was rejected (wrong or revoked)." : status === 403 ? "This key may not use that model." : status === 429 ? "Rate limited, try again in a minute." : err?.message || "Request failed";
    throw new ApiError(400, reason);
  }
});

export const adminDefaultPrompt = asyncHandler(async (req, res) => ok(res, { systemPrompt: DEFAULT_PROMPT }));

export const adminListConversations = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const q = String(req.query.search || "").trim();
  const where = {
    ...(req.query.flagged === "true" ? { flagged: true } : {}),
    ...(req.query.unreviewed === "true" ? { reviewed: false } : {}),
    ...(q
      ? {
          OR: [
            { userName: { contains: q, mode: "insensitive" } },
            { userEmail: { contains: q, mode: "insensitive" } },
            { messages: { some: { content: { contains: q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };
  const [total, rows, flaggedOpen] = await Promise.all([
    prisma.advisorConversation.count({ where }),
    prisma.advisorConversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { messages: { orderBy: { createdAt: "asc" }, take: 1, select: { content: true } } },
    }),
    prisma.advisorConversation.count({ where: { flagged: true, reviewed: false } }),
  ]);
  ok(res, {
    conversations: rows.map((c) => ({
      id: c.id,
      who: c.userName || c.userEmail || "Guest visitor",
      email: c.userEmail,
      signedIn: !!c.userId,
      firstMessage: c.messages[0]?.content?.slice(0, 140) || "",
      messageCount: c.messageCount,
      flagged: c.flagged,
      flagReason: c.flagReason,
      reviewed: c.reviewed,
      pageUrl: c.pageUrl,
      createdAt: c.createdAt,
      lastMessageAt: c.lastMessageAt,
    })),
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    flaggedOpen,
  });
});

export const adminGetConversation = asyncHandler(async (req, res) => {
  const c = await prisma.advisorConversation.findUnique({
    where: { id: req.params.id },
    include: { messages: { orderBy: { createdAt: "asc" }, select: { id: true, role: true, content: true, createdAt: true, model: true, inputTokens: true, outputTokens: true, toolsUsed: true } } },
  });
  if (!c) throw new ApiError(404, "Conversation not found");
  ok(res, {
    conversation: {
      id: c.id,
      who: c.userName || c.userEmail || "Guest visitor",
      email: c.userEmail,
      signedIn: !!c.userId,
      userAgent: c.userAgent,
      pageUrl: c.pageUrl,
      flagged: c.flagged,
      flagReason: c.flagReason,
      reviewed: c.reviewed,
      createdAt: c.createdAt,
      messages: c.messages,
    },
  });
});

export const adminMarkReviewed = asyncHandler(async (req, res) => {
  const c = await prisma.advisorConversation.update({ where: { id: req.params.id }, data: { reviewed: req.body?.reviewed !== false } });
  ok(res, { reviewed: c.reviewed });
});

export const adminDeleteConversation = asyncHandler(async (req, res) => {
  await prisma.advisorConversation.delete({ where: { id: req.params.id } });
  ok(res, {}, "Conversation deleted");
});
