import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, Calendar, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { initiateNmapScan } from "@/services/scanApi";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { ScheduleScanDialog } from "./ScheduleScanDialog";

interface ScanCardProps {
  title: string;
  description: string;
  type: string;
}

export const ScanCard = ({ title, description, type }: ScanCardProps) => {
  const [scanName, setScanName] = useState("");
  const [target, setTarget] = useState("");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "scanning" | "error" | "success">("idle");
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session } = useAuth();

  const handleScan = async () => {
    if (!scanName.trim()) {
      toast({
        title: "Scan Name Required",
        description: "Please provide a name for this scan.",
        variant: "destructive",
      });
      return;
    }

    if (!session?.user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to perform scans.",
        variant: "destructive",
      });
      return;
    }

    try {
      setScanning(true);
      setStatus("scanning");
      setProgress(10);

      const result = await initiateNmapScan(target, type);
      setProgress(90);

      if (result.status === 'success') {
        const { data: scanData, error: insertError } = await supabase
          .from('scan_history')
          .insert([
            {
              user_id: session.user.id,
              scan_name: scanName,
              target: target,
              scan_type: type,
              status: 'completed',
              result: result.output,
              timestamp: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        setStatus("success");
        toast({
          title: "Scan Complete",
          description: "The scan has finished successfully. Viewing results...",
        });

        if (scanData) {
          navigate(`/scan/${scanData.id}`);
        }
      } else {
        throw new Error(result.output || 'Scan failed');
      }
      
      setProgress(100);
    } catch (error: any) {
      setStatus("error");
      toast({
        title: "Scan Failed",
        description: error.message || "There was an error during the scan.",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "scanning":
        return <Shield className="h-6 w-6 text-blue-500 animate-pulse" />;
      case "error":
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      default:
        return <Shield className="h-6 w-6 text-cyber-teal" />;
    }
  };

  const isDedicatedPageScan = type === 'script' || type === 'custom';

  return (
    <Card className="glass-card p-6 animate-enter">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {getStatusIcon()}
      </div>

      {isDedicatedPageScan ? (
        <div className="mt-4">
          <Button 
            onClick={() => navigate(type === 'script' ? '/script' : '/custom')}
            className="w-full cyber-gradient flex items-center justify-center gap-2"
          >
            <span>Click Here</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            For detailed {type === 'script' ? 'NSE script' : 'custom'} scanning options
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <Input
            placeholder="Enter scan name"
            value={scanName}
            onChange={(e) => setScanName(e.target.value)}
            className="bg-background/50"
          />
          <Input
            placeholder="Enter target IP or hostname"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="bg-background/50"
          />

          <div className="flex items-center gap-4">
            <Button
              onClick={handleScan}
              disabled={scanning || !target || !scanName}
              className="flex-1 cyber-gradient"
            >
              {scanning ? "Scanning..." : "Start Scan"}
            </Button>
            <Button
              variant="outline"
              className="px-3"
              onClick={() => setShowScheduleDialog(true)}
              disabled={!target || !scanName}
            >
              <Calendar className="h-4 w-4" />
              <span className="ml-2">Schedule</span>
            </Button>
          </div>

          {scanning && (
            <div className="space-y-2 animate-slide">
              <div className="flex justify-between text-sm">
                <span>Scan Progress</span>
                <Badge variant={status === "error" ? "destructive" : "default"}>
                  {status.toUpperCase()}
                </Badge>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      )}

      <ScheduleScanDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        scanType={type}
        target={target}
        scanName={scanName}
      />
    </Card>
  );
};
