import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScanStats } from "./ScanStats";
import { ScanDetails } from "./ScanDetails";
import { Code, Shield, Terminal, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface CustomScriptResultsProps {
  scanResult: any;
  scanInfo: {
    target: string;
    timestamp: string;
    scan_name: string;
  };
}

export const CustomScriptResults = ({ scanResult, scanInfo }: CustomScriptResultsProps) => {
  const navigate = useNavigate();
  const results = typeof scanResult === 'string' ? JSON.parse(scanResult) : scanResult;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-cyber-purple" />
            <h3 className="text-lg font-semibold">Custom Script Results</h3>
          </div>
          <Button
            onClick={() => navigate('/custom')}
            variant="outline"
            className="gap-2 hover:bg-secondary/50"
          >
            <span>New Custom Scan</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Custom Script Execution</AlertTitle>
          <AlertDescription>
            Results from your custom NSE scripts, providing specialized security
            assessments based on your specific requirements.
          </AlertDescription>
        </Alert>
      </Card>

      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Script Output Analysis</h4>
        <div className="space-y-4">
          {results.map((host: any, hostIndex: number) => (
            <Accordion key={hostIndex} type="single" collapsible>
              <AccordionItem value={`host-${hostIndex}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    <span className="font-mono">{host.host}</span>
                    {host.customScriptOutput && (
                      <Badge>Custom Script Results</Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  {host.customScriptOutput && (
                    <Card className="p-4">
                      <div className="space-y-2">
                        <h5 className="font-semibold">Script Output</h5>
                        <pre className="bg-secondary/30 p-4 rounded-md overflow-x-auto">
                          <code>{host.customScriptOutput}</code>
                        </pre>
                      </div>
                    </Card>
                  )}
                  {host.customFindings?.map((finding: any, index: number) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-semibold">{finding.title}</h5>
                          <Badge variant={finding.severity === 'high' ? 'destructive' : 'default'}>
                            {finding.severity}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{finding.description}</p>
                        {finding.recommendation && (
                          <div className="mt-2">
                            <h6 className="font-medium">Recommendation</h6>
                            <p className="text-sm text-muted-foreground">
                              {finding.recommendation}
                            </p>
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

      <ScanStats scanResult={scanResult} />
      <ScanDetails scanResult={scanResult} />
    </div>
  );
};