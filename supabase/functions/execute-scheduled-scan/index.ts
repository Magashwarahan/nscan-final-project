
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function handleScheduledScans() {
  console.log("Checking for scheduled scans...");
  const now = new Date();
  
  try {
    // Get all active scheduled scans that are due to run
    const { data: scheduledScans, error } = await supabase
      .from("scheduled_scans")
      .select("*")
      .eq("is_active", true)
      .lte("next_run", now.toISOString());
    
    if (error) {
      console.error("Error fetching scheduled scans:", error);
      return { error: error.message };
    }
    
    if (!scheduledScans || scheduledScans.length === 0) {
      console.log("No scheduled scans to execute at this time");
      return { message: "No scheduled scans to execute" };
    }
    
    console.log(`Found ${scheduledScans.length} scheduled scans to execute`);
    
    // Process each scheduled scan
    const results = await Promise.all(
      scheduledScans.map(async (scan) => {
        try {
          console.log(`Executing scan: ${scan.id} - ${scan.scan_name}`);
          
          // Call the backend scan API
          const backendUrl = Deno.env.get("BACKEND_URL") || "http://localhost:5000";
          const response = await fetch(`${backendUrl}/api/scan`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              target: scan.target,
              scanType: scan.scan_type,
              customAttributes: scan.custom_attributes,
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Scan API returned status: ${response.status}`);
          }
          
          const scanResult = await response.json();
          
          // Save the scan result to scan_history
          const { data: savedScan, error: saveError } = await supabase
            .from("scan_history")
            .insert([{
              user_id: scan.user_id,
              scan_name: `${scan.scan_name} (Scheduled)`,
              target: scan.target,
              scan_type: scan.scan_type,
              status: scanResult.status,
              result: JSON.stringify(scanResult.output),
              timestamp: new Date().toISOString()
            }])
            .select()
            .single();
            
          if (saveError) {
            throw new Error(`Failed to save scan history: ${saveError.message}`);
          }
          
          // Send email notification if configured
          if (scan.notification_email) {
            console.log(`Sending notification email to: ${scan.notification_email}`);
            try {
              const { data: emailData, error: emailError } = await supabase.functions.invoke("send-scan-report", {
                body: {
                  scanId: savedScan.id,
                  email: scan.notification_email
                }
              });
              
              if (emailError) {
                console.error(`Error sending notification email: ${emailError.message}`);
              } else {
                console.log(`Notification email sent successfully to ${scan.notification_email}`);
              }
            } catch (emailException) {
              console.error(`Exception when sending notification email: ${emailException.message}`);
            }
          }
          
       
          let nextRun = null;
          

          if (scan.frequency === "once") {
            await supabase
              .from("scheduled_scans")
              .update({
                is_active: false,
                last_run: new Date().toISOString(),
              })
              .eq("id", scan.id);
          } else {
            // Calculate next run time
            const exactTime = scan.exact_time || "00:00:00";
            let nextRunDate = new Date(scan.next_run);
            
            switch (scan.frequency) {
              case "hourly":
                nextRunDate.setHours(nextRunDate.getHours() + 1);
                break;
              case "daily":
                nextRunDate.setDate(nextRunDate.getDate() + 1);
                break;
              case "weekly":
                // Check if days_of_week is specified
                if (scan.days_of_week && scan.days_of_week.length > 0) {
                  // Find the next day of week that is in the days_of_week array
                  let found = false;
                  let daysToAdd = 1;
                  
                  while (!found && daysToAdd <= 7) {
                    const nextDay = new Date(scan.next_run);
                    nextDay.setDate(nextDay.getDate() + daysToAdd);
                    const dayOfWeek = nextDay.getDay();
                    
                    if (scan.days_of_week.includes(dayOfWeek)) {
                      found = true;
                      nextRunDate = nextDay;
                    } else {
                      daysToAdd++;
                    }
                  }
                  
                  if (!found) {
                    // Fallback: add 7 days if no matching day found
                    nextRunDate.setDate(nextRunDate.getDate() + 7);
                  }
                } else {
                  // Default: add 7 days
                  nextRunDate.setDate(nextRunDate.getDate() + 7);
                }
                break;
              case "monthly":
                // Set to the specified day of month for the next month
                const currentMonth = nextRunDate.getMonth();
                nextRunDate.setMonth(currentMonth + 1);
                
                if (scan.day_of_month) {
                  // Set to the specified day of month
                  const lastDayOfMonth = new Date(
                    nextRunDate.getFullYear(),
                    nextRunDate.getMonth() + 1,
                    0
                  ).getDate();
                  
                  // Ensure the day is valid (not beyond the last day of the month)
                  nextRunDate.setDate(Math.min(scan.day_of_month, lastDayOfMonth));
                }
                break;
            }
            
            // Set the exact time
            if (exactTime) {
              const [hours, minutes] = exactTime.split(':').map(Number);
              nextRunDate.setHours(hours, minutes, 0, 0);
            }
            
            await supabase
              .from("scheduled_scans")
              .update({
                next_run: nextRunDate.toISOString(),
                last_run: new Date().toISOString(),
              })
              .eq("id", scan.id);
          }
          
          return { 
            id: scan.id, 
            status: "success", 
            scan_history_id: savedScan.id 
          };
        } catch (error) {
          console.error(`Error executing scan ${scan.id}:`, error);
          
          // Update the next run time even if there was an error
          // to prevent the system from continually retrying failed scans
          if (scan.frequency !== "once") {
            const nextRunDate = new Date(scan.next_run);
            
            // Basic fallback: add 1 hour to prevent immediate retries
            nextRunDate.setHours(nextRunDate.getHours() + 1);
            
            await supabase
              .from("scheduled_scans")
              .update({
                next_run: nextRunDate.toISOString(),
                last_run: new Date().toISOString(),
              })
              .eq("id", scan.id);
          } else {
            // For one-time scans, deactivate them after failure
            await supabase
              .from("scheduled_scans")
              .update({
                is_active: false,
                last_run: new Date().toISOString(),
              })
              .eq("id", scan.id);
          }
          
          return { 
            id: scan.id, 
            status: "error", 
            error: error.message || "Unknown error"
          };
        }
      })
    );
    
    return { executed: results };
  } catch (error) {
    console.error("Unexpected error in scheduled scan execution:", error);
    return { error: error.message || "Unexpected error in scheduled scan execution" };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const result = await handleScheduledScans();
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
