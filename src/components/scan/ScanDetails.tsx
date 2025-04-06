import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Shield } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ScanDetailsProps {
  scanResult: any;
}

export const ScanDetails = ({ scanResult }: ScanDetailsProps) => {
  const results = typeof scanResult === 'string' ? JSON.parse(scanResult) : scanResult;
  
  const getStateColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'open':
        return 'bg-green-500';
      case 'closed':
        return 'bg-red-500';
      case 'filtered':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getServiceRisk = (service: string) => {
    const highRiskServices = ['telnet', 'ftp', 'rsh', 'rlogin'];
    const mediumRiskServices = ['http', 'smtp', 'pop3', 'imap'];
    
    if (highRiskServices.some(s => service.toLowerCase().includes(s))) {
      return 'high';
    }
    if (mediumRiskServices.some(s => service.toLowerCase().includes(s))) {
      return 'medium';
    }
    return 'low';
  };

  return (
    <TooltipProvider>
      <Card className="glass-card p-6 animate-enter">
        <div className="space-y-6">
          {results.map((host: any, hostIndex: number) => (
            <Accordion
              key={hostIndex}
              type="single"
              collapsible
              className="w-full space-y-4"
            >
              <AccordionItem value={`host-${hostIndex}`}>
                <AccordionTrigger className="flex items-center gap-2 px-4">
                  <Shield className="h-4 w-4" />
                  <span className="font-mono">{host.host}</span>
                  <Badge variant="outline" className="ml-2">
                    {host.state}
                  </Badge>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 p-4">
                  {Object.entries(host.protocols).map(([protocol, ports]: [string, any]) => (
                    <div key={protocol} className="space-y-2">
                      <h4 className="text-sm font-semibold uppercase">{protocol} Ports</h4>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Port</TableHead>
                              <TableHead>State</TableHead>
                              <TableHead>Service</TableHead>
                              <TableHead>Version</TableHead>
                              <TableHead>Risk Level</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ports.map((port: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="font-mono">
                                  {port.port}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="secondary"
                                    className={`${getStateColor(port.state)} text-white`}
                                  >
                                    {port.state}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {port.service}
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Product: {port.product}</p>
                                        <p>Version: {port.version}</p>
                                        <p>Extra Info: {port.extrainfo}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </TableCell>
                                <TableCell>{port.version}</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      getServiceRisk(port.service) === 'high' 
                                        ? 'destructive' 
                                        : getServiceRisk(port.service) === 'medium'
                                        ? 'secondary'
                                        : 'default'
                                    }
                                  >
                                    {getServiceRisk(port.service)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </div>
      </Card>
    </TooltipProvider>
  );
};