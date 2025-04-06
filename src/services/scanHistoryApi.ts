
import { supabase } from '@/lib/supabase';

export interface ScanHistoryEntry {
  id: string;
  scan_name: string;
  target: string;
  scan_type: string;
  timestamp: string;
  status: 'completed' | 'failed' | 'in_progress';
  result: any; // Can be string or parsed object
}

export const getScanHistory = async (): Promise<ScanHistoryEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('scan_history')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching scan history:', error);
    throw new Error('Failed to fetch scan history');
  }
};

export const getScanById = async (scanId: string): Promise<ScanHistoryEntry> => {
  try {
    console.log('Fetching scan with ID:', scanId);
    
    if (!scanId || scanId === 'undefined') {
      throw new Error('Invalid or missing scan ID');
    }
    
    const { data, error } = await supabase
      .from('scan_history')
      .select('*')
      .eq('id', scanId)
      .single();

    if (error) {
      console.error('Supabase error fetching scan:', error);
      throw error;
    }
    
    if (!data) {
      console.error('No scan found with ID:', scanId);
      throw new Error('Scan not found');
    }
    
    console.log('Successfully retrieved scan:', data.id);
    return data;
  } catch (error) {
    console.error('Error fetching scan details:', error);
    throw error;
  }
};

export const deleteScan = async (scanId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('scan_history')
      .delete()
      .eq('id', scanId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting scan:', error);
    throw new Error('Failed to delete scan');
  }
};

export const saveScanHistory = async (scanData: Omit<ScanHistoryEntry, 'id'>): Promise<ScanHistoryEntry> => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      throw new Error('User must be logged in to save scan history');
    }

    console.log('Saving scan history:', scanData);
    
    // Ensure the result is a string for storage
    const resultToSave = typeof scanData.result === 'string' 
      ? scanData.result 
      : JSON.stringify(scanData.result);
    
    const { data, error } = await supabase
      .from('scan_history')
      .insert([
        {
          ...scanData,
          result: resultToSave,
          user_id: session.session.user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving scan:', error);
      throw error;
    }
    
    if (!data) throw new Error('Failed to save scan history');

    console.log('Scan history saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error saving scan history:', error);
    throw new Error('Failed to save scan history');
  }
};
