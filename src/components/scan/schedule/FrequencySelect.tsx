
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { ScheduleFormValues } from "./types";

interface FrequencySelectProps {
  form: UseFormReturn<ScheduleFormValues>;
}

export function FrequencySelect({ form }: FrequencySelectProps) {
  return (
    <FormField
      control={form.control}
      name="frequency"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Frequency</FormLabel>
          <FormControl>
            <Select
              value={field.value}
              onValueChange={(value) => {
                // Clear the daysOfWeek when switching from weekly
                if (field.value === "weekly" && value !== "weekly") {
                  form.setValue("daysOfWeek", []);
                }
                field.onChange(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Once</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </FormControl>
          <FormDescription>
            Choose how often you want this scan to run
          </FormDescription>
        </FormItem>
      )}
    />
  );
}
