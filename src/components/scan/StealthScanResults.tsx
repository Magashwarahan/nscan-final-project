
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { EyeOff, Shield, AlertTriangle } from "lucide-react";
import { ScanStats } from "./ScanStats";
import { ScanDetails } from "./ScanDetails";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StealthScanResultsProps {
  scanResult: any;
  scanInfo: {
    target: string;
    timestamp: string;
    scan_name: string;
  };
}

export const StealthScanResults = ({ scanResult, scanInfo }: StealthScanResultsProps) => {
  const results = typeof scanResult === 'string' ? JSON.parse(scanResult) : scanResult;

  // Process stealth scan data
  const stealthStats = results.reduce((acc: any, host: any) => {
    Object.entries(host.protocols).forEach(([protocol, ports]: [string, any]) => {
      ports.forEach((port: any) => {
        acc.totalPorts++;
        acc.states[port.state] = (acc.states[port.state] || 0) + 1;
        
        if (port.state === 'filtered') {
          acc.filteredServices[port.service] = (acc.filteredServices[port.service] || 0) + 1;
        }
      });
    });
    return acc;
  }, { totalPorts: 0, states: {}, filteredServices: {} });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <EyeOff className="h-5 w-5 text-cyber-teal" />
          <h3 className="text-lg font-semibold">Stealth Scan Analysis</h3>
        </div>
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Stealth Scan Information</AlertTitle>
          <AlertDescription>
            Advanced stealth scan completed on {scanInfo.target}, analyzing {stealthStats.totalPorts} ports
            while minimizing detection footprint. This scan type is ideal for security assessments
            requiring discretion.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className="p-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Port States Distribution</h4>
            <div className="space-y-2">
              {Object.entries(stealthStats.states).map(([state, count]) => (
                <div key={state} className="flex items-center justify-between">
                  <span className="font-medium capitalize">{state}</span>
                  <Badge
                    variant={
                      state === 'filtered' ? 'secondary' :
                      state === 'open' ? 'default' :
                      'destructive'
                    }
                  >
                    {count as number}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Filtered Services</h4>
            <div className="space-y-2">
              {Object.entries(stealthStats.filteredServices).map(([service, count]) => (
                <div key={service} className="flex items-center justify-between">
                  <span className="font-medium">{service}</span>
                  <Badge variant="outline">{count as number}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Card>
      
      <ScanStats scanResult={scanResult} />
      <ScanDetails scanResult={scanResult} />
    </div>
  );
};
