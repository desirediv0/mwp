import { useState, useEffect } from "react";
import { fragranceQuiz } from "@/api/adminService";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Loader2,
  TrendingUp,
  Users,
  Clock,
  Target,
  Smartphone,
  Monitor,
  Tablet,
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalResponses: number;
    completedResponses: number;
    completionRate: number;
    avgTimeTaken: number;
    periodResponses: number;
    periodCompleted: number;
  };
  mostSelectedAnswers: {
    optionId: string;
    optionTitle: string;
    questionTitle: string;
    count: number;
    percentage: string;
  }[];
  popularProducts: {
    productId: string;
    productName: string;
    productSlug: string;
    image: string | null;
    count: number;
    percentage: string;
  }[];
  dailyResponses: {
    date: string;
    total: number;
    completed: number;
  }[];
  deviceBreakdown: {
    device: string;
    count: number;
  }[];
}

export default function FragranceQuizAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fragranceQuiz.getAnalytics({ period });
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device?.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const maxBarValue = analytics?.dailyResponses
    ? Math.max(...analytics.dailyResponses.map((d) => d.total), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[#B8976A]" />
            Quiz Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track quiz performance and user engagement
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#0A3B3F]" />
        </div>
      ) : !analytics ? (
        <Card className="border-[#E5E7EB]">
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No analytics data available yet</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-[#E5E7EB]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Total Responses
                    </p>
                    <p className="text-2xl font-bold text-[#1F2937] mt-1">
                      {analytics.overview.totalResponses.toLocaleString()}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-[#DBEAFE] flex items-center justify-center">
                    <Users className="h-5 w-5 text-[#2563EB]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#E5E7EB]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Completed
                    </p>
                    <p className="text-2xl font-bold text-[#1F2937] mt-1">
                      {analytics.overview.completedResponses.toLocaleString()}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-[#D1FAE5] flex items-center justify-center">
                    <Target className="h-5 w-5 text-[#059669]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#E5E7EB]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Completion Rate
                    </p>
                    <p className="text-2xl font-bold text-[#1F2937] mt-1">
                      {analytics.overview.completionRate}%
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-[#D97706]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#E5E7EB]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      Avg. Time
                    </p>
                    <p className="text-2xl font-bold text-[#1F2937] mt-1">
                      {Math.floor(analytics.overview.avgTimeTaken / 60)}m{" "}
                      {analytics.overview.avgTimeTaken % 60}s
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-[#F3E8FF] flex items-center justify-center">
                    <Clock className="h-5 w-5 text-[#7C3AED]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Responses Chart */}
            <Card className="border-[#E5E7EB]">
              <CardHeader className="border-b border-[#E5E7EB]">
                <CardTitle className="text-base font-semibold text-[#1F2937]">
                  Daily Responses
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {analytics.dailyResponses.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No data for this period
                  </p>
                ) : (
                  <div className="space-y-2">
                    {analytics.dailyResponses.map((day) => (
                      <div key={day.date} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-20 shrink-0">
                          {new Date(day.date).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                            <div
                              className="h-full bg-[#0A3B3F] rounded-full transition-all"
                              style={{
                                width: `${(day.total / maxBarValue) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-mono text-gray-600 w-8 text-right">
                            {day.total}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card className="border-[#E5E7EB]">
              <CardHeader className="border-b border-[#E5E7EB]">
                <CardTitle className="text-base font-semibold text-[#1F2937]">
                  Device Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {analytics.deviceBreakdown.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No device data
                  </p>
                ) : (
                  <div className="space-y-4">
                    {analytics.deviceBreakdown.map((device) => {
                      const total = analytics.deviceBreakdown.reduce(
                        (sum, d) => sum + d.count,
                        0
                      );
                      const percentage =
                        total > 0
                          ? ((device.count / total) * 100).toFixed(1)
                          : 0;
                      return (
                        <div key={device.device} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(device.device)}
                              <span className="text-sm font-medium text-[#1F2937] capitalize">
                                {device.device || "Unknown"}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {device.count} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="h-full bg-[#B8976A] rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Selected Answers */}
            <Card className="border-[#E5E7EB]">
              <CardHeader className="border-b border-[#E5E7EB]">
                <CardTitle className="text-base font-semibold text-[#1F2937]">
                  Most Selected Answers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {analytics.mostSelectedAnswers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No answer data yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analytics.mostSelectedAnswers
                      .slice(0, 10)
                      .map((answer, i) => (
                        <div
                          key={answer.optionId}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                        >
                          <span className="text-xs font-mono text-gray-400 w-6 text-center">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-[#1F2937] block truncate">
                              {answer.optionTitle}
                            </span>
                            <span className="text-xs text-gray-400">
                              {answer.questionTitle}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-semibold text-[#1F2937]">
                              {answer.count}
                            </span>
                            <span className="text-xs text-gray-400 block">
                              {answer.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Popular Products */}
            <Card className="border-[#E5E7EB]">
              <CardHeader className="border-b border-[#E5E7EB]">
                <CardTitle className="text-base font-semibold text-[#1F2937]">
                  Popular Recommended Products
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {analytics.popularProducts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    No product recommendations yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analytics.popularProducts.map((product, i) => (
                      <div
                        key={product.productId}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                      >
                        <span className="text-xs font-mono text-gray-400 w-6 text-center">
                          {i + 1}
                        </span>
                        <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.productName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                              N/A
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-[#1F2937] block truncate">
                            {product.productName}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-semibold text-[#1F2937]">
                            {product.count}
                          </span>
                          <span className="text-xs text-gray-400 block">
                            {product.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
