import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fragranceQuiz } from "@/api/adminService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Sparkles,
  HelpCircle,
  GitBranch,
  BarChart3,
  MessageSquare,
  Settings,
  Save,
  ArrowRight,
} from "lucide-react";

export default function FragranceQuizDashboardPage() {
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "Fragrance Finder",
    description: "Discover your perfect fragrance",
    heroImage: "",
    isActive: true,
    showResults: true,
    maxQuestions: 15,
  });

  useEffect(() => {
    fetchQuiz();
  }, []);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await fragranceQuiz.getSettings();
      if (response.data.success) {
        const data = response.data.data;
        setQuiz(data);
        setFormData({
          title: data.title || "Fragrance Finder",
          description: data.description || "Discover your perfect fragrance",
          heroImage: data.heroImage || "",
          isActive: data.isActive,
          showResults: data.showResults,
          maxQuestions: data.maxQuestions || 15,
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fragranceQuiz.updateSettings(formData);
      if (response.data.success) {
        toast.success("Quiz settings saved");
        fetchQuiz();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A3B3F]" />
      </div>
    );
  }

  const stats = quiz?.stats || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#B8976A]" />
            Fragrance Finder
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your quiz settings and view overview
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/fragrance-quiz/questions">
            <Button variant="outline" size="sm">
              <HelpCircle className="h-4 w-4 mr-2" />
              Questions
            </Button>
          </Link>
          <Link to="/fragrance-quiz/rules">
            <Button variant="outline" size="sm">
              <GitBranch className="h-4 w-4 mr-2" />
              Rules
            </Button>
          </Link>
          <Link to="/fragrance-quiz/analytics">
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#E5E7EB]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Questions</p>
                <p className="text-2xl font-bold text-[#1F2937] mt-1">
                  {stats.questionCount || 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-[#D97706]" />
              </div>
            </div>
            <Link
              to="/fragrance-quiz/questions"
              className="text-xs text-[#0A3B3F] hover:underline mt-3 inline-flex items-center gap-1"
            >
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-[#E5E7EB]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Active Rules</p>
                <p className="text-2xl font-bold text-[#1F2937] mt-1">
                  {stats.ruleCount || 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#DBEAFE] flex items-center justify-center">
                <GitBranch className="h-5 w-5 text-[#2563EB]" />
              </div>
            </div>
            <Link
              to="/fragrance-quiz/rules"
              className="text-xs text-[#0A3B3F] hover:underline mt-3 inline-flex items-center gap-1"
            >
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-[#E5E7EB]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Responses</p>
                <p className="text-2xl font-bold text-[#1F2937] mt-1">
                  {stats.responseCount || 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#D1FAE5] flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-[#059669]" />
              </div>
            </div>
            <Link
              to="/fragrance-quiz/responses"
              className="text-xs text-[#0A3B3F] hover:underline mt-3 inline-flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-[#E5E7EB]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                <p className="text-2xl font-bold mt-1">
                  {quiz?.isActive ? (
                    <span className="text-[#059669]">Active</span>
                  ) : (
                    <span className="text-gray-400">Inactive</span>
                  )}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#F3E8FF] flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-[#7C3AED]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Card */}
      <Card className="border-[#E5E7EB]">
        <CardHeader className="border-b border-[#E5E7EB]">
          <CardTitle className="text-lg font-semibold text-[#1F2937] flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quiz Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Fragrance Finder"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxQuestions">Max Questions</Label>
              <Input
                id="maxQuestions"
                type="number"
                min={1}
                max={50}
                value={formData.maxQuestions}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxQuestions: parseInt(e.target.value) || 15,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Discover your perfect fragrance"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heroImage">Hero Image URL</Label>
            <Input
              id="heroImage"
              value={formData.heroImage}
              onChange={(e) =>
                setFormData({ ...formData, heroImage: e.target.value })
              }
              placeholder="https://..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Quiz Active
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="showResults"
                checked={formData.showResults}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, showResults: checked })
                }
              />
              <Label htmlFor="showResults" className="cursor-pointer">
                Show Results to Users
              </Label>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#0A3B3F] hover:bg-[#0d4d52] text-white"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
