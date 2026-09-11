import { useState, useEffect } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { videoReels, products } from "@/api/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Video,
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  Play,
  X,
  Check,
  Film,
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { useDropzone } from "react-dropzone";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Helper to get product image URL
function getProductImageUrl(product: any): string | null {
  if (!product) return null;
  // Admin API returns "primaryImage" (string)
  if (product.primaryImage) return product.primaryImage;
  // Fallback: check images array
  if (product.images && product.images.length > 0) {
    const img = product.images[0];
    if (typeof img === "string") return img;
    if (img?.url) return img.url;
  }
  return null;
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  price?: number;
  salePrice?: number;
  images?: { url: string; isPrimary: boolean }[];
  variants?: { id: string; price: number; salePrice?: number }[];
}

interface ReelProduct {
  id: string;
  productId: string;
  position: number;
  product: ProductItem;
}

interface VideoReelItem {
  id: string;
  title: string;
  videoUrl: string;
  position: number;
  isActive: boolean;
  products: ReelProduct[];
  createdAt: string;
}

// Video Reel Form Component
function VideoReelForm({
  mode,
  reelId,
}: {
  mode: "create" | "edit";
  reelId?: string;
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(mode === "edit");
  const [formData, setFormData] = useState({
    title: "",
    position: 0,
    isActive: true,
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductItem[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);

  // Load reel data for edit mode
  useEffect(() => {
    if (mode === "edit" && reelId) {
      const fetchReel = async () => {
        try {
          setFormLoading(true);
          const response = await videoReels.getReelById(reelId);
          if (response.data.success) {
            const reel = response.data.data.reel;
            setFormData({
              title: reel.title || "",
              position: reel.position || 0,
              isActive: reel.isActive !== false,
            });
            setVideoPreview(reel.videoUrl);
            const productIds = (reel.products || []).map(
              (rp: ReelProduct) => rp.productId
            );
            setSelectedProductIds(productIds);
            // Store products for display
            setAllProducts(
              (reel.products || []).map((rp: ReelProduct) => ({
                ...rp.product,
                id: rp.productId,
              }))
            );
          }
        } catch {
          toast.error("Failed to load video reel");
        } finally {
          setFormLoading(false);
        }
      };
      fetchReel();
    }
  }, [mode, reelId]);

  // Search products
  useEffect(() => {
    if (!productSearchQuery.trim()) {
      setSearchResults([]);
      setShowProductDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingProducts(true);
      try {
        const response = await products.getProducts({
          search: productSearchQuery,
          limit: 20,
        });
        if (response.data.success) {
          const productList = response.data.data?.products || [];
          const filtered = productList.filter(
            (p: ProductItem) => !selectedProductIds.includes(p.id)
          );
          setSearchResults(filtered);
          setShowProductDropdown(true);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearchingProducts(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [productSearchQuery, selectedProductIds]);

  const addProduct = (product: ProductItem) => {
    if (!selectedProductIds.includes(product.id)) {
      setSelectedProductIds((prev) => [...prev, product.id]);
      setAllProducts((prev) => [...prev, product]);
    }
    setProductSearchQuery("");
    setSearchResults([]);
    setShowProductDropdown(false);
  };

  const removeProduct = (productId: string) => {
    setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
    setAllProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Video dropzone
  const {
    getRootProps: getVideoRootProps,
    getInputProps: getVideoInputProps,
    isDragActive: isVideoDragActive,
  } = useDropzone({
    accept: { "video/*": [".mp4", ".webm", ".mov", ".avi"] },
    multiple: false,
    maxSize: 100 * 1024 * 1024,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles[0]) {
        setVideoFile(acceptedFiles[0]);
        setVideoPreview(URL.createObjectURL(acceptedFiles[0]));
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (mode === "create" && !videoFile) {
      toast.error("Video file is required");
      return;
    }

    if (mode === "edit" && !reelId) return;

    setIsLoading(true);
    try {
      const submitData: any = {
        title: formData.title,
        isActive: formData.isActive,
        productIds: selectedProductIds,
      };

      // Only send position on edit (not create - auto-assigned)
      if (mode === "edit") {
        submitData.position = parseInt(formData.position.toString()) || 0;
      }

      if (videoFile) submitData.video = videoFile;

      let response;
      if (mode === "create") {
        response = await videoReels.createReel(submitData);
      } else {
        response = await videoReels.updateReel(reelId!, submitData);
      }

      if (response.data.success) {
        toast.success(
          mode === "create" ? "Video reel created!" : "Video reel updated!"
        );
        navigate("/video-reels");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to save video reel"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!reelId || !confirm("Delete this video reel?")) return;
    try {
      const response = await videoReels.deleteReel(reelId);
      if (response.data.success) {
        toast.success("Video reel deleted");
        navigate("/video-reels");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete");
    }
  };

  if (formLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate("/video-reels")}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2937]">
            {mode === "create" ? "Create Video Reel" : "Edit Video Reel"}
          </h1>
          <p className="text-sm text-[#9CA3AF]">
            {mode === "create"
              ? "Add a new video reel with products"
              : "Update video reel details"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card className="bg-white border-[#E5E7EB]">
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-lg font-semibold text-[#1F2937]">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#4B5563]">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter reel title"
                  className="border-[#E5E7EB]"
                />
              </div>

              {/* Position - only show on edit */}
              {mode === "edit" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#4B5563]">
                    Position
                  </Label>
                  <Input
                    type="number"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        position: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    className="border-[#E5E7EB]"
                  />
                  <p className="text-xs text-[#9CA3AF]">
                    Set position (0 = first). Other reels will be automatically
                    reordered.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <span className="text-sm text-[#4B5563]">
                  {formData.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Video Upload */}
          <Card className="bg-white border-[#E5E7EB]">
            <CardHeader className="px-6 py-4">
              <div className="flex items-center gap-2">
                <Film className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold text-[#1F2937]">
                  Video{" "}
                  {mode === "create" && <span className="text-red-500">*</span>}
                </CardTitle>
              </div>
              <p className="text-sm text-[#9CA3AF]">
                Upload the video reel (MP4, WebM, MOV - max 100MB)
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div
                {...getVideoRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  isVideoDragActive
                    ? "border-primary bg-primary/5"
                    : "border-[#E5E7EB] hover:border-primary hover:bg-[#F3F7F6]"
                )}
              >
                <input {...getVideoInputProps()} />
                {videoPreview ? (
                  <div className="space-y-4">
                    <video
                      src={videoPreview}
                      className="max-h-60 mx-auto rounded-lg"
                      controls
                    />
                    <p className="text-xs text-[#9CA3AF]">
                      {videoFile ? "New video selected (click to replace)" : "Existing video (click to replace)"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F3F4F6]">
                      <Video className="h-8 w-8 text-[#9CA3AF]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1F2937]">
                        Drop video here or click to upload
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-2">
                        MP4, WebM, MOV up to 100MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Selection */}
          <Card className="bg-white border-[#E5E7EB]">
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-lg font-semibold text-[#1F2937]">
                Attach Products
              </CardTitle>
              <p className="text-sm text-[#9CA3AF]">
                Select products to show in this reel
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                <Input
                  placeholder="Search products..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  onFocus={() =>
                    productSearchQuery && setShowProductDropdown(true)
                  }
                  className="pl-10 border-[#E5E7EB]"
                />
                {isSearchingProducts && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#9CA3AF]" />
                )}

                {/* Dropdown */}
                {showProductDropdown && searchResults.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-white border border-[#E5E7EB] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addProduct(product)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F3F7F6] text-left transition-colors"
                      >
                        {getProductImageUrl(product) ? (
                          <img
                            src={getProductImageUrl(product)!}
                            alt={product.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-[#F3F4F6] flex items-center justify-center">
                            <Film className="h-5 w-5 text-[#9CA3AF]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1F2937] truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-[#9CA3AF]">
                            ₹
                            {product.variants?.[0]?.price ||
                              product.price ||
                              "N/A"}
                          </p>
                        </div>
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Products */}
              {selectedProductIds.length > 0 ? (
                <div className="space-y-2">
                  {selectedProductIds.map((pid, index) => {
                    const product = allProducts.find((p) => p.id === pid);
                    return (
                      <div
                        key={pid}
                        className="flex items-center gap-2 p-2 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]"
                      >
                        <span className="text-xs text-[#9CA3AF] font-medium w-5">
                          {index + 1}.
                        </span>
                        {getProductImageUrl(product) ? (
                          <img
                            src={getProductImageUrl(product)!}
                            alt={product?.name}
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-[#F3F4F6] flex items-center justify-center">
                            <Film className="h-4 w-4 text-[#9CA3AF]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-[#1F2937] truncate block">
                            {product?.name || pid}
                          </span>
                          <span className="text-xs text-[#9CA3AF]">
                            ₹{product?.variants?.[0]?.price || product?.price || "N/A"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProduct(pid)}
                          className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-[#E5E7EB] text-[#9CA3AF]"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-[#9CA3AF]">
                  No products attached yet. Search above to add.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          {mode === "edit" && (
            <Card className="bg-white border-2 border-red-200">
              <CardHeader className="px-6 py-4">
                <CardTitle className="text-lg font-semibold text-red-600">
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Reel
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 bg-white border-t border-[#E5E7EB] py-4 px-6 -mx-6 -mb-8 flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          className="border-[#E5E7EB]"
          onClick={() => navigate("/video-reels")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : mode === "create" ? (
            "Create Reel"
          ) : (
            "Update Reel"
          )}
        </Button>
      </div>
    </form>
  );
}

// Video Reels List Component
function VideoReelsList() {
  const [reels, setReels] = useState<VideoReelItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("");

  useEffect(() => {
    const fetchReels = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params: any = {
          page: 1,
          limit: 100,
          ...(searchQuery && { search: searchQuery }),
          ...(activeFilter && { isActive: activeFilter }),
        };
        const response = await videoReels.getReels(params);
        if (response.data.success) {
          setReels(response.data.data?.reels || []);
        } else {
          setError("Failed to fetch video reels");
        }
      } catch {
        setError("Failed to fetch video reels");
      } finally {
        setIsLoading(false);
      }
    };
    fetchReels();
  }, [searchQuery, activeFilter]);

  const handleDelete = async (reelId: string) => {
    if (!confirm("Delete this video reel?")) return;
    try {
      const response = await videoReels.deleteReel(reelId);
      if (response.data.success) {
        toast.success("Video reel deleted");
        setReels((prev) => prev.filter((r) => r.id !== reelId));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete");
    }
  };

  const handleToggleActive = async (reelId: string) => {
    try {
      const response = await videoReels.toggleActive(reelId);
      if (response.data.success) {
        const newActive = response.data.data.reel.isActive;
        toast.success(newActive ? "Reel activated" : "Reel deactivated");
        setReels((prev) =>
          prev.map((r) =>
            r.id === reelId ? { ...r, isActive: newActive } : r
          )
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to toggle");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2937]">
            Video Reels
          </h1>
          <p className="text-sm text-[#9CA3AF]">
            Manage Watch and Buy video reels
          </p>
        </div>
        <Button asChild>
          <Link to="/video-reels/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Reel
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white border-[#E5E7EB]">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input
                placeholder="Search reels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-[#E5E7EB]"
              />
            </div>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-[#E5E7EB] bg-[#F3F7F6] text-sm text-[#4B5563]"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Reels List */}
      {reels.length === 0 ? (
        <Card className="bg-white border-[#E5E7EB]">
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F3F4F6] mb-4">
              <Video className="h-8 w-8 text-[#9CA3AF]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1F2937] mb-1">
              No video reels yet
            </h3>
            <p className="text-sm text-[#9CA3AF] mb-6">
              Create your first video reel to show on the homepage
            </p>
            <Button asChild>
              <Link to="/video-reels/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Reel
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reels.map((reel) => (
            <Card
              key={reel.id}
              className="bg-white border-[#E5E7EB] hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-[9/16] max-h-64 bg-[#1F2937] rounded-t-xl overflow-hidden">
                {reel.videoUrl ? (
                  <video
                    src={reel.videoUrl}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Film className="h-12 w-12 text-[#4B5563]" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="h-6 w-6 text-[#1F2937] ml-0.5" />
                  </div>
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge
                    className={cn(
                      "text-xs",
                      reel.isActive
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    )}
                  >
                    {reel.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-[#1F2937] mb-1 truncate">
                  {reel.title}
                </h3>
                <p className="text-xs text-[#9CA3AF] mb-3">
                  Position: {reel.position} | {reel.products?.length || 0}{" "}
                  products
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(reel.id)}
                    className="h-8 px-3"
                  >
                    {reel.isActive ? (
                      <EyeOff className="h-4 w-4 mr-1" />
                    ) : (
                      <Eye className="h-4 w-4 mr-1" />
                    )}
                    {reel.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3"
                  >
                    <Link to={`/video-reels/${reel.id}`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(reel.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Main Component
export default function VideoReelsPage() {
  const { id } = useParams();
  const location = useLocation();
  const isNewReel = location.pathname.includes("/new");
  const isEditReel = !!id;

  if (isNewReel) {
    return <VideoReelForm mode="create" />;
  }

  if (isEditReel) {
    return <VideoReelForm mode="edit" reelId={id} />;
  }

  return <VideoReelsList />;
}
