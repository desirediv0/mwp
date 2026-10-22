import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { prisma } from "../config/db.js";
import {
  processAndUploadImage,
  deleteFile,
} from "../middlewares/multer.middlerware.js";
import { getFileUrl } from "../utils/deleteFromS3.js";
import slugify from "slugify";

/**
 * Create a new blog post
 */

// Article details that come with a blog post (multipart forms send them as strings)
const MAX_FAQ = 30;
const MAX_REFERENCES = 60;
const parseJsonField = (value, label) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new ApiError(400, `${label} is not valid`);
  }
};
const cleanText = (v, max) => {
  if (v === undefined) return undefined;
  const t = String(v ?? "").trim();
  return t ? t.slice(0, max) : null;
};

const articleDetails = (body) => {
  const data = {
    writtenBy: cleanText(body.writtenBy, 120),
    reviewedBy: cleanText(body.reviewedBy, 160),
    lastUpdatedLabel: cleanText(body.lastUpdatedLabel, 60),
    mainQuestion: cleanText(body.mainQuestion, 300),
    disclaimer: cleanText(body.disclaimer, 4000),
    ctaText: cleanText(body.ctaText, 80),
    ctaNote: cleanText(body.ctaNote, 400),
    ctaUrl: cleanText(body.ctaUrl, 400),
  };

  if (data.ctaUrl && !/^(\/(?!\/)|https:\/\/)/i.test(data.ctaUrl)) {
    throw new ApiError(400, "The button link must start with / (a page on this site) or https://");
  }
  if (data.ctaUrl && !data.ctaText) throw new ApiError(400, "Add the button text for the button link");

  if (body.readingMinutes !== undefined) {
    const n = parseInt(body.readingMinutes, 10);
    data.readingMinutes = Number.isFinite(n) && n > 0 && n <= 240 ? n : null;
  }

  const faq = parseJsonField(body.faq, "FAQ");
  if (faq !== undefined) {
    if (!Array.isArray(faq)) throw new ApiError(400, "FAQ must be a list");
    const items = faq
      .map((f) => ({ question: String(f?.question || "").trim(), answer: String(f?.answer || "").trim() }))
      .filter((f) => f.question || f.answer);
    if (items.length > MAX_FAQ) throw new ApiError(400, `Too many FAQ items (max ${MAX_FAQ})`);
    if (items.some((f) => !f.question || !f.answer)) throw new ApiError(400, "Every FAQ needs both a question and an answer");
    data.faq = items.length ? items : null;
  }

  const references = parseJsonField(body.references, "References");
  if (references !== undefined) {
    if (!Array.isArray(references)) throw new ApiError(400, "References must be a list");
    const items = references.map((r) => String(r || "").trim()).filter(Boolean);
    if (items.length > MAX_REFERENCES) throw new ApiError(400, `Too many references (max ${MAX_REFERENCES})`);
    data.references = items.length ? items.map((r) => r.slice(0, 600)) : null;
  }

  // drop fields that were not sent so a partial update never wipes them
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  return data;
};

const customSlug = (value) => {
  const s = slugify(String(value || ""), { lower: true, strict: true });
  return s || null;
};

const createBlogPost = asyncHandler(async (req, res) => {
  const {
    title,
    summary,
    content,
    isPublished,
    categories,
    metaTitle,
    metaDescription,
    keywords,
  } = req.body;
  const authorId = req.admin.id;

  // Validate required fields
  if (!title || !content) {
    throw new ApiError(400, "Title and content are required");
  }

  // Slug: the one typed in the form, else generated from the title
  const slug = customSlug(req.body.slug) || slugify(title, { lower: true, strict: true });
  const details = articleDetails(req.body);

  try {
    // Check if slug already exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (existingPost) {
      throw new ApiError(400, "A blog post with this title already exists");
    }

    // Process cover image if uploaded
    let coverImage = null;
    if (req.file) {
      const uploaded = await processAndUploadImage(req.file, "blog");
      coverImage = uploaded;
    }

    // Parse categories array from JSON if it comes as a string
    let parsedCategories = categories;
    if (typeof categories === "string") {
      try {
        parsedCategories = JSON.parse(categories);
      } catch (e) {
        console.error("Failed to parse categories:", e);
        parsedCategories = [];
      }
    }

    // Create blog post
    const blogPost = await prisma.blogPost.create({
      data: {
        title,
        slug,
        summary,
        content,
        coverImage,
        isPublished: isPublished === "true" || isPublished === true,
        authorId,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || summary,
        keywords,
        ...details,
        ...(parsedCategories &&
          parsedCategories.length > 0 && {
            categories: {
              connect: parsedCategories.map((cat) => ({ id: cat })),
            },
          }),
      },
      include: {
        categories: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Add full URL to coverImage if it exists
    if (blogPost.coverImage) {
      blogPost.coverImageUrl = getFileUrl(blogPost.coverImage);
    }

    return res.status(201).json(new ApiResponsive(201, blogPost));
  } catch (error) {
    // If there was an error and we uploaded an image, delete it
    if (req.file && req.fileUrl) {
      await deleteFile(req.fileUrl);
    }

    console.error("Error creating blog post:", error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, "Failed to create blog post");
  }
});

/**
 * Update an existing blog post
 */
const updateBlogPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    summary,
    content,
    isPublished,
    categories,
    removeCoverImage,
    metaTitle,
    metaDescription,
    keywords,
  } = req.body;

  // Validate required fields
  if (!title || !content) {
    throw new ApiError(400, "Title and content are required");
  }

  try {
    // Check if blog post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        categories: true,
      },
    });

    if (!existingPost) {
      throw new ApiError(404, "Blog post not found");
    }

    const details = articleDetails(req.body);

    // Generate a new slug only if the title or the typed slug changed
    let slug = existingPost.slug;
    const typedSlug = customSlug(req.body.slug);
    if (typedSlug && typedSlug !== existingPost.slug) {
      slug = typedSlug;
    } else if (!typedSlug && title !== existingPost.title) {
      slug = slugify(title, { lower: true, strict: true });
    }
    if (slug !== existingPost.slug) {

      // Check if the new slug already exists on a different post
      const slugExists = await prisma.blogPost.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });

      if (slugExists) {
        throw new ApiError(400, "A blog post with this title already exists");
      }
    }

    // Process new cover image if uploaded
    let coverImage = existingPost.coverImage;

    // If removeCoverImage is true, delete the existing image
    if (removeCoverImage === "true" || removeCoverImage === true) {
      if (existingPost.coverImage) {
        await deleteFile(existingPost.coverImage);
      }
      coverImage = null;
    }

    // If a new file is uploaded, process it and update coverImage
    if (req.file) {
      // If there's an existing image and we're replacing it, delete the old one
      if (existingPost.coverImage) {
        await deleteFile(existingPost.coverImage);
      }

      const uploaded = await processAndUploadImage(req.file, "blog");
      coverImage = uploaded;
    }

    // Parse categories array from JSON if it comes as a string
    let parsedCategories = categories;
    if (typeof categories === "string") {
      try {
        parsedCategories = JSON.parse(categories);
      } catch (e) {
        console.error("Failed to parse categories:", e);
        parsedCategories = existingPost.categories.map((c) => c.id);
      }
    }

    // Update the blog post
    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        slug,
        summary,
        content,
        coverImage,
        isPublished: isPublished === "true" || isPublished === true,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || summary,
        keywords,
        ...details,
        categories: {
          disconnect: existingPost.categories.map((c) => ({ id: c.id })),
          ...(parsedCategories &&
            parsedCategories.length > 0 && {
              connect: parsedCategories.map((cat) => ({ id: cat })),
            }),
        },
      },
      include: {
        categories: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Add full URL to coverImage if it exists
    if (updatedPost.coverImage) {
      updatedPost.coverImageUrl = getFileUrl(updatedPost.coverImage);
    }

    return res.status(200).json(new ApiResponsive(200, updatedPost));
  } catch (error) {
    // If there was an error and we uploaded an image, delete it
    if (req.file && req.fileUrl) {
      await deleteFile(req.fileUrl);
    }

    console.error("Error updating blog post:", error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, "Failed to update blog post");
  }
});

/**
 * Delete a blog post
 */
const deleteBlogPost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Check if blog post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      throw new ApiError(404, "Blog post not found");
    }

    // Delete the cover image if it exists
    if (existingPost.coverImage) {
      await deleteFile(existingPost.coverImage);
    }

    // Delete the blog post
    await prisma.blogPost.delete({
      where: { id },
    });

    return res
      .status(200)
      .json(
        new ApiResponsive(200, { message: "Blog post deleted successfully" })
      );
  } catch (error) {
    console.error("Error deleting blog post:", error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, "Failed to delete blog post");
  }
});

/**
 * Get all blog posts with pagination for admin dashboard
 */
const getAllBlogPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  try {
    // Get total count for pagination
    const totalPosts = await prisma.blogPost.count();

    // Get blog posts with pagination
    const posts = await prisma.blogPost.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        categories: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Add full URL to coverImage for all posts
    const postsWithUrls = posts.map((post) => ({
      ...post,
      coverImageUrl: post.coverImage ? getFileUrl(post.coverImage) : null,
    }));

    return res.status(200).json(
      new ApiResponsive(200, {
        posts: postsWithUrls,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
        },
      })
    );
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    throw new ApiError(500, "Failed to fetch blog posts");
  }
});

/**
 * Get a single blog post by ID for admin dashboard
 */
const getBlogPostById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        categories: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!post) {
      throw new ApiError(404, "Blog post not found");
    }

    // Add full URL to coverImage if it exists
    if (post.coverImage) {
      post.coverImageUrl = getFileUrl(post.coverImage);
    }

    return res.status(200).json(new ApiResponsive(200, post));
  } catch (error) {
    console.error("Error fetching blog post:", error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, "Failed to fetch blog post");
  }
});

/**
 * Create a new blog category
 */
const createBlogCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  try {
    // Generate slug from name
    const slug = slugify(name, { lower: true, strict: true });

    // Check if category with this slug already exists
    const existingCategory = await prisma.blogCategory.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      throw new ApiError(400, "A category with this name already exists");
    }

    // Create the category
    const category = await prisma.blogCategory.create({
      data: {
        name,
        slug,
      },
    });

    return res.status(201).json(new ApiResponsive(201, category));
  } catch (error) {
    console.error("Error creating blog category:", error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, "Failed to create blog category");
  }
});

/**
 * Update a blog category
 */
const updateBlogCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  try {
    // Check if category exists
    const existingCategory = await prisma.blogCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new ApiError(404, "Category not found");
    }

    // Generate slug from name
    const slug = slugify(name, { lower: true, strict: true });

    // Check if another category with this slug already exists
    const slugExists = await prisma.blogCategory.findFirst({
      where: {
        slug,
        id: { not: id },
      },
    });

    if (slugExists) {
      throw new ApiError(400, "A category with this name already exists");
    }

    // Update the category
    const updatedCategory = await prisma.blogCategory.update({
      where: { id },
      data: {
        name,
        slug,
      },
    });

    return res.status(200).json(new ApiResponsive(200, updatedCategory));
  } catch (error) {
    console.error("Error updating blog category:", error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, "Failed to update blog category");
  }
});

/**
 * Delete a blog category
 */
const deleteBlogCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Check if category exists
    const existingCategory = await prisma.blogCategory.findUnique({
      where: { id },
      include: {
        posts: true,
      },
    });

    if (!existingCategory) {
      throw new ApiError(404, "Category not found");
    }

    // Check if category has posts
    if (existingCategory.posts.length > 0) {
      throw new ApiError(400, "Cannot delete category with associated posts");
    }

    // Delete the category
    await prisma.blogCategory.delete({
      where: { id },
    });

    return res
      .status(200)
      .json(
        new ApiResponsive(200, { message: "Category deleted successfully" })
      );
  } catch (error) {
    console.error("Error deleting blog category:", error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, "Failed to delete blog category");
  }
});

/**
 * Get all blog categories
 */
const getAllBlogCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await prisma.blogCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    // Transform the results to include post count directly
    const transformedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      postCount: cat._count.posts,
    }));

    return res.status(200).json(new ApiResponsive(200, transformedCategories));
  } catch (error) {
    console.error("Error fetching blog categories:", error);
    throw new ApiError(500, "Failed to fetch blog categories");
  }
});

/**
 * Update page content (about, shipping, etc.)
 */
const updatePageContent = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { title, content, metaTitle, metaDescription } = req.body;
  const adminId = req.admin.id;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  try {
    // Check if page content exists
    const existingContent = await prisma.pageContent.findUnique({
      where: { slug },
    });

    // If it exists, update it; otherwise, create it
    let pageContent;

    if (existingContent) {
      pageContent = await prisma.pageContent.update({
        where: { slug },
        data: {
          title: title || existingContent.title,
          content,
          metaTitle,
          metaDescription,
          updatedBy: adminId,
        },
      });
    } else {
      if (!title) {
        throw new ApiError(400, "Title is required for new page content");
      }

      pageContent = await prisma.pageContent.create({
        data: {
          slug,
          title,
          content,
          metaTitle,
          metaDescription,
          updatedBy: adminId,
        },
      });
    }

    return res.status(200).json(new ApiResponsive(200, pageContent));
  } catch (error) {
    console.error("Error updating page content:", error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, "Failed to update page content");
  }
});

/**
 * Get specific page content by slug
 */
const getPageContent = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  try {
    const pageContent = await prisma.pageContent.findUnique({
      where: { slug },
      include: {
        adminUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!pageContent) {
      throw new ApiError(404, "Page content not found");
    }

    return res.status(200).json(new ApiResponsive(200, pageContent));
  } catch (error) {
    console.error("Error fetching page content:", error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, "Failed to fetch page content");
  }
});

/**
 * Get all page contents
 */
const getAllPageContents = asyncHandler(async (req, res) => {
  try {
    const pageContents = await prisma.pageContent.findMany({
      orderBy: { title: "asc" },
      include: {
        adminUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return res.status(200).json(new ApiResponsive(200, pageContents));
  } catch (error) {
    console.error("Error fetching all page contents:", error);
    throw new ApiError(500, "Failed to fetch page contents");
  }
});

/**
 * Create a new FAQ
 */
const createFaq = asyncHandler(async (req, res) => {
  const { question, answer, category, order, isPublished } = req.body;

  if (!question || !answer) {
    throw new ApiError(400, "Question and answer are required");
  }

  try {
    const faq = await prisma.fAQ.create({
      data: {
        question,
        answer,
        category: category || null,
        order: order ? parseInt(order, 10) : 0,
        isPublished: isPublished === "true" || isPublished === true,
      },
    });

    return res.status(201).json(new ApiResponsive(201, faq));
  } catch (error) {
    console.error("Error creating FAQ:", error);
    throw new ApiError(500, "Failed to create FAQ");
  }
});

/**
 * Update an existing FAQ
 */
const updateFaq = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { question, answer, category, order, isPublished } = req.body;

  if (!question || !answer) {
    throw new ApiError(400, "Question and answer are required");
  }

  try {
    // Check if FAQ exists
    const existingFaq = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!existingFaq) {
      throw new ApiError(404, "FAQ not found");
    }

    // Update the FAQ
    const updatedFaq = await prisma.fAQ.update({
      where: { id },
      data: {
        question,
        answer,
        category: category || null,
        order: order ? parseInt(order, 10) : existingFaq.order,
        isPublished: isPublished === "true" || isPublished === true,
      },
    });

    return res.status(200).json(new ApiResponsive(200, updatedFaq));
  } catch (error) {
    console.error("Error updating FAQ:", error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, "Failed to update FAQ");
  }
});

/**
 * Delete an FAQ
 */
const deleteFaq = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // Check if FAQ exists
    const existingFaq = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!existingFaq) {
      throw new ApiError(404, "FAQ not found");
    }

    // Delete the FAQ
    await prisma.fAQ.delete({
      where: { id },
    });

    return res
      .status(200)
      .json(new ApiResponsive(200, { message: "FAQ deleted successfully" }));
  } catch (error) {
    console.error("Error deleting FAQ:", error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, "Failed to delete FAQ");
  }
});

/**
 * Get all FAQs
 */
const getAllFaqs = asyncHandler(async (req, res) => {
  try {
    const faqs = await prisma.fAQ.findMany({
      orderBy: [{ category: "asc" }, { order: "asc" }],
    });

    return res.status(200).json(new ApiResponsive(200, faqs));
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    throw new ApiError(500, "Failed to fetch FAQs");
  }
});

/**
 * Get all contact submissions with pagination and filtering
 */
const getContactSubmissions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const status = req.query.status;

  try {
    // Build where clause based on filters
    const where = {};
    if (status) {
      where.status = status;
    }

    // Get total count for pagination
    const totalSubmissions = await prisma.contactSubmission.count({ where });

    // Get submissions with pagination, most recent first
    const submissions = await prisma.contactSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    return res.status(200).json(
      new ApiResponsive(200, {
        submissions,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalSubmissions / limit),
          totalSubmissions,
        },
      })
    );
  } catch (error) {
    console.error("Error fetching contact submissions:", error);
    throw new ApiError(500, "Failed to fetch contact submissions");
  }
});

/**
 * Get a single contact submission by ID
 */
const getContactSubmissionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new ApiError(404, "Contact submission not found");
    }

    return res.status(200).json(new ApiResponsive(200, submission));
  } catch (error) {
    console.error("Error fetching contact submission:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Failed to fetch contact submission");
  }
});

/**
 * Update a contact submission's status and notes
 */
const updateContactSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status) {
    throw new ApiError(400, "Status is required");
  }

  try {
    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new ApiError(404, "Contact submission not found");
    }

    const updatedSubmission = await prisma.contactSubmission.update({
      where: { id },
      data: {
        status,
        notes,
      },
    });

    return res.status(200).json(new ApiResponsive(200, updatedSubmission));
  } catch (error) {
    console.error("Error updating contact submission:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Failed to update contact submission");
  }
});

/**
 * Delete a contact submission
 */
const deleteContactSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new ApiError(404, "Contact submission not found");
    }

    await prisma.contactSubmission.delete({
      where: { id },
    });

    return res.status(200).json(
      new ApiResponsive(200, {
        message: "Contact submission deleted successfully",
      })
    );
  } catch (error) {
    console.error("Error deleting contact submission:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Failed to delete contact submission");
  }
});

export {
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getAllBlogPosts,
  getBlogPostById,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  getAllBlogCategories,
  updatePageContent,
  getPageContent,
  getAllPageContents,
  createFaq,
  updateFaq,
  deleteFaq,
  getAllFaqs,
  getContactSubmissions,
  getContactSubmissionById,
  updateContactSubmission,
  deleteContactSubmission,
};
