import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { prisma } from "../config/db.js";
import { getFileUrl } from "../utils/deleteFromS3.js";

/**
 * Get blog posts with pagination
 */
const getBlogPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 9;
  const skip = (page - 1) * limit;
  const categorySlug = req.query.category;

  try {
    // Build where clause based on filters
    const where = { isPublished: true };
    if (categorySlug) {
      where.categories = {
        some: {
          slug: categorySlug,
        },
      };
    }

    // Get total count for pagination
    const totalPosts = await prisma.blogPost.count({ where });

    // Get blog posts with pagination
    const posts = await prisma.blogPost.findMany({
      where,
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
 * Get a single blog post by slug
 */
const getBlogPostBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  try {
    // Find post by slug
    const post = await prisma.blogPost.findUnique({
      where: { slug, isPublished: true },
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

    // Add full URL to coverImage
    if (post.coverImage) {
      post.coverImageUrl = getFileUrl(post.coverImage);
    }

    // Get related posts (posts with the same categories)
    let relatedPosts = [];
    if (post.categories.length > 0) {
      // Get category IDs from the current post
      const categoryIds = post.categories.map((cat) => cat.id);

      relatedPosts = await prisma.blogPost.findMany({
        where: {
          id: { not: post.id },
          isPublished: true,
          categories: {
            some: {
              id: { in: categoryIds },
            },
          },
        },
        take: 3,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          coverImage: true,
          createdAt: true,
        },
      });

      // Add full URL to coverImage for related posts
      relatedPosts = relatedPosts.map((p) => ({
        ...p,
        coverImageUrl: p.coverImage ? getFileUrl(p.coverImage) : null,
      }));
    }

    return res.status(200).json(
      new ApiResponsive(200, {
        post,
        relatedPosts,
      })
    );
  } catch (error) {
    if (error.statusCode === 404) {
      throw error;
    }
    console.error("Error fetching blog post:", error);
    throw new ApiError(500, "Failed to fetch blog post");
  }
});

/**
 * Get blog categories
 */
const getBlogCategories = asyncHandler(async (req, res) => {
  try {
    // Get all published categories
    const categories = await prisma.blogCategory.findMany({
      orderBy: { name: "asc" },
    });

    // Count posts for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const postCount = await prisma.blogPost.count({
          where: {
            isPublished: true,
            categories: {
              some: {
                id: category.id,
              },
            },
          },
        });

        return {
          ...category,
          postCount,
        };
      })
    );

    return res.status(200).json(new ApiResponsive(200, categoriesWithCount));
  } catch (error) {
    console.error("Error fetching blog categories:", error);
    throw new ApiError(500, "Failed to fetch blog categories");
  }
});

/**
 * Get about page content
 */
const getAboutPageContent = asyncHandler(async (req, res) => {
  try {
    // Try to get content from database
    const aboutContent = await prisma.pageContent.findUnique({
      where: { slug: "about" },
    });

    if (aboutContent) {
      return res.status(200).json(new ApiResponsive(200, aboutContent));
    }

    // If no content exists in the database, return the fallback content
    return res.status(200).json(
      new ApiResponsive(200, {
        title: "About Us",
        content:
          "<h2>Our Story</h2><p>MWP SUPPLEMENTS (MEN | WOMEN | POWER) was founded on an uncompromising principle: to engineer clean, clinically dosed, high-potency sports nutrition and wellness formulations for high performers.</p><p>We cut through industry noise by using standardized herbal extracts, zero banned substances, and full label transparency. Whether you are aiming for explosive gym performance, optimized vitality, or holistic daily wellness, MWP delivers peak human output.</p>",
        metaTitle: "About Us | MWP SUPPLEMENTS",
        metaDescription: "Learn more about MWP SUPPLEMENTS and our mission for peak physical performance and vitality.",
      })
    );
  } catch (error) {
    console.error("Error fetching about page content:", error);
    throw new ApiError(500, "Failed to fetch about page content");
  }
});

/**
 * Get shipping policy content
 */
const getShippingPolicy = asyncHandler(async (req, res) => {
  try {
    // Try to get content from database
    const shippingContent = await prisma.pageContent.findUnique({
      where: { slug: "shipping" },
    });

    if (shippingContent) {
      return res.status(200).json(new ApiResponsive(200, shippingContent));
    }

    // If no content exists in the database, return the fallback content
    return res.status(200).json(
      new ApiResponsive(200, {
        title: "Shipping Policy",
        content:
          "<h2>Delivery Information</h2><p>At MWP SUPPLEMENTS, we ensure your supplements reach you fresh, tamper-proof, and fast. All orders are packed in secure sealed packaging to guarantee product integrity.</p><h2>Shipping Rates</h2><ul><li><strong>Free Express Shipping:</strong> On all orders above ₹999 across India.</li><li><strong>Standard Shipping:</strong> ₹99 for orders below ₹999.</li><li><strong>Dispatch Timeline:</strong> Dispatched within 24-48 hours with real-time tracking.</li></ul>",
        metaTitle: "Shipping Policy | MWP SUPPLEMENTS",
        metaDescription: "Fast Pan-India shipping and delivery policy for MWP SUPPLEMENTS.",
      })
    );
  } catch (error) {
    console.error("Error fetching shipping policy:", error);
    throw new ApiError(500, "Failed to fetch shipping policy");
  }
});

/**
 * Get FAQs
 */
const getFaqs = asyncHandler(async (req, res) => {
  try {
    // Get FAQs from database
    const faqs = await prisma.fAQ.findMany({
      where: { isPublished: true },
      orderBy: [{ category: "asc" }, { order: "asc" }],
    });

    if (faqs.length > 0) {
      return res.status(200).json(
        new ApiResponsive(200, {
          faqs,
          metaTitle: "Frequently Asked Questions | MWP Supplements",
          metaDescription:
            "Find answers to common questions about our products and services.",
        })
      );
    }

    // If no FAQs in database, return mock data
    return res.status(200).json(
      new ApiResponsive(200, {
        faqs: [
          {
            id: "1",
            question: "How do I track my order?",
            answer:
              "<p>You can track your order by logging into your account and visiting the 'Orders' section. Alternatively, you can use the tracking number provided in your shipping confirmation email.</p>",
            category: "Orders",
            order: 1,
            isPublished: true,
          },
          {
            id: "2",
            question: "What payment methods do you accept?",
            answer:
              "<p>We accept credit/debit cards, UPI, net banking, and various wallets including PayTM, PhonePe, and Google Pay.</p>",
            category: "Payments",
            order: 1,
            isPublished: true,
          },
          {
            id: "3",
            question: "Are your grocery products pure?",
            answer:
              "<p>Yes, all our products are sourced from our verified farms and undergo rigorous quality testing for purity and nutrition. We prioritize freshness and quality in all our products.</p>",
            category: "Products",
            order: 1,
            isPublished: true,
          },
        ],
        metaTitle: "Frequently Asked Questions | MWP Supplements",
        metaDescription:
          "Find answers to common questions about our fresh grocery products.",
      })
    );
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    throw new ApiError(500, "Failed to fetch FAQs");
  }
});

/**
 * Submit contact form
 */
const submitContactForm = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  // Validate required fields
  if (!name || !email || !message) {
    throw new ApiError(400, "Name, email and message are required");
  }

  try {
    // Create contact form submission in database
    await prisma.contactSubmission.create({
      data: {
        name,
        email,
        phone,
        subject,
        message,
        status: "NEW",
      },
    });

    return res.status(201).json(
      new ApiResponsive(201, {
        message:
          "Your message has been sent successfully. We will contact you soon!",
      })
    );
  } catch (error) {
    console.error("Error submitting contact form:", error);
    throw new ApiError(500, "Failed to submit contact form");
  }
});

/**
 * Get contact page information
 */
const getContactInfo = asyncHandler(async (req, res) => {
  try {
    // Try to get content from database
    const contactContent = await prisma.pageContent.findUnique({
      where: { slug: "contact" },
    });

    // If exists in database, return that content
    if (contactContent) {
      const contactData = {
        ...contactContent,
        // You can override or add specific fields as needed
        mapCoordinates: {
          lat: 19.076,
          lng: 72.8777,
        },
        socialLinks: {
          facebook: "https://facebook.com/mwpsupplements",
          instagram: "https://instagram.com/mwpsupplements",
          twitter: "https://twitter.com/mwpsupplements",
        },
      };

      return res.status(200).json(new ApiResponsive(200, contactData));
    }

    // Default fallback contact info
    const contactInfo = {
      address: "India",
      phone: "+91 76783 36268",
      email: "support@mwpsupplements.com",
      hours: "Monday - Saturday: 9:00 AM - 8:00 PM",
      mapCoordinates: {
        lat: 28.4595,
        lng: 77.0266,
      },
      socialLinks: {
        facebook: "https://facebook.com/mwpsupplements",
        instagram: "https://instagram.com/mwpsupplements",
        twitter: "https://twitter.com/mwpsupplements",
      },
      metaTitle: "Contact Us | MWP SUPPLEMENTS",
      metaDescription:
        "Get in touch with the MWP SUPPLEMENTS team. Expert assistance on products, orders, and sports nutrition stacks.",
    };

    return res.status(200).json(new ApiResponsive(200, contactInfo));
  } catch (error) {
    console.error("Error fetching contact info:", error);
    throw new ApiError(500, "Failed to fetch contact information");
  }
});

export {
  getBlogPosts,
  getBlogPostBySlug,
  getBlogCategories,
  getAboutPageContent,
  getShippingPolicy,
  getFaqs,
  submitContactForm,
  getContactInfo,
};
