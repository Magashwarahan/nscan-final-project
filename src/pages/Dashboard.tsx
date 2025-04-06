import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ScanCard } from "@/components/scan/ScanCard";

const scanTypes = [
  {
    title: "Quick Scan",
    description: "Fast scan of common ports (top 100) and basic vulnerability detection. Best for initial reconnaissance.",
    type: "quick",
  },
  {
    title: "Full Port Scan",
    description: "Comprehensive scan of all 65535 ports with service version detection. Thorough but time-consuming.",
    type: "full",
  },
  {
    title: "Stealth Scan",
    description: "Low-profile SYN scan designed to avoid detection. Uses timing delays and careful probing techniques.",
    type: "stealth",
  },
  {
    title: "Vulnerability Scan",
    description: "Focused scan for known vulnerabilities, exploits, and security weaknesses using version detection.",
    type: "vuln",
  },
  {
    title: "Service Detection",
    description: "Detailed analysis of running services, versions, and potential misconfigurations on open ports.",
    type: "service",
  },
  {
    title: "OS Detection",
    description: "Advanced fingerprinting to identify operating systems and system architecture.",
    type: "os",
  },
  {
    title: "UDP Scan",
    description: "Scan UDP ports to discover services like DNS, SNMP, and VPN. Often overlooked but critical.",
    type: "udp",
  },
  {
    title: "Script Scan",
    description: "Uses NSE (Nmap Scripting Engine) to detect vulnerabilities and gather extended information.",
    type: "script",
  },
  {
    title: "Custom Script",
    description: "Run your own custom NSE scripts for specialized security assessments and targeted vulnerability scanning.",
    type: "custom",
  }
];

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Nscan Security Scanner
          </h1>
          <p className="text-muted-foreground">
            Select a scan type to begin your security assessment. Each scan type is optimized for different security needs.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {scanTypes.map((scan) => (
            <ScanCard key={scan.type} {...scan} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;