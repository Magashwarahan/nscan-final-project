
import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { FrequencySelect } from "./schedule/FrequencySelect";
import { TimeSelect } from "./schedule/TimeSelect";
import { DaysOfWeekSelect } from "./schedule/DaysOfWeekSelect";
import { DayOfMonthSelect } from "./schedule/DayOfMonthSelect";
import { ScheduleFormValues } from "./schedule/types";

interface ScheduleScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanType: string;
  target: string;
  scanName: string;
  customAttributes?: string;
}

export function ScheduleScanDialog({
  open,
  onOpenChange,
  scanType,
  target,
  scanName,
  customAttributes,
}: ScheduleScanDialogProps) {
  const { toast } = useToast();
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ScheduleFormValues>({
    defaultValues: {
      frequency: "once",
      email: "",
      exactTime: format(new Date(), "HH:mm"),
      daysOfWeek: [],
      dayOfMonth: 1,
    },
  });

  const onSubmit = async (values: ScheduleFormValues) => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to schedule scans.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const startDateTime = new Date();
      const [hours, minutes] = values.exactTime.split(":");
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // If the time has already passed today and it's not a 'once' scan, start from tomorrow
      if (startDateTime < new Date() && values.frequency !== 'once') {
        startDateTime.setDate(startDateTime.getDate() + 1);
      }

      const { error } = await supabase.from("scheduled_scans").insert({
        user_id: session.user.id,
        scan_name: scanName,
        target: target,
        scan_type: scanType,
        frequency: values.frequency,
        start_time: startDateTime.toISOString(),
        next_run: startDateTime.toISOString(),
        notification_email: values.email,
        custom_attributes: customAttributes,
        exact_time: values.exactTime,
        days_of_week: values.frequency === "weekly" ? values.daysOfWeek : null,
        day_of_month: values.frequency === "monthly" ? values.dayOfMonth : null,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Scan Scheduled",
        description: `Your scan has been scheduled for ${format(startDateTime, "PPpp")}`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule scan",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Scan</DialogTitle>
          <DialogDescription>
            Set up recurring scans and get results via email
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FrequencySelect form={form} />
            <TimeSelect form={form} />
            
            {form.watch("frequency") === "weekly" && (
              <DaysOfWeekSelect form={form} />
            )}
            
            {form.watch("frequency") === "monthly" && (
              <DayOfMonthSelect form={form} />
            )}
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notification Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    You'll receive scan reports at this email address
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Scheduling..." : "Schedule Scan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
