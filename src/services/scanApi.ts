interface ScanResult {
  output: any;
  status: 'success' | 'error';
  timestamp: string;
  raw?: string;
}

// Get backend URL from environment if available, otherwise default to localhost
const getBackendUrl = () => {
  // In production, use the environment variable set in Vercel
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  
  if (!backendUrl) {
    console.warn("VITE_BACKEND_URL is not set. Falling back to localhost:5000");
    return 'http://localhost:5000';
  }
  
  return backendUrl;
};

export const initiateNmapScan = async (
  target: string, 
  scanType: string, 
  customAttributes?: string
): Promise<ScanResult> => {
  console.log(`Initiating ${scanType} scan on target: ${target}`);
  if (customAttributes) {
    console.log(`Using custom attributes: ${customAttributes}`);
  }
  
  const backendUrl = getBackendUrl();
  console.log(`Using backend URL: ${backendUrl}`);
  
  try {
    const response = await fetch(`${backendUrl}/api/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        target,
        scanType,
        customAttributes,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.output || 'Scan request failed');
    }

    const result = await response.json();
    console.log('Scan completed successfully:', result);
    
    // Process the result based on scan type
    let processedOutput = result.output;
    
    // Ensure we handle the output correctly for each scan type
    if (scanType === 'os' && Array.isArray(processedOutput)) {
      // Make sure OS scan results are properly structured
      processedOutput = processedOutput.map(host => {
        if (!host.os) {
          host.os = { matches: [] };
        }
        return host;
      });
    }
    
    // Ensure we always return a consistent format
    return {
      output: processedOutput,
      status: result.status,
      timestamp: result.timestamp,
      raw: result.raw
    };
  } catch (error: any) {
    console.error('Scan error:', error);
    throw new Error(error.message || 'Failed to perform scan');
  }
};