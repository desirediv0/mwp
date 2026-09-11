import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { secretAccess } from "@/api/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Loader2, Search, MoreHorizontal, Copy, Mail, Ban, RefreshCw, Clock, Key } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  USED: "bg-blue-100 text-blue-700",
  REVOKED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
};

export default function SecretAccessListPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: string; record: any; value: string }>({
    open: false, type: "", record: null, value: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const { } = {};

  useEffect(() => {
    fetchRecords();
  }, [pagination.page, statusFilter]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await secretAccess.listAccess({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setRecords(res.data.data.records);
      setPagination((p) => ({ ...p, total: res.data.data.total }));
    } catch (err: any) {
      toast.error("Failed to load access records");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((p) => ({ ...p, page: 1 }));
    fetchRecords();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleAction = async () => {
    if (!actionDialog.record) return;
    setActionLoading(true);
    try {
      switch (actionDialog.type) {
        case "revoke":
          await secretAccess.revokeAccess(actionDialog.record.id, actionDialog.value);
          break;
        case "reactivate":
          await secretAccess.reactivateAccess(actionDialog.record.id);
          break;
        case "extend":
          await secretAccess.extendExpiry(actionDialog.record.id, parseInt(actionDialog.value));
          break;
        case "usageLimit":
          await secretAccess.increaseUsageLimit(actionDialog.record.id, parseInt(actionDialog.value));
          break;
        case "resend":
          await secretAccess.resendEmail(actionDialog.record.id);
          break;
      }
      toast.success("Action completed successfully");
      setActionDialog({ open: false, type: "", record: null, value: "" });
      fetchRecords();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/secret-access">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0A3B3F]">Issued Access Codes</h1>
          <p className="text-gray-500 mt-1">All Secret Collection access invitations</p>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search by email or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <select
          className="border rounded-md px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="USED">Used</option>
          <option value="REVOKED">Revoked</option>
          <option value="EXPIRED">Expired</option>
        </select>
        <Button variant="outline" onClick={handleSearch}>Search</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#0A3B3F]" />
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No access records found.</div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.user?.name || "N/A"}</TableCell>
                  <TableCell className="text-sm">{r.email}</TableCell>
                  <TableCell className="font-mono text-sm">#{r.order?.orderNumber || "N/A"}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{r.displayCode}</code>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[r.status] || "bg-gray-100 text-gray-700"}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm">{new Date(r.expiresAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm">{r.usageCount}/{r.usageLimit}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copyToClipboard(r.displayCode)}>
                          <Copy className="h-4 w-4 mr-2" /> Copy Code
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => copyToClipboard(
                            `${window.location.origin}/secret-access?token=...`
                          )}
                        >
                          <Key className="h-4 w-4 mr-2" /> Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActionDialog({ open: true, type: "resend", record: r, value: "" })}>
                          <Mail className="h-4 w-4 mr-2" /> Resend Email
                        </DropdownMenuItem>
                        {r.status !== "REVOKED" && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setActionDialog({ open: true, type: "revoke", record: r, value: "" })}
                          >
                            <Ban className="h-4 w-4 mr-2" /> Revoke
                          </DropdownMenuItem>
                        )}
                        {r.status === "REVOKED" && (
                          <DropdownMenuItem onClick={() => setActionDialog({ open: true, type: "reactivate", record: r, value: "" })}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Reactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setActionDialog({ open: true, type: "extend", record: r, value: "7" })}>
                          <Clock className="h-4 w-4 mr-2" /> Extend Expiry
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActionDialog({ open: true, type: "usageLimit", record: r, value: String(r.usageLimit) })}>
                          <Key className="h-4 w-4 mr-2" /> Usage Limit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={pagination.page >= totalPages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "revoke" && "Revoke Access"}
              {actionDialog.type === "reactivate" && "Reactivate Access"}
              {actionDialog.type === "extend" && "Extend Expiry"}
              {actionDialog.type === "usageLimit" && "Update Usage Limit"}
              {actionDialog.type === "resend" && "Resend Email"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "revoke" && "This will immediately revoke access. The user will no longer be able to use the Secret Collection."}
              {actionDialog.type === "reactivate" && "This will reactivate the revoked access."}
              {actionDialog.type === "extend" && "Enter the number of days to extend from today."}
              {actionDialog.type === "usageLimit" && "Enter the new maximum number of activations allowed."}
              {actionDialog.type === "resend" && "A new activation email will be sent with a fresh token."}
            </DialogDescription>
          </DialogHeader>
          {(actionDialog.type === "revoke" || actionDialog.type === "extend" || actionDialog.type === "usageLimit") && (
            <Input
              type={actionDialog.type === "revoke" ? "text" : "number"}
              value={actionDialog.value}
              onChange={(e) => setActionDialog({ ...actionDialog, value: e.target.value })}
              placeholder={
                actionDialog.type === "revoke" ? "Reason (optional)" :
                actionDialog.type === "extend" ? "Days" : "Limit"
              }
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, type: "", record: null, value: "" })}>
              Cancel
            </Button>
            <Button
              className={actionDialog.type === "revoke" ? "bg-red-600 hover:bg-red-700" : "bg-[#0A3B3F] hover:bg-[#0A3B3F]/90"}
              onClick={handleAction}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
