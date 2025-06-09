
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { EmailJob, EmailTarget } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, RefreshCw, Eye } from "lucide-react";

export default function JobMonitor() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<EmailJob | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch jobs from API
  const { data: jobsData, isLoading, error, refetch } = useQuery({
    queryKey: ['jobs', page, statusFilter],
    queryFn: () => apiService.getEmailJobs(page, limit, statusFilter === 'all' ? undefined : statusFilter),
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  const jobs = jobsData?.jobs || [];
  const totalJobs = jobsData?.total || 0;

  // Fetch job targets when a job is selected
  const { data: jobTargets, isLoading: targetsLoading } = useQuery({
    queryKey: ['jobTargets', selectedJob?.id],
    queryFn: () => selectedJob ? apiService.getEmailJobTargets(selectedJob.id) : Promise.resolve([]),
    enabled: !!selectedJob,
  });

  const statusOptions = [
    { value: "all", label: "All Jobs" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
  ];

  // Filter jobs by search term (status filtering is handled by the API)
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getProgress = (job: EmailJob) => {
    if (job.status === 'completed') return 100;
    if (job.status === 'failed') return 0;
    if (job.recipientCount === 0) return 0;
    return Math.round((job.processedCount / job.recipientCount) * 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email Job Monitor</h1>
            <p className="text-muted-foreground">Track and manage your email jobs</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin mr-2" />
              <span>Loading jobs...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email Job Monitor</h1>
            <p className="text-muted-foreground">Track and manage your email jobs</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-red-500 mb-4">
              <h3 className="text-lg font-medium mb-2">Error Loading Jobs</h3>
              <p className="text-muted-foreground">
                {error instanceof Error ? error.message : 'Failed to load jobs'}
              </p>
            </div>
            <Button onClick={() => refetch()}>Try Again</Button>
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
          <h1 className="text-3xl font-bold">Email Job Monitor</h1>
          <p className="text-muted-foreground">Track and manage your email jobs</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by subject or job ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={statusFilter === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setStatusFilter(option.value);
                    setPage(1); // Reset to first page when filter changes
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs ({filteredJobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-mono text-sm">
                    {job.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {job.subject}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={job.status} />
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{job.recipientCount} total</div>
                      {job.status !== 'pending' && (
                        <div className="text-muted-foreground">
                          {job.successCount} sent, {job.failedCount} failed
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress value={getProgress(job)} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {getProgress(job)}%
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(job.createdAt)}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedJob(job)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Job Details - {selectedJob?.id}</DialogTitle>
                        </DialogHeader>
                        {selectedJob && (
                          <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="overview">Overview</TabsTrigger>
                              <TabsTrigger value="recipients">Recipients</TabsTrigger>
                              <TabsTrigger value="timeline">Timeline</TabsTrigger>
                            </TabsList>
                            <TabsContent value="overview" className="space-y-4">
                              <div className="grid gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Subject</h4>
                                  <p className="text-sm">{selectedJob.subject}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Status</h4>
                                  <StatusBadge status={selectedJob.status} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium mb-2">Recipients</h4>
                                    <p className="text-2xl font-bold">{selectedJob.recipientCount}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium mb-2">Success Rate</h4>
                                    <p className="text-2xl font-bold">
                                      {selectedJob.recipientCount > 0 
                                        ? Math.round((selectedJob.successCount / selectedJob.recipientCount) * 100)
                                        : 0}%
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Progress</h4>
                                  <Progress value={getProgress(selectedJob)} className="h-3" />
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {selectedJob.processedCount} / {selectedJob.recipientCount} processed
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Created</h4>
                                  <p className="text-sm">{new Date(selectedJob.createdAt).toLocaleString()}</p>
                                </div>
                                {selectedJob.completedAt && (
                                  <div>
                                    <h4 className="font-medium mb-2">Completed</h4>
                                    <p className="text-sm">{new Date(selectedJob.completedAt).toLocaleString()}</p>
                                  </div>
                                )}
                                {selectedJob.metadata && Object.keys(selectedJob.metadata).length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Metadata</h4>
                                    <div className="space-y-1">
                                      {Object.entries(selectedJob.metadata).map(([key, value]) => (
                                        <div key={key} className="text-sm">
                                          <span className="font-medium">{key}:</span> {value}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TabsContent>
                            <TabsContent value="recipients">
                              {targetsLoading ? (
                                <div className="text-center py-8">
                                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                                  <p className="text-muted-foreground">Loading recipients...</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium">Email Recipients ({jobTargets?.length || 0})</h4>
                                  </div>
                                  <div className="border rounded-lg">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Email</TableHead>
                                          <TableHead>Status</TableHead>
                                          <TableHead>Provider</TableHead>
                                          <TableHead>Sent At</TableHead>
                                          <TableHead>Retries</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {jobTargets?.map((target) => (
                                          <TableRow key={target.id}>
                                            <TableCell className="font-medium">{target.email}</TableCell>
                                            <TableCell>
                                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                target.status === 'sent' 
                                                  ? 'bg-green-100 text-green-800' 
                                                  : target.status === 'failed' || target.status === 'blocked'
                                                  ? 'bg-red-100 text-red-800'
                                                  : 'bg-yellow-100 text-yellow-800'
                                              }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                                                  target.status === 'sent' 
                                                    ? 'bg-green-500' 
                                                    : target.status === 'failed' || target.status === 'blocked'
                                                    ? 'bg-red-500'
                                                    : 'bg-yellow-500'
                                                }`} />
                                                {target.status}
                                              </div>
                                            </TableCell>
                                            <TableCell>
                                              {target.providerId || '-'}
                                            </TableCell>
                                            <TableCell>
                                              {target.sentAt 
                                                ? new Date(target.sentAt).toLocaleString()
                                                : '-'
                                              }
                                            </TableCell>
                                            <TableCell>
                                              {target.retryCount > 0 ? target.retryCount : '-'}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                    {(!jobTargets || jobTargets.length === 0) && (
                                      <div className="text-center py-8 text-muted-foreground">
                                        No recipients found for this job.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </TabsContent>
                            <TabsContent value="timeline">
                              <div className="text-center py-8 text-muted-foreground">
                                Job timeline would be displayed here
                              </div>
                            </TabsContent>
                          </Tabs>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredJobs.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              No jobs found matching your criteria.
            </div>
          )}
        </CardContent>
        
        {/* Pagination */}
        {totalJobs > limit && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((page - 1) * limit + 1, totalJobs)} to {Math.min(page * limit, totalJobs)} of {totalJobs} jobs
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {Math.ceil(totalJobs / limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(totalJobs / limit)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
