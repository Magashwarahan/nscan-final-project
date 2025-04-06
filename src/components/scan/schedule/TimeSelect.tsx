import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ScheduleFormValues } from "./types";

interface TimeSelectProps {
  form: UseFormReturn<ScheduleFormValues>;
}

export const TimeSelect = ({ form }: TimeSelectProps) => {
  return (
    <FormField
      control={form.control}
      name="exactTime"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Exact Time</FormLabel>
          <FormControl>
            <Input
              type="time"
              {...field}
              onChange={(e) => field.onChange(e.target.value)}
            />
          </FormControl>
          <FormDescription>
            Select the exact time when you want the scan to run
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};