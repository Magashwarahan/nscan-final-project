import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getScanById, deleteScan } from "@/services/scanHistoryApi";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Calendar, Target, Clock, ChevronLeft, Download, Trash2, MoreHorizontal, AlertCircle, Mail } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast, useToast } from "@/hooks/use-toast";
import { QuickScanResults } from "@/components/scan/QuickScanResults";
import { FullPortScanResults } from "@/components/scan/FullPortScanResults";
import { StealthScanResults } from "@/components/scan/StealthScanResults";
import { VulnerabilityReport } from "@/components/scan/VulnerabilityReport";
import { ServiceScanResults } from "@/components/scan/ServiceScanResults";
import { OSReport } from "@/components/scan/OSReport";
import { UDPScanResults } from "@/components/scan/UDPScanResults";
import { ScriptScanResults } from "@/components/scan/ScriptScanResults";
import { NSEScriptResults } from "@/components/scan/NSEScriptResults";
import { CustomScriptResults } from "@/components/scan/CustomScriptResults";
import { EmailReportDialog } from "@/components/scan/EmailReportDialog";

interface ScanHistoryEntry {
  id: string;
  user_id: string;
  scan_name: string;
  target: string;
  scan_type: string;
  status: 'completed' | 'pending' | 'failed';
  result: any;
  timestamp: string;
}

const ScanResultsSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-[200px]" />
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
    <Skeleton className="h-4 w-[150px]" />
    <Skeleton className="h-64 w-full" />
  </div>
);

const ScanResults = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const [scanData, setScanData] = useState<ScanHistoryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (scanId) {
      fetchScanData(scanId);
    }
  }, [scanId]);

  const fetchScanData = async (scanId: string) => {
    setLoading(true);
    try {
      const data = await getScanById(scanId);
      // Add the missing user_id property if it doesn't exist
      setScanData(data as ScanHistoryEntry);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch scan details",
        variant: "destructive",
      });
      navigate("/history");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScan = async () => {
    try {
      if (scanId) {
        await deleteScan(scanId);
        toast({
          title: "Success",
          description: "Scan deleted successfully",
        });
        navigate("/history");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete scan",
        variant: "destructive",
      });
    } finally {
      setOpenDeleteAlert(false);
    }
  };

  const generateReport = async (formatType: 'pdf' | 'csv' | 'html') => {
    try {
      toast({
        title: "Generating Report",
        description: "Please wait while we generate your report...",
      });

      const response = await fetch('http://localhost:5000/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scanResult: scanData?.result,
          scanType: scanData?.scan_type,
          formatType,
          timestamp: scanData?.timestamp,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Report generation error:', errorData);
        throw new Error(errorData || 'Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scan_report_${scanData?.scan_type}_${formatType}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Report Generated",
        description: `Your ${formatType.toUpperCase()} report has been downloaded.`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Render the appropriate scan result component based on scan type
  const renderScanResults = () => {
    if (!scanData || loading) {
      return <ScanResultsSkeleton />;
    }

    const scanInfo = {
      target: scanData.target,
      timestamp: scanData.timestamp,
      scan_name: scanData.scan_name,
      scan_id: scanId || ""
    };

    switch (scanData.scan_type) {
      case 'quick':
        return <QuickScanResults scanResult={scanData.result} scanInfo={scanInfo} />;
      case 'full':
        return <FullPortScanResults scanResult={scanData.result} scanInfo={scanInfo} />;
      case 'stealth':
        return <StealthScanResults scanResult={scanData.result} scanInfo={scanInfo} />;
      case 'vuln':
        return <VulnerabilityReport scanResult={scanData.result} scanInfo={scanInfo} />;
      case 'service':
        return <ServiceScanResults scanResult={scanData.result} scanInfo={scanInfo} />;
      case 'os':
        return <OSReport scanResult={scanData.result} scanInfo={scanInfo} />;
      case 'udp':
        return <UDPScanResults scanResult={scanData.result} scanInfo={scanInfo} />;
      case 'script':
        return <NSEScriptResults scanResult={scanData.result} scanInfo={scanInfo} />;
      case 'custom':
        return <CustomScriptResults scanResult={scanData.result} scanInfo={scanInfo} />;
      default:
        return (
          <div className="text-center p-8">
            <h3 className="text-xl font-semibold mb-2">Unsupported Scan Type</h3>
            <p>The scan type "{scanData.scan_type}" is not supported for visualization.</p>
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/history")}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to History
          </Button>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setOpenEmailDialog(true)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateReport('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpenDeleteAlert(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Scan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                {scanData?.scan_name || "Scan Results"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Details and results of the network scan.
              </p>
            </div>
            {scanData?.status === 'failed' && (
              <Badge variant="destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                Failed
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Target:</span>
              <p className="text-sm text-muted-foreground">{scanData?.target}</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Date:</span>
              <p className="text-sm text-muted-foreground">
                {scanData?.timestamp &&
                  format(new Date(scanData.timestamp), "MMM d, yyyy")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Time:</span>
              <p className="text-sm text-muted-foreground">
                {scanData?.timestamp &&
                  format(new Date(scanData.timestamp), "HH:mm:ss")}
              </p>
            </div>
          </div>
        </Card>

        {renderScanResults()}

        <AlertDialog open={openDeleteAlert} onOpenChange={setOpenDeleteAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this scan and all of its data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteScan}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <EmailReportDialog 
          open={openEmailDialog} 
          onOpenChange={setOpenEmailDialog} 
          scanId={scanId || ''} 
        />
      </div>
    </DashboardLayout>
  );
};

export default ScanResults;