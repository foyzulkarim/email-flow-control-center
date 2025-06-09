
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Settings, RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AddProviderDialog } from "@/components/AddProviderDialog";
import { apiService } from "@/services/api";
import { EmailProvider } from "@/types/api";

export default function Providers() {
  const [providers, setProviders] = useState<EmailProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load providers on component mount
  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getProviders();
      setProviders(data);
    } catch (err) {
      console.error("Failed to load providers:", err);
      setError("Failed to load providers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleProviderAdded = (newProvider: EmailProvider) => {
    setProviders(prev => [...prev, newProvider]);
  };

  const toggleProvider = async (id: string, enabled: boolean) => {
    try {
      await apiService.updateProviderStatus(id, enabled);
      setProviders(prev => prev.map(p => 
        p.id === id ? { ...p, isActive: enabled } : p
      ));
    } catch (err) {
      console.error("Failed to update provider status:", err);
      // Revert the change if API call fails
      setProviders(prev => prev.map(p => 
        p.id === id ? { ...p, isActive: !enabled } : p
      ));
    }
  };

  const resetQuota = async (id: string) => {
    try {
      await apiService.resetProviderQuota(id);
      setProviders(prev => prev.map(p => 
        p.id === id ? { 
          ...p, 
          usedToday: 0, 
          remainingToday: p.dailyQuota,
          lastResetDate: new Date().toISOString()
        } : p
      ));
    } catch (err) {
      console.error("Failed to reset provider quota:", err);
    }
  };

  const getQuotaUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getProviderIcon = (type: string) => {
    return <Settings className="h-8 w-8 text-muted-foreground" />;
  };

  const getProviderStatus = (provider: EmailProvider) => {
    if (!provider.isActive) return "offline";
    return "online"; // You can add more logic here based on other factors
  };

  const totalQuotaUsed = providers.reduce((sum, p) => sum + p.usedToday, 0);
  const totalQuotaLimit = providers.reduce((sum, p) => sum + p.dailyQuota, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading providers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email Provider Management</h1>
            <p className="text-muted-foreground">Manage your email service providers</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Providers</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadProviders}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Provider Management</h1>
          <p className="text-muted-foreground">Manage your email service providers</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={loadProviders}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <AddProviderDialog onProviderAdded={handleProviderAdded} />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Quota Usage</p>
                <p className="text-2xl font-bold">{totalQuotaUsed.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">of {totalQuotaLimit.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Settings className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <Progress 
              value={totalQuotaLimit > 0 ? (totalQuotaUsed / totalQuotaLimit) * 100 : 0} 
              className="mt-3" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Providers</p>
                <p className="text-2xl font-bold">
                  {providers.filter(p => p.isActive).length}
                </p>
                <p className="text-sm text-muted-foreground">of {providers.length} total</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Remaining Quota</p>
                <p className="text-2xl font-bold">
                  {providers.reduce((sum, p) => sum + p.remainingToday, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">emails available today</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => {
          const quotaPercentage = (provider.usedToday / provider.dailyQuota) * 100;
          const isQuotaWarning = quotaPercentage >= 80;
          const status = getProviderStatus(provider);

          return (
            <Card key={provider.id} className={isQuotaWarning ? "border-yellow-500" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(provider.type)}
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          status === 'online' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                            status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                          }`} />
                          {status}
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">
                          {provider.type}
                        </span>
                        {isQuotaWarning && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={provider.isActive}
                    onCheckedChange={(enabled) => toggleProvider(provider.id, enabled)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quota Usage */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Quota Usage</span>
                    <span>{provider.usedToday.toLocaleString()} / {provider.dailyQuota.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={quotaPercentage} 
                    className="h-2"
                  />
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    {Math.round(quotaPercentage)}%
                  </div>
                  {isQuotaWarning && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⚠️ Quota usage is high
                    </p>
                  )}
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Remaining Today</p>
                    <p className="font-medium">{provider.remainingToday.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium">{provider.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="text-muted-foreground">Last Reset</p>
                  <p className="font-medium">
                    {new Date(provider.lastResetDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Reset Quota
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset Quota</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reset the quota for {provider.name}? 
                          This will set the used quota back to 0.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => resetQuota(provider.id)}
                        >
                          Reset
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {providers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Providers Configured</h3>
            <p className="text-muted-foreground mb-4">
              Add your first email service provider to start sending emails.
            </p>
            <AddProviderDialog onProviderAdded={handleProviderAdded} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
