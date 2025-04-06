import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { jsPDF } from "npm:jspdf";
import { autoTable } from "npm:jspdf-autotable";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Port information database with expanded entries
const PORT_INFO = {
  // ... keep existing code (PORT_INFO definitions)
};

function assessRisk(port, service) {
  const highRiskServices = ['telnet', 'ftp', 'rsh', 'rlogin'];
  const mediumRiskServices = ['http', 'smtp', 'pop3', 'imap', 'dns', 'smb'];
  
  const serviceLower = service.toLowerCase();
  
  if (highRiskServices.some(s => serviceLower.includes(s))) {
    return 'High';
  }
  if (mediumRiskServices.some(s => serviceLower.includes(s))) {
    return 'Medium';
  }
  return 'Low';
}

function getPortInfoAndRecommendations(port, service) {
  // First try to match by exact port number
  if (PORT_INFO[port]) {
    return PORT_INFO[port];
  }
  
  // If no exact match, try to match by service name
  const serviceLower = service.toLowerCase();
  
  // Create a default entry if no match found
  const defaultInfo = {
    service: service,
    description: `Port ${port} - ${service}`,
    risks: ['Unknown risks - service not in database'],
    recommendations: [
      'Keep service updated',
      'Monitor for suspicious activity',
      'Consider disabling if not required'
    ]
  };
  
  // Check if we can match the service name to any known port
  for (const portKey in PORT_INFO) {
    const portInfo = PORT_INFO[portKey];
    if (serviceLower.includes(portInfo.service.toLowerCase())) {
      return portInfo;
    }
  }
  
  return defaultInfo;
}

function generatePDF(scanResult, scanType, timestamp, scanId) {
  console.log(`Generating enhanced ${scanType} PDF report for scanId:`, scanId);
  const pdf = new jsPDF();
  
  // Add header with improved styling
  pdf.setFillColor(41, 65, 97);
  pdf.rect(0, 0, 210, 30, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`NScan ${scanType.toUpperCase()} Security Report`, 105, 15, { align: 'center' });
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  
  // Add report metadata
  pdf.text(`Scan Type: ${scanType.toUpperCase()}`, 15, 40);
  pdf.text(`Scan ID: ${scanId}`, 15, 48);
  pdf.text(`Generated on: ${new Date(timestamp).toLocaleString()}`, 15, 56);
  
  // Process and organize scan data
  const results = typeof scanResult === 'string' ? JSON.parse(scanResult) : scanResult;
  
  // Generate different report based on scan type
  switch(scanType) {
    case 'os':
      return generateOSReport(pdf, results, scanId, timestamp);
    case 'vuln':
      return generateVulnerabilityReport(pdf, results, scanId, timestamp);
    case 'service':
      return generateServiceReport(pdf, results, scanId, timestamp);
    case 'stealth':
      return generateStealthReport(pdf, results, scanId, timestamp);
    case 'script':
      return generateScriptReport(pdf, results, scanId, timestamp);
    case 'udp':
      return generateUDPReport(pdf, results, scanId, timestamp);
    default:
      return generateStandardReport(pdf, results, scanType, scanId, timestamp);
  }
}

function generateStandardReport(pdf, results, scanType, scanId, timestamp) {
  // Calculate statistics for charts
  const stats = {
    openPorts: 0,
    closedPorts: 0,
    filteredPorts: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    services: {}
  };
  
  // Process findings and collect statistics
  const findings = [];
  
  results.forEach(host => {
    Object.entries(host.protocols || {}).forEach(([protocol, ports]) => {
      ports.forEach(port => {
        // Update statistics
        if (port.state === 'open') stats.openPorts++;
        else if (port.state === 'closed') stats.closedPorts++;
        else stats.filteredPorts++;
        
        // Only process open ports for risk assessment
        if (port.state === 'open') {
          const risk = assessRisk(port.port, port.service);
          if (risk === 'High') stats.highRisk++;
          else if (risk === 'Medium') stats.mediumRisk++;
          else stats.lowRisk++;
          
          // Count services
          stats.services[port.service] = (stats.services[port.service] || 0) + 1;
          
          // Add to findings
          findings.push({
            host: host.host,
            port: port.port,
            protocol,
            service: port.service,
            state: port.state,
            version: port.version || 'Unknown',
            product: port.product || 'Unknown',
            risk
          });
        }
      });
    });
  });
  
  // Add executive summary
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Summary', 15, 70);
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  // Add summary statistics table
  const summaryData = [
    ['Total Hosts Scanned', results.length.toString()],
    ['Open Ports', stats.openPorts.toString()],
    ['Closed Ports', stats.closedPorts.toString()],
    ['Filtered Ports', stats.filteredPorts.toString()],
    ['High Risk Findings', stats.highRisk.toString()],
    ['Medium Risk Findings', stats.mediumRisk.toString()],
    ['Low Risk Findings', stats.lowRisk.toString()]
  ];
  
  autoTable(pdf, {
    startY: 75,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [66, 99, 147] }
  });
  
  // Add risk assessment section
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Risk Assessment', 15, 20);
  
  // Sort findings by risk level (High to Low)
  findings.sort((a, b) => {
    const riskOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
    return riskOrder[a.risk] - riskOrder[b.risk];
  });
  
  // Add findings table
  const findingsData = findings.map(finding => [
    finding.host,
    `${finding.port}/${finding.protocol}`,
    finding.service,
    finding.product !== 'Unknown' ? `${finding.product} ${finding.version}` : '-',
    finding.risk
  ]);
  
  autoTable(pdf, {
    startY: 25,
    head: [['Host', 'Port/Protocol', 'Service', 'Product Version', 'Risk Level']],
    body: findingsData,
    theme: 'striped',
    headStyles: { fillColor: [66, 99, 147] },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      4: {
        fontStyle: 'bold',
        cellWidth: 20,
        fillColor: function(row) {
          const risk = findings[row.index].risk;
          if (risk === 'High') return [239, 83, 80]; // red
          if (risk === 'Medium') return [255, 167, 38]; // orange
          return [102, 187, 106]; // green
        },
        textColor: [255, 255, 255]
      }
    }
  });
  
  // Add detailed findings with recommendations
  let currentY = pdf.lastAutoTable.finalY + 15;
  
  // Check if we need a new page
  if (currentY > 260) {
    pdf.addPage();
    currentY = 20;
  }
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Detailed Analysis & Recommendations', 15, currentY);
  currentY += 10;
  
  // Process high and medium risk findings for detailed analysis
  const detailedFindings = findings.filter(f => f.risk !== 'Low');
  
  for (const finding of detailedFindings) {
    // Check if we need a new page
    if (currentY > 250) {
      pdf.addPage();
      currentY = 20;
    }
    
    const portInfo = getPortInfoAndRecommendations(finding.port.toString(), finding.service);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(66, 99, 147);
    pdf.text(`${finding.host} - Port ${finding.port} (${finding.service})`, 15, currentY);
    currentY += 8;
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Description:`, 20, currentY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(portInfo.description, 70, currentY);
    currentY += 7;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Risk Level:`, 20, currentY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(finding.risk, 70, currentY);
    currentY += 7;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Known Risks:`, 20, currentY);
    currentY += 7;
    
    pdf.setFont('helvetica', 'normal');
    for (const risk of portInfo.risks) {
      pdf.text(`• ${risk}`, 25, currentY);
      currentY += 6;
    }
    
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Recommendations:`, 20, currentY);
    currentY += 7;
    
    pdf.setFont('helvetica', 'normal');
    for (const rec of portInfo.recommendations) {
      pdf.text(`• ${rec}`, 25, currentY);
      currentY += 6;
    }
    
    currentY += 5;
  }
  
  return pdf.output('arraybuffer');
}

function generateOSReport(pdf, results, scanId, timestamp) {
  // Organize OS detection data
  const osStats = {
    totalHosts: results.length,
    detectedOS: 0,
    vendors: {},
    osTypes: {},
    osAccuracy: 0
  };

  let totalAccuracy = 0;
  let osMatches = 0;

  results.forEach(host => {
    if (host.os && host.os.matches && host.os.matches.length > 0) {
      osStats.detectedOS++;
      
      host.os.matches.forEach(match => {
        osMatches++;
        totalAccuracy += parseInt(match.accuracy) || 0;
        
        if (match.osclass) {
          const osclasses = Array.isArray(match.osclass) ? match.osclass : [match.osclass];
          
          osclasses.forEach(osclass => {
            const vendor = osclass.vendor || 'Unknown';
            const type = osclass.type || 'Unknown';
            
            osStats.vendors[vendor] = (osStats.vendors[vendor] || 0) + 1;
            osStats.osTypes[type] = (osStats.osTypes[type] || 0) + 1;
          });
        }
      });
    }
  });

  osStats.osAccuracy = osMatches > 0 ? totalAccuracy / osMatches : 0;

  // Executive Summary
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('OS Detection Summary', 15, 70);
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  const summaryData = [
    ['Total Hosts Scanned', osStats.totalHosts.toString()],
    ['Hosts with OS Detection', osStats.detectedOS.toString()],
    ['Average Detection Accuracy', `${osStats.osAccuracy.toFixed(1)}%`]
  ];
  
  autoTable(pdf, {
    startY: 75,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [66, 99, 147] }
  });

  // OS Distribution
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('OS Distribution', 15, 20);

  // Convert OS types and vendors to table data
  const osTypeData = Object.entries(osStats.osTypes).map(([type, count]) => [type, count.toString()]);
  const vendorData = Object.entries(osStats.vendors).map(([vendor, count]) => [vendor, count.toString()]);

  autoTable(pdf, {
    startY: 25,
    head: [['OS Type', 'Count']],
    body: osTypeData,
    theme: 'striped',
    headStyles: { fillColor: [66, 99, 147] }
  });

  let currentY = pdf.lastAutoTable.finalY + 15;

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Vendor Distribution', 15, currentY);

  autoTable(pdf, {
    startY: currentY + 5,
    head: [['Vendor', 'Count']],
    body: vendorData,
    theme: 'striped',
    headStyles: { fillColor: [66, 99, 147] }
  });

  // Detailed OS matches per host
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Detailed OS Fingerprinting Results', 15, 20);

  currentY = 30;

  results.forEach((host, hostIndex) => {
    if (currentY > 250) {
      pdf.addPage();
      currentY = 20;
    }

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Host: ${host.host}`, 15, currentY);
    currentY += 10;

    if (host.os && host.os.matches && host.os.matches.length > 0) {
      host.os.matches.forEach((match, matchIndex) => {
        if (currentY > 250) {
          pdf.addPage();
          currentY = 20;
        }

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Match ${matchIndex + 1}: ${match.name} (Accuracy: ${match.accuracy}%)`, 20, currentY);
        currentY += 7;

        if (match.osclass) {
          const osclasses = Array.isArray(match.osclass) ? match.osclass : [match.osclass];
          
          osclasses.forEach((osclass, classIndex) => {
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`• Type: ${osclass.type || 'Unknown'}`, 25, currentY);
            currentY += 5;
            pdf.text(`• Vendor: ${osclass.vendor || 'Unknown'}`, 25, currentY);
            currentY += 5;
            pdf.text(`• Family: ${osclass.osfamily || 'Unknown'}`, 25, currentY);
            currentY += 5;
            pdf.text(`• Generation: ${osclass.osgen || 'Unknown'}`, 25, currentY);
            currentY += 10;
          });
        } else {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`No OS class information available`, 25, currentY);
          currentY += 10;
        }
      });
    } else {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`No OS detection information available for this host`, 20, currentY);
      currentY += 10;
    }

    currentY += 5;
  });

  // Add security recommendations
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('OS Security Recommendations', 15, 20);

  currentY = 30;
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Based on the detected operating systems, consider the following security recommendations:', 15, currentY);
  currentY += 10;

  const recommendations = [
    'Ensure all identified operating systems are up to date with the latest security patches',
    'Remove or update any end-of-life operating systems that no longer receive security updates',
    'Implement host-based firewalls on all systems',
    'Consider network segmentation based on OS types',
    'Implement regular vulnerability scanning for all detected operating systems',
    'Develop an incident response plan specific to the OS types in your environment',
    'Document all identified systems for IT asset management'
  ];

  recommendations.forEach(rec => {
    pdf.setFontSize(10);
    pdf.text(`• ${rec}`, 20, currentY);
    currentY += 7;
  });

  return pdf.output('arraybuffer');
}

function generateVulnerabilityReport(pdf, results, scanId, timestamp) {
  // This is a placeholder for vulnerability report
  // Would need to process vulnerability scan results specifically
  
  // For now, we'll use the standard report with a focus on vulnerabilities
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Vulnerability Assessment Results', 15, 70);

  // Process vulnerability findings
  const vulnFindings = [];
  let currentY = 85;

  results.forEach(host => {
    // Look for script results which often contain vulnerability information
    if (host.scripts) {
      Object.entries(host.scripts).forEach(([scriptName, output]) => {
        if (typeof output === 'string' && output.toLowerCase().includes('vulnerability')) {
          vulnFindings.push({
            host: host.host,
            scriptName,
            output
          });
        }
      });
    }

    // Look for service information that might indicate vulnerabilities
    if (host.protocols) {
      Object.values(host.protocols).forEach((ports: any) => {
        ports.forEach((port: any) => {
          if (port.state === 'open' && port.version) {
            // Check if there's version information that might indicate vulnerability
            vulnFindings.push({
              host: host.host,
              port: port.port,
              service: port.service,
              version: port.version,
              product: port.product
            });
          }
        });
      });
    }
  });

  // Add vulnerability count
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Total potential vulnerabilities found: ${vulnFindings.length}`, 15, currentY);
  
  // Use standard report formatting for the rest
  return generateStandardReport(pdf, results, 'vuln', scanId, timestamp);
}

function generateServiceReport(pdf, results, scanId, timestamp) {
  // Focus on service detection information
  const serviceStats = {
    totalServices: 0,
    serviceTypes: {},
    serviceVersions: {}
  };

  results.forEach(host => {
    if (host.protocols) {
      Object.entries(host.protocols).forEach(([protocol, ports]) => {
        ports.forEach((port: any) => {
          if (port.state === 'open') {
            serviceStats.totalServices++;
            
            const service = port.service || 'unknown';
            serviceStats.serviceTypes[service] = (serviceStats.serviceTypes[service] || 0) + 1;
            
            if (port.product && port.version) {
              const versionKey = `${port.product} ${port.version}`;
              serviceStats.serviceVersions[versionKey] = (serviceStats.serviceVersions[versionKey] || 0) + 1;
            }
          }
        });
      });
    }
  });

  // Create service-specific report sections
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Service Detection Analysis', 15, 70);
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Detected ${serviceStats.totalServices} services across ${results.length} hosts`, 15, 80);

  // Service distribution table
  const serviceData = Object.entries(serviceStats.serviceTypes).map(([service, count]) => [
    service, count.toString()
  ]);

  autoTable(pdf, {
    startY: 90,
    head: [['Service Type', 'Count']],
    body: serviceData,
    theme: 'striped',
    headStyles: { fillColor: [66, 99, 147] }
  });

  // Use standard report for the rest
  pdf.addPage();
  return generateStandardReport(pdf, results, 'service', scanId, timestamp);
}

// Placeholder functions for other report types
function generateStealthReport(pdf, results, scanId, timestamp) {
  return generateStandardReport(pdf, results, 'stealth', scanId, timestamp);
}

function generateScriptReport(pdf, results, scanId, timestamp) {
  return generateStandardReport(pdf, results, 'script', scanId, timestamp);
}

function generateUDPReport(pdf, results, scanId, timestamp) {
  return generateStandardReport(pdf, results, 'udp', scanId, timestamp);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received request to send scan report");
    const requestBody = await req.json();
    const { email, scanId } = requestBody;

    if (!email) {
      throw new Error("Email is required");
    }

    if (!scanId) {
      throw new Error("Scan ID is required");
    }

    // Fetch the scan details from the database
    console.log(`Fetching scan with ID: ${scanId}`);
    const { data: scanData, error: scanError } = await supabase
      .from("scan_history")
      .select("*")
      .eq("id", scanId)
      .single();

    if (scanError || !scanData) {
      console.error("Error fetching scan:", scanError);
      throw new Error(scanError?.message || "Scan not found");
    }

    console.log("Retrieved scan data:", scanData.scan_name);

    const scanResult = typeof scanData.result === 'string' 
      ? JSON.parse(scanData.result) 
      : scanData.result;
    
    const scanType = scanData.scan_type;
    const timestamp = scanData.timestamp;

    console.log(`Generating enhanced ${scanType} PDF report...`);
    const pdfBuffer = generatePDF(scanResult, scanType, timestamp, scanId);
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    console.log("PDF generated successfully, sending email...");

    const emailResponse = await resend.emails.send({
      from: "Nscan <onboarding@resend.dev>",
      to: [email],
      subject: `${scanType.toUpperCase()} Scan Report - (ID: ${scanId.substring(0, 8)})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 5px;">
          <h1 style="color: #4263a3;">Your ${scanType.toUpperCase()} Scan Report</h1>
          <p>Thank you for using NScan. Please find attached your detailed ${scanType} security report for:</p>
          <ul>
            <li><strong>Scan Type:</strong> ${scanType.toUpperCase()}</li>
            <li><strong>Scan ID:</strong> ${scanId}</li>
            <li><strong>Generated:</strong> ${new Date(timestamp).toLocaleString()}</li>
          </ul>
          <p>The attached PDF contains a comprehensive analysis of your ${scanType} scan, including:</p>
          <ul>
            <li>Executive summary with key statistics</li>
            <li>Risk assessment of all identified services</li>
            <li>Detailed findings with vulnerability information</li>
            <li>Security recommendations and best practices</li>
          </ul>
          <p>If you have any questions about this report or need assistance implementing the recommendations, please contact our support team.</p>
          <p style="margin-top: 30px;">Best regards,<br>The NScan Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `nscan_${scanType}_report_${scanId.substring(0, 8)}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-scan-report function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});