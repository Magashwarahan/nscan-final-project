
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Code2, AlertTriangle, Shield } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { initiateNmapScan } from "@/services/scanApi";
import { saveScanHistory } from "@/services/scanHistoryApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define predefined NSE scripts
const predefinedScripts = [
  {
    name: "Default",
    value: "default",
    description: "Default NSE scripts for basic security assessment"
  },
  {
    name: "Banner Grabbing",
    value: "banner",
    description: "Retrieve service banners to identify version information"
  },
  {
    name: "FTP Brute Force",
    value: "ftp-brute",
    description: "Attempt to brute force FTP authentication"
  },
  {
    name: "HTTP Brute Force",
    value: "http-brute",
    description: "Attempt to brute force HTTP authentication"
  },
  {
    name: "SSH Brute Force",
    value: "ssh-brute",
    description: "Attempt to brute force SSH authentication"
  },
  {
    name: "Malware Detection",
    value: "malware",
    description: "Detect potential malware and backdoors on target systems"
  },
  {
    name: "SMB Share Enumeration",
    value: "smb-enum-shares",
    description: "Enumerate SMB shares and permissions"
  },
  {
    name: "DNS Brute Force",
    value: "dns-brute",
    description: "Discover subdomains through DNS brute forcing"
  },
  {
    name: "Host Mapping",
    value: "hostmap-bfk",
    description: "Map target hostnames to IP addresses using various sources"
  },
  {
    name: "Traceroute Geolocation",
    value: "traceroute-geolocation",
    description: "Perform traceroute with geolocation information"
  }
];

const ScriptScan = () => {
  const [scanName, setScanName] = useState("");
  const [target, setTarget] = useState("");
  const [selectedScript, setSelectedScript] = useState("default");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleScan = async () => {
    if (!scanName || !target || !selectedScript) {
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
      // Construct the appropriate script parameter
      const scriptParam = selectedScript === "default" 
        ? "--script default,safe" 
        : `--script=${selectedScript}`;
      
      // Initiate the scan with the script parameter
      const result = await initiateNmapScan(target, "script", scriptParam);
      setProgress(75);

      // Store scan result
      const scanData = {
        scan_name: scanName,
        target: target,
        scan_type: "script",
        timestamp: new Date().toISOString(),
        result: JSON.stringify(result.output),
        status: "completed" as const,
      };

      const savedScan = await saveScanHistory(scanData);
      setProgress(100);

      toast({
        title: "Scan Completed",
        description: "NSE Script scan completed successfully!",
      });

      // Navigate to scan results
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
      setProgress(0);
    }
  };

  const selectedScriptInfo = predefinedScripts.find(script => script.value === selectedScript);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NSE Script Scan</h1>
          <p className="text-muted-foreground">
            Run specialized Nmap Script Engine (NSE) scans for targeted security assessments
          </p>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="h-5 w-5 text-cyber-teal" />
            <h2 className="text-xl font-semibold">NSE Script Configuration</h2>
          </div>

          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Specialized Security Assessment</AlertTitle>
            <AlertDescription>
              NSE Scripts provide targeted security assessments for specific vulnerabilities and services.
              Choose from predefined scripts or use the default configuration for general security testing.
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
              <label htmlFor="scriptType" className="block text-sm font-medium mb-1">
                NSE Script Type
              </label>
              <Select
                value={selectedScript}
                onValueChange={setSelectedScript}
                disabled={isScanning}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a script type" />
                </SelectTrigger>
                <SelectContent>
                  {predefinedScripts.map(script => (
                    <SelectItem key={script.value} value={script.value}>
                      {script.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedScriptInfo && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedScriptInfo.description}
                </p>
              )}
            </div>

            {isScanning && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  {progress < 50 ? "Initializing script scan..." : 
                   progress < 90 ? "Running NSE script scan..." :
                   "Processing results..."}
                </p>
              </div>
            )}
            
            <Button
              onClick={handleScan}
              disabled={isScanning || !scanName || !target || !selectedScript}
              className="w-full"
            >
              {isScanning ? "Scanning..." : "Start NSE Script Scan"}
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ScriptScan;
