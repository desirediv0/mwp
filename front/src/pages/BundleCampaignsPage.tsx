import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { bundles } from "@/api/adminService";
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
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Layers,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BundleCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    title: string;
  }>({ open: false, id: "", title: "" });
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const fetchCampaigns = async (page = 1) => {
    try {
      setLoading(true);
      const res = await bundles.getBundles({
        page,
        limit: pagination.limit,
        search,
      });
      setCampaigns(res.data.data.campaigns);
      setPagination(res.data.data.pagination);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to fetch bundles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [search]);

  const handleToggleStatus = async (id: string) => {
    try {
      await bundles.toggleStatus(id);
      fetchCampaigns(pagination.page);
      toast({ title: "Success", description: "Status updated" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to toggle status",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await bundles.duplicateBundle(id);
      fetchCampaigns(pagination.page);
      toast({ title: "Success", description: "Bundle duplicated" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to duplicate",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      setDeleting(true);
      await bundles.deleteBundle(deleteDialog.id);
      setDeleteDialog({ open: false, id: "", title: "" });
      fetchCampaigns(pagination.page);
      toast({ title: "Success", description: "Bundle deleted" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6" />
            Bundle Campaigns
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage bundle campaigns for your store
          </p>
        </div>
        <Link to="/bundles/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Bundle
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bundles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Analytics Summary Cards */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Bundles</p>
            <p className="text-2xl font-bold">{pagination.total}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Active Bundles</p>
            <p className="text-2xl font-bold text-green-600">
              {campaigns.filter((c) => c.isActive).length}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + (c.orderBundleCount || 0), 0)}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Avg. Slabs per Bundle</p>
            <p className="text-2xl font-bold">
              {(campaigns.reduce((sum, c) => sum + (c.pricingSlabs?.length || 0), 0) / campaigns.length).toFixed(1)}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No bundle campaigns found</p>
          <Link to="/bundles/new">
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Bundle
            </Button>
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Pricing Slabs</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Website</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p>{campaign.title}</p>
                      <p className="text-xs text-muted-foreground">
                        /{campaign.slug}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{campaign.bundleType}</Badge>
                  </TableCell>
                  <TableCell>
                    {campaign.pricingSlabs?.length || 0} slabs
                  </TableCell>
                  <TableCell>{campaign.orderBundleCount || 0}</TableCell>
                  <TableCell>
                    <Badge
                      variant={campaign.isActive ? "default" : "secondary"}
                      className={
                        campaign.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {campaign.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {campaign.showOnWebsite ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(campaign.id)}
                      >
                        {campaign.isActive ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicate(campaign.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Link to={`/bundles/edit/${campaign.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setDeleteDialog({
                            open: true,
                            id: campaign.id,
                            title: campaign.title,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} bundles
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => fetchCampaigns(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.pages}
              onClick={() => fetchCampaigns(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, id: "", title: "" })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bundle</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.title}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteDialog({ open: false, id: "", title: "" })
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
