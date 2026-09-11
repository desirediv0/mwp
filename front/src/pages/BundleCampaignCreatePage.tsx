import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  bundles,
  categories as categoriesApi,
  brands as brandsApi,
  attributes as attributesApi,
  products as productsApi,
} from "@/api/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Plus,
  Trash2,
  Loader2,
  Search,
  Upload,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PricingSlab {
  itemCount: number | "";
  price: number | "";
  label: string;
}

interface FormData {
  title: string;
  slug: string;
  banner: File | null;
  bannerPreview: string;
  description: string;
  bundleType: string;
  startDate: string;
  endDate: string;
  displayOrder: number | "";
  showOnWebsite: boolean;
  isActive: boolean;
  categoryIds: string[];
  subcategoryIds: string[];
  brandIds: string[];
  attributeValueIds: string[];
  productIds: string[];
  pricingSlabs: PricingSlab[];
  metaTitle: string;
  metaDescription: string;
}

const initialFormData: FormData = {
  title: "",
  slug: "",
  banner: null,
  bannerPreview: "",
  description: "",
  bundleType: "",
  startDate: "",
  endDate: "",
  displayOrder: "",
  showOnWebsite: true,
  isActive: true,
  categoryIds: [],
  subcategoryIds: [],
  brandIds: [],
  attributeValueIds: [],
  productIds: [],
  pricingSlabs: [{ itemCount: "", price: "", label: "" }],
  metaTitle: "",
  metaDescription: "",
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

interface BundleCampaignFormProps {
  mode: "create" | "edit";
  bundleId?: string;
}

export default function BundleCampaignCreatePage() {
  const { id } = useParams();
  if (id) {
    return <BundleCampaignForm mode="edit" bundleId={id} />;
  }
  return <BundleCampaignForm mode="create" />;
}

export function BundleCampaignForm({
  mode,
  bundleId,
}: BundleCampaignFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(mode === "edit");

  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [, setAttributes] = useState<any[]>([]);
  const [attributeValues, setAttributeValues] = useState<any[]>([]);

  const [productSearch, setProductSearch] = useState("");
  const [productSearchResults, setProductSearchResults] = useState<any[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, brandRes, attrRes] = await Promise.all([
          categoriesApi.getCategories(),
          brandsApi.getBrands(),
          attributesApi.getAttributes(),
        ]);
        if (catRes.data.success) {
          setCategories(catRes.data.data?.categories || catRes.data.data || []);
        }
        if (brandRes.data.success) {
          setBrands(brandRes.data.data?.brands || brandRes.data.data || []);
        }
        if (attrRes.data.success) {
          const attrs = attrRes.data.data?.attributes || attrRes.data.data || [];
          setAttributes(attrs);
          const allValues: any[] = [];
          attrs.forEach((attr: any) => {
            if (attr.values && Array.isArray(attr.values)) {
              attr.values.forEach((val: any) => {
                allValues.push({
                  ...val,
                  attributeName: attr.name,
                  attributeId: attr.id,
                });
              });
            }
          });
          setAttributeValues(allValues);
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (mode === "edit" && bundleId) {
      const fetchBundle = async () => {
        try {
          setIsFetching(true);
          const res = await bundles.getBundleById(bundleId);
          if (res.data.success) {
            const b = res.data.data?.bundle || res.data.data;
            setFormData({
              title: b.title || "",
              slug: b.slug || "",
              banner: null,
              bannerPreview: b.banner || "",
              description: b.description || "",
              bundleType: b.bundleType || "",
              startDate: b.startDate
                ? new Date(b.startDate).toISOString().slice(0, 16)
                : "",
              endDate: b.endDate
                ? new Date(b.endDate).toISOString().slice(0, 16)
                : "",
              displayOrder: b.displayOrder ?? "",
              showOnWebsite: b.showOnWebsite ?? true,
              isActive: b.isActive ?? true,
              categoryIds: b.rule?.categoryIds || b.categoryIds || [],
              subcategoryIds: b.rule?.subcategoryIds || b.subcategoryIds || [],
              brandIds: b.rule?.brandIds || b.brandIds || [],
              attributeValueIds: b.rule?.attributeValueIds || b.attributeValueIds || [],
              productIds: b.rule?.productIds || b.productIds || [],
              pricingSlabs:
                b.pricingSlabs?.length > 0
                  ? b.pricingSlabs.map((s: any) => ({
                    itemCount: s.itemCount ?? "",
                    price: s.price ?? "",
                    label: s.label || "",
                  }))
                  : [{ itemCount: "", price: "", label: "" }],
              metaTitle: b.metaTitle || "",
              metaDescription: b.metaDescription || "",
            });
            const ruleProductIds = b.rule?.productIds || b.productIds;
            if (ruleProductIds?.length > 0) {
              try {
                const prodRes = await productsApi.getProducts({ limit: 1000 });
                if (prodRes.data.success) {
                  const allProds = prodRes.data.data?.products || [];
                  setSelectedProducts(
                    allProds.filter((p: any) => ruleProductIds.includes(p.id))
                  );
                }
              } catch {
                /* ignore */
              }
            }
          }
        } catch (err: any) {
          toast({
            title: "Error",
            description:
              err.response?.data?.message || "Failed to fetch bundle",
            variant: "destructive",
          });
          navigate("/bundles");
        } finally {
          setIsFetching(false);
        }
      };
      fetchBundle();
    }
  }, [mode, bundleId]);

  useEffect(() => {
    if (formData.categoryIds.length > 0) {
      const filtered: any[] = [];
      categories.forEach((cat: any) => {
        if (
          cat.subcategories &&
          cat.subcategories.length > 0 &&
          formData.categoryIds.includes(cat.id)
        ) {
          cat.subcategories.forEach((sub: any) => {
            filtered.push({ ...sub, parentCategoryName: cat.name });
          });
        }
      });
      setSubcategories(filtered);
    } else {
      setSubcategories([]);
    }
  }, [formData.categoryIds, categories]);

  const handleTitleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      title: value,
      slug: mode === "create" ? generateSlug(value) : prev.slug,
    }));
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        banner: file,
        bannerPreview: URL.createObjectURL(file),
      }));
    }
  };

  const removeBanner = () => {
    setFormData((prev) => ({
      ...prev,
      banner: null,
      bannerPreview: "",
    }));
  };

  const toggleArrayItem = (arr: string[], item: string): string[] => {
    return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
  };

  const addPricingSlab = () => {
    setFormData((prev) => ({
      ...prev,
      pricingSlabs: [
        ...prev.pricingSlabs,
        { itemCount: "", price: "", label: "" },
      ],
    }));
  };

  const removePricingSlab = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pricingSlabs: prev.pricingSlabs.filter((_, i) => i !== index),
    }));
  };

  const updatePricingSlab = (
    index: number,
    field: keyof PricingSlab,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      pricingSlabs: prev.pricingSlabs.map((slab, i) =>
        i === index ? { ...slab, [field]: value } : slab
      ),
    }));
  };

  const handleProductSearch = async (query: string) => {
    setProductSearch(query);
    if (query.length < 2) {
      setProductSearchResults([]);
      return;
    }
    try {
      setIsSearchingProducts(true);
      const res = await productsApi.getProducts({ search: query, limit: 20 });
      if (res.data.success) {
        const found = res.data.data?.products || [];
        setProductSearchResults(
          found.filter((p: any) => !formData.productIds.includes(p.id))
        );
      }
    } catch {
      setProductSearchResults([]);
    } finally {
      setIsSearchingProducts(false);
    }
  };

  const toggleProduct = (product: any) => {
    if (formData.productIds.includes(product.id)) {
      setFormData((prev) => ({
        ...prev,
        productIds: prev.productIds.filter((id) => id !== product.id),
      }));
      setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id));
    } else {
      setFormData((prev) => ({
        ...prev,
        productIds: [...prev.productIds, product.id],
      }));
      setSelectedProducts((prev) => [...prev, product]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", formData.title);
      fd.append("slug", formData.slug);
      fd.append("description", formData.description);
      fd.append("bundleType", formData.bundleType);
      fd.append("startDate", new Date(formData.startDate).toISOString());
      fd.append("endDate", new Date(formData.endDate).toISOString());
      fd.append("displayOrder", String(formData.displayOrder || 0));
      fd.append("showOnWebsite", String(formData.showOnWebsite));
      fd.append("isActive", String(formData.isActive));
      fd.append("categoryIds", JSON.stringify(formData.categoryIds));
      fd.append("subcategoryIds", JSON.stringify(formData.subcategoryIds));
      fd.append("brandIds", JSON.stringify(formData.brandIds));
      fd.append("attributeValueIds", JSON.stringify(formData.attributeValueIds));
      fd.append("productIds", JSON.stringify(formData.productIds));
      fd.append(
        "pricingSlabs",
        JSON.stringify(
          formData.pricingSlabs.filter(
            (s) => s.itemCount !== "" && s.price !== ""
          )
        )
      );
      fd.append("metaTitle", formData.metaTitle);
      fd.append("metaDescription", formData.metaDescription);
      if (formData.banner) {
        fd.append("banner", formData.banner);
      }

      let res;
      if (mode === "create") {
        res = await bundles.createBundle(fd);
      } else {
        res = await bundles.updateBundle(bundleId!, fd);
      }

      if (res.data.success) {
        toast({
          title: "Success",
          description:
            mode === "create"
              ? "Bundle campaign created"
              : "Bundle campaign updated",
        });
        navigate("/bundles");
      } else {
        toast({
          title: "Error",
          description: res.data.message || "Failed to save bundle",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err.response?.data?.message || "Failed to save bundle campaign",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#4CAF50]" />
          <p className="mt-4 text-base text-[#9CA3AF]">Loading bundle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#1F2937] tracking-tight">
              {mode === "create"
                ? "Create Bundle Campaign"
                : "Edit Bundle Campaign"}
            </h1>
            <p className="text-[#9CA3AF] text-sm mt-1.5">
              {mode === "create"
                ? "Set up a new bundle campaign for your store"
                : "Update the bundle campaign details"}
            </p>
          </div>
        </div>
        <div className="h-px bg-[#E5E7EB]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General Section */}
        <Card className="bg-[#FFFFFF] border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-xl">
          <CardHeader className="px-6 pt-6 pb-4">
            <CardTitle className="text-lg font-semibold text-[#1F2937]">
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className="text-sm font-medium text-[#4B5563]"
                >
                  Title <span className="text-[#EF4444]">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Summer 50ML Combo"
                  required
                  className="border-[#E5E7EB] focus:border-primary"
                />
                <p className="text-[11px] text-[#9CA3AF]">
                  Example: "Summer Collection 2026" (Customer-facing title)
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="slug"
                  className="text-sm font-medium text-[#4B5563]"
                >
                  Slug
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="auto-generated-from-title"
                  className="border-[#E5E7EB] focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="bundleType"
                  className="text-sm font-medium text-[#4B5563]"
                >
                  Bundle Type
                </Label>
                <Input
                  id="bundleType"
                  value={formData.bundleType}
                  onChange={(e) =>
                    setFormData({ ...formData, bundleType: e.target.value })
                  }
                  placeholder='e.g. 50ML, FESTIVAL, COMBO'
                  className="border-[#E5E7EB] focus:border-primary"
                />
                <p className="text-[11px] text-[#9CA3AF]">
                  Example: "50ml" or "Custom Combo" (Used for filtering and badging)
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#4B5563]">
                  Banner
                </Label>
                {formData.bannerPreview ? (
                  <div className="relative">
                    <img
                      src={formData.bannerPreview}
                      alt="Banner preview"
                      className="w-full h-32 object-cover rounded-lg border border-[#E5E7EB]"
                    />
                    <button
                      type="button"
                      onClick={removeBanner}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#E5E7EB] rounded-lg cursor-pointer hover:bg-[#F9FAFB] transition-colors">
                    <Upload className="h-6 w-6 text-[#9CA3AF] mb-2" />
                    <span className="text-sm text-[#9CA3AF]">
                      Click to upload banner
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="startDate"
                  className="text-sm font-medium text-[#4B5563]"
                >
                  Start Date <span className="text-[#EF4444]">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                  className="border-[#E5E7EB] focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="endDate"
                  className="text-sm font-medium text-[#4B5563]"
                >
                  End Date <span className="text-[#EF4444]">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  required
                  className="border-[#E5E7EB] focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="displayOrder"
                  className="text-sm font-medium text-[#4B5563]"
                >
                  Display Order
                </Label>
                <Input
                  id="displayOrder"
                  type="number"
                  min="0"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      displayOrder: e.target.value
                        ? parseInt(e.target.value)
                        : "",
                    })
                  }
                  placeholder="0"
                  className="border-[#E5E7EB] focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-[#4B5563]">
                    Show on Website
                  </Label>
                  <p className="text-xs text-[#9CA3AF]">
                    Display this bundle on the storefront
                  </p>
                </div>
                <Switch
                  checked={formData.showOnWebsite}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, showOnWebsite: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-[#4B5563]">
                    Status
                  </Label>
                  <p className="text-xs text-[#9CA3AF]">
                    {formData.isActive
                      ? "Campaign is active"
                      : "Campaign is inactive"}
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-[#4B5563]"
              >
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe this bundle campaign..."
                rows={4}
                className="border-[#E5E7EB] focus:border-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Rules Section */}
        <Card className="bg-[#FFFFFF] border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-xl">
          <CardHeader className="px-6 pt-6 pb-4">
            <CardTitle className="text-lg font-semibold text-[#1F2937]">
              Product Rules
            </CardTitle>
            <p className="text-sm text-[#9CA3AF] mt-1">
              Define which products are eligible for this bundle
            </p>
            <div className="text-xs text-[#6B7280] mt-2 bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB]">
              <strong>Rule Guide (Example):</strong> If you select category "50ml Perfumes" and brand "MWP Supplements", only products matching both will be selectable in the bundle. Leaving categories/brands empty allows all active products.
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Categories */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#4B5563]">
                  Categories
                </Label>
                <div className="border border-[#E5E7EB] rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                  {categories.length === 0 ? (
                    <p className="text-xs text-[#9CA3AF]">No categories found</p>
                  ) : (
                    categories.map((cat: any) => (
                      <label
                        key={cat.id}
                        className="flex items-center gap-2 cursor-pointer py-1"
                      >
                        <input
                          type="checkbox"
                          checked={formData.categoryIds.includes(cat.id)}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              categoryIds: toggleArrayItem(
                                prev.categoryIds,
                                cat.id
                              ),
                              subcategoryIds: prev.subcategoryIds.filter(
                                (sid) => {
                                  const sub = categories
                                    .flatMap((c: any) => c.subcategories || [])
                                    .find((s: any) => s.id === sid);
                                  return sub?.categoryId !== cat.id;
                                }
                              ),
                            }))
                          }
                          className="rounded border-[#E5E7EB]"
                        />
                        <span className="text-sm text-[#4B5563]">{cat.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Subcategories */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#4B5563]">
                  Subcategories
                </Label>
                <div className="border border-[#E5E7EB] rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                  {subcategories.length === 0 ? (
                    <p className="text-xs text-[#9CA3AF]">
                      {formData.categoryIds.length === 0
                        ? "Select categories first"
                        : "No subcategories found"}
                    </p>
                  ) : (
                    subcategories.map((sub: any) => (
                      <label
                        key={sub.id}
                        className="flex items-center gap-2 cursor-pointer py-1"
                      >
                        <input
                          type="checkbox"
                          checked={formData.subcategoryIds.includes(sub.id)}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              subcategoryIds: toggleArrayItem(
                                prev.subcategoryIds,
                                sub.id
                              ),
                            }))
                          }
                          className="rounded border-[#E5E7EB]"
                        />
                        <span className="text-sm text-[#4B5563]">
                          {sub.name}
                          {sub.parentCategoryName && (
                            <span className="text-[#9CA3AF] ml-1">
                              ({sub.parentCategoryName})
                            </span>
                          )}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Brands */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#4B5563]">
                  Brands
                </Label>
                <div className="border border-[#E5E7EB] rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                  {brands.length === 0 ? (
                    <p className="text-xs text-[#9CA3AF]">No brands found</p>
                  ) : (
                    brands.map((brand: any) => (
                      <label
                        key={brand.id}
                        className="flex items-center gap-2 cursor-pointer py-1"
                      >
                        <input
                          type="checkbox"
                          checked={formData.brandIds.includes(brand.id)}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              brandIds: toggleArrayItem(
                                prev.brandIds,
                                brand.id
                              ),
                            }))
                          }
                          className="rounded border-[#E5E7EB]"
                        />
                        <span className="text-sm text-[#4B5563]">
                          {brand.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Attribute Values */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#4B5563]">
                  Attribute Values
                </Label>
                <div className="border border-[#E5E7EB] rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                  {attributeValues.length === 0 ? (
                    <p className="text-xs text-[#9CA3AF]">
                      No attribute values found
                    </p>
                  ) : (
                    attributeValues.map((val: any) => (
                      <label
                        key={val.id}
                        className="flex items-center gap-2 cursor-pointer py-1"
                      >
                        <input
                          type="checkbox"
                          checked={formData.attributeValueIds.includes(val.id)}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              attributeValueIds: toggleArrayItem(
                                prev.attributeValueIds,
                                val.id
                              ),
                            }))
                          }
                          className="rounded border-[#E5E7EB]"
                        />
                        <span className="text-sm text-[#4B5563]">
                          {val.value}
                          <span className="text-[#9CA3AF] ml-1">
                            ({val.attributeName})
                          </span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Manual Product Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#4B5563]">
                Manual Product Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                <Input
                  value={productSearch}
                  onChange={(e) => handleProductSearch(e.target.value)}
                  placeholder="Search products to add..."
                  className="pl-9 border-[#E5E7EB] focus:border-primary"
                />
                {isSearchingProducts && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#9CA3AF]" />
                )}
              </div>

              {productSearchResults.length > 0 && (
                <div className="border border-[#E5E7EB] rounded-lg max-h-48 overflow-y-auto">
                  {productSearchResults.map((product: any) => (
                    <label
                      key={product.id}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#F9FAFB] border-b border-[#F3F4F6] last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={formData.productIds.includes(product.id)}
                        onChange={() => toggleProduct(product)}
                        className="rounded border-[#E5E7EB]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1F2937] truncate">
                          {product.name}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {product.brand?.name && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded">
                              Brand: {product.brand.name}
                            </span>
                          )}
                          {product.categories?.[0]?.name && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded">
                              Category: {product.categories[0].name}
                            </span>
                          )}
                          {product.variants?.[0] && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 px-1 rounded">
                              Sku: {product.variants[0].sku || product.sku}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end text-right">
                        <span className="text-sm text-[#1F2937] font-semibold">
                          ₹{product.variants?.[0]?.price || product.regularPrice || product.price || 0}
                        </span>
                        {product.variants?.[0]?.attributes && product.variants[0].attributes.length > 0 && (
                          <span className="text-[10px] text-gray-500 mt-0.5">
                            {product.variants[0].attributes.map((a: any) => `${a.attribute}: ${a.value}`).join(", ")}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedProducts.map((product: any) => {
                    const price = product.variants?.[0]?.price || product.regularPrice || product.price || 0;
                    const attrs = product.variants?.[0]?.attributes && product.variants[0].attributes.length > 0
                      ? ` (${product.variants[0].attributes.map((a: any) => a.value).join(", ")})`
                      : "";
                    return (
                      <span
                        key={product.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F3F4F6] rounded-md text-xs text-[#1F2937] font-medium border border-[#E5E7EB]"
                      >
                        <span>{product.name}{attrs} - ₹{price}</span>
                        <button
                          type="button"
                          onClick={() => toggleProduct(product)}
                          className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Slabs Section */}
        <Card className="bg-[#FFFFFF] border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-xl">
          <CardHeader className="px-6 pt-6 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-[#1F2937]">
                Pricing Slabs
              </CardTitle>
              <p className="text-sm text-[#9CA3AF] mt-1">
                Define quantity-based pricing tiers
              </p>
              <div className="text-xs text-[#6B7280] mt-2 bg-[#F9FAFB] p-2.5 rounded border border-[#E5E7EB] max-w-xl">
                <strong>Pricing Guide (Example):</strong> <br />
                - Item Count: <strong>2</strong>, Price: <strong>1499</strong>, Label: <strong>"Buy any 2 for ₹1499"</strong><br />
                - Item Count: <strong>3</strong>, Price: <strong>1999</strong>, Label: <strong>"Buy any 3 for ₹1999"</strong>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPricingSlab}
              className="border-[#E5E7EB] hover:bg-[#F3F7F6]"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-3">
            {formData.pricingSlabs.map((slab, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr_auto] gap-3 items-end p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]"
              >
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-[#4B5563]">
                    Item Count
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={slab.itemCount}
                    onChange={(e) =>
                      updatePricingSlab(
                        index,
                        "itemCount",
                        e.target.value ? parseInt(e.target.value) : ""
                      )
                    }
                    placeholder="e.g. 3"
                    className="border-[#E5E7EB] focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-[#4B5563]">
                    Price
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={slab.price}
                    onChange={(e) =>
                      updatePricingSlab(
                        index,
                        "price",
                        e.target.value ? parseFloat(e.target.value) : ""
                      )
                    }
                    placeholder="e.g. 999"
                    className="border-[#E5E7EB] focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-[#4B5563]">
                    Label
                  </Label>
                  <Input
                    value={slab.label}
                    onChange={(e) =>
                      updatePricingSlab(index, "label", e.target.value)
                    }
                    placeholder="e.g. Buy 3 for ₹999"
                    className="border-[#E5E7EB] focus:border-primary"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePricingSlab(index)}
                  disabled={formData.pricingSlabs.length <= 1}
                  className="h-9 w-9 p-0 hover:bg-[#FEF2F2]"
                >
                  <Trash2 className="h-4 w-4 text-[#EF4444]" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* SEO Section */}
        <Card className="bg-[#FFFFFF] border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-xl">
          <CardHeader className="px-6 pt-6 pb-4">
            <CardTitle className="text-lg font-semibold text-[#1F2937]">
              SEO
            </CardTitle>
            <p className="text-sm text-[#9CA3AF] mt-1">
              Search engine optimization settings
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="metaTitle"
                className="text-sm font-medium text-[#4B5563]"
              >
                Meta Title
              </Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle}
                onChange={(e) =>
                  setFormData({ ...formData, metaTitle: e.target.value })
                }
                placeholder="SEO title for this bundle"
                className="border-[#E5E7EB] focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="metaDescription"
                className="text-sm font-medium text-[#4B5563]"
              >
                Meta Description
              </Label>
              <Textarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(e) =>
                  setFormData({ ...formData, metaDescription: e.target.value })
                }
                placeholder="SEO description for this bundle"
                rows={3}
                className="border-[#E5E7EB] focus:border-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="border-[#E5E7EB] hover:bg-[#F3F7F6]"
            onClick={() => navigate("/bundles")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "create" ? "Creating..." : "Updating..."}
              </>
            ) : mode === "create" ? (
              "Create Bundle"
            ) : (
              "Update Bundle"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
