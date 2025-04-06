import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getScanHistory, deleteScan } from "@/services/scanHistoryApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { 
  Shield, 
  Clock, 
  Calendar,
  Target,
  Search,
  Trash2,
  AlertCircle,
  CheckCircle,
  FilterX,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

const ScanHistory = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);

  const { data: scanHistory = [], isLoading } = useQuery({
    queryKey: ['scanHistory'],
    queryFn: getScanHistory,
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error loading scan history",
          description: error.message,
          variant: "destructive",
        });
      },
    },
  });

  const handleDeleteScan = async (scanId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await deleteScan(scanId);
      await queryClient.invalidateQueries({ queryKey: ['scanHistory'] });
      toast({
        title: "Success",
        description: "Scan deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete scan",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Shield className="h-5 w-5 text-blue-500" />;
    }
  };

  const filteredHistory = scanHistory
    .filter((scan) =>
      (scan?.scan_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (scan?.target?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-pulse">Loading scan history...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Scan History</h1>
            <p className="text-muted-foreground">
              View and manage your previous scan results
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-[250px]"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchTerm("")}
                >
                  <FilterX className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredHistory.length === 0 ? (
            <Card className="flex flex-col items-center justify-center h-[40vh] space-y-4 p-6">
              <Shield className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold text-muted-foreground">
                {searchTerm ? "No matching scans found" : "No Scans Yet"}
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                {searchTerm
                  ? "Try adjusting your search terms or clear the filter"
                  : "You haven't performed any scans yet. Start a new scan from the dashboard to see your results here."}
              </p>
              <Button 
                onClick={() => searchTerm ? setSearchTerm("") : navigate('/dashboard')}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90"
              >
                {searchTerm ? "Clear Search" : "Start New Scan"}
              </Button>
            </Card>
          ) : (
            filteredHistory.map((scan) => (
              <Button
                key={scan.id}
                variant="outline"
                className="w-full justify-start h-auto p-4 hover:bg-accent/50 group"
                onClick={() => navigate(`/scan/${scan.id}`)}
              >
                <div className="flex items-center gap-4 w-full">
                  {getStatusIcon(scan.status)}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="font-medium">{scan.scan_name}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span className="truncate">{scan.target}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Badge 
                        variant={scan.status === "completed" ? "default" : "destructive"}
                        className="mb-1"
                      >
                        {scan.status}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(scan.timestamp), "PPP")}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Scan Type</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        <span className="capitalize">{scan.scan_type}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                    onClick={(e) => handleDeleteScan(scan.id, e)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                  </Button>
                </div>
              </Button>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ScanHistory;