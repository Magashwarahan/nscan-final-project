
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Network, Shield, AlertTriangle } from "lucide-react";
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

interface UDPScanResultsProps {
  scanResult: any;
  scanInfo: {
    target: string;
    timestamp: string;
    scan_name: string;
  };
}

export const UDPScanResults = ({ scanResult, scanInfo }: UDPScanResultsProps) => {
  const results = typeof scanResult === 'string' ? JSON.parse(scanResult) : scanResult;

  // Process UDP scan data
  const udpStats = results.reduce((acc: any, host: any) => {
    if (host.protocols.udp) {
      host.protocols.udp.forEach((port: any) => {
        acc.totalPorts++;
        if (port.state === 'open') {
          acc.openPorts++;
          acc.commonServices[port.service] = (acc.commonServices[port.service] || 0) + 1;
        }
      });
    }
    return acc;
  }, { totalPorts: 0, openPorts: 0, commonServices: {} });

  // Common UDP services to watch for
  const criticalUDPServices = ['dns', 'snmp', 'ntp', 'tftp', 'netbios'];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Network className="h-5 w-5 text-cyber-teal" />
          <h3 className="text-lg font-semibold">UDP Service Discovery</h3>
        </div>
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>UDP Scan Information</AlertTitle>
          <AlertDescription>
            UDP port scan completed on {scanInfo.target}, examining {udpStats.totalPorts} ports
            and identifying {udpStats.openPorts} open UDP services. This scan focuses on discovering
            critical UDP services like DNS, SNMP, and VPN.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card className="p-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-4">UDP Services Overview</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Instances</TableHead>
                  <TableHead>Risk Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(udpStats.commonServices).map(([service, count]) => (
                  <TableRow key={service}>
                    <TableCell>{service}</TableCell>
                    <TableCell>{count as number}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          criticalUDPServices.includes(service.toLowerCase())
                            ? "destructive"
                            : "default"
                        }
                      >
                        {criticalUDPServices.includes(service.toLowerCase())
                          ? "High"
                          : "Normal"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Security Recommendations</h4>
            <div className="space-y-4">
              {Object.keys(udpStats.commonServices).map((service) => (
                <Alert
                  key={service}
                  variant={criticalUDPServices.includes(service.toLowerCase()) ? "destructive" : "default"}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{service}</AlertTitle>
                  <AlertDescription>
                    {criticalUDPServices.includes(service.toLowerCase())
                      ? `Critical UDP service ${service} detected. Ensure proper access controls and monitoring are in place.`
                      : `Monitor ${service} service for any unusual activity and keep it updated.`}
                  </AlertDescription>
                </Alert>
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
