import { useState, useEffect } from "react";
import { Plus, FlaskConical, Trash2, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/api/api";
import { toast } from "sonner";

interface FragranceNote {
  id: string;
  category: string;
  name: string;
  description: string;
  color: string;
  image: string;
}

interface BottleOption {
  id: string;
  name: string;
  capacity: string;
  price: number;
  description: string;
  image: string;
}

export default function CustomPerfumeManagementPage() {
  const [activeTab, setActiveTab] = useState<"base" | "heart" | "top" | "bottles">("base");
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Woody");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#8B5A2B");
  const [price, setPrice] = useState("3999");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Real Database State Data
  const [baseNotes, setBaseNotes] = useState<FragranceNote[]>([]);
  const [heartNotes, setHeartNotes] = useState<FragranceNote[]>([]);
  const [topNotes, setTopNotes] = useState<FragranceNote[]>([]);
  const [bottles, setBottles] = useState<BottleOption[]>([]);

  // Fetch real data from database endpoint
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/custom-perfume/notes");
      if (res.data?.success && res.data?.data) {
        const { base = [], heart = [], top = [], bottles: fetchedBottles = [] } = res.data.data;
        setBaseNotes(base);
        setHeartNotes(heart);
        setTopNotes(top);
        setBottles(fetchedBottles);
      }
    } catch (err: any) {
      console.warn("Failed to fetch custom perfume DB items, utilizing current items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview("");
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (activeTab === "bottles") {
        formData.append("price", price);
        formData.append("capacity", "100 ml");
        const res = await api.post("/admin/custom-perfume/bottles", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success(res.data?.message || "Bottle silhouette saved successfully!");
      } else {
        formData.append("noteType", activeTab.toUpperCase());
        formData.append("category", category);
        formData.append("color", color);
        const res = await api.post("/admin/custom-perfume/notes", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success(res.data?.message || "Fragrance note saved successfully!");
      }

      setName("");
      setDescription("");
      setImageFile(null);
      setImagePreview("");
      setIsAdding(false);
      await fetchData();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.response?.data?.message || "Failed to save item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      if (activeTab === "bottles") {
        await api.delete(`/admin/custom-perfume/bottles/${id}`);
        setBottles(bottles.filter(b => b.id !== id));
      } else {
        await api.delete(`/admin/custom-perfume/notes/${id}`);
        if (activeTab === "base") setBaseNotes(baseNotes.filter(n => n.id !== id));
        if (activeTab === "heart") setHeartNotes(heartNotes.filter(n => n.id !== id));
        if (activeTab === "top") setTopNotes(topNotes.filter(n => n.id !== id));
      }
      toast.success("Item deleted successfully");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete item");
    }
  };

  const currentNotes = 
    activeTab === "base" ? baseNotes :
    activeTab === "heart" ? heartNotes : topNotes;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2E7D32] mb-1">
            <FlaskConical className="w-4 h-4" /> Atelier Management
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Custom Fragrance Notes & Bottles</h1>
          <p className="text-xs text-slate-500 mt-1">Configure dynamic Base, Heart, Top notes and Bottle options with real image uploads for the Custom Perfume Builder.</p>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className="bg-[#2E7D32] hover:bg-[#1b5e20] text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New {activeTab.toUpperCase()} Option
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-sm overflow-x-auto">
        <button
          onClick={() => { setActiveTab("base"); setIsAdding(false); }}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "base" ? "border-[#2E7D32] text-[#2E7D32]" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Base Notes (Layer 1)
        </button>
        <button
          onClick={() => { setActiveTab("heart"); setIsAdding(false); }}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "heart" ? "border-[#2E7D32] text-[#2E7D32]" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Heart Notes (Layer 2)
        </button>
        <button
          onClick={() => { setActiveTab("top"); setIsAdding(false); }}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "top" ? "border-[#2E7D32] text-[#2E7D32]" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Top Notes (Layer 3)
        </button>
        <button
          onClick={() => { setActiveTab("bottles"); setIsAdding(false); }}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "bottles" ? "border-[#2E7D32] text-[#2E7D32]" : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Bottle Silhouettes
        </button>
      </div>

      {/* Add Form with Image File Upload */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">
            Add New {activeTab.toUpperCase()} {activeTab === "bottles" ? "Bottle" : "Fragrance Note"}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Oudh or Tuscan Suede"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#2E7D32]"
              />
            </div>

            {activeTab !== "bottles" ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#2E7D32]"
                >
                  <option value="Woody">Woody</option>
                  <option value="Amber">Amber</option>
                  <option value="Musky">Musky</option>
                  <option value="Leathery">Leathery</option>
                  <option value="Floral">Floral</option>
                  <option value="Spicy">Spicy</option>
                  <option value="Fruity">Fruity</option>
                  <option value="Fresh">Fresh</option>
                  <option value="Citrus">Citrus</option>
                  <option value="Green">Green</option>
                  <option value="Aquatic">Aquatic</option>
                  <option value="Aromatic">Aromatic</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#2E7D32]"
                />
              </div>
            )}

            {activeTab !== "bottles" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Color Tag</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-10 p-1 border rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short sensory description of this note or bottle"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#2E7D32]"
            />
          </div>

          {/* Real Custom Image Upload Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Upload Custom Image</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border rounded-lg cursor-pointer text-xs font-semibold transition-colors">
                <Upload className="w-4 h-4 text-[#2E7D32]" /> Choose File
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
              {imagePreview && (
                <div className="flex items-center gap-2">
                  <img src={imagePreview} alt="Preview" className="w-10 h-10 rounded-md object-cover border" />
                  <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]">{imageFile?.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-[#2E7D32] hover:bg-[#1b5e20] text-white flex items-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Uploading..." : "Save Item to Database"}
            </Button>
          </div>
        </form>
      )}

      {/* Display Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#2E7D32]" />
          <span className="ml-3 text-sm text-slate-600 font-medium">Fetching options from database...</span>
        </div>
      ) : activeTab === "bottles" ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {bottles.map((bottle) => (
            <div key={bottle.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 relative group">
              <div className="w-full h-40 relative rounded-lg overflow-hidden bg-slate-100 border">
                <img 
                  src={bottle.image} 
                  alt={bottle.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80";
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">{bottle.name}</h3>
                <span className="text-sm font-bold text-[#2E7D32]">₹{bottle.price}</span>
              </div>
              <p className="text-xs text-slate-500">{bottle.description}</p>
              <button
                onClick={() => handleDeleteNote(bottle.id)}
                className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 pt-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Bottle
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {currentNotes.map((note) => (
            <div key={note.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 relative flex flex-col justify-between">
              <div>
                {note.image && (
                  <div className="w-full h-28 relative rounded-lg overflow-hidden bg-slate-100 border mb-2">
                    <img 
                      src={note.image} 
                      alt={note.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" style={{ backgroundColor: note.color || "#8B5A2B" }} />
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{note.category}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mt-1">{note.name}</h4>
                <p className="text-xs text-slate-500 font-light line-clamp-2 mt-0.5">{note.description}</p>
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 mt-2">
                <span className="text-[10px] text-slate-400 font-mono">ID: {note.id.substring(0, 8)}</span>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-red-500 hover:text-red-700 text-xs p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
