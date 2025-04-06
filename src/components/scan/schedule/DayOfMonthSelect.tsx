import { UseFormReturn } from "react-hook-form";
import { ScheduleFormValues } from "./types";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DayOfMonthSelectProps {
  form: UseFormReturn<ScheduleFormValues>;
}

export const DayOfMonthSelect = ({ form }: DayOfMonthSelectProps) => {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <FormField
      control={form.control}
      name="dayOfMonth"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Day of Month</FormLabel>
          <Select
            onValueChange={(value) => field.onChange(parseInt(value))}
            defaultValue={field.value?.toString()}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select day of month" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {days.map((day) => (
                <SelectItem key={day} value={day.toString()}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            Select the day of the month when the scan should run
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};