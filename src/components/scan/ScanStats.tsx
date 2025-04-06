import { Card } from "@/components/ui/card";
import {
  ChartContainer,
} from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  Legend 
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle } from "lucide-react";

interface ScanStatsProps {
  scanResult: any;
}

export const ScanStats = ({ scanResult }: ScanStatsProps) => {
  const parseData = () => {
    if (!scanResult) return { portData: [], stateData: [], riskData: [] };
    
    const results = typeof scanResult === 'string' ? JSON.parse(scanResult) : scanResult;
    const ports: { [key: string]: number } = {};
    const states: { [key: string]: number } = {};
    const risks: { [key: string]: number } = {};
    
    results.forEach((host: any) => {
      Object.entries(host.protocols).forEach(([protocol, portList]: [string, any]) => {
        portList.forEach((port: any) => {
          // Port data
          ports[port.port] = (ports[port.port] || 0) + 1;
          
          // State data
          states[port.state] = (states[port.state] || 0) + 1;
          
          // Risk assessment based on service
          const riskLevel = assessRiskLevel(port.service, port.state);
          risks[riskLevel] = (risks[riskLevel] || 0) + 1;
        });
      });
    });

    const portData = Object.entries(ports).map(([port, count]) => ({
      port,
      count,
    }));

    const stateData = Object.entries(states).map(([name, value]) => ({
      name,
      value,
    }));

    const riskData = Object.entries(risks).map(([name, value]) => ({
      name,
      value,
    }));

    return { portData, stateData, riskData };
  };

  const assessRiskLevel = (service: string, state: string) => {
    if (state.toLowerCase() !== 'open') return 'Low';
    
    const highRiskServices = ['telnet', 'ftp', 'rsh', 'rlogin'];
    const mediumRiskServices = ['http', 'smtp', 'pop3', 'imap'];
    
    if (highRiskServices.some(s => service.toLowerCase().includes(s))) {
      return 'High';
    }
    if (mediumRiskServices.some(s => service.toLowerCase().includes(s))) {
      return 'Medium';
    }
    return 'Low';
  };

  const { portData, stateData, riskData } = parseData();
  
  const COLORS = {
    states: ['#00f2ea', '#ffa500', '#ff6b6b', '#4ecdc4'],
    risks: {
      High: '#ef4444',
      Medium: '#f59e0b',
      Low: '#10b981'
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/80 p-2 rounded-lg border shadow-sm">
          <p className="text-sm font-medium">
            {payload[0].name === "count" ? `Port ${label}` : payload[0].name}
          </p>
          <p className="text-sm text-muted-foreground">
            Count: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-card p-6 animate-enter">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-cyber-teal" />
            <h3 className="text-lg font-semibold">Port Distribution</h3>
          </div>
          <div className="h-[300px]">
            <ChartContainer
              config={{
                bar: {
                  theme: {
                    light: "var(--cyber-teal)",
                    dark: "var(--cyber-teal)",
                  },
                },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={portData}>
                  <XAxis dataKey="port" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="count" name="Open Ports" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-cyber-teal" />
            <h3 className="text-lg font-semibold">Risk Assessment</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {riskData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS.risks[entry.name as keyof typeof COLORS.risks]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold">Port States Overview</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stateData.map((state, index) => (
              <Card key={index} className="p-4 border-border/50">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant={
                      state.name.toLowerCase() === 'open' ? 'default' :
                      state.name.toLowerCase() === 'filtered' ? 'secondary' :
                      'destructive'
                    }
                  >
                    {state.name}
                  </Badge>
                  <span className="text-2xl font-bold">{state.value}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};