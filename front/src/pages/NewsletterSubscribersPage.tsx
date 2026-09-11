import { useState, useEffect } from "react";
import { Mail, Search, Loader2, RefreshCw, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/api/api";
import { toast } from "sonner";

interface Subscriber {
  id: string;
  email: string;
  source: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function NewsletterSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 50, pages: 1 });
  const [page, setPage] = useState(1);

  const fetchSubscribers = async (currentPage = page, search = searchTerm) => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: 50, search };
      if (activeFilter === "active") params.isActive = true;
      if (activeFilter === "inactive") params.isActive = false;

      const res = await api.get("/admin/newsletter/subscribers", { params });
      if (res.data?.success && res.data?.data) {
        setSubscribers(res.data.data.subscribers);
        setPagination(res.data.data.pagination);
      }
    } catch (err: any) {
      console.error("Failed to fetch subscribers:", err);
      toast.error(err.response?.data?.message || "Failed to load newsletter subscribers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers(1, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchSubscribers(1, searchTerm);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    fetchSubscribers(page, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleToggleStatus = async (subscriber: Subscriber) => {
    try {
      const res = await api.patch(`/admin/newsletter/subscribers/${subscriber.id}/status`, {
        isActive: !subscriber.isActive,
      });
      if (res.data?.success) {
        toast.success(`Subscriber ${subscriber.isActive ? "deactivated" : "activated"} successfully`);
        await fetchSubscribers(page, searchTerm);
      }
    } catch (err: any) {
      console.error("Toggle status error:", err);
      toast.error(err.response?.data?.message || "Failed to update subscriber status");
    }
  };

  const handleDelete = async (subscriber: Subscriber) => {
    if (!confirm(`Are you sure you want to remove ${subscriber.email}?`)) return;
    try {
      const res = await api.delete(`/admin/newsletter/subscribers/${subscriber.id}`);
      if (res.data?.success) {
        toast.success("Subscriber removed successfully");
        await fetchSubscribers(page, searchTerm);
      }
    } catch (err: any) {
      console.error("Delete subscriber error:", err);
      toast.error(err.response?.data?.message || "Failed to remove subscriber");
    }
  };

  const filteredSubscribers = subscribers;

  const activeCount = subscribers.filter((s) => s.isActive).length;
  const inactiveCount = subscribers.filter((s) => !s.isActive).length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2E7D32] mb-1">
            <Mail className="w-4 h-4" /> Newsletter Subscribers
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Newsletter Subscribers</h1>
          <p className="text-xs text-slate-500 mt-1">View, manage, and export emails collected from the newsletter signup on the storefront.</p>
        </div>
        <Button onClick={() => fetchSubscribers(page, searchTerm)} variant="outline" className="flex items-center gap-2 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Subscribers</span>
          <p className="text-2xl font-extrabold text-slate-900">{pagination.total}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-green-600">Active</span>
          <p className="text-2xl font-extrabold text-slate-900">{activeCount}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-red-500">Inactive</span>
          <p className="text-2xl font-extrabold text-slate-900">{inactiveCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by email address..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2E7D32]"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-colors ${
                activeFilter === filter
                  ? "bg-[#2E7D32] text-white border-[#2E7D32]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#2E7D32] hover:text-[#2E7D32]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-[#2E7D32]" />
          <span className="ml-3 text-sm text-slate-600 font-medium">Loading subscribers...</span>
        </div>
      ) : filteredSubscribers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm">
          <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p>No newsletter subscribers found matching your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-900">{subscriber.email}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          subscriber.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {subscriber.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Inactive
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 capitalize">{subscriber.source.replace(/_/g, " ")}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(subscriber.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => handleToggleStatus(subscriber)}
                          variant="outline"
                          size="sm"
                          className="h-8 text-[10px]"
                        >
                          {subscriber.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          onClick={() => handleDelete(subscriber)}
                          variant="outline"
                          size="sm"
                          className="h-8 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">
            Page {pagination.page} of {pagination.pages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Previous
            </Button>
            <Button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
