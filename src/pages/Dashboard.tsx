
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Mail, Send, Shield, Settings } from "lucide-react";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: apiService.getDashboardStats,
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: apiService.getProviders,
    refetchInterval: autoRefresh ? 60000 : false,
  });

  const { data: recentJobs } = useQuery({
    queryKey: ['recent-jobs'],
    queryFn: () => apiService.getEmailJobs(1, 10),
    refetchInterval: autoRefresh ? 30000 : false,
  });

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastUpdated(new Date());
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Email Dispatch Dashboard</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Dispatch Dashboard</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Jobs"
          value={stats?.totalJobs || 0}
          subtitle="Email Jobs Created"
          icon={<Mail className="h-4 w-4" />}
        />
        <StatCard
          title="Total Emails"
          value={stats?.totalEmails || 0}
          subtitle="Individual Emails Sent"
          icon={<Send className="h-4 w-4" />}
        />
        <StatCard
          title="Suppressed Emails"
          value={stats?.suppressedEmails || 0}
          subtitle="Blocked/Suppressed"
          icon={<Shield className="h-4 w-4" />}
        />
        <StatCard
          title="Active Providers"
          value={stats?.activeProviders || 0}
          subtitle="Email Providers Online"
          icon={<Settings className="h-4 w-4" />}
        />
      </div>

      {/* Status Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Job Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.jobStatusBreakdown && Object.entries(stats.jobStatusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status={status} />
                  <span className="capitalize">{status}</span>
                </div>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.emailStatusBreakdown && Object.entries(stats.emailStatusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status={status} />
                  <span className="capitalize">{status}</span>
                </div>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Sent</p>
              <p className="text-2xl font-bold text-green-600">{stats?.todayActivity?.sent || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats?.todayActivity?.failed || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats?.todayActivity?.total || 0}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <Progress value={stats?.todayActivity?.successRate || 0} className="h-2" />
              <p className="text-sm font-medium">{stats?.todayActivity?.successRate || 0}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Status */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers?.map((provider) => (
              <Card key={provider.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{provider.name}</h3>
                    <StatusBadge status={provider.status} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Quota Usage</span>
                      <span>{provider.quotaUsed}/{provider.quotaTotal}</span>
                    </div>
                    <Progress 
                      value={(provider.quotaUsed / provider.quotaTotal) * 100} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Success: {provider.successRate}%</span>
                      <span>Today: {provider.emailsSentToday}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentJobs?.jobs?.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{job.subject}</span>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {job.recipientCount} recipients • {new Date(job.createdAt).toLocaleString()}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
