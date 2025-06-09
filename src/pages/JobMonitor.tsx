
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { EmailJob } from "@/types/api";

export default function JobMonitor() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<EmailJob | null>(null);
  const [page, setPage] = useState(1);

  const { data: jobsData, isLoading, refetch } = useQuery({
    queryKey: ['email-jobs', page, statusFilter === 'all' ? undefined : statusFilter],
    queryFn: () => apiService.getEmailJobs(page, 20, statusFilter === 'all' ? undefined : statusFilter),
    refetchInterval: 10000, // Refetch every 10 seconds for active jobs
  });

  const statusOptions = [
    { value: "all", label: "All Jobs" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
  ];

  const filteredJobs = jobsData?.jobs?.filter(job => 
    job.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
          <h1 className="text-3xl font-bold">Email Job Monitor</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
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
        <Button onClick={() => refetch()} size="sm" variant="outline">
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
                  onClick={() => setStatusFilter(option.value)}
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
          <CardTitle>Jobs ({jobsData?.total || 0})</CardTitle>
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
                              <div className="text-center py-8 text-muted-foreground">
                                Recipient details would be loaded here from the API
                              </div>
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

          {filteredJobs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No jobs found matching your criteria.
            </div>
          )}

          {/* Pagination */}
          {jobsData && jobsData.total > 20 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="py-2 px-3 text-sm">
                Page {page} of {Math.ceil(jobsData.total / 20)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page * 20 >= jobsData.total}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
