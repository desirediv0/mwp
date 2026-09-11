import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import sendEmail from "../utils/sendEmail.js";
import { getStoreConfig } from "../utils/storeConfig.js";

const BATCH_SIZE = 100;
const MAX_RETRIES = 3;

// Get SMTP settings status
export const getSmtpSettings = asyncHandler(async (req, res, next) => {
  const store = getStoreConfig();
  const smtpConfigured = Boolean(
    process.env.SMTP_USER && (process.env.SMTP_SERVICE || process.env.SMTP_HOST)
  );

  res.status(200).json(
    new ApiResponsive(200, {
      configured: smtpConfigured,
      host: process.env.SMTP_HOST || "",
      port: process.env.SMTP_PORT || "587",
      service: process.env.SMTP_SERVICE || "",
      user: process.env.SMTP_USER || "",
      secure: process.env.SMTP_SECURE || "",
      fromName: store.fromName,
      fromEmail: store.fromEmail,
      storeName: store.storeName,
      storeEmail: store.storeEmail,
    }, "SMTP settings fetched")
  );
});

// Get all campaigns with pagination
export const getCampaigns = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (status) where.status = status;

  const [campaigns, total] = await Promise.all([
    prisma.emailCampaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
      include: {
        _count: { select: { logs: true } },
        logs: {
          select: { status: true },
        },
      },
    }),
    prisma.emailCampaign.count({ where }),
  ]);

  // Compute status counts for each campaign
  const campaignsWithStats = campaigns.map((c) => {
    const sent = c.logs.filter((l) => l.status === "SENT").length;
    const failed = c.logs.filter((l) => l.status === "FAILED").length;
    const pending = c.logs.filter((l) => l.status === "PENDING").length;
    return {
      id: c.id,
      subject: c.subject,
      status: c.status,
      totalRecipients: c.totalRecipients,
      sentCount: sent,
      failedCount: failed,
      pendingCount: pending,
      createdAt: c.createdAt,
      sentAt: c.sentAt,
    };
  });

  res.status(200).json(
    new ApiResponsive(200, {
      campaigns: campaignsWithStats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    }, "Campaigns fetched successfully")
  );
});

// Get campaign details with logs
export const getCampaignById = asyncHandler(async (req, res, next) => {
  const { campaignId } = req.params;

  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
    include: {
      logs: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!campaign) {
    throw new ApiError(404, "Campaign not found");
  }

  // Compute stats
  const stats = {
    total: campaign.totalRecipients,
    sent: campaign.logs.filter((l) => l.status === "SENT").length,
    failed: campaign.logs.filter((l) => l.status === "FAILED").length,
    pending: campaign.logs.filter((l) => l.status === "PENDING").length,
    retrying: campaign.logs.filter((l) => l.status === "RETRYING").length,
  };

  res.status(200).json(
    new ApiResponsive(200, { campaign, stats }, "Campaign fetched successfully")
  );
});

// Create a campaign (DRAFT)
export const createCampaign = asyncHandler(async (req, res, next) => {
  const { subject, htmlContent, plainText } = req.body;

  if (!subject || !htmlContent) {
    throw new ApiError(400, "Subject and HTML content are required");
  }

  const campaign = await prisma.emailCampaign.create({
    data: {
      subject,
      htmlContent,
      plainText: plainText || "",
      createdById: req.admin.id,
    },
  });

  res.status(201).json(
    new ApiResponsive(201, { campaign }, "Campaign created successfully")
  );
});

// Update a campaign (DRAFT only)
export const updateCampaign = asyncHandler(async (req, res, next) => {
  const { campaignId } = req.params;
  const { subject, htmlContent, plainText } = req.body;

  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new ApiError(404, "Campaign not found");
  }

  if (campaign.status !== "DRAFT") {
    throw new ApiError(400, "Only DRAFT campaigns can be edited");
  }

  const updated = await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      ...(subject && { subject }),
      ...(htmlContent && { htmlContent }),
      ...(plainText !== undefined && { plainText }),
    },
  });

  res.status(200).json(
    new ApiResponsive(200, { campaign: updated }, "Campaign updated successfully")
  );
});

// Delete a campaign
export const deleteCampaign = asyncHandler(async (req, res, next) => {
  const { campaignId } = req.params;

  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new ApiError(404, "Campaign not found");
  }

  if (campaign.status === "SENDING") {
    throw new ApiError(400, "Cannot delete a campaign that is currently sending");
  }

  await prisma.emailCampaign.delete({ where: { id: campaignId } });

  res.status(200).json(
    new ApiResponsive(200, null, "Campaign deleted successfully")
  );
});

// Test email - send to a single address
export const sendTestEmail = asyncHandler(async (req, res, next) => {
  const { email, subject, htmlContent } = req.body;

  if (!email || !subject || !htmlContent) {
    throw new ApiError(400, "Email, subject, and HTML content are required");
  }

  try {
    await sendEmail({
      email,
      subject: `[TEST] ${subject}`,
      html: htmlContent,
    });

    res.status(200).json(
      new ApiResponsive(200, { success: true }, "Test email sent successfully")
    );
  } catch (error) {
    throw new ApiError(500, `Failed to send test email: ${error.message}`);
  }
});

// Send campaign to all users (batch processing)
export const sendCampaign = asyncHandler(async (req, res, next) => {
  const { campaignId } = req.params;

  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new ApiError(404, "Campaign not found");
  }

  if (campaign.status !== "DRAFT") {
    throw new ApiError(400, "Only DRAFT campaigns can be sent");
  }

  // Get all active users with emails
  const allUsers = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
  const users = allUsers.filter((u) => u.email && u.email.trim().length > 0);

  if (users.length === 0) {
    throw new ApiError(400, "No users with email addresses found");
  }

  // Limit to BATCH_SIZE
  const recipients = users.slice(0, BATCH_SIZE);

  // Update campaign status
  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: "SENDING",
      totalRecipients: recipients.length,
    },
  });

  // Create email logs for all recipients
  await prisma.emailLog.createMany({
    data: recipients.map((user) => ({
      campaignId,
      email: user.email,
      userName: user.name,
      status: "PENDING",
    })),
  });

  // Process first batch immediately (fire and forget)
  processBatch(campaignId, campaign.subject, campaign.htmlContent).catch(
    (err) => console.error("Batch processing error:", err)
  );

  res.status(200).json(
    new ApiResponsive(200, {
      campaignId,
      totalRecipients: recipients.length,
      message: `Sending started. ${recipients.length} emails will be processed in batches.`,
    }, "Campaign sending started")
  );
});

// Retry failed emails for a campaign
export const retryFailedEmails = asyncHandler(async (req, res, next) => {
  const { campaignId } = req.params;

  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new ApiError(404, "Campaign not found");
  }

  // Get failed logs with retry count < MAX_RETRIES
  const failedLogs = await prisma.emailLog.findMany({
    where: {
      campaignId,
      status: "FAILED",
      retryCount: { lt: MAX_RETRIES },
    },
  });

  if (failedLogs.length === 0) {
    throw new ApiError(400, "No failed emails eligible for retry");
  }

  // Update status to RETRYING
  await prisma.emailLog.updateMany({
    where: {
      id: { in: failedLogs.map((l) => l.id) },
    },
    data: { status: "RETRYING" },
  });

  // Process retries (fire and forget)
  retryBatch(campaignId, campaign.subject, campaign.htmlContent, failedLogs.map((l) => l.id)).catch(
    (err) => console.error("Retry processing error:", err)
  );

  res.status(200).json(
    new ApiResponsive(200, {
      retryCount: failedLogs.length,
      message: `Retrying ${failedLogs.length} failed emails`,
    }, "Retry started")
  );
});

// Helper: Process a batch of emails
async function processBatch(campaignId, subject, htmlContent) {
  const pendingLogs = await prisma.emailLog.findMany({
    where: {
      campaignId,
      status: "PENDING",
    },
    take: 10, // Process 10 at a time to avoid overload
    orderBy: { createdAt: "asc" },
  });

  for (const log of pendingLogs) {
    try {
      await sendEmail({
        email: log.email,
        subject,
        html: htmlContent,
      });

      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });
    } catch (error) {
      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          errorMessage: error.message || "Unknown error",
        },
      });
    }
  }

  // Check if there are more pending logs
  const remainingCount = await prisma.emailLog.count({
    where: {
      campaignId,
      status: "PENDING",
    },
  });

  if (remainingCount > 0) {
    // Process next batch after a small delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await processBatch(campaignId, subject, htmlContent);
  } else {
    // All done - update campaign status
    const stats = await prisma.emailLog.groupBy({
      by: ["status"],
      where: { campaignId },
      _count: true,
    });

    const sentCount = stats.find((s) => s.status === "SENT")?._count || 0;
    const failedCount = stats.find((s) => s.status === "FAILED")?._count || 0;

    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: failedCount > 0 ? "COMPLETED" : "COMPLETED",
        sentCount,
        failedCount,
        sentAt: new Date(),
      },
    });
  }
}

// Helper: Retry failed emails
async function retryBatch(campaignId, subject, htmlContent, logIds) {
  const logs = await prisma.emailLog.findMany({
    where: {
      id: { in: logIds },
      status: "RETRYING",
    },
  });

  for (const log of logs) {
    try {
      await sendEmail({
        email: log.email,
        subject,
        html: htmlContent,
      });

      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          retryCount: log.retryCount + 1,
        },
      });
    } catch (error) {
      const newRetryCount = log.retryCount + 1;
      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: newRetryCount >= MAX_RETRIES ? "FAILED" : "FAILED",
          errorMessage: error.message || "Unknown error",
          retryCount: newRetryCount,
        },
      });
    }
  }

  // Update campaign stats after retry
  const stats = await prisma.emailLog.groupBy({
    by: ["status"],
    where: { campaignId },
    _count: true,
  });

  const sentCount = stats.find((s) => s.status === "SENT")?._count || 0;
  const failedCount = stats.find((s) => s.status === "FAILED")?._count || 0;

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { sentCount, failedCount },
  });
}

// Get user count for email marketing
export const getUserCount = asyncHandler(async (req, res, next) => {
  const allUsers = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    select: {
      email: true,
    },
  });
  const count = allUsers.filter((u) => u.email && u.email.trim().length > 0).length;

  res.status(200).json(
    new ApiResponsive(200, { count }, "User count fetched")
  );
});
