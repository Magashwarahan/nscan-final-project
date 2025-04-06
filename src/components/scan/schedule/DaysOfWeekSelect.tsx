import { UseFormReturn } from "react-hook-form";
import { ScheduleFormValues } from "./types";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

interface DaysOfWeekSelectProps {
  form: UseFormReturn<ScheduleFormValues>;
}

export const DaysOfWeekSelect = ({ form }: DaysOfWeekSelectProps) => {
  const days = [
    { label: "Sunday", value: 0 },
    { label: "Monday", value: 1 },
    { label: "Tuesday", value: 2 },
    { label: "Wednesday", value: 3 },
    { label: "Thursday", value: 4 },
    { label: "Friday", value: 5 },
    { label: "Saturday", value: 6 },
  ];

  return (
    <FormField
      control={form.control}
      name="daysOfWeek"
      render={() => (
        <FormItem>
          <FormLabel>Days of Week</FormLabel>
          <div className="grid grid-cols-2 gap-2">
            {days.map((day) => (
              <FormField
                key={day.value}
                control={form.control}
                name="daysOfWeek"
                render={({ field }) => {
                  return (
                    <FormItem
                      key={day.value}
                      className="flex flex-row items-start space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(day.value)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, day.value])
                              : field.onChange(
                                  field.value?.filter((value) => value !== day.value)
                                );
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {day.label}
                      </FormLabel>
                    </FormItem>
                  );
                }}
              />
            ))}
          </div>
          <FormDescription>
            Select the days when the scan should run
          </FormDescription>
        </FormItem>
      )}
    />
  );
};