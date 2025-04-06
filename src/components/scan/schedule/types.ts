
export type ScheduleFrequency = "once" | "hourly" | "daily" | "weekly" | "monthly";

export interface ScheduleFormValues {
  frequency: ScheduleFrequency;
  email: string;
  exactTime: string; // Format: HH:mm
  daysOfWeek: number[]; // 0-6 (Sunday to Saturday)
  dayOfMonth: number; // 1-31
}
