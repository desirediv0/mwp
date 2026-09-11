import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  ShoppingCart,
  Users,
  Settings,
  Mail,
  Truck,
  Sparkles,
  Shield,
  Layers,
  Video,
  ChevronDown,
  ChevronRight,
  Search,
  FileText,
  Tags,
  BookOpen,
  ExternalLink,
} from "lucide-react";

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  steps: string[];
  tips?: string[];
  link?: string;
}

const sections: Section[] = [
  {
    id: "products",
    title: "Products Management",
    icon: <Package className="h-5 w-5" />,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    link: "/products",
    steps: [
      "Go to Products > All Products to see all your products.",
      "Click 'Add Product' to create a new product.",
      "Fill in: Product Name, Description (rich text), Price, Sale Price, Quantity.",
      "Select Categories and Sub-Categories for the product.",
      "Upload Product Images (drag & drop, max 10MB each, first image = primary).",
      "Upload Product Videos in 'Progress of Product' section (drag & drop, max 100MB each).",
      "Add rich text sections: Fragrance Notes, Feelings, Occasions, Behind the Perfume, Shipping & Return, Legal Info.",
      "Add Lifestyle Image + Description for the lifestyle section on product page.",
      "Add Product Notes (e.g., Mandarin, Pear) with images.",
      "Toggle 'Has Variants' ON if product has size/color variants.",
      "For variants: select attributes, generate variants, set SKU/price/quantity per variant.",
      "Set SEO fields: Meta Title, Meta Description, Keywords, Tags.",
      "Click 'Create Product' to save.",
      "To Edit: click the edit icon on any product, make changes, click 'Update Product'.",
      "To Delete: click the trash icon on any product, confirm deletion.",
    ],
    tips: [
      "Always add at least 3-4 images per product.",
      "Set one image as Primary - this shows first on the website.",
      "Product Videos appear in an accordion on the product detail page.",
      "Use the rich text editor for formatted descriptions (bold, italic, lists, tables).",
    ],
  },
  {
    id: "orders",
    title: "Orders Management",
    icon: <ShoppingCart className="h-5 w-5" />,
    color: "bg-green-50 text-green-700 border-green-200",
    link: "/orders",
    steps: [
      "Go to Orders > All Orders to see all customer orders.",
      "Filter orders by status: Pending, Processing, Shipped, Delivered, Cancelled.",
      "Search orders by order number or customer name.",
      "Click on any order to see full details.",
      "On Order Details page, you can see: customer info, items, payment, shipping address.",
      "Change order status using the status dropdown.",
      "When status changes to 'Shipped', the order auto-syncs to Shiprocket (if enabled).",
      "You can manually sync to Shiprocket by clicking 'Sync to Shiprocket'.",
      "Download Shipping Label from Shiprocket section.",
      "Download Invoice (PDF) for the order.",
      "Cancel order from the order details page (also cancels on Shiprocket).",
      "View Return Requests under Orders > Return Requests.",
      "Manage Coupons under Orders > Coupons.",
    ],
    tips: [
      "Always check payment status before processing.",
      "Orders in PENDING or PROCESSING can be cancelled.",
      "Shipped orders cannot be cancelled from admin - only by customer.",
      "Check Shiprocket section for tracking info and AWB code.",
    ],
  },
  {
    id: "users",
    title: "Users & Partners",
    icon: <Users className="h-5 w-5" />,
    color: "bg-purple-50 text-purple-700 border-purple-200",
    link: "/users",
    steps: [
      "Go to Users > Users to see all registered customers.",
      "Search users by name, email, or phone.",
      "Click on a user to see their order history and details.",
      "Go to Users > Partners to manage partner accounts.",
    ],
    tips: [
      "Partners can log in and see their own orders/commissions.",
      "Only Super Admin can manage partners.",
    ],
  },
  {
    id: "shipping",
    title: "Shipping (Shiprocket)",
    icon: <Truck className="h-5 w-5" />,
    color: "bg-orange-50 text-orange-700 border-orange-200",
    link: "/shiprocket-settings",
    steps: [
      "Go to Settings > Shiprocket Settings.",
      "Enter your Shiprocket API credentials: Email, Password.",
      "Click 'Get Token' to authenticate.",
      "Toggle 'Enable Shiprocket' ON.",
      "Choose Booking Mode:",
      "  AUTO = Orders auto-sync to Shiprocket when placed.",
      "  MANUAL = You manually sync from Order Details page.",
      "Set Default Pickup Address (warehouse location).",
      "Set Default Estimated Weight for shipments.",
      "Save settings.",
      "When an order ships, Shiprocket auto-assigns AWB code and courier.",
      "Track shipments using the 'Track Live' link on order details.",
    ],
    tips: [
      "Start with MANUAL mode to understand the flow.",
      "Switch to AUTO mode once you're comfortable.",
      "Always verify pickup address before enabling.",
      "Test with a dummy order first.",
    ],
  },
  {
    id: "email-marketing",
    title: "Email Marketing",
    icon: <Mail className="h-5 w-5" />,
    color: "bg-red-50 text-red-700 border-red-200",
    link: "/email-marketing",
    steps: [
      "Go to Email Marketing page from sidebar.",
      "Check SMTP status at the top (green = configured, red = not configured).",
      "Click 'New Campaign' to create a campaign.",
      "Choose a template: Blank, Welcome, Sale, Newsletter.",
      "Enter your Email Subject.",
      "Edit the HTML content using the editor.",
      "Use placeholders: {{STORE_NAME}}, {{USER_NAME}}, {{SUBJECT}}, {{SHOP_URL}}, {{UNSUBSCRIBE_URL}}.",
      "Preview the email in the right sidebar.",
      "Send a Test Email first to verify it looks correct.",
      "Click 'Save as Draft' to save the campaign.",
      "From the campaign list, click 'Send' to send to all users (max 100 per batch).",
      "View delivery status: Sent, Failed, Pending per email.",
      "Click 'Retry Failed' to retry failed emails (up to 3 retries).",
      "Click 'Refresh' to get updated delivery status.",
    ],
    tips: [
      "Always send a Test Email first before bulk sending.",
      "Max 100 emails per campaign batch.",
      "Failed emails auto-retry up to 3 times.",
      "Check SMTP settings in server .env if not configured.",
      "Use {{USER_NAME}} to personalize emails.",
    ],
  },
  {
    id: "fragrance-quiz",
    title: "Fragrance Finder (Quiz)",
    icon: <Sparkles className="h-5 w-5" />,
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    link: "/fragrance-quiz",
    steps: [
      "Go to Fragrance Finder > Dashboard to see quiz overview.",
      "Go to Questions to manage quiz questions.",
      "Click 'Add Question' to create a new question.",
      "Enter the question text (e.g., 'What mood are you in?').",
      "Add answer options for the question.",
      "For each option, select which products should be recommended.",
      "Go to Rules to set recommendation rules.",
      "Rules map answer combinations to specific product recommendations.",
      "Go to Analytics to see quiz performance data.",
      "Go to Responses to see user quiz submissions and their recommended products.",
    ],
    tips: [
      "Start with 5-6 questions for best results.",
      "Each question should have 3-4 options.",
      "Map products to multiple options for better recommendations.",
      "Check Analytics weekly to see which products get recommended most.",
    ],
  },
  {
    id: "categories",
    title: "Categories & Attributes",
    icon: <Tags className="h-5 w-5" />,
    color: "bg-teal-50 text-teal-700 border-teal-200",
    link: "/categories",
    steps: [
      "Go to Products > Categories to manage categories.",
      "Click 'Add Category' to create a new category.",
      "Enter Category Name and upload a Category Image.",
      "Set parent category for sub-categories (leave empty for top-level).",
      "Go to Products > Attributes to manage product attributes (e.g., Size, Color).",
      "Create an attribute, then add attribute values (e.g., Color > Red, Blue, Green).",
      "These attributes are used when creating product variants.",
    ],
    tips: [
      "Organize categories hierarchically (Parent > Child).",
      "Upload attractive category images.",
      "Keep attribute names simple: 'Size', 'Color', 'Material'.",
    ],
  },
  {
    id: "banners",
    title: "Banners & Video Reels",
    icon: <Video className="h-5 w-5" />,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    link: "/banners",
    steps: [
      "Go to Banners to manage homepage banners.",
      "Upload desktop and mobile banner images.",
      "Set banner position/order for display sequence.",
      "Go to Video Reels to manage product video reels.",
      "Click 'Create Reel' to upload a new video.",
      "Enter title, upload video file (MP4/WebM).",
      "Select which products this reel is associated with.",
      "Drag to reorder reels.",
      "Toggle active/inactive to show/hide reels.",
    ],
    tips: [
      "Keep banner images optimized (under 500KB).",
      "Upload both desktop and mobile versions.",
      "Video reels appear on product pages.",
    ],
  },
  {
    id: "content",
    title: "Content & Support",
    icon: <FileText className="h-5 w-5" />,
    color: "bg-pink-50 text-pink-700 border-pink-200",
    link: "/faq-management",
    steps: [
      "Go to Support > Contact to see customer inquiries.",
      "Click on any contact submission to view full message.",
      "Update status (New, In Progress, Resolved) and add notes.",
      "Go to Support > Reviews to manage product reviews.",
      "Approve or reject customer reviews.",
      "Go to Support > FAQ to manage frequently asked questions.",
      "Click 'Add FAQ' to create a new FAQ entry.",
      "Enter question and answer, set display order.",
    ],
    tips: [
      "Respond to contact submissions within 24 hours.",
      "Only approve genuine reviews.",
      "Keep FAQs updated based on common customer questions.",
    ],
  },
  {
    id: "settings",
    title: "Settings Overview",
    icon: <Settings className="h-5 w-5" />,
    color: "bg-gray-50 text-gray-700 border-gray-200",
    link: "/settings",
    steps: [
      "Go to Settings > General to configure store name, logo, contact info.",
      "Go to Price Visibility to show/hide prices for guests.",
      "Go to MOQ Settings to set Minimum Order Quantity per product.",
      "Go to Pricing Slabs for bulk/wholesale pricing tiers.",
      "Go to Payment Settings to configure Razorpay keys.",
      "Go to Payment Gateway to manage gateway credentials.",
      "Go to Shiprocket Settings for shipping integration.",
      "Go to Shipping Settings for shipping rates/methods.",
    ],
    tips: [
      "Test payment settings with Razorpay test keys first.",
      "MOQ helps enforce minimum order quantities.",
      "Pricing Slabs enable wholesale/bulk discounts.",
    ],
  },
  {
    id: "bundles",
    title: "Bundle Campaigns",
    icon: <Layers className="h-5 w-5" />,
    color: "bg-amber-50 text-amber-700 border-amber-200",
    link: "/bundles",
    steps: [
      "Go to Bundle Management to create product bundles.",
      "Click 'Create Campaign' to start a new bundle.",
      "Set bundle name, discount percentage, and date range.",
      "Select products to include in the bundle.",
      "Set which products must be bought together.",
      "Activate the campaign when ready.",
    ],
    tips: [
      "Bundles increase average order value.",
      "Use limited-time bundles for urgency.",
      "Test bundle pricing before going live.",
    ],
  },
  {
    id: "secret",
    title: "Secret Collection",
    icon: <Shield className="h-5 w-5" />,
    color: "bg-slate-50 text-slate-700 border-slate-200",
    link: "/secret-access",
    steps: [
      "Go to Secret Collection > Dashboard for overview.",
      "Go to Pending Orders to see pending secret access requests.",
      "Approve or reject access requests.",
      "Go to Issued Codes to see all issued access codes.",
      "Secret collection products are only visible to approved users.",
    ],
    tips: [
      "Use secret collection for exclusive/limited products.",
      "Review pending requests regularly.",
      "Track which users have access.",
    ],
  },
];

export default function AdminHelpPage() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = sections.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.steps.some((step) =>
        step.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" /> Admin Guide
        </h1>
        <p className="text-muted-foreground text-sm">
          Complete guide on how to use every feature in the admin panel
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search features or steps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {filteredSections.map((section) => (
          <Card key={section.id} className="overflow-hidden">
            <button
              onClick={() =>
                setOpenSection(openSection === section.id ? null : section.id)
              }
              className="w-full"
            >
              <CardContent className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${section.color}`}>
                    {section.icon}
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">{section.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {section.steps.length} steps
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {section.link && (
                    <a
                      href={section.link}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Go to page <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {openSection === section.id ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </button>

            {openSection === section.id && (
              <CardContent className="p-4 pt-0 border-t">
                <div className="mt-4 space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    How to use:
                  </h4>
                  <ol className="space-y-2">
                    {section.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">
                          {i + 1}
                        </span>
                        <span className="text-gray-700 leading-relaxed pt-0.5">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>

                  {section.tips && section.tips.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <h5 className="font-medium text-sm text-amber-800 mb-2">
                        Tips:
                      </h5>
                      <ul className="space-y-1">
                        {section.tips.map((tip, i) => (
                          <li
                            key={i}
                            className="text-xs text-amber-700 flex items-start gap-2"
                          >
                            <span className="text-amber-500 mt-0.5">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredSections.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">No results found</p>
            <p className="text-muted-foreground text-sm">
              Try a different search term
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Reference */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">Quick Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground mb-1">Placeholders for Email Marketing:</p>
              <ul className="space-y-1 text-xs">
                <li><code className="bg-white px-1 rounded">{"{{STORE_NAME}}"}</code> - Your store name</li>
                <li><code className="bg-white px-1 rounded">{"{{USER_NAME}}"}</code> - Customer's name</li>
                <li><code className="bg-white px-1 rounded">{"{{SUBJECT}}"}</code> - Email subject</li>
                <li><code className="bg-white px-1 rounded">{"{{SHOP_URL}}"}</code> - Website URL</li>
                <li><code className="bg-white px-1 rounded">{"{{UNSUBSCRIBE_URL}}"}</code> - Unsubscribe link</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-muted-foreground mb-1">Order Status Flow:</p>
              <ul className="space-y-1 text-xs">
                <li>PENDING → PROCESSING → SHIPPED → DELIVERED</li>
                <li>PENDING/PROCESSING → CANCELLED</li>
                <li>SHIPPED → RETURN REQUESTED → REFUNDED</li>
              </ul>
              <p className="font-medium text-muted-foreground mb-1 mt-3">File Size Limits:</p>
              <ul className="space-y-1 text-xs">
                <li>Product Images: 10MB each</li>
                <li>Product Videos: 100MB each</li>
                <li>Email Batch: 100 emails max</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
