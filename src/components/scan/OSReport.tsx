import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Monitor, Shield, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface OSReportProps {
  scanResult: any;
  scanInfo?: {
    target?: string;
    timestamp?: string;
    scan_name?: string;
    scan_id?: string;
  };
}

export const OSReport = ({ scanResult, scanInfo }: OSReportProps) => {
  // Properly parse the scan result
  const parseResults = () => {
    if (typeof scanResult === 'string') {
      try {
        return JSON.parse(scanResult);
      } catch (e) {
        console.error("Failed to parse OS scan result:", e);
        return [];
      }
    }
    return Array.isArray(scanResult) ? scanResult : [];
  };

  const results = parseResults();

  if (!results || results.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No OS Detection Results</AlertTitle>
        <AlertDescription>
          No operating system information could be detected for this target.
        </AlertDescription>
      </Alert>
    );
  }

  const processOSData = () => {
    const osTypes: { [key: string]: number } = {};
    const vendors: { [key: string]: number } = {};
    let totalHosts = results.length;
    let averageAccuracy = 0;
    let matchCount = 0;

    results.forEach((host: any) => {
      if (host.os && host.os.matches) {
        host.os.matches.forEach((match: any) => {
          matchCount++;
          
          if (match.osclass) {
            // Handle different formats of osclass (array or object)
            const osclasses = Array.isArray(match.osclass) ? match.osclass : [match.osclass];
            
            osclasses.forEach((osclass: any) => {
              const type = osclass.type || 'Unknown';
              const vendor = osclass.vendor || 'Unknown';
              
              osTypes[type] = (osTypes[type] || 0) + 1;
              vendors[vendor] = (vendors[vendor] || 0) + 1;
            });
          }
          
          averageAccuracy += parseInt(match.accuracy) || 0;
        });
      }
    });

    averageAccuracy = matchCount > 0 ? averageAccuracy / matchCount : 0;

    return {
      osTypes,
      vendors,
      totalHosts,
      averageAccuracy,
      chartData: Object.entries(osTypes).map(([name, value]) => ({
        name,
        value
      }))
    };
  };

  const { osTypes, vendors, totalHosts, averageAccuracy, chartData } = processOSData();

  const COLORS = ['#00f2ea', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6 animate-enter">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-cyber-teal" />
            <h3 className="text-lg font-semibold">OS Detection Analysis</h3>
          </div>
          <Badge variant="secondary">
            Accuracy: {averageAccuracy.toFixed(1)}%
          </Badge>
        </div>

        <Alert className="mt-4">
          <Shield className="h-4 w-4" />
          <AlertTitle>Analysis Overview</AlertTitle>
          <AlertDescription>
            Detected operating systems across {totalHosts} hosts with an average accuracy of {averageAccuracy.toFixed(1)}%.
            {averageAccuracy < 70 && " Consider additional enumeration methods for more accurate results."}
          </AlertDescription>
        </Alert>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">OS Type Distribution</h4>
          <div className="h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No OS type data available</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">Vendor Analysis</h4>
          {Object.keys(vendors).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(vendors).map(([vendor, count], index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{vendor}</span>
                  <Badge variant="secondary">{count} instances</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-muted-foreground">No vendor data available</p>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Detailed OS Analysis</h4>
        <div className="space-y-4">
          {results.map((host: any, hostIndex: number) => (
            <Accordion key={hostIndex} type="single" collapsible>
              <AccordionItem value={`host-${hostIndex}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <span className="font-mono">{host.host}</span>
                    {host.os?.matches?.[0] && (
                      <Badge variant="outline" className="ml-2">
                        {host.os.matches[0].name}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  {host.os?.matches?.map((match: any, matchIndex: number) => (
                    <Card key={matchIndex} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{match.name}</h4>
                          <Badge variant="secondary">
                            Accuracy: {match.accuracy}%
                          </Badge>
                        </div>
                        
                        {match.osclass && (
                          <div className="grid grid-cols-2 gap-4">
                            {(() => {
                              const osclasses = Array.isArray(match.osclass) ? match.osclass : [match.osclass];
                              
                              return osclasses.map((osclass: any, osclassIndex: number) => (
                                <div key={osclassIndex} className="col-span-2 border rounded p-3">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">Type</p>
                                      <p className="font-medium">{osclass.type || 'Unknown'}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Vendor</p>
                                      <p className="font-medium">{osclass.vendor || 'Unknown'}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Family</p>
                                      <p className="font-medium">{osclass.osfamily || 'Unknown'}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Generation</p>
                                      <p className="font-medium">{osclass.osgen || 'Unknown'}</p>
                                    </div>
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </div>
      </Card>
    </div>
  );
};