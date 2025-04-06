import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScanStats } from "./ScanStats";
import { ScanDetails } from "./ScanDetails";
import { Code2, Shield, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ScriptScanResultsProps {
  scanResult: any;
  scanInfo: {
    target: string;
    timestamp: string;
    scan_name: string;
  };
}

export const ScriptScanResults = ({ scanResult, scanInfo }: ScriptScanResultsProps) => {
  const results = typeof scanResult === 'string' ? JSON.parse(scanResult) : scanResult;

  const getScriptSeverity = (output: string) => {
    const lowRisk = ['info', 'status', 'debug'].some(term => 
      output.toLowerCase().includes(term)
    );
    const mediumRisk = ['warning', 'notice'].some(term => 
      output.toLowerCase().includes(term)
    );
    const highRisk = ['vulnerability', 'critical', 'exploit'].some(term => 
      output.toLowerCase().includes(term)
    );

    return highRisk ? 'high' : mediumRisk ? 'medium' : 'low';
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="h-5 w-5 text-cyber-teal" />
          <h3 className="text-lg font-semibold">NSE Script Analysis</h3>
        </div>
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Script Execution Results</AlertTitle>
          <AlertDescription>
            Detailed analysis from NSE (Nmap Scripting Engine) scripts, providing
            insights into service vulnerabilities and security configurations.
          </AlertDescription>
        </Alert>
      </Card>

      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Script Execution Summary</h4>
        <div className="space-y-4">
          {results.map((host: any, hostIndex: number) => (
            <Accordion key={hostIndex} type="single" collapsible>
              <AccordionItem value={`host-${hostIndex}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="font-mono">{host.host}</span>
                    {host.scriptResults?.some((result: any) => 
                      getScriptSeverity(result.output) === 'high'
                    ) && (
                      <Badge variant="destructive">High Risk Found</Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  {host.scriptResults?.map((script: any, scriptIndex: number) => (
                    <Card key={scriptIndex} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-semibold">{script.name}</h5>
                          <Badge 
                            variant={
                              getScriptSeverity(script.output) === 'high' 
                                ? 'destructive' 
                                : getScriptSeverity(script.output) === 'medium'
                                ? 'secondary'
                                : 'default'
                            }
                          >
                            {getScriptSeverity(script.output)} risk
                          </Badge>
                        </div>
                        <pre className="bg-secondary/30 p-4 rounded-md overflow-x-auto">
                          <code>{script.output}</code>
                        </pre>
                      </div>
                    </Card>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </div>
      </Card>

      <ScanStats scanResult={scanResult} />
      <ScanDetails scanResult={scanResult} />
    </div>
  );
};