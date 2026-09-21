import api from "./api";

// Types
interface LoginCredentials {
  email: string;
  password: string;
}

interface AdminUpdateData {
  firstName?: string;
  lastName?: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

interface ProductData {
  name: string;
  description: string;
  categoryId?: string;
  categoryIds?: string[] | string;
  primaryCategoryId?: string;
  featured?: boolean;
  isActive?: boolean;
  hasVariants?: boolean;
  slug?: string;
  regularPrice?: number | string;
  basePrice?: number | string;
  price?: number | string;
  salePrice?: number | string;
  hasSale?: boolean;
  stock?: number | string;
  quantity?: number | string;
  sku?: string;
  variants?: Array<ProductVariantData>;
  [key: string]: any;
}

interface ProductVariantData {
  id?: string;
  name?: string;
  sku: string;
  sizeId?: string;
  colorId?: string;
  price: number | string;
  salePrice?: number | string | null;
  stock: number | string;
  quantity?: number | string;
  [key: string]: any;
}

interface StoreSettings {
  storeName?: string;
  storeEmail?: string;
  storePhone?: string;
  storeAddress?: string;
  currency?: string;
  taxRate?: number;
  enableTax?: boolean;
  logo?: File | null;
  favicon?: File | null;
  shippingFee?: number;
  freeShippingThreshold?: number;
  enableFreeShipping?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  colorTheme?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}

// Admin Authentication
export const adminAuth = {
  login: (credentials: LoginCredentials) => {
    return api.post("/api/admin/login", credentials);
  },
  getProfile: () => {
    return api.get("/api/admin/profile");
  },
  updateProfile: (data: AdminUpdateData) => {
    return api.patch("/api/admin/profile", data);
  },
  changePassword: (data: PasswordChangeData) => {
    return api.post("/api/admin/change-password", data);
  },
};

// Admin User Management
export const adminUsers = {
  getAllAdmins: () => {
    return api.get("/api/admin/admins");
  },
  updateAdminRole: (
    adminId: string,
    data: { role: string; isActive?: boolean }
  ) => {
    return api.patch(`/api/admin/admins/${adminId}`, data);
  },
  deleteAdmin: (adminId: string) => {
    return api.delete(`/api/admin/admins/${adminId}`);
  },
  registerAdmin: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    customPermissions?: Array<{ resource: string; action: string }>;
  }) => {
    return api.post("/api/admin/register", data);
  },
  updateAdminPermissions: (
    adminId: string,
    data: { permissions: Array<{ resource: string; action: string }> }
  ) => {
    return api.post(`/api/admin/admins/${adminId}/update-permissions`, data);
  },
};

// Customer Users Management
export const customerUsers = {
  getUsers: (
    params: { page?: number; limit?: number; search?: string } = {}
  ) => {
    return api.get("/api/admin/users", { params });
  },
  getUserById: (userId: string) => {
    return api.get(`/api/admin/users/${userId}`);
  },
  updateUserStatus: (userId: string, isActive: boolean) => {
    return api.patch(`/api/admin/users/${userId}/status`, { isActive });
  },
  verifyUserEmail: (userId: string) => {
    return api.post(`/api/admin/users/${userId}/verify-email`);
  },
  deleteUser: (userId: string) => {
    return api.delete(`/api/admin/users/${userId}`);
  },
  updateUserDetails: (
    userId: string,
    data: { name?: string; phone?: string; email?: string }
  ) => {
    return api.patch(`/api/admin/users/${userId}`, data);
  },
};

// Product Management
export const products = {
  getProducts: (params: ProductQueryParams = {}) => {
    return api.get("/api/admin/products", { params });
  },
  getProductById: (productId: string) => {
    return api.get(`/api/admin/products/${productId}`);
  },
  getFeaturedProducts: (limit: number = 8) => {
    return api.get(`/api/public/products?featured=true&limit=${limit}`);
  },
  getProductsByType: (productType: string, limit: number = 8) => {
    return api.get(`/api/admin/products/type/${productType}?limit=${limit}`);
  },
  createProduct: (data: ProductData) => {
    // Check if data is already FormData
    if (data instanceof FormData) {
      return api.post("/api/admin/products", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }

    const formData = new FormData();

    // Convert JSON object to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Handle arrays and objects by stringifying them
        if (typeof value === "object" && !(value instanceof File)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    });

    return api.post("/api/admin/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  updateProduct: (productId: string, data: ProductData) => {
    // Check if data is already FormData
    if (data instanceof FormData) {
      return api.patch(`/api/admin/products/${productId}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }

    const formData = new FormData();

    // Convert JSON object to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Handle arrays and objects by stringifying them
        if (typeof value === "object" && !(value instanceof File)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    });

    return api.patch(`/api/admin/products/${productId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  deleteProduct: (productId: string, force: boolean = false) => {
    return api.delete(
      `/api/admin/products/${productId}${force ? "?force=true" : ""}`
    );
  },
  // Product Images
  uploadImage: (
    productId: string,
    imageFile: File,
    isPrimary: boolean = false
  ) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("isPrimary", isPrimary.toString());

    return api.post(`/api/admin/products/${productId}/images`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  deleteImage: (imageId: string) => {
    return api.delete(`/api/admin/products/images/${imageId}`);
  },
  // Product Variants
  manageVariants: (
    productId: string,
    data: {
      variants: ProductVariantData[];
      variantsToDelete?: string[];
    }
  ) => {
    return api.post(`/api/admin/products/${productId}/bulk-variants`, data);
  },
  createVariant: (productId: string, variantData: ProductVariantData) => {
    return api.post(`/api/admin/products/${productId}/variants`, variantData);
  },
  updateVariant: (variantId: string, variantData: ProductVariantData) => {
    return api.patch(`/api/admin/variants/${variantId}`, variantData);
  },
  deleteVariant: (variantId: string, force: boolean = false) => {
    return api.delete(
      `/api/admin/variants/${variantId}${force ? "?force=true" : ""}`
    );
  },
  getVariantsByProductId: (productId: string) => {
    return api.get(`/api/admin/products/${productId}/variants`);
  },
  // Variant Images
  uploadVariantImage: (
    variantId: string,
    imageFile: File,
    isPrimary?: boolean
  ) => {
    const formData = new FormData();
    formData.append("image", imageFile);

    // Only append isPrimary if it's explicitly set (true or false)
    // If undefined, let backend handle the decision
    if (isPrimary !== undefined) {
      formData.append("isPrimary", isPrimary.toString());
    }

    return api.post(`/api/admin/variants/${variantId}/images`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  deleteVariantImage: (imageId: string) => {
    return api.delete(`/api/admin/variants/images/${imageId}`);
  },
  setVariantImageAsPrimary: (imageId: string) => {
    return api.patch(`/api/admin/variants/images/${imageId}/set-primary`);
  },
  reorderVariantImages: (
    variantId: string,
    imageOrders: Array<{ imageId: string; order: number }>
  ) => {
    return api.patch(`/api/admin/variants/${variantId}/images/reorder`, {
      imageOrders,
    });
  },
};

// Colors Management
export const colors = {
  getColors: (params = {}) => {
    return api.get("/api/admin/colors", { params });
  },
  getColorById: (colorId: string) => {
    return api.get(`/api/admin/colors/${colorId}`);
  },
  createColor: (data: {
    name: string;
    hexCode?: string;
    description?: string;
    image?: File | null;
  }) => {
    const formData = new FormData();
    formData.append("name", data.name);
    if (data.hexCode) formData.append("hexCode", data.hexCode);
    if (data.description) formData.append("description", data.description);
    if (data.image) formData.append("image", data.image);

    return api.post("/api/admin/colors", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  updateColor: (
    colorId: string,
    data: {
      name?: string;
      hexCode?: string;
      description?: string;
      image?: File | null;
    }
  ) => {
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.hexCode !== undefined)
      formData.append("hexCode", data.hexCode || "");
    if (data.description) formData.append("description", data.description);
    if (data.image) formData.append("image", data.image);

    return api.patch(`/api/admin/colors/${colorId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  deleteColor: (colorId: string, force: boolean = false) => {
    return api.delete(
      `/api/admin/colors/${colorId}${force ? "?force=true" : ""}`
    );
  },
};

// Inventory Management
export const inventory = {
  addInventory: (data: {
    variantId: string;
    quantity: number;
    notes?: string;
    purchasePrice?: number;
    supplier?: string;
  }) => {
    return api.post("/api/admin/inventory/add", data);
  },
  removeInventory: (data: {
    variantId: string;
    quantity: number;
    reason: string;
    notes?: string;
  }) => {
    return api.post("/api/admin/inventory/remove", data);
  },
  getInventoryHistory: (
    params: {
      page?: number;
      limit?: number;
      variantId?: string;
      productId?: string;
      type?: string;
    } = {}
  ) => {
    return api.get("/api/admin/inventory/history", { params });
  },
  getInventoryAlerts: async (threshold = 5) => {
    try {
      const response = await api.get(
        `/api/admin/inventory-alerts?threshold=${threshold}`
      );

      // Check if data is nested in a success response wrapper
      if (response.data.success && response.data.data) {
        // Return the data in the expected format for direct use
        return {
          data: response.data.data,
        };
      } else if (response.data.statusCode === 200 && response.data.data) {
        // Handle alternative format with statusCode
        return {
          data: response.data.data,
        };
      }

      // If no special structure, just return the original response
      return response.data;
    } catch (error) {
      console.error("Error fetching inventory alerts:", error);
      throw error;
    }
  },
};

// Sizes Management
export const sizes = {
  getSizes: (params = {}) => {
    return api.get("/api/admin/sizes", { params });
  },
  getSizeById: (sizeId: string) => {
    return api.get(`/api/admin/sizes/${sizeId}`);
  },
  createSize: (data: {
    name: string;
    order?: number;
    description?: string;
  }) => {
    return api.post("/api/admin/sizes", data);
  },
  updateSize: (
    sizeId: string,
    data: {
      name?: string;
      order?: number;
      description?: string;
    }
  ) => {
    return api.patch(`/api/admin/sizes/${sizeId}`, data);
  },
  deleteSize: (sizeId: string, force: boolean = false) => {
    return api.delete(
      `/api/admin/sizes/${sizeId}${force ? "?force=true" : ""}`
    );
  },
};

// Category Management
export const categories = {
  getCategories: () => {
    return api.get("/api/admin/categories");
  },
  getCategoryById: (categoryId: string) => {
    return api.get(`/api/admin/categories/${categoryId}`);
  },
  createCategory: (data: FormData) => {
    return api.post("/api/admin/categories", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  updateCategory: (categoryId: string, data: FormData) => {
    return api.patch(`/api/admin/categories/${categoryId}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  deleteCategory: (categoryId: string, force: boolean = false) => {
    return api.delete(
      `/api/admin/categories/${categoryId}${force ? "?force=true" : ""}`
    );
  },
};

// Order Management
export const orders = {
  getOrders: (
    params: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
      sortBy?: string;
      order?: "asc" | "desc";
    } = {}
  ) => {
    return api.get("/api/admin/orders", { params });
  },
  getOrderById: (orderId: string) => {
    return api.get(`/api/admin/orders/${orderId}`);
  },
  updateOrderStatus: (orderId: string, data: { status: string }) => {
    return api.patch(`/api/admin/orders/${orderId}/status`, data);
  },
  getCouriersForOrder: (orderId: string) => {
    return api.get(`/api/admin/shiprocket/orders/${orderId}/couriers`);
  },
  getOrderWarehouseOptions: (orderId: string) => {
    return api.get(`/api/admin/shiprocket/orders/${orderId}/warehouse-options`);
  },
  syncToShiprocket: (
    orderId: string,
    data?: { courierId?: number | string; warehouseId?: string }
  ) => {
    return api.post(`/api/admin/shiprocket/orders/${orderId}/sync`, data);
  },
  getOrderTracking: (orderId: string) => {
    return api.get(`/api/admin/shiprocket/orders/${orderId}/tracking`);
  },
  getShippingLabel: (orderId: string) => {
    return api.get(`/api/admin/shiprocket/orders/${orderId}/label`);
  },
  getOrderInvoice: (orderId: string) => {
    return api.get(`/api/admin/shiprocket/orders/${orderId}/invoice`);
  },
  cancelShiprocketShipment: (orderId: string) => {
    return api.post(`/api/admin/shiprocket/orders/${orderId}/cancel`);
  },
  getOrderStats: async () => {
    try {
      const response = await api.get("/api/admin/orders-stats");

      // Check if data is nested in a success response wrapper
      if (response.data.success && response.data.data) {
        // Return the data in the expected format for direct use
        return {
          data: response.data.data,
        };
      } else if (response.data.statusCode === 200 && response.data.data) {
        // Handle alternative format with statusCode
        return {
          data: response.data.data,
        };
      }

      // If no special structure, just return the original response
      return response;
    } catch (error) {
      console.error("Error getting order stats:", error);
      throw error;
    }
  },
};

// Coupons Management
export const coupons = {
  getCoupons: (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      isActive?: boolean;
    } = {}
  ) => {
    return api.get("/api/admin/coupons", { params });
  },
  getCouponById: (couponId: string) => {
    return api.get(`/api/admin/coupons/${couponId}`);
  },
  createCoupon: (data: {
    code: string;
    description?: string;
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
    minOrderAmount?: number;
    maxUses?: number;
    startDate: string;
    endDate?: string;
    isActive?: boolean;
    partners?: Array<{ partnerId: string; commission?: number }>;
  }) => {
    return api.post("/api/admin/coupons", data);
  },
  updateCoupon: (
    couponId: string,
    data: {
      code?: string;
      description?: string;
      discountType?: "PERCENTAGE" | "FIXED_AMOUNT";
      discountValue?: number;
      minOrderAmount?: number;
      maxUses?: number;
      startDate?: string;
      endDate?: string;
      isActive?: boolean;
      partners?: Array<{ partnerId: string; commission?: number }>;
    }
  ) => {
    return api.patch(`/api/admin/coupons/${couponId}`, data);
  },
  deleteCoupon: (couponId: string) => {
    return api.delete(`/api/admin/coupons/${couponId}`);
  },
};

// Partners Management
export const partners = {
  getApprovedPartners: () => {
    return api.get("/api/admin/partners/approved");
  },
  getPartnerById: (partnerId: string) => {
    return api.get(`/api/admin/partners/${partnerId}`);
  },
  markPaymentAsPaid: (
    earningId: string,
    data: { notes: string; year: number; month: number; partnerId?: string }
  ) => {
    return api.patch(
      `/api/admin/partners/earnings/${earningId}/mark-paid`,
      data
    );
  },
  getPartnerEarnings: (
    partnerId: string,
    params?: { year?: number; month?: number }
  ) => {
    return api.get(`/api/admin/partners/${partnerId}/earnings`, { params });
  },
};

// Reviews Management
export const reviews = {
  getReviews: (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      productId?: string;
      rating?: number;
      sortBy?: string;
      order?: "asc" | "desc";
    } = {}
  ) => {
    return api.get("/api/admin/reviews", { params });
  },
  getReviewById: (reviewId: string) => {
    return api.get(`/api/admin/reviews/${reviewId}`);
  },
  updateReview: (
    reviewId: string,
    data: {
      status?: "APPROVED" | "REJECTED" | "PENDING";
      featured?: boolean;
      adminComment?: string;
    }
  ) => {
    return api.patch(`/api/admin/reviews/${reviewId}`, data);
  },
  deleteReview: (reviewId: string) => {
    return api.delete(`/api/admin/reviews/${reviewId}`);
  },
  replyToReview: (reviewId: string, comment: string) => {
    return api.post(`/api/admin/reviews/${reviewId}/reply`, { comment });
  },
  getReviewStats: () => {
    return api.get("/api/admin/review-stats");
  },
};

// Settings Management
export const settings = {
  getSettings: () => {
    return api.get("/api/admin/settings");
  },
  updateSettings: (data: StoreSettings) => {
    const formData = new FormData();

    // Process text and boolean fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === "logo" || key === "favicon") {
        // Skip file fields for separate handling
        return;
      } else if (key === "socialLinks" || key === "colorTheme") {
        // Handle nested objects
        if (value) formData.append(key, JSON.stringify(value));
      } else if (value !== undefined) {
        formData.append(key, String(value));
      }
    });

    // Process file fields
    if (data.logo) formData.append("logo", data.logo);
    if (data.favicon) formData.append("favicon", data.favicon);

    return api.patch("/api/admin/settings", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getMockSettings: () => {
    return Promise.resolve({
      data: {
        success: true,
        data: {
          settings: {
            storeName: "MWP SUPPLEMENTS",
            storeEmail: "support@mwpsupplements.com",
            storePhone: "+91 76783 36268",
            storeAddress: "India",
            currency: "INR",
            taxRate: 18,
            enableTax: true,
            shippingFee: 99,
            freeShippingThreshold: 999,
            enableFreeShipping: true,
            metaTitle: "MWP SUPPLEMENTS — Men | Women | Power",
            metaDescription: "Clinical-grade sports nutrition and wellness formulations at MWP SUPPLEMENTS",
            socialLinks: {
              facebook: "https://facebook.com/yourstore",
              twitter: "https://twitter.com/yourstore",
              instagram: "https://instagram.com/yourstore",
              youtube: "",
            },
            colorTheme: {
              primary: "#3b82f6",
              secondary: "#10b981",
              accent: "#8b5cf6",
            },
          },
        },
        message: "Settings fetched successfully",
      },
    });
  },
  // Mock method for simulating updating settings
  updateMockSettings: (data: StoreSettings) => {
    // Return a promise that resolves with success
    return Promise.resolve({
      data: {
        success: true,
        data: {
          settings: data,
        },
        message: "Settings updated successfully",
      },
    });
  },
};

// Flash Sales Management
export const flashSales = {
  getFlashSales: () => {
    return api.get("/api/admin/flash-sales");
  },
  getFlashSaleById: (flashSaleId: string) => {
    return api.get(`/api/admin/flash-sales/${flashSaleId}`);
  },
  createFlashSale: (data: {
    name: string;
    startTime: string;
    endTime: string;
    discountPercentage: number;
    maxQuantity?: number;
    isActive?: boolean;
    productIds?: string[];
  }) => {
    return api.post("/api/admin/flash-sales", data);
  },
  updateFlashSale: (
    flashSaleId: string,
    data: {
      name?: string;
      startTime?: string;
      endTime?: string;
      discountPercentage?: number;
      maxQuantity?: number;
      isActive?: boolean;
      productIds?: string[];
    }
  ) => {
    return api.patch(`/api/admin/flash-sales/${flashSaleId}`, data);
  },
  deleteFlashSale: (flashSaleId: string) => {
    return api.delete(`/api/admin/flash-sales/${flashSaleId}`);
  },
  toggleFlashSaleStatus: (flashSaleId: string) => {
    return api.patch(`/api/admin/flash-sales/${flashSaleId}/toggle-status`);
  },
};

// Brands Management
export const brands = {
  getBrands: (params: any = {}) => {
    return api.get("/api/admin/brands", { params });
  },
  createBrand: (data: { name: string; image: File; tags?: string[] }) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("image", data.image);
    if (data.tags) data.tags.forEach((tag) => formData.append("tags", tag));
    return api.post("/api/admin/brands", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  updateBrand: (
    brandId: string,
    data: { name?: string; image?: File; tags?: string[] }
  ) => {
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.image) formData.append("image", data.image);
    if (data.tags) data.tags.forEach((tag) => formData.append("tags", tag));
    return api.patch(`/api/admin/brands/${brandId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteBrand: (brandId: string) => {
    return api.delete(`/api/admin/brands/${brandId}`);
  },
  removeProductFromBrand: (brandId: string, productId: string) => {
    return api.delete(`/api/admin/brands/${brandId}/products/${productId}`);
  },
};

// Referrals Management
export const referrals = {
  getAllReferrals: (params?: any) => {
    return api.get("/api/admin/referrals", { params });
  },
  getReferralStats: () => {
    return api.get("/api/admin/referrals/stats");
  },
  getReferralById: (referralId: string) => {
    return api.get(`/api/admin/referrals/${referralId}`);
  },
  updateReferralStatus: (referralId: string, data: { status?: string; rewardAmount?: number }) => {
    return api.patch(`/api/admin/referrals/${referralId}`, data);
  },
};

// Return Requests Management
export const returnRequests = {
  getAllReturnRequests: (params?: any) => {
    return api.get("/api/admin/returns", { params });
  },
  getReturnStats: () => {
    return api.get("/api/admin/returns/stats");
  },
  getReturnRequestById: (returnId: string) => {
    return api.get(`/api/admin/returns/${returnId}`);
  },
  updateReturnRequestStatus: (
    returnId: string,
    data: { status: string; adminNotes?: string }
  ) => {
    return api.patch(`/api/admin/returns/${returnId}`, data);
  },
  getReturnSettings: () => {
    return api.get("/api/admin/returns/settings");
  },
  updateReturnSettings: (data: {
    isEnabled?: boolean;
    returnWindowDays?: number;
  }) => {
    return api.patch("/api/admin/returns/settings", data);
  },
};

// Attributes Management
export const attributes = {
  getAttributes: (params?: { search?: string }) => {
    return api.get("/api/admin/attributes", { params });
  },
  getAttributeById: (attributeId: string) => {
    return api.get(`/api/admin/attributes/${attributeId}`);
  },
  createAttribute: (data: { name: string; inputType: string }) => {
    return api.post("/api/admin/attributes", data);
  },
  updateAttribute: (attributeId: string, data: { name?: string; inputType?: string }) => {
    return api.put(`/api/admin/attributes/${attributeId}`, data);
  },
  deleteAttribute: (attributeId: string) => {
    return api.delete(`/api/admin/attributes/${attributeId}`);
  },
  getAttributeValues: (attributeId: string) => {
    return api.get(`/api/admin/attributes/${attributeId}/values`);
  },
};

// Attribute Values Management
export const attributeValues = {
  getAttributeValues: (attributeId: string) => {
    return api.get(`/api/admin/attributes/${attributeId}/values`);
  },
  getAttributeValueById: (attributeValueId: string) => {
    return api.get(`/api/admin/attribute-values/${attributeValueId}`);
  },
  createAttributeValue: (
    attributeId: string,
    data: { value: string; hexCode?: string; image?: File }
  ) => {
    const formData = new FormData();
    formData.append("value", data.value);
    if (data.hexCode) formData.append("hexCode", data.hexCode);
    if (data.image) formData.append("image", data.image);

    return api.post(`/api/admin/attributes/${attributeId}/values`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  updateAttributeValue: (
    attributeValueId: string,
    data: { value: string; hexCode?: string; image?: File }
  ) => {
    const formData = new FormData();
    formData.append("value", data.value);
    if (data.hexCode !== undefined) formData.append("hexCode", data.hexCode || "");
    if (data.image) formData.append("image", data.image);

    return api.put(`/api/admin/attribute-values/${attributeValueId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  deleteAttributeValue: (attributeValueId: string) => {
    return api.delete(`/api/admin/attribute-values/${attributeValueId}`);
  },
};

// Product Sections Management
export const productSections = {
  getProductSections: () => {
    return api.get("/api/admin/product-sections");
  },
  getProductSectionById: (sectionId: string) => {
    return api.get(`/api/admin/product-sections/${sectionId}`);
  },
  createProductSection: (data: any) => {
    const isFormData = data instanceof FormData;
    return api.post("/api/admin/product-sections", data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
  },
  updateProductSection: (sectionId: string, data: any) => {
    const isFormData = data instanceof FormData;
    return api.put(`/api/admin/product-sections/${sectionId}`, data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
  },
  deleteProductSection: (sectionId: string) => {
    return api.delete(`/api/admin/product-sections/${sectionId}`);
  },
  addProductToSection: (
    sectionId: string,
    data: { productId: string; displayOrder?: number }
  ) => {
    return api.post(`/api/admin/product-sections/${sectionId}/products`, data);
  },
  removeProductFromSection: (sectionId: string, productId: string) => {
    return api.delete(
      `/api/admin/product-sections/${sectionId}/products/${productId}`
    );
  },
  updateProductOrderInSection: (
    sectionId: string,
    data: { productOrders: Array<{ productId: string; displayOrder: number }> }
  ) => {
    return api.put(
      `/api/admin/product-sections/${sectionId}/products/order`,
      data
    );
  },
};

// Sub-Categories Management
export const subCategories = {
  getSubCategoriesByCategory: (categoryId: string) => {
    return api.get(`/api/admin/categories/${categoryId}/sub-categories`);
  },
  getSubCategoryById: (subCategoryId: string) => {
    return api.get(`/api/admin/sub-categories/${subCategoryId}`);
  },
  createSubCategory: (
    categoryId: string,
    data: { name: string; description?: string; image?: File }
  ) => {
    const formData = new FormData();
    formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    if (data.image) formData.append("image", data.image);

    return api.post(
      `/api/admin/categories/${categoryId}/sub-categories`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },
  updateSubCategory: (
    subCategoryId: string,
    data: { name?: string; description?: string; image?: File; isActive?: boolean }
  ) => {
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.description !== undefined)
      formData.append("description", data.description || "");
    if (data.image) formData.append("image", data.image);
    if (data.isActive !== undefined)
      formData.append("isActive", data.isActive.toString());

    return api.put(`/api/admin/sub-categories/${subCategoryId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  deleteSubCategory: (subCategoryId: string) => {
    return api.delete(`/api/admin/sub-categories/${subCategoryId}`);
  },
};

// Flavors Management
export const flavors = {
  getFlavors: (params = {}) => {
    return api.get("/api/admin/flavors", { params });
  },
  getFlavorById: (flavorId: string) => {
    return api.get(`/api/admin/flavors/${flavorId}`);
  },
  createFlavor: (data: {
    name: string;
    description?: string;
    image?: File | null;
  }) => {
    const formData = new FormData();
    formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    if (data.image) formData.append("image", data.image);

    return api.post("/api/admin/flavors", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  updateFlavor: (
    flavorId: string,
    data: {
      name?: string;
      description?: string;
      image?: File | null;
    }
  ) => {
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    if (data.image) formData.append("image", data.image);

    return api.patch(`/api/admin/flavors/${flavorId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  deleteFlavor: (flavorId: string, force: boolean = false) => {
    return api.delete(
      `/api/admin/flavors/${flavorId}${force ? "?force=true" : ""}`
    );
  },
};

// Weights Management
export const weights = {
  getWeights: (params = {}) => {
    return api.get("/api/admin/weights", { params });
  },
  getWeightById: (weightId: string) => {
    return api.get(`/api/admin/weights/${weightId}`);
  },
  createWeight: (data: { value: number; unit: string }) => {
    return api.post("/api/admin/weights", data);
  },
  updateWeight: (
    weightId: string,
    data: {
      value?: number;
      unit?: string;
    }
  ) => {
    return api.patch(`/api/admin/weights/${weightId}`, data);
  },
  deleteWeight: (weightId: string, force: boolean = false) => {
    return api.delete(
      `/api/admin/weights/${weightId}${force ? "?force=true" : ""}`
    );
  },
};

// Banners Management
export const banners = {
  getBanners: (params = {}) => {
    return api.get("/api/admin/banners", { params });
  },
  getBannerById: (bannerId: string) => {
    return api.get(`/api/admin/banners/${bannerId}`);
  },
  createBanner: (data: {
    title?: string;
    subtitle?: string;
    link?: string;
    position?: number;
    isPublished?: boolean;
    isActive?: boolean;
    desktopImage: File;
    mobileImage: File;
  }) => {
    const formData = new FormData();
    if (data.title) formData.append("title", data.title);
    if (data.subtitle) formData.append("subtitle", data.subtitle);
    if (data.link) formData.append("link", data.link);
    if (data.position !== undefined)
      formData.append("position", data.position.toString());
    if (data.isPublished !== undefined)
      formData.append("isPublished", data.isPublished.toString());
    if (data.isActive !== undefined)
      formData.append("isActive", data.isActive.toString());
    formData.append("desktopImage", data.desktopImage);
    formData.append("mobileImage", data.mobileImage);

    return api.post("/api/admin/banners", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  updateBanner: (
    bannerId: string,
    data: {
      title?: string;
      subtitle?: string;
      link?: string;
      position?: number;
      isPublished?: boolean;
      isActive?: boolean;
      desktopImage?: File | null;
      mobileImage?: File | null;
    }
  ) => {
    const formData = new FormData();
    if (data.title !== undefined) formData.append("title", data.title || "");
    if (data.subtitle !== undefined)
      formData.append("subtitle", data.subtitle || "");
    if (data.link !== undefined)
      formData.append("link", data.link || "/products");
    if (data.position !== undefined)
      formData.append("position", data.position.toString());
    if (data.isPublished !== undefined)
      formData.append("isPublished", data.isPublished.toString());
    if (data.isActive !== undefined)
      formData.append("isActive", data.isActive.toString());
    if (data.desktopImage) formData.append("desktopImage", data.desktopImage);
    if (data.mobileImage) formData.append("mobileImage", data.mobileImage);

    return api.put(`/api/admin/banners/${bannerId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  deleteBanner: (bannerId: string) => {
    return api.delete(`/api/admin/banners/${bannerId}`);
  },
  togglePublishBanner: (bannerId: string) => {
    return api.patch(`/api/admin/banners/${bannerId}/publish`);
  },
};

// ==================== MOQ Services ====================
export const moq = {
  // Global MOQ
  getGlobalMOQ: () => {
    return api.get("/api/admin/moq/global");
  },
  setGlobalMOQ: (data: { minQuantity: number; isActive: boolean }) => {
    return api.post("/api/admin/moq/global", data);
  },

  // Product MOQ
  getProductMOQ: (productId: string) => {
    return api.get(`/api/admin/moq/product/${productId}`);
  },
  setProductMOQ: (productId: string, data: { minQuantity: number; isActive: boolean }) => {
    return api.post(`/api/admin/moq/product/${productId}`, data);
  },
  deleteProductMOQ: (productId: string) => {
    return api.delete(`/api/admin/moq/product/${productId}`);
  },

  // Variant MOQ
  getVariantMOQ: (variantId: string) => {
    return api.get(`/api/admin/moq/variant/${variantId}`);
  },
  setVariantMOQ: (variantId: string, data: { minQuantity: number; isActive: boolean }) => {
    return api.post(`/api/admin/moq/variant/${variantId}`, data);
  },
  deleteVariantMOQ: (variantId: string) => {
    return api.delete(`/api/admin/moq/variant/${variantId}`);
  },

  // Effective MOQ (for frontend)
  getEffectiveMOQ: (variantId: string) => {
    return api.get(`/api/admin/moq/effective/${variantId}`);
  },
};

// ==================== Pricing Slabs Services ====================
export const pricingSlabs = {
  // Get all slabs
  getAll: (params?: { productId?: string; variantId?: string }) => {
    return api.get("/api/admin/pricing-slabs", { params });
  },

  // Product slabs
  getProductSlabs: (productId: string) => {
    return api.get(`/api/admin/pricing-slabs/product/${productId}`);
  },

  // Variant slabs
  getVariantSlabs: (variantId: string) => {
    return api.get(`/api/admin/pricing-slabs/variant/${variantId}`);
  },

  // Create slab
  create: (data: {
    productId?: string | null;
    variantId?: string | null;
    minQty: number;
    maxQty?: number | null;
    price: number;
  }) => {
    return api.post("/api/admin/pricing-slabs", data);
  },

  // Update slab
  update: (id: string, data: {
    minQty?: number;
    maxQty?: number | null;
    price?: number;
  }) => {
    return api.put(`/api/admin/pricing-slabs/${id}`, data);
  },

  // Delete slab
  delete: (id: string) => {
    return api.delete(`/api/admin/pricing-slabs/${id}`);
  },

  // Get effective price (for frontend)
  getEffectivePrice: (variantId: string, quantity: number) => {
    return api.get(`/api/admin/pricing-slabs/effective/${variantId}`, {
      params: { quantity },
    });
  },
};

// ==================== Video Reels Services ====================
export const videoReels = {
  getReels: (params = {}) => {
    return api.get("/api/admin/video-reels", { params });
  },
  getReelById: (reelId: string) => {
    return api.get(`/api/admin/video-reels/${reelId}`);
  },
  createReel: (data: {
    title: string;
    isActive?: boolean;
    productIds?: string[];
    video: File;
  }) => {
    const formData = new FormData();
    formData.append("title", data.title);
    if (data.isActive !== undefined)
      formData.append("isActive", data.isActive.toString());
    if (data.productIds)
      formData.append("productIds", JSON.stringify(data.productIds));
    formData.append("video", data.video);

    return api.post("/api/admin/video-reels", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  updateReel: (
    reelId: string,
    data: {
      title?: string;
      position?: number;
      isActive?: boolean;
      productIds?: string[];
      video?: File | null;
    }
  ) => {
    const formData = new FormData();
    if (data.title) formData.append("title", data.title);
    if (data.position !== undefined)
      formData.append("position", data.position.toString());
    if (data.isActive !== undefined)
      formData.append("isActive", data.isActive.toString());
    if (data.productIds)
      formData.append("productIds", JSON.stringify(data.productIds));
    if (data.video) formData.append("video", data.video);

    return api.put(`/api/admin/video-reels/${reelId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteReel: (reelId: string) => {
    return api.delete(`/api/admin/video-reels/${reelId}`);
  },
  toggleActive: (reelId: string) => {
    return api.patch(`/api/admin/video-reels/${reelId}/toggle-active`);
  },
  getReelsByProductId: (productId: string) => {
    return api.get(`/api/admin/video-reels/product/${productId}`);
  },
};

// Bundle Campaign Management
export const bundles = {
  getBundles: (params: any = {}) => {
    return api.get("/api/admin/bundles", { params });
  },
  getBundleById: (id: string) => {
    return api.get(`/api/admin/bundles/${id}`);
  },
  createBundle: (data: FormData) => {
    return api.post("/api/admin/bundles", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  updateBundle: (id: string, data: FormData) => {
    return api.patch(`/api/admin/bundles/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteBundle: (id: string) => {
    return api.delete(`/api/admin/bundles/${id}`);
  },
  toggleStatus: (id: string) => {
    return api.patch(`/api/admin/bundles/${id}/toggle-status`);
  },
  duplicateBundle: (id: string) => {
    return api.post(`/api/admin/bundles/${id}/duplicate`);
  },
  previewProducts: (id: string, params: any = {}) => {
    return api.get(`/api/admin/bundles/${id}/preview-products`, { params });
  },
  getAnalytics: () => {
    return api.get("/api/admin/bundles/analytics");
  },
};

// Secret Collection Access
export const secretAccess = {
  getDashboard: () => {
    return api.get("/api/admin/secret-access/dashboard");
  },
  getPendingOrders: (params: any = {}) => {
    return api.get("/api/admin/secret-access/pending-orders", { params });
  },
  grantAccess: (data: { orderId: string; email: string; usageLimit?: number; expiryDays?: number }) => {
    return api.post("/api/admin/secret-access/grant", data);
  },
  listAccess: (params: any = {}) => {
    return api.get("/api/admin/secret-access", { params });
  },
  getById: (id: string) => {
    return api.get(`/api/admin/secret-access/${id}`);
  },
  revokeAccess: (id: string, reason?: string) => {
    return api.patch(`/api/admin/secret-access/${id}/revoke`, { reason });
  },
  reactivateAccess: (id: string) => {
    return api.patch(`/api/admin/secret-access/${id}/reactivate`);
  },
  extendExpiry: (id: string, expiryDays: number) => {
    return api.patch(`/api/admin/secret-access/${id}/extend-expiry`, { expiryDays });
  },
  increaseUsageLimit: (id: string, usageLimit: number) => {
    return api.patch(`/api/admin/secret-access/${id}/usage-limit`, { usageLimit });
  },
  resendEmail: (id: string) => {
    return api.post(`/api/admin/secret-access/${id}/resend-email`);
  },
};

// ─── Fragrance Quiz ────────────────────────────────────────────

export const fragranceQuiz = {
  // Settings
  getSettings: () => {
    return api.get("/api/admin/fragrance-quiz/settings");
  },
  updateSettings: (data: any) => {
    return api.put("/api/admin/fragrance-quiz/settings", data);
  },

  // Questions
  getQuestions: (params: any = {}) => {
    return api.get("/api/admin/fragrance-quiz/questions", { params });
  },
  createQuestion: (data: any) => {
    return api.post("/api/admin/fragrance-quiz/questions", data);
  },
  updateQuestion: (id: string, data: any) => {
    return api.put(`/api/admin/fragrance-quiz/questions/${id}`, data);
  },
  deleteQuestion: (id: string) => {
    return api.delete(`/api/admin/fragrance-quiz/questions/${id}`);
  },
  reorderQuestions: (questionIds: string[]) => {
    return api.patch("/api/admin/fragrance-quiz/questions/reorder", { questionIds });
  },

  // Options
  createOption: (questionId: string, data: any) => {
    return api.post(`/api/admin/fragrance-quiz/questions/${questionId}/options`, data);
  },
  updateOption: (id: string, data: any) => {
    return api.put(`/api/admin/fragrance-quiz/options/${id}`, data);
  },
  deleteOption: (id: string) => {
    return api.delete(`/api/admin/fragrance-quiz/options/${id}`);
  },

  // Rules
  getRules: (params: any = {}) => {
    return api.get("/api/admin/fragrance-quiz/rules", { params });
  },
  createRule: (data: any) => {
    return api.post("/api/admin/fragrance-quiz/rules", data);
  },
  updateRule: (id: string, data: any) => {
    return api.put(`/api/admin/fragrance-quiz/rules/${id}`, data);
  },
  deleteRule: (id: string) => {
    return api.delete(`/api/admin/fragrance-quiz/rules/${id}`);
  },
  toggleRuleStatus: (id: string) => {
    return api.patch(`/api/admin/fragrance-quiz/rules/${id}/toggle-status`);
  },

  // Analytics
  getAnalytics: (params: any = {}) => {
    return api.get("/api/admin/fragrance-quiz/analytics", { params });
  },

  // Responses
  getResponses: (params: any = {}) => {
    return api.get("/api/admin/fragrance-quiz/responses", { params });
  },
};

// ==================== Checkout Recommendations ====================
export const checkoutRecommendations = {
  get: () => {
    return api.get("/api/admin/checkout-recommendations");
  },
  set: (productIds: string[]) => {
    return api.put("/api/admin/checkout-recommendations", { productIds });
  },
};

// ==================== Email Marketing Services ====================
export const emailMarketing = {
  getSmtpSettings: () => {
    return api.get("/api/admin/email-marketing/smtp-settings");
  },
  getUserCount: () => {
    return api.get("/api/admin/email-marketing/user-count");
  },
  getCampaigns: (params = {}) => {
    return api.get("/api/admin/email-marketing/campaigns", { params });
  },
  getCampaignById: (campaignId: string) => {
    return api.get(`/api/admin/email-marketing/campaigns/${campaignId}`);
  },
  createCampaign: (data: { subject: string; htmlContent: string; plainText?: string }) => {
    return api.post("/api/admin/email-marketing/campaigns", data);
  },
  updateCampaign: (campaignId: string, data: { subject?: string; htmlContent?: string; plainText?: string }) => {
    return api.put(`/api/admin/email-marketing/campaigns/${campaignId}`, data);
  },
  deleteCampaign: (campaignId: string) => {
    return api.delete(`/api/admin/email-marketing/campaigns/${campaignId}`);
  },
  sendTestEmail: (data: { email: string; subject: string; htmlContent: string }) => {
    return api.post("/api/admin/email-marketing/test-email", data);
  },
  sendCampaign: (campaignId: string) => {
    return api.post(`/api/admin/email-marketing/campaigns/${campaignId}/send`);
  },
  retryFailedEmails: (campaignId: string) => {
    return api.post(`/api/admin/email-marketing/campaigns/${campaignId}/retry`);
  },
};

export const ingredients = {
  list: () => api.get("/api/admin/ingredients"),
  get: (id: string) => api.get(`/api/admin/ingredients/${id}`),
  create: (data: { name: string; benefit: string; displayOrder?: number; isActive?: boolean; image?: File | null }) => {
    const fd = new FormData();
    fd.append("name", data.name);
    fd.append("benefit", data.benefit);
    if (data.displayOrder !== undefined) fd.append("displayOrder", String(data.displayOrder));
    if (data.isActive !== undefined) fd.append("isActive", String(data.isActive));
    if (data.image) fd.append("image", data.image);
    return api.post("/api/admin/ingredients", fd, { headers: { "Content-Type": "multipart/form-data" } });
  },
  update: (id: string, data: { name?: string; benefit?: string; displayOrder?: number; isActive?: boolean; image?: File | null }) => {
    const fd = new FormData();
    if (data.name !== undefined) fd.append("name", data.name);
    if (data.benefit !== undefined) fd.append("benefit", data.benefit);
    if (data.displayOrder !== undefined) fd.append("displayOrder", String(data.displayOrder));
    if (data.isActive !== undefined) fd.append("isActive", String(data.isActive));
    if (data.image) fd.append("image", data.image);
    return api.put(`/api/admin/ingredients/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
  },
  remove: (id: string) => api.delete(`/api/admin/ingredients/${id}`),
  // master-library <-> product links (unused by current admin UI)
  getForProduct: (productId: string) =>
    api.get(`/api/admin/ingredients/library-links/${productId}`),
  setForProduct: (productId: string, ingredientIds: string[]) =>
    api.put(`/api/admin/ingredients/library-links/${productId}`, { ingredientIds }),
};

// Standalone per-product ingredients (name/type/image/description).
// The public page these feed is permanent: /ingredients/product/<productId>
interface ProductIngredientData {
  name: string;
  scientificName?: string;
  type?: string;
  keyBenefit?: string;
  source?: string;
  description: string;
  displayOrder?: number;
  image?: File | null;
}

export const productIngredients = {
  getForProduct: (productId: string) =>
    api.get(`/api/admin/product-ingredients/product/${productId}`),
  create: (productId: string, data: ProductIngredientData) => {
    const fd = new FormData();
    fd.append("name", data.name);
    if (data.scientificName) fd.append("scientificName", data.scientificName);
    if (data.type) fd.append("type", data.type);
    if (data.keyBenefit) fd.append("keyBenefit", data.keyBenefit);
    if (data.source) fd.append("source", data.source);
    fd.append("description", data.description);
    if (data.displayOrder !== undefined) fd.append("displayOrder", String(data.displayOrder));
    if (data.image) fd.append("image", data.image);
    return api.post(`/api/admin/product-ingredients/product/${productId}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  update: (itemId: string, data: Partial<ProductIngredientData>) => {
    const fd = new FormData();
    if (data.name !== undefined) fd.append("name", data.name);
    if (data.scientificName !== undefined) fd.append("scientificName", data.scientificName);
    if (data.type !== undefined) fd.append("type", data.type);
    if (data.keyBenefit !== undefined) fd.append("keyBenefit", data.keyBenefit);
    if (data.source !== undefined) fd.append("source", data.source);
    if (data.description !== undefined) fd.append("description", data.description);
    if (data.displayOrder !== undefined) fd.append("displayOrder", String(data.displayOrder));
    if (data.image) fd.append("image", data.image);
    return api.put(`/api/admin/product-ingredients/item/${itemId}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  remove: (itemId: string) => api.delete(`/api/admin/product-ingredients/item/${itemId}`),
  reorder: (productId: string, order: { id: string; displayOrder: number }[]) =>
    api.put(`/api/admin/product-ingredients/product/${productId}/reorder`, { order }),
};

export const certificates = {
  list: () => api.get("/api/admin/certificates"),
  create: (data: { title: string; displayOrder?: number; isActive?: boolean; file: File }) => {
    const fd = new FormData();
    fd.append("title", data.title);
    if (data.displayOrder !== undefined) fd.append("displayOrder", String(data.displayOrder));
    if (data.isActive !== undefined) fd.append("isActive", String(data.isActive));
    fd.append("file", data.file);
    return api.post("/api/admin/certificates", fd, { headers: { "Content-Type": "multipart/form-data" } });
  },
  update: (id: string, data: { title?: string; displayOrder?: number; isActive?: boolean; file?: File | null }) => {
    const fd = new FormData();
    if (data.title !== undefined) fd.append("title", data.title);
    if (data.displayOrder !== undefined) fd.append("displayOrder", String(data.displayOrder));
    if (data.isActive !== undefined) fd.append("isActive", String(data.isActive));
    if (data.file) fd.append("file", data.file);
    return api.put(`/api/admin/certificates/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
  },
  remove: (id: string) => api.delete(`/api/admin/certificates/${id}`),
};

export interface VerificationIngredientData {
  name: string;
  amount?: string;
  description?: string;
  origin?: string;
}

export interface VerificationData {
  productId?: string;
  productName?: string;
  productSlug?: string;
  productImage?: File | null;
  batchNumber?: string;
  lotNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  authenticityStatus?: "VERIFIED" | "UNVERIFIED" | "UNAVAILABLE";
  status?: "ACTIVE" | "INACTIVE" | "EXPIRED" | "SUSPENDED" | "REVOKED";
  tagline?: string;
  shortDescription?: string;
  description?: string;
  features?: string[];
  ingredients?: VerificationIngredientData[];
  origin?: string;
  badgeType?: string;
  badgeImage?: File | null;
  coa?: File | null;
  certificate?: File | null;
}

const buildVerificationFormData = (data: VerificationData) => {
  const fd = new FormData();
  if (data.productId !== undefined) fd.append("productId", data.productId);
  if (data.productName !== undefined) fd.append("productName", data.productName);
  if (data.productSlug !== undefined) fd.append("productSlug", data.productSlug);
  if (data.batchNumber !== undefined) fd.append("batchNumber", data.batchNumber);
  if (data.lotNumber !== undefined) fd.append("lotNumber", data.lotNumber);
  if (data.manufacturingDate !== undefined) fd.append("manufacturingDate", data.manufacturingDate);
  if (data.expiryDate !== undefined) fd.append("expiryDate", data.expiryDate);
  if (data.authenticityStatus !== undefined) fd.append("authenticityStatus", data.authenticityStatus);
  if (data.status !== undefined) fd.append("status", data.status);
  if (data.tagline !== undefined) fd.append("tagline", data.tagline);
  if (data.shortDescription !== undefined) fd.append("shortDescription", data.shortDescription);
  if (data.description !== undefined) fd.append("description", data.description);
  if (data.features !== undefined) fd.append("features", JSON.stringify(data.features));
  if (data.ingredients !== undefined) fd.append("ingredients", JSON.stringify(data.ingredients));
  if (data.origin !== undefined) fd.append("origin", data.origin);
  if (data.badgeType !== undefined) fd.append("badgeType", data.badgeType);
  if (data.productImage) fd.append("productImage", data.productImage);
  if (data.badgeImage) fd.append("badgeImage", data.badgeImage);
  if (data.coa) fd.append("coa", data.coa);
  if (data.certificate) fd.append("certificate", data.certificate);
  return fd;
};

export const verifications = {
  list: (params?: { search?: string; status?: string; page?: number; limit?: number }) =>
    api.get("/api/admin/verifications", { params }),
  get: (id: string) => api.get(`/api/admin/verifications/${id}`),
  getByCode: (code: string) => api.get(`/api/admin/verifications/code/${code}`),
  create: (data: VerificationData) =>
    api.post("/api/admin/verifications", buildVerificationFormData(data), {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: string, data: VerificationData) =>
    api.patch(`/api/admin/verifications/${id}`, buildVerificationFormData(data), {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateStatus: (id: string, status: string) =>
    api.patch(`/api/admin/verifications/${id}/status`, { status }),
  reactivate: (id: string) => api.patch(`/api/admin/verifications/${id}/reactivate`),
  remove: (id: string) => api.delete(`/api/admin/verifications/${id}`),
};
