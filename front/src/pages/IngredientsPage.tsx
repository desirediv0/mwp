import { useEffect, useRef, useState } from "react";
import { ingredients as api } from "@/api/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, ImageIcon, FlaskConical } from "lucide-react";

interface Ingredient {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  benefit: string;
  displayOrder: number;
  isActive: boolean;
}

const empty = { name: "", benefit: "", displayOrder: 0, isActive: true };

export default function IngredientsPage() {
  const [list, setList] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.list();
      setList(res.data?.data?.ingredients || []);
    } catch {
      toast.error("Failed to load ingredients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty, displayOrder: list.length + 1 });
    setImageFile(null);
    setPreview(null);
    setOpen(true);
  };

  const openEdit = (ing: Ingredient) => {
    setEditing(ing);
    setForm({
      name: ing.name,
      benefit: ing.benefit,
      displayOrder: ing.displayOrder,
      isActive: ing.isActive,
    });
    setImageFile(null);
    setPreview(ing.image);
    setOpen(true);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    if (!form.name.trim() || !form.benefit.trim()) {
      toast.error("Name and benefit are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.update(editing.id, { ...form, image: imageFile });
        toast.success("Ingredient updated");
      } else {
        await api.create({ ...form, image: imageFile });
        toast.success("Ingredient created");
      }
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (ing: Ingredient) => {
    if (!confirm(`Delete "${ing.name}"?`)) return;
    try {
      await api.remove(ing.id);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2937] flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-[#4CAF50]" /> Ingredients
          </h1>
          <p className="text-sm text-[#9CA3AF] mt-1">
            The ingredient library shown on the public /ingredients page. Upload a clean
            raw-form image and a short benefit line for each.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add Ingredient
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#4CAF50]" />
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-20 border rounded-xl bg-white">
          <FlaskConical className="h-10 w-10 text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-[#1F2937] font-semibold">No ingredients yet</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Add your first ingredient to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {list.map((ing) => (
            <div key={ing.id} className="rounded-xl border bg-white overflow-hidden">
              <div className="relative aspect-square bg-[#F3F4F6] flex items-center justify-center">
                {ing.image ? (
                  <img src={ing.image} alt={ing.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-[#9CA3AF]">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-[10px] uppercase tracking-wide mt-1">No image</span>
                  </div>
                )}
                {!ing.isActive && (
                  <span className="absolute top-2 left-2 bg-[#F59E0B] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Hidden
                  </span>
                )}
                <span className="absolute top-2 right-2 bg-white/90 text-[#4B5563] text-[10px] font-bold px-2 py-0.5 rounded">
                  #{ing.displayOrder}
                </span>
              </div>
              <div className="p-3">
                <h3 className="text-[13px] font-bold text-[#1F2937] leading-snug">{ing.name}</h3>
                <p className="text-[12px] text-[#6B7280] leading-relaxed mt-1 line-clamp-3">
                  {ing.benefit}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(ing)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2]"
                    onClick={() => remove(ing)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Ingredient" : "Add Ingredient"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. KSM-66 Ashwagandha"
              />
            </div>
            <div>
              <Label>Benefit (one short line) *</Label>
              <textarea
                value={form.benefit}
                onChange={(e) => setForm((f) => ({ ...f, benefit: e.target.value }))}
                placeholder="Supports stress control, strength and energy."
                rows={3}
                className="w-full mt-1 rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:border-[#4CAF50]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm((f) => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                />
                <Label className="mb-0">Visible</Label>
              </div>
            </div>
            <div>
              <Label>Image (raw / natural form)</Label>
              <div
                onClick={() => fileRef.current?.click()}
                className="mt-1 border-2 border-dashed border-[#E5E7EB] rounded-lg p-4 text-center cursor-pointer hover:border-[#4CAF50]"
              >
                {preview ? (
                  <img src={preview} alt="" className="max-h-40 mx-auto rounded" />
                ) : (
                  <div className="text-[#9CA3AF] text-sm py-4">Click to upload image</div>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
