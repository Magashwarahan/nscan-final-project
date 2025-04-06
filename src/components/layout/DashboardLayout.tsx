import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard,
  History,
  LogOut,
  Menu,
  Clock,
  Shield,
  Trash2,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  Search,
  X,
  CalendarClock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getScanHistory, deleteScan, type ScanHistoryEntry } from "@/services/scanHistoryApi";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: scanHistory = [] } = useQuery<ScanHistoryEntry[]>({
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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4 text-blue-500" />;
    }
  };

  const filteredHistory = scanHistory
    .filter((scan) =>
      (scan?.scan_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (scan?.target?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: History, label: "Scan History", path: "/history" },
    { icon: CalendarClock, label: "Scheduled", path: "/scheduled" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={`fixed top-0 left-0 h-full bg-secondary/30 backdrop-blur-lg border-r border-border/50 transition-all duration-300 z-50 ${
          isSidebarOpen ? (isMobile ? "w-full" : "w-64") : "w-20"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <span
              className={`font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-cyber-purple to-cyber-blue ${
                isSidebarOpen ? "opacity-100" : "opacity-0"
              }`}
            >
              Nscan
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hover:bg-secondary/50"
            >
              {isSidebarOpen ? (
                <X className="h-5 w-5 transition-transform hover:rotate-90" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          <nav className="flex-1 py-4">
            <ul className="space-y-2 px-2">
              {menuItems.map((item) => (
                <li key={item.label}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start hover:bg-secondary/50 ${
                      isSidebarOpen ? "px-4" : "px-0 justify-center"
                    }`}
                    onClick={() => {
                      navigate(item.path);
                      if (isMobile) setIsSidebarOpen(false);
                    }}
                  >
                    <item.icon className="h-5 w-5 mr-2" />
                    <span
                      className={`${
                        isSidebarOpen ? "opacity-100" : "opacity-0 w-0"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          </nav>

          {isSidebarOpen && (
            <div className="p-4 border-t border-border/50">
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search scans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-background/50 pl-9"
                />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Recent Scans</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs hover:bg-secondary/50"
                  onClick={() => navigate('/history')}
                >
                  View All
                </Button>
              </div>
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="space-y-2">
                  {filteredHistory.map((scan) => (
                    <Button
                      key={scan.id}
                      variant="ghost"
                      className="w-full justify-start text-left hover:bg-accent/50 group p-3"
                      onClick={() => navigate(`/scan/${scan.id}`)}
                    >
                      <div className="flex items-start gap-2 w-full">
                        {getStatusIcon(scan.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate block font-medium text-sm">
                              {scan.scan_name}
                            </span>
                            <Badge 
                              variant={scan.status === "completed" ? "default" : "destructive"}
                              className="text-[10px] h-4"
                            >
                              {scan.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              <span className="truncate">{scan.target}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(scan.timestamp), "MMM d, yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{format(new Date(scan.timestamp), "HH:mm")}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteScan(scan.id, e)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                        </Button>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <Button
            variant="ghost"
            className={`m-4 justify-start hover:bg-secondary/50 ${
              isSidebarOpen ? "px-4" : "px-0 justify-center"
            }`}
            onClick={() => navigate("/")}
          >
            <LogOut className="h-5 w-5 mr-2" />
            <span
              className={`${isSidebarOpen ? "opacity-100" : "opacity-0 w-0"}`}
            >
              Logout
            </span>
          </Button>
        </div>
      </aside>

      <main
        className={`transition-all duration-300 ${
          isSidebarOpen ? (isMobile ? "ml-0" : "ml-64") : "ml-20"
        }`}
      >
        <div className="container py-8">{children}</div>
      </main>
    </div>
  );
};
