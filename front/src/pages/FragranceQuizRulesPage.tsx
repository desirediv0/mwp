import { useState, useEffect } from "react";
import { fragranceQuiz } from "@/api/adminService";
import api from "@/api/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  GitBranch,
  Search,
  X,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Rule {
  id: string;
  name: string;
  description?: string;
  operator: string;
  priority: number;
  weight: number;
  isActive: boolean;
  conditions: {
    id: string;
    questionId: string;
    questionTitle: string;
    optionId: string;
    optionTitle: string;
  }[];
  products: {
    id: string;
    productId: string;
    priority: number;
    product: {
      id: string;
      name: string;
      slug: string;
      image: string | null;
    };
  }[];
}

interface Question {
  id: string;
  title: string;
  options: { id: string; title: string }[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
}

export default function FragranceQuizRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // Rule Dialog
  const [ruleDialog, setRuleDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    rule?: Rule;
  }>({ open: false, mode: "create" });
  const [ruleForm, setRuleForm] = useState({
    name: "",
    description: "",
    operator: "AND",
    priority: 0,
    weight: 1.0,
    isActive: true,
    conditions: [] as { questionId: string; optionId: string }[],
    productIds: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  // Delete Dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    title: string;
  }>({ open: false, id: "", title: "" });
  const [deleting, setDeleting] = useState(false);

  // Product search
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    fetchRules();
    fetchQuestions();
    fetchProducts();
  }, [search]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fragranceQuiz.getRules({ search, limit: 100 });
      if (response.data.success) {
        setRules(response.data.data?.rules || []);
        setPagination(response.data.data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load rules");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await fragranceQuiz.getQuestions({ limit: 100, isActive: "true" });
      if (response.data.success) {
        setQuestions(response.data.data?.questions || []);
      }
    } catch (error) {
      console.error("Failed to load questions");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get("/api/admin/products", { params: { limit: 500, isActive: true } });
      if (response.data.success) {
        setProducts(
          (response.data.data?.products || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load products");
    }
  };

  // ─── Rule CRUD ───────────────────────────────────────────────

  const openCreateRule = () => {
    setRuleForm({
      name: "",
      description: "",
      operator: "AND",
      priority: 0,
      weight: 1.0,
      isActive: true,
      conditions: [{ questionId: "", optionId: "" }],
      productIds: [],
    });
    setRuleDialog({ open: true, mode: "create" });
  };

  const openEditRule = (rule: Rule) => {
    setRuleForm({
      name: rule.name,
      description: rule.description || "",
      operator: rule.operator,
      priority: rule.priority,
      weight: rule.weight,
      isActive: rule.isActive,
      conditions: rule.conditions.map((c) => ({
        questionId: c.questionId,
        optionId: c.optionId,
      })),
      productIds: rule.products.map((p) => p.productId),
    });
    setRuleDialog({ open: true, mode: "edit", rule });
  };

  const handleSaveRule = async () => {
    if (!ruleForm.name.trim()) {
      toast.error("Rule name is required");
      return;
    }
    if (ruleForm.conditions.length === 0 || ruleForm.conditions.every((c) => !c.questionId || !c.optionId)) {
      toast.error("At least one valid condition is required");
      return;
    }
    if (ruleForm.productIds.length === 0) {
      toast.error("Select at least one product");
      return;
    }

    try {
      setSaving(true);
      const validConditions = ruleForm.conditions.filter(
        (c) => c.questionId && c.optionId
      );
      const data = { ...ruleForm, conditions: validConditions };

      if (ruleDialog.mode === "create") {
        const response = await fragranceQuiz.createRule(data);
        if (response.data.success) {
          toast.success("Rule created");
          fetchRules();
        }
      } else {
        const response = await fragranceQuiz.updateRule(ruleDialog.rule!.id, data);
        if (response.data.success) {
          toast.success("Rule updated");
          fetchRules();
        }
      }
      setRuleDialog({ open: false, mode: "create" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await fragranceQuiz.deleteRule(deleteDialog.id);
      if (response.data.success) {
        toast.success("Rule deleted");
        fetchRules();
      }
      setDeleteDialog({ open: false, id: "", title: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleRule = async (rule: Rule) => {
    try {
      await fragranceQuiz.toggleRuleStatus(rule.id);
      fetchRules();
    } catch (error: any) {
      toast.error("Failed to toggle rule");
    }
  };

  const addCondition = () => {
    setRuleForm({
      ...ruleForm,
      conditions: [...ruleForm.conditions, { questionId: "", optionId: "" }],
    });
  };

  const removeCondition = (index: number) => {
    setRuleForm({
      ...ruleForm,
      conditions: ruleForm.conditions.filter((_, i) => i !== index),
    });
  };

  const updateCondition = (
    index: number,
    field: "questionId" | "optionId",
    value: string
  ) => {
    const newConditions = [...ruleForm.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    // Reset option when question changes
    if (field === "questionId") {
      newConditions[index].optionId = "";
    }
    setRuleForm({ ...ruleForm, conditions: newConditions });
  };

  const toggleProduct = (productId: string) => {
    setRuleForm((prev) => {
      const exists = prev.productIds.includes(productId);
      return {
        ...prev,
        productIds: exists
          ? prev.productIds.filter((id) => id !== productId)
          : [...prev.productIds, productId],
      };
    });
  };

  const getOptionsForQuestion = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    return question?.options || [];
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-[#B8976A]" />
            Recommendation Rules
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Define IF/THEN rules to map quiz answers to products
          </p>
        </div>
        <Button
          onClick={openCreateRule}
          className="bg-[#0A3B3F] hover:bg-[#0d4d52] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search rules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <span className="text-sm text-gray-500">
          {pagination.total} rule{pagination.total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Rules Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#0A3B3F]" />
        </div>
      ) : rules.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <CardContent className="p-12 text-center">
            <GitBranch className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No rules yet
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Create rules to recommend products based on quiz answers
            </p>
            <Button
              onClick={openCreateRule}
              className="bg-[#0A3B3F] hover:bg-[#0d4d52] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#E5E7EB]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium text-[#1F2937]">
                          {rule.name}
                        </span>
                        {rule.description && (
                          <p className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">
                            {rule.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {rule.conditions.slice(0, 3).map((c, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-[10px]"
                          >
                            {c.questionTitle}: {c.optionTitle}
                          </Badge>
                        ))}
                        {rule.conditions.length > 3 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{rule.conditions.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {rule.products.slice(0, 2).map((rp) => (
                          <Badge
                            key={rp.id}
                            className="text-[10px] bg-[#D1FAE5] text-[#065F46] border-0"
                          >
                            {rp.product.name}
                          </Badge>
                        ))}
                        {rule.products.length > 2 && (
                          <Badge
                            className="text-[10px] bg-[#D1FAE5] text-[#065F46] border-0"
                          >
                            +{rule.products.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.operator}</Badge>
                    </TableCell>
                    <TableCell>{rule.priority}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleRule(rule)}
                        className="flex items-center"
                      >
                        {rule.isActive ? (
                          <ToggleRight className="h-6 w-6 text-[#059669]" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditRule(rule)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              id: rule.id,
                              title: rule.name,
                            })
                          }
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Rule Dialog */}
      <Dialog
        open={ruleDialog.open}
        onOpenChange={(open) =>
          !open && setRuleDialog({ open: false, mode: "create" })
        }
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {ruleDialog.mode === "create" ? "Create Rule" : "Edit Rule"}
            </DialogTitle>
            <DialogDescription>
              Define conditions (IF) and products (THEN) for this rule
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Rule Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={ruleForm.name}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, name: e.target.value })
                  }
                  placeholder="e.g., Woody Office Lovers"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={ruleForm.description}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, description: e.target.value })
                  }
                  placeholder="Optional description"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Operator</Label>
                <Select
                  value={ruleForm.operator}
                  onValueChange={(value) =>
                    setRuleForm({ ...ruleForm, operator: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND (All match)</SelectItem>
                    <SelectItem value="OR">OR (Any match)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  min={0}
                  value={ruleForm.priority}
                  onChange={(e) =>
                    setRuleForm({
                      ...ruleForm,
                      priority: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Weight</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={ruleForm.weight}
                  onChange={(e) =>
                    setRuleForm({
                      ...ruleForm,
                      weight: parseFloat(e.target.value) || 1.0,
                    })
                  }
                />
              </div>
            </div>

            {/* Conditions (IF) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#1F2937]">
                  IF (Conditions)
                </h3>
                <Button variant="outline" size="sm" onClick={addCondition}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Condition
                </Button>
              </div>

              <div className="space-y-2">
                {ruleForm.conditions.map((condition, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-[#E5E7EB]"
                  >
                    <span className="text-xs text-gray-400 shrink-0">
                      {index + 1}.
                    </span>
                    <Select
                      value={condition.questionId}
                      onValueChange={(value) =>
                        updateCondition(index, "questionId", value)
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select question" />
                      </SelectTrigger>
                      <SelectContent>
                        {questions.map((q) => (
                          <SelectItem key={q.id} value={q.id}>
                            {q.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-gray-400 shrink-0">=</span>
                    <Select
                      value={condition.optionId}
                      onValueChange={(value) =>
                        updateCondition(index, "optionId", value)
                      }
                      disabled={!condition.questionId}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        {getOptionsForQuestion(condition.questionId).map(
                          (opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.title}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(index)}
                      disabled={ruleForm.conditions.length <= 1}
                      className="text-red-500 hover:text-red-700 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Products (THEN) */}
            <div>
              <h3 className="text-sm font-semibold text-[#1F2937] mb-3">
                THEN (Recommend Products)
              </h3>

              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="max-h-48 overflow-y-auto border border-[#E5E7EB] rounded-lg">
                {filteredProducts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No products found
                  </p>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer border-b border-[#E5E7EB] last:border-0"
                      onClick={() => toggleProduct(product.id)}
                    >
                      <input
                        type="checkbox"
                        checked={ruleForm.productIds.includes(product.id)}
                        onChange={() => toggleProduct(product.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-[#1F2937]">
                        {product.name}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {ruleForm.productIds.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {ruleForm.productIds.length} product
                  {ruleForm.productIds.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={ruleForm.isActive}
                onCheckedChange={(checked) =>
                  setRuleForm({ ...ruleForm, isActive: checked })
                }
              />
              <Label className="cursor-pointer">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRuleDialog({ open: false, mode: "create" })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRule}
              disabled={saving}
              className="bg-[#0A3B3F] hover:bg-[#0d4d52] text-white"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {ruleDialog.mode === "create" ? "Create Rule" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, id: "", title: "" })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteDialog.title}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, id: "", title: "" })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
