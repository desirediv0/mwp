import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { secretAccess } from "@/api/adminService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, Clock, CheckCircle, XCircle, AlertTriangle, Key } from "lucide-react";
import { toast } from "sonner";

export default function SecretAccessDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await secretAccess.getDashboard();
      setStats(res.data.data);
    } catch (err: any) {
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A3B3F]" />
      </div>
    );
  }

  const cards = [
    { title: "Total Issued", value: stats?.total || 0, icon: Key, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Pending", value: stats?.pending || 0, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", link: "/secret-access/pending" },
    { title: "Active", value: stats?.active || 0, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { title: "Used", value: stats?.used || 0, icon: Shield, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Revoked", value: stats?.revoked || 0, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
    { title: "Expired", value: stats?.expired || 0, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A3B3F]">Secret Collection Access</h1>
          <p className="text-gray-500 mt-1">Manage secret collection invitations and access</p>
        </div>
        <div className="flex gap-2">
          <Link to="/secret-access/pending">
            <Button className="bg-[#0A3B3F] hover:bg-[#0A3B3F]/90">Pending Orders</Button>
          </Link>
          <Link to="/secret-access/issued">
            <Button variant="outline">Issued Codes</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#0A3B3F]">{card.value}</div>
              {card.link && (
                <Link to={card.link} className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                  View details →
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-[#0A3B3F]">{stats?.totalActivations || 0}</div>
              <div className="text-sm text-gray-500">Total Activations</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-[#0A3B3F]">
                {stats?.total ? Math.round(((stats?.active + stats?.used) / stats?.total) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-500">Activation Rate</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-[#0A3B3F]">
                {stats?.total ? Math.round((stats?.expired / stats?.total) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-500">Expiry Rate</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-[#0A3B3F]">
                {stats?.total ? Math.round((stats?.revoked / stats?.total) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-500">Revocation Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
