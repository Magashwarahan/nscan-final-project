interface PortExplanation {
  description: string;
  risks: string[];
  recommendations: string[];
}

interface ServiceExplanation {
  name: string;
  description: string;
  commonPorts: number[];
  risks: string[];
  bestPractices: string[];
}

export const commonPorts: Record<string, PortExplanation> = {
  "20": {
    description: "FTP Data Transfer - Used for transferring files between computers",
    risks: [
      "Unencrypted data transmission",
      "Potential for anonymous access",
      "Vulnerable to brute force attacks"
    ],
    recommendations: [
      "Use SFTP or FTPS instead",
      "Implement strong authentication",
      "Restrict access to specific IP addresses"
    ]
  },
  "21": {
    description: "FTP Control - Manages FTP connections and commands",
    risks: [
      "Clear text credentials transmission",
      "Directory traversal vulnerabilities",
      "Known exploits in older versions"
    ],
    recommendations: [
      "Use secure alternatives like SFTP",
      "Enable encryption",
      "Keep FTP server software updated"
    ]
  },
  "22": {
    description: "SSH (Secure Shell) - Encrypted remote access and file transfer",
    risks: [
      "Potential for brute force attacks",
      "Older versions may have vulnerabilities",
      "Misconfiguration risks"
    ],
    recommendations: [
      "Use strong authentication methods",
      "Keep SSH software updated",
      "Implement fail2ban or similar protection"
    ]
  },
  "23": {
    description: "Telnet - Legacy remote access protocol (unencrypted)",
    risks: [
      "No encryption - all data sent in clear text",
      "Easily intercepted credentials",
      "Vulnerable to man-in-the-middle attacks"
    ],
    recommendations: [
      "Replace with SSH immediately",
      "Disable if not absolutely necessary",
      "Use VPN if legacy systems require Telnet"
    ]
  },
  "25": {
    description: "SMTP - Email server protocol for sending mail",
    risks: [
      "Spam relay if misconfigured",
      "Email harvesting",
      "DoS attacks"
    ],
    recommendations: [
      "Implement proper authentication",
      "Use TLS encryption",
      "Configure SPF, DKIM, and DMARC"
    ]
  },
  "80": {
    description: "HTTP - Standard web server protocol",
    risks: [
      "Unencrypted data transmission",
      "Susceptible to traffic interception",
      "Various web-based attacks"
    ],
    recommendations: [
      "Upgrade to HTTPS (port 443)",
      "Implement security headers",
      "Regular security audits"
    ]
  },
  "443": {
    description: "HTTPS - Secure web server protocol",
    risks: [
      "SSL/TLS vulnerabilities if not updated",
      "Weak cipher suites",
      "Certificate management issues"
    ],
    recommendations: [
      "Keep SSL/TLS updated",
      "Use strong cipher suites",
      "Maintain valid certificates"
    ]
  },
  "3389": {
    description: "RDP (Remote Desktop Protocol) - Windows remote access",
    risks: [
      "Brute force attacks",
      "BlueKeep and similar vulnerabilities",
      "Resource exhaustion attacks"
    ],
    recommendations: [
      "Use strong passwords",
      "Implement Network Level Authentication",
      "Restrict access by IP"
    ]
  }
};

export const commonServices: Record<string, ServiceExplanation> = {
  "http": {
    name: "HTTP (Web Server)",
    description: "Serves web pages and handles web traffic",
    commonPorts: [80, 8080],
    risks: [
      "Data transmitted in clear text",
      "Vulnerable to man-in-the-middle attacks",
      "Can expose sensitive information"
    ],
    bestPractices: [
      "Migrate to HTTPS",
      "Implement security headers",
      "Regular security updates"
    ]
  },
  "https": {
    name: "HTTPS (Secure Web Server)",
    description: "Encrypted version of HTTP for secure web traffic",
    commonPorts: [443],
    risks: [
      "Outdated SSL/TLS versions",
      "Weak cipher configurations",
      "Expired certificates"
    ],
    bestPractices: [
      "Use modern TLS versions",
      "Regular certificate maintenance",
      "Security header implementation"
    ]
  },
  "ssh": {
    name: "SSH (Secure Shell)",
    description: "Encrypted protocol for remote access and file transfers",
    commonPorts: [22],
    risks: [
      "Brute force attacks",
      "Weak key exchanges",
      "Unauthorized access attempts"
    ],
    bestPractices: [
      "Use key-based authentication",
      "Disable root login",
      "Implement fail2ban"
    ]
  },
  "ftp": {
    name: "FTP (File Transfer Protocol)",
    description: "Protocol for transferring files between systems",
    commonPorts: [20, 21],
    risks: [
      "Unencrypted data transfer",
      "Password sniffing",
      "Anonymous access"
    ],
    bestPractices: [
      "Use SFTP instead",
      "Enable encryption",
      "Strict access controls"
    ]
  }
};

export type RiskLevel = "critical" | "high" | "medium" | "low";

export const getRiskLevel = (service: string): RiskLevel => {
  const criticalRiskServices = ['telnet', 'rsh', 'rlogin'];
  const highRiskServices = ['ftp'];
  const mediumRiskServices = ['http', 'smtp', 'pop3', 'imap'];
  
  if (criticalRiskServices.some(s => service.toLowerCase().includes(s))) {
    return "critical";
  }
  if (highRiskServices.some(s => service.toLowerCase().includes(s))) {
    return "high";
  }
  if (mediumRiskServices.some(s => service.toLowerCase().includes(s))) {
    return "medium";
  }
  return "low";
};

export const getRiskDescription = (level: RiskLevel): string => {
  switch (level) {
    case "critical":
      return "Critical attention required. These services pose significant security risks and should be addressed immediately.";
    case "high":
      return "Moderate risk. While not critical, these services should be reviewed and secured according to best practices.";
    case "medium":
      return "Low risk. These services follow security best practices but should still be monitored regularly.";
    case "low":
      return "Low risk. These services follow security best practices but should still be monitored regularly.";
  }
};
