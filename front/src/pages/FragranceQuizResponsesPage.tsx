import { useState, useEffect } from "react";
import { fragranceQuiz } from "@/api/adminService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
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
import {
  Loader2,
  MessageSquare,
  Eye,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  Calendar,
  User,
} from "lucide-react";

interface Response {
  id: string;
  userId?: string;
  guestId?: string;
  user?: { id: string; name: string; email: string };
  answers: {
    questionId: string;
    questionTitle: string;
    optionId?: string;
    optionTitle?: string;
    value?: string;
  }[];
  recommendedProducts: { productId: string; name: string; matchPercentage: number }[];
  timeTaken?: number;
  device?: string;
  browser?: string;
  completed: boolean;
  createdAt: string;
}

export default function FragranceQuizResponsesPage() {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [completed, setCompleted] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Detail Dialog
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    response?: Response;
  }>({ open: false });

  useEffect(() => {
    fetchResponses();
  }, [pagination.page, completed, startDate, endDate]);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (completed !== "all") params.completed = completed;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await fragranceQuiz.getResponses(params);
      if (response.data.success) {
        setResponses(response.data.data?.responses || []);
        setPagination(
          response.data.data?.pagination || {
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 1,
          }
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load responses");
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (device?: string) => {
    switch (device?.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-3.5 w-3.5" />;
      case "tablet":
        return <Tablet className="h-3.5 w-3.5" />;
      default:
        return <Monitor className="h-3.5 w-3.5" />;
    }
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return "-";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1F2937] flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-[#B8976A]" />
          Quiz Responses
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          View all quiz submissions from users and guests
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={completed} onValueChange={setCompleted}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Completed</SelectItem>
            <SelectItem value="false">Incomplete</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[160px]"
          />
          <span className="text-gray-400">-</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[160px]"
          />
        </div>

        <span className="text-sm text-gray-500 ml-auto">
          {pagination.total} response{pagination.total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#0A3B3F]" />
        </div>
      ) : responses.length === 0 ? (
        <Card className="border-[#E5E7EB]">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No responses yet
            </h3>
            <p className="text-sm text-gray-400">
              Responses will appear here when users complete the quiz
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-[#E5E7EB]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Answers</TableHead>
                    <TableHead>Recommendations</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>
                        {response.user ? (
                          <div>
                            <span className="text-sm font-medium text-[#1F2937] block">
                              {response.user.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {response.user.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Guest ({response.guestId?.slice(0, 8) || "N/A"})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-[#1F2937]">
                          {response.answers?.length || 0} answer
                          {(response.answers?.length || 0) !== 1 ? "s" : ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(response.recommendedProducts || [])
                            .slice(0, 2)
                            .map((p) => (
                              <Badge
                                key={p.productId}
                                className="text-[10px] bg-[#D1FAE5] text-[#065F46] border-0"
                              >
                                {p.name}
                                {p.matchPercentage > 0 &&
                                  ` (${p.matchPercentage}%)`}
                              </Badge>
                            ))}
                          {(response.recommendedProducts || []).length >
                            2 && (
                            <Badge
                              className="text-[10px] bg-[#D1FAE5] text-[#065F46] border-0"
                            >
                              +
                              {(response.recommendedProducts || []).length -
                                2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(response.timeTaken)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          {getDeviceIcon(response.device)}
                          <span className="capitalize">
                            {response.device || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            response.completed
                              ? "text-[#059669] border-[#059669]"
                              : "text-gray-400"
                          }
                        >
                          {response.completed ? "Completed" : "Incomplete"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">
                          {new Date(response.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDetailDialog({ open: true, response })
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={detailDialog.open}
        onOpenChange={(open) =>
          !open && setDetailDialog({ open: false })
        }
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quiz Response Details</DialogTitle>
          </DialogHeader>

          {detailDialog.response && (
            <div className="space-y-6 py-2">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-[#1F2937]">
                    {detailDialog.response.user?.name || "Guest User"}
                  </span>
                  <span className="text-xs text-gray-400 block">
                    {detailDialog.response.user?.email ||
                      `Guest ID: ${detailDialog.response.guestId || "N/A"}`}
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    {getDeviceIcon(detailDialog.response.device)}
                    {detailDialog.response.device || "N/A"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(detailDialog.response.timeTaken)}
                  </span>
                </div>
              </div>

              {/* Answers */}
              <div>
                <h3 className="text-sm font-semibold text-[#1F2937] mb-3">
                  Answers ({detailDialog.response.answers?.length || 0})
                </h3>
                <div className="space-y-2">
                  {detailDialog.response.answers?.map((answer, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-xs font-mono text-gray-400 mt-0.5">
                        {i + 1}.
                      </span>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-[#1F2937] block">
                          {answer.questionTitle}
                        </span>
                        <Badge
                          variant="outline"
                          className="mt-1 text-xs"
                        >
                          {answer.optionTitle || answer.value || "N/A"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-sm font-semibold text-[#1F2937] mb-3">
                  Recommended Products (
                  {detailDialog.response.recommendedProducts?.length || 0})
                </h3>
                {(detailDialog.response.recommendedProducts || []).length ===
                0 ? (
                  <p className="text-sm text-gray-400">
                    No products recommended
                  </p>
                ) : (
                  <div className="space-y-2">
                    {detailDialog.response.recommendedProducts?.map(
                      (product) => (
                        <div
                          key={product.productId}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm font-medium text-[#1F2937]">
                            {product.name}
                          </span>
                          {product.matchPercentage > 0 && (
                            <Badge className="bg-[#D1FAE5] text-[#065F46] border-0">
                              {product.matchPercentage}% match
                            </Badge>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="text-xs text-gray-400 border-t border-[#E5E7EB] pt-3">
                <p>
                  Submitted:{" "}
                  {new Date(
                    detailDialog.response.createdAt
                  ).toLocaleString("en-IN")}
                </p>
                <p>Response ID: {detailDialog.response.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
