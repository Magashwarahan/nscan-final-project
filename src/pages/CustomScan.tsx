
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { initiateNmapScan } from "@/services/scanApi";
import { saveScanHistory } from "@/services/scanHistoryApi";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Code, Terminal, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const CustomScan = () => {
  const [scanName, setScanName] = useState("");
  const [target, setTarget] = useState("");
  const [attributes, setAttributes] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleScan = async () => {
    if (!scanName || !target || !attributes) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before starting the scan.",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setProgress(25);

    try {
      const result = await initiateNmapScan(target, "custom", attributes);
      setProgress(75);

      // Store scan result in database with the correct status type
      const scanData = {
        scan_name: scanName,
        target: target,
        scan_type: "custom",
        timestamp: new Date().toISOString(),
        result: JSON.stringify(result.output),
        status: "completed" as const, // Using type assertion to match the expected union type
      };

      const savedScan = await saveScanHistory(scanData);
      setProgress(100);

      toast({
        title: "Scan Completed",
        description: "Custom scan completed successfully!",
      });

      // Navigate to scan results page with the new scan ID
      setTimeout(() => {
        navigate(`/scan/${savedScan.id}`);
      }, 500);

    } catch (error: any) {
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to perform scan",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Scan</h1>
          <p className="text-muted-foreground">
            Configure and run a custom Nmap scan with specific attributes
          </p>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="h-5 w-5 text-cyber-teal" />
            <h2 className="text-xl font-semibold">Custom Scan Configuration</h2>
          </div>

          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Advanced Feature</AlertTitle>
            <AlertDescription>
              Custom scans allow you to define specific Nmap parameters for advanced security testing.
              Ensure you have the necessary permissions to scan the target system.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <label htmlFor="scanName" className="block text-sm font-medium mb-1">
                Scan Name
              </label>
              <Input
                id="scanName"
                placeholder="Enter a descriptive name"
                value={scanName}
                onChange={(e) => setScanName(e.target.value)}
                disabled={isScanning}
              />
            </div>

            <div>
              <label htmlFor="target" className="block text-sm font-medium mb-1">
                Target IP Address or Hostname
              </label>
              <Input
                id="target"
                placeholder="e.g., 192.168.1.1 or example.com"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={isScanning}
              />
            </div>

            <div>
              <label htmlFor="attributes" className="block text-sm font-medium mb-1">
                Nmap Attributes
              </label>
              <Textarea
                id="attributes"
                placeholder="e.g., -A -sS -T4 --script=vuln"
                value={attributes}
                onChange={(e) => setAttributes(e.target.value)}
                disabled={isScanning}
                className="min-h-[100px]"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Common examples: <code>-sV</code> (service/version detection), <code>-A</code> (aggressive scan), <code>-O</code> (OS detection)
              </p>
            </div>

            {isScanning && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  {progress < 50 ? "Initializing scan..." : 
                   progress < 90 ? "Scanning in progress..." :
                   "Processing results..."}
                </p>
              </div>
            )}
            
            <Button
              onClick={handleScan}
              disabled={isScanning}
              className="w-full"
            >
              {isScanning ? "Scanning..." : "Start Custom Scan"}
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CustomScan;
