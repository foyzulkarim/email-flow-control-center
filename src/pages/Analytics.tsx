
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function Analytics() {
  const [dateRange, setDateRange] = useState("7");

  const { data: volumeData, isLoading: volumeLoading } = useQuery({
    queryKey: ['chart-volume', dateRange],
    queryFn: () => apiService.getChartData('volume', parseInt(dateRange)),
  });

  const { data: providerData, isLoading: providerLoading } = useQuery({
    queryKey: ['chart-providers', dateRange],
    queryFn: () => apiService.getChartData('providers', parseInt(dateRange)),
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: apiService.getDashboardStats,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const calculateSuccessRate = (sent: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((sent / total) * 100);
  };

  // Mock data for demonstration - replace with real API data
  const successRateData = volumeData?.map(item => ({
    date: item.date,
    successRate: calculateSuccessRate(item.sent, item.total),
  })) || [];

  if (volumeLoading && providerLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Email Analytics</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-64 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalSent = volumeData?.reduce((sum, item) => sum + item.sent, 0) || 0;
  const totalFailed = volumeData?.reduce((sum, item) => sum + item.failed, 0) || 0;
  const totalEmails = totalSent + totalFailed;
  const overallSuccessRate = totalEmails > 0 ? Math.round((totalSent / totalEmails) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Analytics</h1>
          <p className="text-muted-foreground">Detailed insights into your email performance</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
              <p className="text-3xl font-bold text-green-600">{totalSent.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">emails delivered</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Failed</p>
              <p className="text-3xl font-bold text-red-600">{totalFailed.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">delivery failures</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
              <p className="text-3xl font-bold text-blue-600">{overallSuccessRate}%</p>
              <p className="text-sm text-muted-foreground">delivery success</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
              <p className="text-3xl font-bold">{totalEmails.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">emails processed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Email Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Email Volume Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value)}
                  formatter={(value, name) => [value.toLocaleString(), name === 'sent' ? 'Sent' : 'Failed']}
                />
                <Line 
                  type="monotone" 
                  dataKey="sent" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  name="sent"
                />
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="failed"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Success Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Success Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={successRateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value)}
                  formatter={(value) => [`${value}%`, 'Success Rate']}
                />
                <Line 
                  type="monotone" 
                  dataKey="successRate" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Provider Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Provider Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={providerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value)}
                />
                <Bar dataKey="sent" fill="#22c55e" name="Emails Sent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Peak Day</p>
                <p className="text-lg font-bold">
                  {volumeData && volumeData.length > 0 
                    ? formatDate(volumeData.reduce((a, b) => a.total > b.total ? a : b).date)
                    : 'N/A'
                  }
                </p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Best Success Rate</p>
                <p className="text-lg font-bold">
                  {successRateData.length > 0 
                    ? `${Math.max(...successRateData.map(d => d.successRate))}%`
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Key Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average daily volume</span>
                  <span className="font-medium">
                    {volumeData && volumeData.length > 0 
                      ? Math.round(totalEmails / volumeData.length).toLocaleString()
                      : '0'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total jobs processed</span>
                  <span className="font-medium">{dashboardStats?.totalJobs?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Suppressed emails</span>
                  <span className="font-medium">{dashboardStats?.suppressedEmails?.toLocaleString() || '0'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
