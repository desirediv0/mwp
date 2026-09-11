import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { getFileUrl } from "../utils/deleteFromS3.js";

// Get active quiz with questions and options (public)
export const getActiveQuiz = asyncHandler(async (req, res) => {
  const quiz = await prisma.fragranceQuiz.findFirst({
    where: { isActive: true },
    include: {
      questions: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        include: {
          options: {
            where: { isActive: true },
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              image: true,
              icon: true,
              order: true,
            },
          },
        },
      },
    },
  });

  if (!quiz) {
    throw new ApiError(404, "Quiz not available at this time");
  }

  // Limit questions to maxQuestions
  const limitedQuestions = quiz.questions.slice(0, quiz.maxQuestions);

  res.status(200).json(
    new ApiResponsive(200, {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      heroImage: quiz.heroImage,
      showResults: quiz.showResults,
      questions: limitedQuestions.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        questionType: q.questionType,
        isRequired: q.isRequired,
        image: q.image,
        order: q.order,
        options: q.options.map((o) => ({
          id: o.id,
          title: o.title,
          description: o.description,
          image: o.image ? getFileUrl(o.image) : null,
          icon: o.icon,
          order: o.order,
        })),
      })),
    })
  );
});

// Submit quiz answers and get recommendations (public)
export const submitQuizAnswers = asyncHandler(async (req, res) => {
  const { answers, guestId, sessionId } = req.body;

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    throw new ApiError(400, "Answers are required");
  }

  // Get user ID from auth if available
  let userId = null;
  if (req.user) {
    userId = req.user.id;
  }

  // Check if user has active SecretAccess
  let hasSecretAccess = false;
  if (userId) {
    const now = new Date();
    const secretRecord = await prisma.secretAccess.findFirst({
      where: {
        userId,
        status: { in: ["ACTIVE", "USED"] },
        expiresAt: { gt: now },
      },
    });
    hasSecretAccess = !!secretRecord && secretRecord.usageCount < secretRecord.usageLimit;
  }

  // Validate answers
  const questionIds = answers.map((a) => a.questionId);
  const questions = await prisma.fragranceQuizQuestion.findMany({
    where: { id: { in: questionIds }, isActive: true },
    include: {
      options: {
        where: { isActive: true },
        select: { id: true },
      },
    },
  });

  if (questions.length === 0) {
    throw new ApiError(400, "No valid questions found");
  }

  // Build validated answers
  const validatedAnswers = [];
  const selectedOptionIds = [];

  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) continue;

    if (question.isRequired && (!answer.optionId && !answer.value)) {
      throw new ApiError(400, `Question "${question.title}" is required`);
    }

    if (answer.optionId) {
      const validOption = question.options.find((o) => o.id === answer.optionId);
      if (!validOption) {
        throw new ApiError(400, `Invalid option for question "${question.title}"`);
      }
      selectedOptionIds.push(answer.optionId);
    }

    validatedAnswers.push({
      questionId: answer.questionId,
      optionId: answer.optionId || null,
      value: answer.value || null,
    });
  }

  // Get all active rules with their conditions and products
  const rules = await prisma.fragranceQuizRule.findMany({
    where: { isActive: true },
    include: {
      conditions: {
        select: {
          questionId: true,
          optionId: true,
        },
      },
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              featured: true,
              isActive: true,
              isDeleted: true,
              visibility: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true },
              },
              variants: {
                where: { isActive: true },
                take: 1,
                select: {
                  id: true,
                  price: true,
                  salePrice: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ priority: "asc" }, { weight: "desc" }],
  });

  // Find matching rules
  const matchedRules = [];

  for (const rule of rules) {
    let isMatch = false;

    if (rule.operator === "AND") {
      // All conditions must be met
      isMatch = rule.conditions.every((condition) =>
        selectedOptionIds.includes(condition.optionId)
      );
    } else {
      // OR: At least one condition must be met
      isMatch = rule.conditions.some((condition) =>
        selectedOptionIds.includes(condition.optionId)
      );
    }

    if (isMatch) {
      matchedRules.push(rule);
    }
  }

  // Collect recommended products
  const productMap = new Map();

  for (const rule of matchedRules) {
    for (const rp of rule.products) {
      const product = rp.product;
      if (!product || !product.isActive || product.isDeleted) continue;

      // Handle SECRET products - lock for users without access
      const isSecretLocked = product.visibility === "SECRET" && !hasSecretAccess;

      if (!productMap.has(product.id)) {
        productMap.set(product.id, {
          id: product.id,
          variantId: product.variants[0]?.id || null,
          productVariantId: product.variants[0]?.id || null,
          name: product.name,
          slug: product.slug,
          description: product.description,
          featured: product.featured,
          image: product.images[0] ? getFileUrl(product.images[0].url) : null,
          price: product.variants[0]?.price || null,
          salePrice: product.variants[0]?.salePrice || null,
          matchScore: 0,
          matchedRuleIds: [],
          isSecretLocked,
          visibility: product.visibility,
        });
      }

      const existing = productMap.get(product.id);
      existing.matchScore += rule.weight;
      existing.matchedRuleIds.push(rule.id);
    }
  }

  // Sort by match score
  let recommendedProducts = Array.from(productMap.values()).sort(
    (a, b) => b.matchScore - a.matchScore
  );

  // Calculate max possible score for percentage
  const maxScore = matchedRules.length > 0
    ? Math.max(...recommendedProducts.map((p) => p.matchScore))
    : 0;

  // Add match percentage
  recommendedProducts = recommendedProducts.map((p) => ({
    ...p,
    matchPercentage: maxScore > 0
      ? Math.round((p.matchScore / maxScore) * 100)
      : 0,
  }));

  // If no rules matched, get best selling / featured products as fallback
  if (recommendedProducts.length === 0) {
    const fallbackWhere = {
      isActive: true,
      isDeleted: false,
      featured: true,
    };
    // Non-secret users only see PUBLIC products in fallback
    if (!hasSecretAccess) {
      fallbackWhere.visibility = "PUBLIC";
    }

    const fallbackProducts = await prisma.product.findMany({
      where: fallbackWhere,
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true },
        },
        variants: {
          where: { isActive: true },
          take: 1,
          select: {
            id: true,
            price: true,
            salePrice: true,
          },
        },
      },
      take: 6,
    });

    recommendedProducts = fallbackProducts.map((p) => ({
      id: p.id,
      variantId: p.variants[0]?.id || null,
      productVariantId: p.variants[0]?.id || null,
      name: p.name,
      slug: p.slug,
      description: p.description,
      featured: p.featured,
      image: p.images[0] ? getFileUrl(p.images[0].url) : null,
      price: p.variants[0]?.price || null,
      salePrice: p.variants[0]?.salePrice || null,
      matchScore: 0,
      matchPercentage: 0,
      matchedRuleIds: [],
      isFallback: true,
      isSecretLocked: false,
      visibility: p.visibility,
    }));
  }

  // Detect device and browser from user agent
  const userAgent = req.headers["user-agent"] || "";
  let device = "desktop";
  if (/mobile/i.test(userAgent)) device = "mobile";
  else if (/tablet/i.test(userAgent)) device = "tablet";

  let browser = "unknown";
  if (/chrome/i.test(userAgent)) browser = "chrome";
  else if (/firefox/i.test(userAgent)) browser = "firefox";
  else if (/safari/i.test(userAgent)) browser = "safari";
  else if (/edge/i.test(userAgent)) browser = "edge";

  // Calculate time taken (client should send startTime)
  const timeTaken = req.body.timeTaken || null;

  // Save response
  const response = await prisma.fragranceQuizResponse.create({
    data: {
      userId,
      guestId: guestId || null,
      sessionId: sessionId || null,
      answers: validatedAnswers,
      recommendedProducts: recommendedProducts.map((p) => ({
        productId: p.id,
        name: p.name,
        matchPercentage: p.matchPercentage,
      })),
      matchedRuleId: matchedRules.length > 0 ? matchedRules[0].id : null,
      timeTaken,
      device,
      browser,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      completed: true,
    },
  });

  res.status(200).json(
    new ApiResponsive(200, {
      responseId: response.id,
      recommendations: recommendedProducts,
      matchedRules: matchedRules.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
      })),
    })
  );
});
