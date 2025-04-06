
import { supabase } from '@/lib/supabase';

export interface ScheduledScan {
  id: string;
  user_id: string;
  scan_name: string;
  target: string;
  scan_type: string;
  frequency: 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  start_time: string;
  next_run: string;
  last_run: string | null;
  notification_email: string;
  custom_attributes: string | null;
  is_active: boolean;
  days_of_week: number[] | null;
  day_of_month: number | null;
  exact_time: string | null;
}

export const getScheduledScans = async (): Promise<ScheduledScan[]> => {
  try {
    const { data, error } = await supabase
      .from('scheduled_scans')
      .select('*')
      .order('next_run', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching scheduled scans:', error);
    throw new Error('Failed to fetch scheduled scans');
  }
};

export const updateScheduledScanStatus = async (scanId: string, isActive: boolean): Promise<void> => {
  try {
    const { error } = await supabase
      .from('scheduled_scans')
      .update({ is_active: isActive })
      .eq('id', scanId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating scheduled scan status:', error);
    throw new Error('Failed to update scheduled scan status');
  }
};

export const deleteScheduledScan = async (scanId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('scheduled_scans')
      .delete()
      .eq('id', scanId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting scheduled scan:', error);
    throw new Error('Failed to delete scheduled scan');
  }
};
