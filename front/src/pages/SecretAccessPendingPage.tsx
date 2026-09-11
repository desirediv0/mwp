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
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SecretAccessPendingPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [grantDialog, setGrantDialog] = useState<{ open: boolean; order: any }>({
    open: false,
    order: null,
  });
  const [grantEmail, setGrantEmail] = useState("");
  const [granting, setGranting] = useState(false);


  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await secretAccess.getPendingOrders();
      setOrders(res.data.data.orders);
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to load pending orders", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGrant = async () => {
    if (!grantDialog.order || !grantEmail) return;
    setGranting(true);
    try {
      await secretAccess.grantAccess({
        orderId: grantDialog.order.id,
        email: grantEmail,
      });
      toast({ title: "Success", description: "Secret Collection access granted!" });
      setGrantDialog({ open: false, order: null });
      setGrantEmail("");
      fetchOrders();
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to grant access", variant: "destructive" });
    } finally {
      setGranting(false);
    }
  };

  const openGrantDialog = (order: any) => {
    setGrantDialog({ open: true, order });
    setGrantEmail(order.user?.email || "");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A3B3F]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/secret-access">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0A3B3F]">Pending Orders</h1>
          <p className="text-gray-500 mt-1">Orders with Secret Collection products eligible for access grant</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No pending orders found. All eligible orders have been processed.
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Secret Products</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const secretProducts = order.items?.filter(
                  (i: any) => i.product?.visibility === "SECRET"
                ) || [];
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">#{order.orderNumber}</TableCell>
                    <TableCell>{order.user?.name || "N/A"}</TableCell>
                    <TableCell>{order.user?.email || "N/A"}</TableCell>
                    <TableCell>
                      <Badge className="bg-purple-100 text-purple-700">
                        {secretProducts.length} item{secretProducts.length !== 1 ? "s" : ""}
                      </Badge>
                    </TableCell>
                    <TableCell>₹{Number(order.total).toLocaleString()}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="bg-[#0A3B3F] hover:bg-[#0A3B3F]/90"
                        onClick={() => openGrantDialog(order)}
                      >
                        <Send className="h-4 w-4 mr-1" /> Grant Access
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={grantDialog.open} onOpenChange={(open) => setGrantDialog({ open, order: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Secret Collection Access</DialogTitle>
            <DialogDescription>
              Send an invitation to the customer to activate their Secret Collection access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Order</label>
              <p className="text-sm text-gray-500">#{grantDialog.order?.orderNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                placeholder="customer@email.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantDialog({ open: false, order: null })}>
              Cancel
            </Button>
            <Button
              className="bg-[#0A3B3F] hover:bg-[#0A3B3F]/90"
              onClick={handleGrant}
              disabled={granting || !grantEmail}
            >
              {granting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
