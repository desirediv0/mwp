import { useState, useEffect } from "react";
import { fragranceQuiz } from "@/api/adminService";
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
  GripVertical,
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const QUESTION_TYPES = [
  { value: "SINGLE_CHOICE", label: "Single Choice" },
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "IMAGE_CHOICE", label: "Image Choice" },
  { value: "ICON_CHOICE", label: "Icon Choice" },
  { value: "YES_NO", label: "Yes / No" },
  { value: "SLIDER", label: "Slider" },
];

interface Question {
  id: string;
  title: string;
  description?: string;
  questionType: string;
  isRequired: boolean;
  isActive: boolean;
  image?: string;
  order: number;
  optionCount: number;
  options: Option[];
}

interface Option {
  id: string;
  title: string;
  description?: string;
  image?: string;
  icon?: string;
  score: number;
  tags: string[];
  priority: number;
  order: number;
  isActive: boolean;
}

export default function FragranceQuizQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // Question Dialog
  const [questionDialog, setQuestionDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    question?: Question;
  }>({ open: false, mode: "create" });
  const [questionForm, setQuestionForm] = useState({
    title: "",
    description: "",
    questionType: "SINGLE_CHOICE",
    isRequired: true,
    isActive: true,
    image: "",
    order: 0,
  });
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Option Dialog
  const [optionDialog, setOptionDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    questionId?: string;
    questionTitle?: string;
    option?: Option;
  }>({ open: false, mode: "create" });
  const [optionForm, setOptionForm] = useState({
    title: "",
    description: "",
    image: "",
    icon: "",
    score: 1,
    tags: "",
    priority: 0,
    isActive: true,
  });
  const [savingOption, setSavingOption] = useState(false);

  // Delete Dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    title: string;
    type: "question" | "option";
    parentId?: string;
  }>({ open: false, id: "", title: "", type: "question" });
  const [deleting, setDeleting] = useState(false);

  // Expanded questions
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchQuestions();
  }, [search]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fragranceQuiz.getQuestions({
        search,
        limit: 100,
      });
      if (response.data.success) {
        setQuestions(response.data.data?.questions || []);
        setPagination(response.data.data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  // ─── Question CRUD ───────────────────────────────────────────

  const openCreateQuestion = () => {
    setQuestionForm({
      title: "",
      description: "",
      questionType: "SINGLE_CHOICE",
      isRequired: true,
      isActive: true,
      image: "",
      order: questions.length + 1,
    });
    setQuestionDialog({ open: true, mode: "create" });
  };

  const openEditQuestion = (question: Question) => {
    setQuestionForm({
      title: question.title,
      description: question.description || "",
      questionType: question.questionType,
      isRequired: question.isRequired,
      isActive: question.isActive,
      image: question.image || "",
      order: question.order,
    });
    setQuestionDialog({ open: true, mode: "edit", question });
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      setSavingQuestion(true);
      if (questionDialog.mode === "create") {
        const response = await fragranceQuiz.createQuestion(questionForm);
        if (response.data.success) {
          toast.success("Question created");
          fetchQuestions();
        }
      } else {
        const response = await fragranceQuiz.updateQuestion(
          questionDialog.question!.id,
          questionForm
        );
        if (response.data.success) {
          toast.success("Question updated");
          fetchQuestions();
        }
      }
      setQuestionDialog({ open: false, mode: "create" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save question");
    } finally {
      setSavingQuestion(false);
    }
  };

  const confirmDeleteQuestion = (question: Question) => {
    setDeleteDialog({
      open: true,
      id: question.id,
      title: question.title,
      type: "question",
    });
  };

  const confirmDeleteOption = (option: Option, questionId: string) => {
    setDeleteDialog({
      open: true,
      id: option.id,
      title: option.title,
      type: "option",
      parentId: questionId,
    });
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      if (deleteDialog.type === "question") {
        const response = await fragranceQuiz.deleteQuestion(deleteDialog.id);
        if (response.data.success) {
          toast.success("Question deleted");
          fetchQuestions();
        }
      } else {
        const response = await fragranceQuiz.deleteOption(deleteDialog.id);
        if (response.data.success) {
          toast.success("Option deleted");
          fetchQuestions();
        }
      }
      setDeleteDialog({ open: false, id: "", title: "", type: "question" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleQuestion = async (question: Question) => {
    try {
      await fragranceQuiz.updateQuestion(question.id, {
        isActive: !question.isActive,
      });
      fetchQuestions();
    } catch (error: any) {
      toast.error("Failed to toggle question");
    }
  };

  const handleMoveQuestion = async (questionId: string, direction: "up" | "down") => {
    const currentIndex = questions.findIndex((q) => q.id === questionId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const newOrder = [...questions];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];

    const questionIds = newOrder.map((q) => q.id);
    try {
      await fragranceQuiz.reorderQuestions(questionIds);
      setQuestions(newOrder.map((q, i) => ({ ...q, order: i + 1 })));
      toast.success("Questions reordered");
    } catch (error: any) {
      toast.error("Failed to reorder");
    }
  };

  // ─── Option CRUD ─────────────────────────────────────────────

  const openCreateOption = (questionId: string, questionTitle: string) => {
    setOptionForm({
      title: "",
      description: "",
      image: "",
      icon: "",
      score: 1,
      tags: "",
      priority: 0,
      isActive: true,
    });
    setOptionDialog({ open: true, mode: "create", questionId, questionTitle });
  };

  const openEditOption = (option: Option, questionId: string, questionTitle: string) => {
    setOptionForm({
      title: option.title,
      description: option.description || "",
      image: option.image || "",
      icon: option.icon || "",
      score: option.score,
      tags: (option.tags || []).join(", "),
      priority: option.priority,
      isActive: option.isActive,
    });
    setOptionDialog({ open: true, mode: "edit", questionId, questionTitle, option });
  };

  const handleSaveOption = async () => {
    if (!optionForm.title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      setSavingOption(true);
      const data = {
        ...optionForm,
        tags: optionForm.tags
          ? optionForm.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
          : [],
      };

      if (optionDialog.mode === "create") {
        const response = await fragranceQuiz.createOption(
          optionDialog.questionId!,
          data
        );
        if (response.data.success) {
          toast.success("Option added");
          fetchQuestions();
        }
      } else {
        const response = await fragranceQuiz.updateOption(
          optionDialog.option!.id,
          data
        );
        if (response.data.success) {
          toast.success("Option updated");
          fetchQuestions();
        }
      }
      setOptionDialog({ open: false, mode: "create" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save option");
    } finally {
      setSavingOption(false);
    }
  };

  const toggleExpand = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-[#B8976A]" />
            Quiz Questions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage quiz questions with options
          </p>
        </div>
        <Button
          onClick={openCreateQuestion}
          className="bg-[#0A3B3F] hover:bg-[#0d4d52] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <span className="text-sm text-gray-500">
          {pagination.total} question{pagination.total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#0A3B3F]" />
        </div>
      ) : questions.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <CardContent className="p-12 text-center">
            <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No questions yet
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Create your first question to start building your quiz
            </p>
            <Button
              onClick={openCreateQuestion}
              className="bg-[#0A3B3F] hover:bg-[#0d4d52] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <Card
              key={question.id}
              className="border-[#E5E7EB] overflow-hidden"
            >
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(question.id)}
              >
                <div className="flex items-center gap-2 text-gray-400">
                  <GripVertical className="h-4 w-4" />
                  <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {question.order}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[#1F2937] truncate">
                      {question.title}
                    </h3>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {QUESTION_TYPES.find(
                        (t) => t.value === question.questionType
                      )?.label || question.questionType}
                    </Badge>
                    {question.isRequired && (
                      <Badge className="text-[10px] bg-[#FEF3C7] text-[#92400E] border-0 shrink-0">
                        Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {question.optionCount} option{question.optionCount !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={question.isActive}
                    onCheckedChange={() => handleToggleQuestion(question)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveQuestion(question.id, "up");
                    }}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveQuestion(question.id, "down");
                    }}
                    disabled={index === questions.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditQuestion(question);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDeleteQuestion(question);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded Options */}
              {expandedQuestions.has(question.id) && (
                <div className="border-t border-[#E5E7EB] bg-gray-50/50">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-600">
                        Options ({question.options?.length || 0})
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openCreateOption(question.id, question.title)
                        }
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Option
                      </Button>
                    </div>

                    {question.options && question.options.length > 0 ? (
                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <div
                            key={option.id}
                            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[#E5E7EB]"
                          >
                            <span className="text-xs font-mono text-gray-400 w-6 text-center">
                              {option.order}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-[#1F2937]">
                                {option.title}
                              </span>
                              {option.description && (
                                <p className="text-xs text-gray-400 mt-0.5 truncate">
                                  {option.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className="text-[10px]">
                                Score: {option.score}
                              </Badge>
                              {option.tags && option.tags.length > 0 && (
                                <div className="flex gap-1">
                                  {option.tags.slice(0, 2).map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  openEditOption(
                                    option,
                                    question.id,
                                    question.title
                                  )
                                }
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  confirmDeleteOption(option, question.id)
                                }
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-4">
                        No options yet. Add options for this question.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Question Dialog */}
      <Dialog
        open={questionDialog.open}
        onOpenChange={(open) =>
          !open && setQuestionDialog({ open: false, mode: "create" })
        }
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {questionDialog.mode === "create"
                ? "Create Question"
                : "Edit Question"}
            </DialogTitle>
            <DialogDescription>
              {questionDialog.mode === "create"
                ? "Add a new question to your quiz"
                : "Update the question details"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                value={questionForm.title}
                onChange={(e) =>
                  setQuestionForm({ ...questionForm, title: e.target.value })
                }
                placeholder="e.g., What fragrance family do you enjoy?"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={questionForm.description}
                onChange={(e) =>
                  setQuestionForm({
                    ...questionForm,
                    description: e.target.value,
                  })
                }
                placeholder="Optional description or hint"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select
                  value={questionForm.questionType}
                  onValueChange={(value) =>
                    setQuestionForm({ ...questionForm, questionType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  min={1}
                  value={questionForm.order}
                  onChange={(e) =>
                    setQuestionForm({
                      ...questionForm,
                      order: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={questionForm.image}
                onChange={(e) =>
                  setQuestionForm({ ...questionForm, image: e.target.value })
                }
                placeholder="Optional image URL"
              />
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  checked={questionForm.isRequired}
                  onCheckedChange={(checked) =>
                    setQuestionForm({ ...questionForm, isRequired: checked })
                  }
                />
                <Label className="cursor-pointer">Required</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={questionForm.isActive}
                  onCheckedChange={(checked) =>
                    setQuestionForm({ ...questionForm, isActive: checked })
                  }
                />
                <Label className="cursor-pointer">Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setQuestionDialog({ open: false, mode: "create" })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveQuestion}
              disabled={savingQuestion}
              className="bg-[#0A3B3F] hover:bg-[#0d4d52] text-white"
            >
              {savingQuestion && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {questionDialog.mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Option Dialog */}
      <Dialog
        open={optionDialog.open}
        onOpenChange={(open) =>
          !open && setOptionDialog({ open: false, mode: "create" })
        }
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {optionDialog.mode === "create" ? "Add Option" : "Edit Option"}
            </DialogTitle>
            <DialogDescription>
              {optionDialog.mode === "create"
                ? `Add an option to "${optionDialog.questionTitle}"`
                : "Update the option details"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                value={optionForm.title}
                onChange={(e) =>
                  setOptionForm({ ...optionForm, title: e.target.value })
                }
                placeholder="e.g., Woody"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={optionForm.description}
                onChange={(e) =>
                  setOptionForm({ ...optionForm, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Input
                  value={optionForm.icon}
                  onChange={(e) =>
                    setOptionForm({ ...optionForm, icon: e.target.value })
                  }
                  placeholder="Icon name or URL"
                />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={optionForm.image}
                  onChange={(e) =>
                    setOptionForm({ ...optionForm, image: e.target.value })
                  }
                  placeholder="Image URL"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Score (Weight)</Label>
                <Input
                  type="number"
                  min={0}
                  value={optionForm.score}
                  onChange={(e) =>
                    setOptionForm({
                      ...optionForm,
                      score: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  min={0}
                  value={optionForm.priority}
                  onChange={(e) =>
                    setOptionForm({
                      ...optionForm,
                      priority: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input
                value={optionForm.tags}
                onChange={(e) =>
                  setOptionForm({ ...optionForm, tags: e.target.value })
                }
                placeholder="e.g., warm, spicy, elegant"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={optionForm.isActive}
                onCheckedChange={(checked) =>
                  setOptionForm({ ...optionForm, isActive: checked })
                }
              />
              <Label className="cursor-pointer">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setOptionDialog({ open: false, mode: "create" })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveOption}
              disabled={savingOption}
              className="bg-[#0A3B3F] hover:bg-[#0d4d52] text-white"
            >
              {savingOption && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {optionDialog.mode === "create" ? "Add" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open &&
          setDeleteDialog({ open: false, id: "", title: "", type: "question" })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {deleteDialog.type === "question" ? "Question" : "Option"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteDialog.title}&quot;?
              {deleteDialog.type === "question" &&
                " This will also delete all its options."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteDialog({
                  open: false,
                  id: "",
                  title: "",
                  type: "question",
                })
              }
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
