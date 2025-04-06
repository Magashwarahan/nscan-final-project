
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Target,
  Trash2,
  CalendarClock,
  AlertCircle,
  RefreshCw,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import {
  getScheduledScans,
  updateScheduledScanStatus,
  deleteScheduledScan,
  type ScheduledScan,
} from "@/services/scheduledScansApi";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";

const getFrequencyDisplay = (scan: ScheduledScan) => {
  switch (scan.frequency) {
    case 'once':
      return 'Once';
    case 'hourly':
      return 'Every hour';
    case 'daily':
      return 'Daily';
    case 'weekly':
      if (scan.days_of_week && scan.days_of_week.length > 0) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return `Weekly on ${scan.days_of_week.map(d => days[d]).join(', ')}`;
      }
      return 'Weekly';
    case 'monthly':
      return `Monthly on day ${scan.day_of_month || '1'}`;
    default:
      return scan.frequency;
  }
};

const getScanTypeDisplay = (type: string) => {
  const typeMappings: Record<string, string> = {
    quick: "Quick Scan",
    full: "Full Port Scan",
    stealth: "Stealth Scan",
    vuln: "Vulnerability Scan",
    service: "Service Detection",
    os: "OS Detection",
    udp: "UDP Scan",
    script: "Script Scan",
    custom: "Custom Script",
  };
  
  return typeMappings[type] || type;
};

const ScheduledScans = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [scanToDelete, setScanToDelete] = useState<string | null>(null);

  const {
    data: scheduledScans = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['scheduledScans'],
    queryFn: getScheduledScans,
    meta: {
      onError: (err: Error) => {
        toast({
          title: "Error loading scheduled scans",
          description: err.message,
          variant: "destructive",
        });
      },
    },
  });

  const handleStatusToggle = async (scanId: string, newStatus: boolean) => {
    try {
      await updateScheduledScanStatus(scanId, newStatus);
      toast({
        title: newStatus ? "Scan activated" : "Scan deactivated",
        description: newStatus ? "The scan will run as scheduled" : "The scan will not run until reactivated",
      });
      queryClient.invalidateQueries({ queryKey: ['scheduledScans'] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update scan status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteScan = async () => {
    if (!scanToDelete) return;
    
    try {
      await deleteScheduledScan(scanToDelete);
      toast({
        title: "Success",
        description: "Scheduled scan deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['scheduledScans'] });
      setScanToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete scheduled scan",
        variant: "destructive",
      });
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-xl font-medium">Error Loading Scheduled Scans</h3>
      <p className="text-muted-foreground mb-4">
        {error instanceof Error ? error.message : "An unexpected error occurred"}
      </p>
      <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['scheduledScans'] })}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );

  const renderEmptyState = () => (
    <Card className="p-6">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CalendarClock className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium">No Scheduled Scans</h3>
        <p className="text-muted-foreground max-w-md mt-2 mb-4">
          You haven't scheduled any security scans yet. Schedule a scan from the dashboard to monitor your systems on a regular basis.
        </p>
        <Button onClick={() => navigate('/dashboard')} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Scan
        </Button>
      </div>
    </Card>
  );

  if (isLoading) return <DashboardLayout>{renderSkeleton()}</DashboardLayout>;
  if (error) return <DashboardLayout>{renderError()}</DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Scheduled Scans</h1>
          <p className="text-muted-foreground">
            Manage your scheduled security scans. Toggle scans on/off or delete them as needed.
          </p>
        </div>

        {scheduledScans.length === 0 ? (
          renderEmptyState()
        ) : (
          <Card className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scan Name</TableHead>
                  {!isMobile && <TableHead>Target</TableHead>}
                  {!isMobile && <TableHead>Frequency</TableHead>}
                  <TableHead>Next Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledScans.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell>
                      <div className="font-medium">{scan.scan_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {getScanTypeDisplay(scan.scan_type)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        ID: {scan.id.substring(0, 8)}
                      </div>
                    </TableCell>
                    
                    {!isMobile && (
                      <TableCell>
                        <div className="flex items-center">
                          <Target className="h-4 w-4 mr-1" />
                          {scan.target}
                        </div>
                      </TableCell>
                    )}
                    
                    {!isMobile && (
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {getFrequencyDisplay(scan)}
                        </div>
                        {scan.exact_time && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {scan.exact_time.substring(0, 5)}
                          </div>
                        )}
                      </TableCell>
                    )}
                    
                    <TableCell>
                      {scan.is_active ? (
                        <div>
                          <div>{format(new Date(scan.next_run), "MMM d, yyyy")}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(scan.next_run), "HH:mm")}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-muted/50">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={scan.is_active}
                          onCheckedChange={(checked) => handleStatusToggle(scan.id, checked)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {scan.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <AlertDialog open={scanToDelete === scan.id} onOpenChange={(open) => !open && setScanToDelete(null)}>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setScanToDelete(scan.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Scheduled Scan</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this scheduled scan? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteScan} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ScheduledScans;
