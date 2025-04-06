
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScanStats } from "./ScanStats";
import { ScanDetails } from "./ScanDetails";
import { Shield, Network, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FullPortScanResultsProps {
  scanResult: any;
  scanInfo: {
    target: string;
    timestamp: string;
    scan_name: string;
  };
}

export const FullPortScanResults = ({ scanResult, scanInfo }: FullPortScanResultsProps) => {
  const results = typeof scanResult === 'string' ? JSON.parse(scanResult) : scanResult;
  
  // Calculate port statistics
  const portStats = results.reduce((acc: any, host: any) => {
    Object.entries(host.protocols).forEach(([proto, ports]: [string, any]) => {
      ports.forEach((port: any) => {
        acc.total++;
        if (port.state === 'open') acc.open++;
        if (port.state === 'filtered') acc.filtered++;
        
        // Group ports by ranges
        const range = Math.floor(port.port / 1000) * 1000;
        const rangeKey = `${range}-${range + 999}`;
        acc.ranges[rangeKey] = (acc.ranges[rangeKey] || 0) + 1;
      });
    });
    return acc;
  }, { total: 0, open: 0, filtered: 0, ranges: {} });

  const portRangeData = Object.entries(portStats.ranges).map(([range, count]) => ({
    range,
    count
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Network className="h-5 w-5 text-cyber-teal" />
          <h3 className="text-lg font-semibold">Full Port Scan Analysis</h3>
        </div>
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Comprehensive Port Analysis</AlertTitle>
          <AlertDescription>
            Complete analysis of all 65,535 ports on {scanInfo.target}. Identified {portStats.open} open ports
            and {portStats.filtered} filtered ports, providing a comprehensive view of the system's network exposure.
          </AlertDescription>
        </Alert>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-center">
            <h4 className="text-sm font-medium text-muted-foreground">Total Ports</h4>
            <p className="text-3xl font-bold mt-2">{portStats.total}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <h4 className="text-sm font-medium text-muted-foreground">Open Ports</h4>
            <p className="text-3xl font-bold mt-2 text-green-500">{portStats.open}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <h4 className="text-sm font-medium text-muted-foreground">Filtered Ports</h4>
            <p className="text-3xl font-bold mt-2 text-yellow-500">{portStats.filtered}</p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Port Distribution Analysis</h4>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={portRangeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#00f2ea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      <ScanStats scanResult={scanResult} />
      <ScanDetails scanResult={scanResult} />
    </div>
  );
};
