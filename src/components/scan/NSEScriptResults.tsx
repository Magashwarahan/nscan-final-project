
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScanStats } from "./ScanStats";
import { ScanDetails } from "./ScanDetails";
import { Code2, Shield, AlertTriangle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface NSEScriptResultsProps {
  scanResult: any;
  scanInfo: {
    target: string;
    timestamp: string;
    scan_name: string;
    scan_id: string;
  };
}

export const NSEScriptResults = ({ scanResult, scanInfo }: NSEScriptResultsProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const results = typeof scanResult === 'string' ? JSON.parse(scanResult) : scanResult;

  const getScriptSeverity = (output: string) => {
    const lowRisk = ['info', 'status', 'debug'].some(term => 
      output.toLowerCase().includes(term)
    );
    const mediumRisk = ['warning', 'notice'].some(term => 
      output.toLowerCase().includes(term)
    );
    const highRisk = ['vulnerability', 'critical', 'exploit', 'high severity'].some(term => 
      output.toLowerCase().includes(term)
    );

    return highRisk ? 'high' : mediumRisk ? 'medium' : 'low';
  };

  const filteredResults = results.filter((host: any) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search in host info
    if (host.host.toLowerCase().includes(searchLower)) return true;
    if (host.hostname?.toLowerCase().includes(searchLower)) return true;
    
    // Search in script results
    if (host.scriptResults) {
      return host.scriptResults.some((script: any) => 
        script.name.toLowerCase().includes(searchLower) ||
        script.output.toLowerCase().includes(searchLower)
      );
    }
    
    return false;
  });

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
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold">Script Execution Results</h4>
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          {filteredResults.length === 0 ? (
            <div className="text-center p-4 border border-dashed rounded-md">
              <p className="text-muted-foreground">No script results found for this search term.</p>
            </div>
          ) : (
            filteredResults.map((host: any, hostIndex: number) => (
              <Accordion key={hostIndex} type="single" collapsible>
                <AccordionItem value={`host-${hostIndex}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span className="font-mono">{host.host}</span>
                      {host.hostname && (
                        <Badge variant="outline" className="ml-2">
                          {host.hostname}
                        </Badge>
                      )}
                      {host.scriptResults?.some((result: any) => 
                        getScriptSeverity(result.output) === 'high'
                      ) && (
                        <Badge variant="destructive" className="ml-auto">High Risk Found</Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    {!host.scriptResults || host.scriptResults.length === 0 ? (
                      <p className="text-muted-foreground italic">No script results available for this host.</p>
                    ) : (
                      host.scriptResults
                        .filter((script: any) => 
                          !searchTerm || 
                          script.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          script.output.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((script: any, scriptIndex: number) => (
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
                              <pre className="bg-secondary/30 p-4 rounded-md overflow-x-auto text-sm">
                                <code>{script.output}</code>
                              </pre>
                              
                              {/* Security recommendations based on script type */}
                              {script.name.includes('brute') && (
                                <Alert variant="destructive" className="mt-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertTitle>Security Recommendation</AlertTitle>
                                  <AlertDescription>
                                    Consider implementing strong password policies and account lockout mechanisms to prevent brute force attacks.
                                  </AlertDescription>
                                </Alert>
                              )}
                              
                              {script.name.includes('banner') && (
                                <Alert variant="destructive" className="mt-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertTitle>Security Recommendation</AlertTitle>
                                  <AlertDescription>
                                    Consider disabling or customizing service banners to prevent information leakage.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </Card>
                        ))
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))
          )}
        </div>
      </Card>

      <ScanStats scanResult={scanResult} />
      <ScanDetails scanResult={scanResult} />
    </div>
  );
};
