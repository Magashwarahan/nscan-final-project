import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Shield, Clock, AlertTriangle, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScanStats } from "./ScanStats";
import { ScanDetails } from "./ScanDetails";

interface QuickScanResultsProps {
  scanResult: any;
  scanInfo: {
    target: string;
    timestamp: string;
    scan_name: string;
    scan_id?: string;
  };
}

export const QuickScanResults = ({ scanResult, scanInfo }: QuickScanResultsProps) => {
  // Process scan information with error handling
  const processScanResults = () => {
    try {
      // Handle string results (parse JSON if needed)
      const results = typeof scanResult === 'string' ? JSON.parse(scanResult) : 
                    Array.isArray(scanResult) ? scanResult : [];
      
      // Calculate total ports and services with safe access
      const stats = results.reduce((acc: any, host: any) => {
        // Handle hosts without protocols
        if (!host.protocols) {
          return acc;
        }
        
        // Process all protocols safely
        Object.entries(host.protocols).forEach(([protocol, ports]: [string, any]) => {
          if (Array.isArray(ports)) {
            acc.totalPorts += ports.length;
            ports.forEach((port: any) => {
              if (port.state === 'open') acc.openPorts++;
              if (port.service && !acc.services.includes(port.service)) {
                acc.services.push(port.service);
              }
            });
          }
        });
        
        return acc;
      }, { totalPorts: 0, openPorts: 0, services: [] });
      
      return { results, stats };
    } catch (error) {
      console.error("Error processing scan results:", error);
      return { 
        results: [], 
        stats: { totalPorts: 0, openPorts: 0, services: [] } 
      };
    }
  };

  const { results, stats } = processScanResults();
  
  // Handle case with no results
  if (results.length === 0) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No scan results available</AlertTitle>
        <AlertDescription>
          The scan did not return any results. This could be due to network issues, 
          firewall restrictions, or the target host being offline.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="h-5 w-5 text-cyber-teal" />
          <h3 className="text-lg font-semibold">Quick Scan Overview</h3>
          {scanInfo.scan_id && (
            <Badge variant="outline" className="ml-auto">
              Scan ID: {scanInfo.scan_id.substring(0, 8)}
            </Badge>
          )}
        </div>
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Quick Scan Information</AlertTitle>
          <AlertDescription>
            Rapid assessment completed for {scanInfo.target} revealing {stats.openPorts} open ports 
            across {stats.services.length} unique services. This quick scan provides essential 
            security insights while minimizing scan duration.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Card className="p-4">
            <div className="text-center">
              <h4 className="text-sm font-medium text-muted-foreground">Total Ports Scanned</h4>
              <p className="text-3xl font-bold mt-2">{stats.totalPorts}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <h4 className="text-sm font-medium text-muted-foreground">Open Ports</h4>
              <p className="text-3xl font-bold mt-2 text-green-500">{stats.openPorts}</p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <h4 className="text-sm font-medium text-muted-foreground">Unique Services</h4>
              <p className="text-3xl font-bold mt-2 text-cyber-teal">{stats.services.length}</p>
            </div>
          </Card>
        </div>
      </Card>
      
      <ScanStats scanResult={scanResult} />
      <ScanDetails scanResult={scanResult} />
    </div>
  );
};
