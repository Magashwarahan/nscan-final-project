
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Database, Server, Shield, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ServiceScanResultsProps {
  scanResult: any;
  scanInfo: {
    target: string;
    timestamp: string;
    scan_name: string;
  };
}

export const ServiceScanResults = ({ scanResult, scanInfo }: ServiceScanResultsProps) => {
  const results = typeof scanResult === 'string' ? JSON.parse(scanResult) : scanResult;

  const processServiceData = () => {
    const services: { [key: string]: number } = {};
    const versions: { [key: string]: string[] } = {};
    let totalPorts = 0;

    results.forEach((host: any) => {
      Object.entries(host.protocols).forEach(([protocol, ports]: [string, any]) => {
        ports.forEach((port: any) => {
          totalPorts++;
          services[port.service] = (services[port.service] || 0) + 1;
          
          if (port.version) {
            if (!versions[port.service]) {
              versions[port.service] = [];
            }
            if (!versions[port.service].includes(port.version)) {
              versions[port.service].push(port.version);
            }
          }
        });
      });
    });

    return {
      services,
      versions,
      totalPorts,
      chartData: Object.entries(services).map(([name, count]) => ({
        name,
        count
      }))
    };
  };

  const { services, versions, totalPorts, chartData } = processServiceData();

  return (
    <div className="space-y-6 animate-enter">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="h-5 w-5 text-cyber-teal" />
          <h3 className="text-lg font-semibold">Service Detection Results</h3>
        </div>
        <Alert>
          <Database className="h-4 w-4" />
          <AlertTitle>Service Analysis</AlertTitle>
          <AlertDescription>
            Comprehensive analysis of {totalPorts} ports, revealing {Object.keys(services).length} unique services across the target system.
          </AlertDescription>
        </Alert>
      </Card>

      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Service Distribution</h4>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#00f2ea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Detailed Service Analysis</h4>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Instances</TableHead>
                <TableHead>Versions Detected</TableHead>
                <TableHead>Risk Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(services).map(([service, count], index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{service}</TableCell>
                  <TableCell>{count}</TableCell>
                  <TableCell>
                    {versions[service]?.map((version, i) => (
                      <Badge key={i} variant="secondary" className="mr-2 mb-1">
                        {version}
                      </Badge>
                    )) || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        service.includes('telnet') || service.includes('ftp')
                          ? "destructive"
                          : service.includes('http') || service.includes('smtp')
                          ? "secondary"
                          : "default"
                      }
                    >
                      {service.includes('telnet') || service.includes('ftp')
                        ? "High"
                        : service.includes('http') || service.includes('smtp')
                        ? "Medium"
                        : "Low"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Security Recommendations</h4>
        <div className="space-y-4">
          {Object.keys(services).map((service, index) => {
            const isHighRisk = service.includes('telnet') || service.includes('ftp');
            const isMediumRisk = service.includes('http') || service.includes('smtp');
            
            return (
              <Alert key={index} variant={isHighRisk ? "destructive" : "default"}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{service}</AlertTitle>
                <AlertDescription>
                  {isHighRisk
                    ? `Consider replacing ${service} with a more secure alternative. This service presents significant security risks.`
                    : isMediumRisk
                    ? `Ensure ${service} is properly configured and up to date with the latest security patches.`
                    : `Monitor ${service} for any unusual activity and keep it updated.`}
                </AlertDescription>
              </Alert>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
