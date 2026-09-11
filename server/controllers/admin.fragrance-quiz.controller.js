import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { getFileUrl } from "../utils/deleteFromS3.js";

// ─── QUIZ SETTINGS ────────────────────────────────────────────

export const getQuizSettings = asyncHandler(async (req, res) => {
  let quiz = await prisma.fragranceQuiz.findFirst();

  if (!quiz) {
    quiz = await prisma.fragranceQuiz.create({
      data: {
        title: "Fragrance Finder",
        description: "Discover your perfect fragrance",
      },
    });
  }

  const questionCount = await prisma.fragranceQuizQuestion.count({
    where: { quizId: quiz.id, isActive: true },
  });

  const ruleCount = await prisma.fragranceQuizRule.count({
    where: { quizId: quiz.id, isActive: true },
  });

  const responseCount = await prisma.fragranceQuizResponse.count({
    where: { completed: true },
  });

  res.status(200).json(
    new ApiResponsive(200, {
      ...quiz,
      stats: {
        questionCount,
        ruleCount,
        responseCount,
      },
    })
  );
});

export const updateQuizSettings = asyncHandler(async (req, res) => {
  const { title, description, heroImage, isActive, showResults, maxQuestions } = req.body;

  let quiz = await prisma.fragranceQuiz.findFirst();

  if (!quiz) {
    quiz = await prisma.fragranceQuiz.create({
      data: {
        title: title || "Fragrance Finder",
        description: description || "Discover your perfect fragrance",
        heroImage,
        isActive: isActive !== undefined ? isActive : true,
        showResults: showResults !== undefined ? showResults : true,
        maxQuestions: maxQuestions || 15,
      },
    });
  } else {
    quiz = await prisma.fragranceQuiz.update({
      where: { id: quiz.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(heroImage !== undefined && { heroImage }),
        ...(isActive !== undefined && { isActive }),
        ...(showResults !== undefined && { showResults }),
        ...(maxQuestions !== undefined && { maxQuestions }),
      },
    });
  }

  res.status(200).json(new ApiResponsive(200, quiz, "Quiz settings updated"));
});

// ─── QUESTIONS CRUD ────────────────────────────────────────────

export const getQuestions = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    search = "",
    isActive,
    sort = "order",
    order = "asc",
  } = req.query;

  const quiz = await prisma.fragranceQuiz.findFirst();
  if (!quiz) throw new ApiError(404, "Quiz not found");

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filterConditions = {
    quizId: quiz.id,
    ...(search && {
      title: { contains: search, mode: "insensitive" },
    }),
    ...(isActive !== undefined && {
      isActive: isActive === "true",
    }),
  };

  const totalQuestions = await prisma.fragranceQuizQuestion.count({
    where: filterConditions,
  });

  const questions = await prisma.fragranceQuizQuestion.findMany({
    where: filterConditions,
    include: {
      options: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: [{ [sort]: order }],
    skip,
    take: parseInt(limit),
  });

  // Format response
  const formattedQuestions = questions.map((q) => ({
    ...q,
    optionCount: q.options.length,
    options: q.options.map((o) => ({
      ...o,
      tags: o.tags || [],
    })),
  }));

  res.status(200).json(
    new ApiResponsive(200, {
      questions: formattedQuestions,
      pagination: {
        total: totalQuestions,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalQuestions / parseInt(limit)),
      },
    })
  );
});

export const createQuestion = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    questionType,
    isRequired,
    isActive,
    image,
    order,
  } = req.body;

  if (!title) throw new ApiError(400, "Title is required");

  const quiz = await prisma.fragranceQuiz.findFirst();
  if (!quiz) throw new ApiError(404, "Quiz not found");

  // Get next order if not provided
  let questionOrder = order;
  if (questionOrder === undefined) {
    const lastQuestion = await prisma.fragranceQuizQuestion.findFirst({
      where: { quizId: quiz.id },
      orderBy: { order: "desc" },
    });
    questionOrder = (lastQuestion?.order || 0) + 1;
  }

  const question = await prisma.fragranceQuizQuestion.create({
    data: {
      quizId: quiz.id,
      title,
      description,
      questionType: questionType || "SINGLE_CHOICE",
      isRequired: isRequired !== undefined ? isRequired : true,
      isActive: isActive !== undefined ? isActive : true,
      image,
      order: questionOrder,
    },
    include: {
      options: true,
    },
  });

  res.status(201).json(new ApiResponsive(201, question, "Question created"));
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  const {
    title,
    description,
    questionType,
    isRequired,
    isActive,
    image,
    order,
  } = req.body;

  const existingQuestion = await prisma.fragranceQuizQuestion.findUnique({
    where: { id: questionId },
  });

  if (!existingQuestion) {
    throw new ApiError(404, "Question not found");
  }

  const question = await prisma.fragranceQuizQuestion.update({
    where: { id: questionId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(questionType !== undefined && { questionType }),
      ...(isRequired !== undefined && { isRequired }),
      ...(isActive !== undefined && { isActive }),
      ...(image !== undefined && { image }),
      ...(order !== undefined && { order }),
    },
    include: {
      options: {
        orderBy: { order: "asc" },
      },
    },
  });

  res.status(200).json(new ApiResponsive(200, question, "Question updated"));
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const { questionId } = req.params;

  const question = await prisma.fragranceQuizQuestion.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    throw new ApiError(404, "Question not found");
  }

  await prisma.fragranceQuizQuestion.delete({
    where: { id: questionId },
  });

  res.status(200).json(new ApiResponsive(200, null, "Question deleted"));
});

export const reorderQuestions = asyncHandler(async (req, res) => {
  const { questionIds } = req.body;

  if (!Array.isArray(questionIds)) {
    throw new ApiError(400, "questionIds must be an array");
  }

  // Update order for each question
  const updates = questionIds.map((id, index) =>
    prisma.fragranceQuizQuestion.update({
      where: { id },
      data: { order: index + 1 },
    })
  );

  await prisma.$transaction(updates);

  res.status(200).json(new ApiResponsive(200, null, "Questions reordered"));
});

// ─── OPTIONS CRUD ──────────────────────────────────────────────

export const createOption = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  const { title, description, image, icon, score, tags, priority, order, isActive } = req.body;

  if (!title) throw new ApiError(400, "Title is required");

  const question = await prisma.fragranceQuizQuestion.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    throw new ApiError(404, "Question not found");
  }

  // Get next order if not provided
  let optionOrder = order;
  if (optionOrder === undefined) {
    const lastOption = await prisma.fragranceQuizOption.findFirst({
      where: { questionId },
      orderBy: { order: "desc" },
    });
    optionOrder = (lastOption?.order || 0) + 1;
  }

  const option = await prisma.fragranceQuizOption.create({
    data: {
      questionId,
      title,
      description,
      image,
      icon,
      score: score || 1,
      tags: tags || [],
      priority: priority || 0,
      order: optionOrder,
      isActive: isActive !== undefined ? isActive : true,
    },
  });

  res.status(201).json(new ApiResponsive(201, option, "Option created"));
});

export const updateOption = asyncHandler(async (req, res) => {
  const { optionId } = req.params;
  const { title, description, image, icon, score, tags, priority, order, isActive } = req.body;

  const existingOption = await prisma.fragranceQuizOption.findUnique({
    where: { id: optionId },
  });

  if (!existingOption) {
    throw new ApiError(404, "Option not found");
  }

  const option = await prisma.fragranceQuizOption.update({
    where: { id: optionId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(image !== undefined && { image }),
      ...(icon !== undefined && { icon }),
      ...(score !== undefined && { score }),
      ...(tags !== undefined && { tags }),
      ...(priority !== undefined && { priority }),
      ...(order !== undefined && { order }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  res.status(200).json(new ApiResponsive(200, option, "Option updated"));
});

export const deleteOption = asyncHandler(async (req, res) => {
  const { optionId } = req.params;

  const option = await prisma.fragranceQuizOption.findUnique({
    where: { id: optionId },
  });

  if (!option) {
    throw new ApiError(404, "Option not found");
  }

  await prisma.fragranceQuizOption.delete({
    where: { id: optionId },
  });

  res.status(200).json(new ApiResponsive(200, null, "Option deleted"));
});

// ─── RULES CRUD ────────────────────────────────────────────────

export const getRules = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    search = "",
    isActive,
  } = req.query;

  const quiz = await prisma.fragranceQuiz.findFirst();
  if (!quiz) throw new ApiError(404, "Quiz not found");

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filterConditions = {
    quizId: quiz.id,
    ...(search && {
      name: { contains: search, mode: "insensitive" },
    }),
    ...(isActive !== undefined && {
      isActive: isActive === "true",
    }),
  };

  const totalRules = await prisma.fragranceQuizRule.count({
    where: filterConditions,
  });

  const rules = await prisma.fragranceQuizRule.findMany({
    where: filterConditions,
    include: {
      conditions: {
        include: {
          question: { select: { id: true, title: true } },
          option: { select: { id: true, title: true } },
        },
      },
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      },
    },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    skip,
    take: parseInt(limit),
  });

  // Format response
  const formattedRules = rules.map((rule) => ({
    ...rule,
    conditions: rule.conditions.map((c) => ({
      id: c.id,
      questionId: c.questionId,
      questionTitle: c.question.title,
      optionId: c.optionId,
      optionTitle: c.option.title,
    })),
    products: rule.products.map((rp) => ({
      id: rp.id,
      productId: rp.productId,
      priority: rp.priority,
      product: {
        ...rp.product,
        image: rp.product.images[0]
          ? getFileUrl(rp.product.images[0].url)
          : null,
      },
    })),
  }));

  res.status(200).json(
    new ApiResponsive(200, {
      rules: formattedRules,
      pagination: {
        total: totalRules,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalRules / parseInt(limit)),
      },
    })
  );
});

export const createRule = asyncHandler(async (req, res) => {
  const { name, description, operator, priority, weight, isActive, conditions, productIds } = req.body;

  if (!name) throw new ApiError(400, "Rule name is required");
  if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
    throw new ApiError(400, "At least one condition is required");
  }
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new ApiError(400, "At least one product is required");
  }

  const quiz = await prisma.fragranceQuiz.findFirst();
  if (!quiz) throw new ApiError(404, "Quiz not found");

  // Validate conditions
  for (const condition of conditions) {
    if (!condition.questionId || !condition.optionId) {
      throw new ApiError(400, "Each condition must have questionId and optionId");
    }

    const question = await prisma.fragranceQuizQuestion.findUnique({
      where: { id: condition.questionId },
    });
    if (!question) throw new ApiError(400, `Question ${condition.questionId} not found`);

    const option = await prisma.fragranceQuizOption.findUnique({
      where: { id: condition.optionId },
    });
    if (!option) throw new ApiError(400, `Option ${condition.optionId} not found`);
  }

  // Validate products
  for (const productId of productIds) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new ApiError(400, `Product ${productId} not found`);
  }

  // Create rule with conditions and products in a transaction
  const rule = await prisma.$transaction(async (tx) => {
    const newRule = await tx.fragranceQuizRule.create({
      data: {
        quizId: quiz.id,
        name,
        description,
        operator: operator || "AND",
        priority: priority || 0,
        weight: weight || 1.0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    // Create conditions
    for (const condition of conditions) {
      await tx.fragranceQuizRuleCondition.create({
        data: {
          ruleId: newRule.id,
          questionId: condition.questionId,
          optionId: condition.optionId,
        },
      });
    }

    // Create product mappings
    for (let i = 0; i < productIds.length; i++) {
      await tx.fragranceQuizRuleProduct.create({
        data: {
          ruleId: newRule.id,
          productId: productIds[i],
          priority: i,
        },
      });
    }

    return newRule;
  });

  // Fetch the complete rule with relations
  const completeRule = await prisma.fragranceQuizRule.findUnique({
    where: { id: rule.id },
    include: {
      conditions: {
        include: {
          question: { select: { id: true, title: true } },
          option: { select: { id: true, title: true } },
        },
      },
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      },
    },
  });

  res.status(201).json(new ApiResponsive(201, completeRule, "Rule created"));
});

export const updateRule = asyncHandler(async (req, res) => {
  const { ruleId } = req.params;
  const { name, description, operator, priority, weight, isActive, conditions, productIds } = req.body;

  const existingRule = await prisma.fragranceQuizRule.findUnique({
    where: { id: ruleId },
  });

  if (!existingRule) {
    throw new ApiError(404, "Rule not found");
  }

  // If updating conditions or products, do it in a transaction
  if (conditions !== undefined || productIds !== undefined) {
    await prisma.$transaction(async (tx) => {
      // Update rule fields
      await tx.fragranceQuizRule.update({
        where: { id: ruleId },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(operator !== undefined && { operator }),
          ...(priority !== undefined && { priority }),
          ...(weight !== undefined && { weight }),
          ...(isActive !== undefined && { isActive }),
        },
      });

      // Replace conditions if provided
      if (conditions !== undefined) {
        await tx.fragranceQuizRuleCondition.deleteMany({
          where: { ruleId },
        });

        for (const condition of conditions) {
          if (!condition.questionId || !condition.optionId) {
            throw new ApiError(400, "Each condition must have questionId and optionId");
          }
          await tx.fragranceQuizRuleCondition.create({
            data: {
              ruleId,
              questionId: condition.questionId,
              optionId: condition.optionId,
            },
          });
        }
      }

      // Replace products if provided
      if (productIds !== undefined) {
        await tx.fragranceQuizRuleProduct.deleteMany({
          where: { ruleId },
        });

        for (let i = 0; i < productIds.length; i++) {
          await tx.fragranceQuizRuleProduct.create({
            data: {
              ruleId,
              productId: productIds[i],
              priority: i,
            },
          });
        }
      }
    });
  } else {
    // Just update rule fields
    await prisma.fragranceQuizRule.update({
      where: { id: ruleId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(operator !== undefined && { operator }),
        ...(priority !== undefined && { priority }),
        ...(weight !== undefined && { weight }),
        ...(isActive !== undefined && { isActive }),
      },
    });
  }

  // Fetch updated rule
  const updatedRule = await prisma.fragranceQuizRule.findUnique({
    where: { id: ruleId },
    include: {
      conditions: {
        include: {
          question: { select: { id: true, title: true } },
          option: { select: { id: true, title: true } },
        },
      },
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      },
    },
  });

  res.status(200).json(new ApiResponsive(200, updatedRule, "Rule updated"));
});

export const deleteRule = asyncHandler(async (req, res) => {
  const { ruleId } = req.params;

  const rule = await prisma.fragranceQuizRule.findUnique({
    where: { id: ruleId },
  });

  if (!rule) {
    throw new ApiError(404, "Rule not found");
  }

  await prisma.fragranceQuizRule.delete({
    where: { id: ruleId },
  });

  res.status(200).json(new ApiResponsive(200, null, "Rule deleted"));
});

export const toggleRuleStatus = asyncHandler(async (req, res) => {
  const { ruleId } = req.params;

  const rule = await prisma.fragranceQuizRule.findUnique({
    where: { id: ruleId },
  });

  if (!rule) {
    throw new ApiError(404, "Rule not found");
  }

  const updatedRule = await prisma.fragranceQuizRule.update({
    where: { id: ruleId },
    data: { isActive: !rule.isActive },
  });

  res.status(200).json(
    new ApiResponsive(
      200,
      updatedRule,
      `Rule ${updatedRule.isActive ? "activated" : "deactivated"}`
    )
  );
});

// ─── ANALYTICS ─────────────────────────────────────────────────

export const getQuizAnalytics = asyncHandler(async (req, res) => {
  const { period = "7d" } = req.query;

  const quiz = await prisma.fragranceQuiz.findFirst();
  if (!quiz) throw new ApiError(404, "Quiz not found");

  // Calculate date range
  const now = new Date();
  let startDate;
  switch (period) {
    case "24h":
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  // Total responses
  const totalResponses = await prisma.fragranceQuizResponse.count();
  const completedResponses = await prisma.fragranceQuizResponse.count({
    where: { completed: true },
  });
  const periodResponses = await prisma.fragranceQuizResponse.count({
    where: {
      createdAt: { gte: startDate },
    },
  });
  const periodCompleted = await prisma.fragranceQuizResponse.count({
    where: {
      completed: true,
      createdAt: { gte: startDate },
    },
  });

  // Completion rate
  const completionRate = totalResponses > 0
    ? ((completedResponses / totalResponses) * 100).toFixed(1)
    : 0;

  // Average time taken (for completed quizzes)
  const avgTimeResult = await prisma.fragranceQuizResponse.aggregate({
    where: { completed: true, timeTaken: { not: null } },
    _avg: { timeTaken: true },
  });
  const avgTimeTaken = avgTimeResult._avg.timeTaken || 0;

  // Most selected options
  const allResponses = await prisma.fragranceQuizResponse.findMany({
    where: { completed: true },
    select: { answers: true },
  });

  const optionCounts = {};
  allResponses.forEach((response) => {
    const answers = Array.isArray(response.answers) ? response.answers : [];
    answers.forEach((answer) => {
      if (answer.optionId) {
        optionCounts[answer.optionId] = (optionCounts[answer.optionId] || 0) + 1;
      }
    });
  });

  // Get top selected options with their question info
  const topOptionIds = Object.entries(optionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([id]) => id);

  const topOptions = await prisma.fragranceQuizOption.findMany({
    where: { id: { in: topOptionIds } },
    include: {
      question: { select: { id: true, title: true } },
    },
  });

  const mostSelectedAnswers = topOptionIds.map((id) => {
    const option = topOptions.find((o) => o.id === id);
    return {
      optionId: id,
      optionTitle: option?.title,
      questionTitle: option?.question?.title,
      count: optionCounts[id],
      percentage: completedResponses > 0
        ? ((optionCounts[id] / completedResponses) * 100).toFixed(1)
        : 0,
    };
  });

  // Popular recommended products
  const allRecommendations = await prisma.fragranceQuizResponse.findMany({
    where: { completed: true },
    select: { recommendedProducts: true },
  });

  const productCounts = {};
  allRecommendations.forEach((response) => {
    const products = Array.isArray(response.recommendedProducts)
      ? response.recommendedProducts
      : [];
    products.forEach((item) => {
      const productId = typeof item === "string" ? item : item.productId || item.id;
      if (productId) {
        productCounts[productId] = (productCounts[productId] || 0) + 1;
      }
    });
  });

  const topProductIds = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id]) => id);

  const topProducts = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: {
      id: true,
      name: true,
      slug: true,
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { url: true },
      },
    },
  });

  const popularProducts = topProductIds.map((id) => {
    const product = topProducts.find((p) => p.id === id);
    return {
      productId: id,
      productName: product?.name,
      productSlug: product?.slug,
      image: product?.images[0] ? getFileUrl(product.images[0].url) : null,
      count: productCounts[id],
      percentage: completedResponses > 0
        ? ((productCounts[id] / completedResponses) * 100).toFixed(1)
        : 0,
    };
  });

  // Daily response trend (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dailyResponses = await prisma.$queryRaw`
    SELECT 
      DATE("createdAt") as date,
      COUNT(*) as total,
      COUNT(CASE WHEN completed = true THEN 1 END) as completed
    FROM "FragranceQuizResponse"
    WHERE "createdAt" >= ${thirtyDaysAgo}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  // Device breakdown
  const deviceBreakdown = await prisma.$queryRaw`
    SELECT 
      device,
      COUNT(*) as count
    FROM "FragranceQuizResponse"
    WHERE "createdAt" >= ${startDate} AND device IS NOT NULL
    GROUP BY device
    ORDER BY count DESC
  `;

  res.status(200).json(
    new ApiResponsive(200, {
      overview: {
        totalResponses,
        completedResponses,
        completionRate: parseFloat(completionRate),
        avgTimeTaken: Math.round(avgTimeTaken),
        periodResponses,
        periodCompleted,
      },
      mostSelectedAnswers,
      popularProducts,
      dailyResponses: dailyResponses.map((d) => ({
        date: d.date,
        total: parseInt(d.total),
        completed: parseInt(d.completed),
      })),
      deviceBreakdown: deviceBreakdown.map((d) => ({
        device: d.device,
        count: parseInt(d.count),
      })),
    })
  );
});

// ─── RESPONSES ─────────────────────────────────────────────────

export const getQuizResponses = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    completed,
    startDate,
    endDate,
    sort = "createdAt",
    order = "desc",
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filterConditions = {
    ...(completed !== undefined && {
      completed: completed === "true",
    }),
    ...(startDate && {
      createdAt: { gte: new Date(startDate) },
    }),
    ...(endDate && {
      createdAt: { lte: new Date(endDate) },
    }),
  };

  const totalResponses = await prisma.fragranceQuizResponse.count({
    where: filterConditions,
  });

  const responses = await prisma.fragranceQuizResponse.findMany({
    where: filterConditions,
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      responseAnswers: {
        include: {
          question: { select: { id: true, title: true } },
          option: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { [sort]: order },
    skip,
    take: parseInt(limit),
  });

  // Format responses
  const formattedResponses = responses.map((r) => ({
    id: r.id,
    userId: r.userId,
    guestId: r.guestId,
    user: r.user,
    answers: r.responseAnswers.map((a) => ({
      questionId: a.questionId,
      questionTitle: a.question.title,
      optionId: a.optionId,
      optionTitle: a.option?.title,
      value: a.value,
    })),
    recommendedProducts: r.recommendedProducts,
    matchedRuleId: r.matchedRuleId,
    timeTaken: r.timeTaken,
    device: r.device,
    browser: r.browser,
    completed: r.completed,
    createdAt: r.createdAt,
  }));

  res.status(200).json(
    new ApiResponsive(200, {
      responses: formattedResponses,
      pagination: {
        total: totalResponses,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalResponses / parseInt(limit)),
      },
    })
  );
});
