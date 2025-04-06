from fpdf import FPDF
import json
import csv
from datetime import datetime
import matplotlib.pyplot as plt
import io
import base64

class UTF8FPDF(FPDF):
    """Extension of FPDF to handle UTF-8 encoding properly"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Store the bytes to prevent encoding issues
        self._byte_string = None

    def output(self, dest=''):
        """Override output method to handle UTF-8 encoding"""
        if dest == 'S':
            self._byte_string = super().output(dest='S')
            return self._byte_string
        else:
            return super().output(dest)

class ReportGenerator:
    def __init__(self, scan_data, scan_type, timestamp, scan_id=None):
        self.scan_data = scan_data
        self.scan_type = scan_type
        self.timestamp = timestamp
        self.scan_id = scan_id
        self.pdf = None
        self.colors = {
            'primary': (66, 99, 147),  # Updated to match the edge function
            'secondary': (214, 188, 250),
            'neutral': (142, 145, 150),
            'background': (241, 240, 251),
            'dark': (34, 31, 38),
            'high_risk': (239, 83, 80),
            'medium_risk': (255, 167, 38),
            'low_risk': (102, 187, 106),
        }
        
        # Keep existing code (port_info database)
        self.port_info = {
            '20': {
                'service': 'FTP Data',
                'description': 'File Transfer Protocol - Data Channel',
                'risks': [
                    'Unencrypted data transmission',
                    'Potential for anonymous access',
                    'Vulnerable to brute force attacks'
                ],
                'recommendations': [
                    'Use SFTP or FTPS instead',
                    'Implement strong authentication',
                    'Use firewall rules to restrict access'
                ]
            },
            '21': {
                'service': 'FTP Control',
                'description': 'File Transfer Protocol - Control Channel',
                'risks': [
                    'Clear text credentials',
                    'Directory traversal risks',
                    'Known exploits'
                ],
                'recommendations': [
                    'Use SFTP or FTPS instead',
                    'Implement strong authentication',
                    'Keep FTP server software updated'
                ]
            },
            '22': {
                'service': 'SSH',
                'description': 'Secure Shell - Encrypted remote access',
                'risks': [
                    'Brute force attempts',
                    'Version-specific vulnerabilities',
                    'Key management risks'
                ],
                'recommendations': [
                    'Use key-based authentication',
                    'Disable root login',
                    'Keep SSH implementation updated'
                ]
            },
            '23': {
                'service': 'Telnet',
                'description': 'Unencrypted remote terminal protocol',
                'risks': [
                    'Unencrypted communications',
                    'Clear-text passwords',
                    'Man-in-the-middle attacks'
                ],
                'recommendations': [
                    'Replace with SSH',
                    'Disable if not required',
                    'Use VPN if must be used'
                ]
            },
            '25': {
                'service': 'SMTP',
                'description': 'Simple Mail Transfer Protocol',
                'risks': [
                    'Open relay attacks',
                    'Email spoofing',
                    'Vulnerability to spam attacks'
                ],
                'recommendations': [
                    'Implement SPF, DKIM and DMARC',
                    'Require authentication',
                    'Use TLS for transmission'
                ]
            },
            '53': {
                'service': 'DNS',
                'description': 'Domain Name System',
                'risks': [
                    'Cache poisoning',
                    'DNS amplification attacks',
                    'Zone transfer vulnerabilities'
                ],
                'recommendations': [
                    'Implement DNSSEC',
                    'Restrict zone transfers',
                    'Keep DNS software updated'
                ]
            },
            '80': {
                'service': 'HTTP',
                'description': 'Web Server - Unencrypted web traffic',
                'risks': [
                    'Man-in-the-middle attacks',
                    'Data interception',
                    'Web vulnerabilities'
                ],
                'recommendations': [
                    'Upgrade to HTTPS',
                    'Implement HTTP Strict Transport Security',
                    'Use Web Application Firewall'
                ]
            },
            '110': {
                'service': 'POP3',
                'description': 'Post Office Protocol - Email retrieval',
                'risks': [
                    'Clear text authentication',
                    'Email content exposed',
                    'Outdated protocol vulnerabilities'
                ],
                'recommendations': [
                    'Use POP3S (TLS/SSL)',
                    'Consider IMAP as alternative',
                    'Implement strong authentication'
                ]
            },
            '139': {
                'service': 'NetBIOS',
                'description': 'NetBIOS Session Service',
                'risks': [
                    'Information disclosure',
                    'Legacy protocol vulnerabilities',
                    'Potential for lateral movement'
                ],
                'recommendations': [
                    'Block at network boundary',
                    'Use VPN for required access',
                    'Disable if not needed'
                ]
            },
            '143': {
                'service': 'IMAP',
                'description': 'Internet Message Access Protocol',
                'risks': [
                    'Clear text authentication',
                    'Email content exposed',
                    'Various implementation vulnerabilities'
                ],
                'recommendations': [
                    'Use IMAPS (TLS/SSL)',
                    'Implement strong authentication',
                    'Keep mail server updated'
                ]
            },
            '443': {
                'service': 'HTTPS',
                'description': 'Secure Web Server - Encrypted web traffic',
                'risks': [
                    'SSL/TLS vulnerabilities',
                    'Certificate issues',
                    'Web application risks'
                ],
                'recommendations': [
                    'Keep TLS configuration updated',
                    'Use proper certificate management',
                    'Implement security headers'
                ]
            },
            '445': {
                'service': 'SMB',
                'description': 'Server Message Block - File sharing',
                'risks': [
                    'EternalBlue and related exploits',
                    'Unauthorized access to shares',
                    'Lateral movement within network'
                ],
                'recommendations': [
                    'Keep fully patched',
                    'Block at network boundary',
                    'Use latest SMB version'
                ]
            },
            '1433': {
                'service': 'MS SQL',
                'description': 'Microsoft SQL Database Server',
                'risks': [
                    'SQL injection attacks',
                    'Default or weak credentials',
                    'Excessive privileges'
                ],
                'recommendations': [
                    'Use strong authentication',
                    'Implement least privilege',
                    'Keep database patched'
                ]
            },
            '3306': {
                'service': 'MySQL',
                'description': 'MySQL Database Server',
                'risks': [
                    'SQL injection attacks',
                    'Default or weak credentials',
                    'Public exposure risks'
                ],
                'recommendations': [
                    'Restrict remote access',
                    'Use strong passwords',
                    'Keep database updated'
                ]
            },
            '3389': {
                'service': 'RDP',
                'description': 'Remote Desktop Protocol',
                'risks': [
                    'BlueKeep and similar vulnerabilities',
                    'Brute force attacks',
                    'Man-in-the-middle attacks'
                ],
                'recommendations': [
                    'Use Network Level Authentication',
                    'Implement 2FA',
                    'Use VPN for access'
                ]
            },
            '5432': {
                'service': 'PostgreSQL',
                'description': 'PostgreSQL Database Server',
                'risks': [
                    'SQL injection attacks',
                    'Default or weak credentials',
                    'Public exposure risks'
                ],
                'recommendations': [
                    'Restrict remote access',
                    'Use strong authentication',
                    'Keep database updated'
                ]
            }
        }

    
    def get_risk_level(self, service):
        high_risk = ['telnet', 'ftp', 'rsh', 'rlogin']
        medium_risk = ['http', 'smtp', 'pop3', 'imap', 'dns', 'smb']
        
        service_lower = service.lower()
        if any(risk in service_lower for risk in high_risk):
            return 'High'
        elif any(risk in service_lower for risk in medium_risk):
            return 'Medium'
        return 'Low'
    
    def get_service_recommendations(self, service, port):
        # First check if we have an exact port match
        if port in self.port_info:
            return self.port_info[port]['recommendations']
        
        # Otherwise, try to provide service-specific recommendations
        recommendations = []
        service_lower = service.lower()
        
        if 'http' in service_lower and port != '443':
            recommendations.append('Consider upgrading to HTTPS for encrypted communication')
        if 'ftp' in service_lower:
            recommendations.append('Replace with SFTP or FTPS for secure file transfers')
        if 'telnet' in service_lower:
            recommendations.append('Replace with SSH for secure remote access')
        if 'sql' in service_lower:
            recommendations.append('Restrict database access to trusted networks only')
            recommendations.append('Implement strong authentication and regular audits')
        
        # Add general recommendations if nothing specific was found
        if not recommendations:
            recommendations = [
                'Keep the service updated with security patches',
                'Restrict access to this service with proper firewall rules',
                'Monitor for suspicious activity'
            ]
        
        return recommendations

    def generate_charts(self):
        """Generate enhanced charts for the report"""
        charts = {}
        
        try:
            results = json.loads(self.scan_data) if isinstance(self.scan_data, str) else self.scan_data
            port_states = {}
            services = {}
            risk_levels = {'High': 0, 'Medium': 0, 'Low': 0}
            
            if not results:
                return {}
                
            for host in results:
                for proto in host.get('protocols', {}):
                    for port in host['protocols'][proto]:
                        state = port['state']
                        port_states[state] = port_states.get(state, 0) + 1
                        
                        service = port['service']
                        services[service] = services.get(service, 0) + 1
                        
                        if state == 'open':  # Only assess risk for open ports
                            risk_level = self.get_risk_level(service)
                            risk_levels[risk_level] += 1
            
            plt.style.use('seaborn')
            
            if any([port_states, services, risk_levels]):
                if port_states:
                    plt.figure(figsize=(10, 6))
                    plt.pie(
                        port_states.values(),
                        labels=port_states.keys(),
                        autopct='%1.1f%%',
                        colors=['#9b87f5', '#D6BCFA', '#8E9196'],
                        shadow=True
                    )
                    plt.title('Port States Distribution', pad=20, fontsize=14)
                    img_bytes = io.BytesIO()
                    plt.savefig(img_bytes, format='png', bbox_inches='tight', dpi=300)
                    img_bytes.seek(0)
                    charts['port_states'] = base64.b64encode(img_bytes.read()).decode()
                    plt.close()

                if services:
                    # Sort services by count for better visualization
                    sorted_services = dict(sorted(services.items(), key=lambda item: item[1], reverse=True)[:10])
                    
                    plt.figure(figsize=(12, 6))
                    plt.bar(
                        sorted_services.keys(),
                        sorted_services.values(),
                        color='#4263a3'
                    )
                    plt.xticks(rotation=45, ha='right')
                    plt.title('Top 10 Services Distribution', pad=20, fontsize=14)
                    plt.tight_layout()
                    img_bytes = io.BytesIO()
                    plt.savefig(img_bytes, format='png', bbox_inches='tight', dpi=300)
                    img_bytes.seek(0)
                    charts['services'] = base64.b64encode(img_bytes.read()).decode()
                    plt.close()

                if risk_levels:
                    plt.figure(figsize=(10, 6))
                    plt.pie(
                        risk_levels.values(),
                        labels=risk_levels.keys(),
                        autopct='%1.1f%%',
                        colors=['#ef4444', '#f59e0b', '#10b981'],
                        pctdistance=0.85,
                        shadow=True,
                        wedgeprops=dict(width=0.5)
                    )
                    plt.title('Risk Level Distribution', pad=20, fontsize=14)
                    img_bytes = io.BytesIO()
                    plt.savefig(img_bytes, format='png', bbox_inches='tight', dpi=300)
                    img_bytes.seek(0)
                    charts['risk_levels'] = base64.b64encode(img_bytes.read()).decode()
                    plt.close()
            
            return charts
        except Exception as e:
            print(f"Error generating charts: {str(e)}")
            return {}

    def generate_pdf(self):
        """Generate enhanced PDF report with detailed explanations"""
        try:
            # Use our custom UTF8FPDF class instead of regular FPDF
            self.pdf = UTF8FPDF()
            self.pdf.set_auto_page_break(auto=True, margin=15)
            
            # Cover page
            self.pdf.add_page()
            self.pdf.set_fill_color(*self.colors['primary'])
            self.pdf.rect(0, 0, 210, 30, 'F')
            
            self.pdf.set_font('Arial', 'B', 22)
            self.pdf.set_text_color(255, 255, 255)
            self.pdf.cell(0, 30, 'NScan Enhanced Security Report', 0, 1, 'C')
            
            self.pdf.set_text_color(0, 0, 0)
            self.pdf.set_font('Arial', '', 12)
            self.pdf.cell(0, 10, f'Scan Type: {self.scan_type.upper()}', 0, 1)
            if self.scan_id:
                self.pdf.cell(0, 10, f'Scan ID: {self.scan_id}', 0, 1)
            self.pdf.cell(0, 10, f'Generated on: {self.timestamp}', 0, 1)
            
            # Process data
            results = json.loads(self.scan_data) if isinstance(self.scan_data, str) else self.scan_data
            
            # Generate different report format based on scan type
            if self.scan_type == 'os':
                return self._generate_os_report(results)
            elif self.scan_type == 'service':
                return self._generate_service_report(results)
            elif self.scan_type == 'vuln':
                return self._generate_vulnerability_report(results)
            else:
                return self._generate_standard_report(results)
            
        except Exception as e:
            print(f"Error generating PDF: {str(e)}")
            raise Exception(f"Failed to generate PDF report: {str(e)}")
    
    def _generate_standard_report(self, results):
        """Generate standard port scan report"""
        # Calculate statistics for summary
        stats = {
            'total_hosts': len(results),
            'open_ports': 0,
            'closed_ports': 0,
            'filtered_ports': 0,
            'high_risk': 0,
            'medium_risk': 0,
            'low_risk': 0,
            'services': {}
        }
        
        findings = []
        
        for host in results:
            for proto in host.get('protocols', {}):
                for port in host['protocols'][proto]:
                    # Update port state stats
                    if port['state'] == 'open':
                        stats['open_ports'] += 1
                    elif port['state'] == 'closed':
                        stats['closed_ports'] += 1
                    else:
                        stats['filtered_ports'] += 1
                    
                    # Only process open ports for risk assessment
                    if port['state'] == 'open':
                        risk_level = self.get_risk_level(port['service'])
                        
                        if risk_level == 'High':
                            stats['high_risk'] += 1
                        elif risk_level == 'Medium':
                            stats['medium_risk'] += 1
                        else:
                            stats['low_risk'] += 1
                            
                        # Track services
                        service = port['service']
                        stats['services'][service] = stats['services'].get(service, 0) + 1
                        
                        # Add to findings
                        findings.append({
                            'host': host['host'],
                            'port': port['port'],
                            'protocol': proto,
                            'service': service,
                            'version': port.get('version', 'Unknown'),
                            'product': port.get('product', 'Unknown'),
                            'risk_level': risk_level
                        })
        
        # Add Executive Summary
        self.pdf.add_page()
        self.pdf.set_font('Arial', 'B', 16)
        self.pdf.cell(0, 10, 'Executive Summary', 0, 1)
        
        self.pdf.set_font('Arial', '', 12)
        self.pdf.multi_cell(0, 10, f'This report presents a comprehensive security analysis of the scan performed on {self.timestamp}. The scan identified a total of {stats["open_ports"]} open ports across {stats["total_hosts"]} host(s), with {stats["high_risk"]} high risk, {stats["medium_risk"]} medium risk, and {stats["low_risk"]} low risk findings.')
        
        # Add summary table
        self.pdf.ln(5)
        summary_data = [
            ['Metric', 'Value'],
            ['Total Hosts', str(stats['total_hosts'])],
            ['Open Ports', str(stats['open_ports'])],
            ['Closed Ports', str(stats['closed_ports'])],
            ['Filtered Ports', str(stats['filtered_ports'])],
            ['High Risk Findings', str(stats['high_risk'])],
            ['Medium Risk Findings', str(stats['medium_risk'])],
            ['Low Risk Findings', str(stats['low_risk'])]
        ]
        
        # Draw summary table
        col_width = self.pdf.w / 2.5
        row_height = 10
        
        for i, row in enumerate(summary_data):
            for j, cell in enumerate(row):
                if i == 0:  # Header row
                    self.pdf.set_fill_color(*self.colors['primary'])
                    self.pdf.set_text_color(255, 255, 255)
                    self.pdf.set_font('Arial', 'B', 12)
                else:
                    self.pdf.set_fill_color(245, 245, 245)
                    self.pdf.set_text_color(0, 0, 0)
                    self.pdf.set_font('Arial', '', 12)
                
                self.pdf.cell(col_width, row_height, cell, 1, 0, 'C', True)
            self.pdf.ln(row_height)
        
        # Add charts
        charts = self.generate_charts()
        if charts:
            self.pdf.add_page()
            self.pdf.set_font('Arial', 'B', 16)
            self.pdf.cell(0, 10, 'Visual Analysis', 0, 1)
            
            y_position = 30
            
            if 'risk_levels' in charts:
                self.pdf.set_font('Arial', 'B', 14)
                self.pdf.cell(0, 10, 'Risk Level Distribution', 0, 1)
                
                risk_image = base64.b64decode(charts['risk_levels'])
                image_file = io.BytesIO(risk_image)
                self.pdf.image(image_file, x=30, y=y_position, w=150)
                y_position += 80
            
            if y_position > 220 and 'port_states' in charts:
                self.pdf.add_page()
                y_position = 20
            
            if 'port_states' in charts:
                self.pdf.set_font('Arial', 'B', 14)
                self.pdf.cell(0, 10, 'Port States Distribution', 0, 1)
                
                port_image = base64.b64decode(charts['port_states'])
                image_file = io.BytesIO(port_image)
                self.pdf.image(image_file, x=30, y=y_position, w=150)
                y_position += 80
            
            if y_position > 220 and 'services' in charts:
                self.pdf.add_page()
                y_position = 20
            
            if 'services' in charts:
                self.pdf.set_font('Arial', 'B', 14)
                self.pdf.cell(0, 10, 'Services Distribution', 0, 1)
                
                services_image = base64.b64decode(charts['services'])
                image_file = io.BytesIO(services_image)
                self.pdf.image(image_file, x=20, y=y_position, w=170)
        
        # Add detailed findings table
        self.pdf.add_page()
        self.pdf.set_font('Arial', 'B', 16)
        self.pdf.cell(0, 10, 'Detailed Findings', 0, 1)
        
        # Sort findings by risk level (High to Low)
        findings.sort(key=lambda x: {'High': 0, 'Medium': 1, 'Low': 2}[x['risk_level']])
        
        # Draw findings table header
        self.pdf.set_fill_color(*self.colors['primary'])
        self.pdf.set_text_color(255, 255, 255)
        self.pdf.set_font('Arial', 'B', 10)
        
        col_widths = [50, 25, 30, 50, 25]
        headers = ['Host', 'Port/Protocol', 'Service', 'Product & Version', 'Risk Level']
        
        for i, header in enumerate(headers):
            self.pdf.cell(col_widths[i], 10, header, 1, 0, 'C', True)
        self.pdf.ln(10)
        
        # Draw findings table rows
        self.pdf.set_text_color(0, 0, 0)
        self.pdf.set_font('Arial', '', 9)
        
        for i, finding in enumerate(findings):
            # Row background alternating colors
            if i % 2 == 0:
                self.pdf.set_fill_color(245, 245, 245)
            else:
                self.pdf.set_fill_color(255, 255, 255)
            
            # Determine risk color
            risk_colors = {
                'High': self.colors['high_risk'],
                'Medium': self.colors['medium_risk'],
                'Low': self.colors['low_risk']
            }
            
            self.pdf.cell(col_widths[0], 10, finding['host'], 1, 0, 'L', True)
            self.pdf.cell(col_widths[1], 10, f"{finding['port']}/{finding['protocol']}", 1, 0, 'C', True)
            self.pdf.cell(col_widths[2], 10, finding['service'], 1, 0, 'L', True)
            
            version_info = finding['product']
            if finding['version'] != 'Unknown':
                version_info += f" {finding['version']}"
            
            self.pdf.cell(col_widths[3], 10, version_info if version_info != 'Unknown' else '-', 1, 0, 'L', True)
            
            # Save current position
            x, y = self.pdf.get_x(), self.pdf.get_y()
            
            # Draw risk level cell with custom color
            self.pdf.set_fill_color(*risk_colors[finding['risk_level']])
            self.pdf.set_text_color(255, 255, 255)
            self.pdf.cell(col_widths[4], 10, finding['risk_level'], 1, 0, 'C', True)
            
            # Reset colors
            self.pdf.set_text_color(0, 0, 0)
            
            self.pdf.ln(10)
            
            # Check if we need a new page
            if self.pdf.get_y() > 270 and i < len(findings) - 1:
                self.pdf.add_page()
                
                # Redraw header on new page
                self.pdf.set_fill_color(*self.colors['primary'])
                self.pdf.set_text_color(255, 255, 255)
                self.pdf.set_font('Arial', 'B', 10)
                
                for j, header in enumerate(headers):
                    self.pdf.cell(col_widths[j], 10, header, 1, 0, 'C', True)
                self.pdf.ln(10)
                
                self.pdf.set_text_color(0, 0, 0)
                self.pdf.set_font('Arial', '', 9)
        
        # Add recommendations section with high and medium risk findings
        high_medium_findings = [f for f in findings if f['risk_level'] in ['High', 'Medium']]
        
        if high_medium_findings:
            self.pdf.add_page()
            self.pdf.set_font('Arial', 'B', 16)
            self.pdf.cell(0, 10, 'Security Recommendations', 0, 1)
            
            self.pdf.set_font('Arial', '', 11)
            self.pdf.multi_cell(0, 10, 'The following recommendations address the high and medium risk findings identified in this scan. Implementing these recommendations will help improve your security posture.')
            
            for i, finding in enumerate(high_medium_findings):
                port_str = str(finding['port'])
                service = finding['service']
                
                # Get recommendations for this service/port
                recommendations = self.get_service_recommendations(service, port_str)
                
                # Draw recommendation box
                self.pdf.set_font('Arial', 'B', 12)
                
                # Determine color based on risk
                if finding['risk_level'] == 'High':
                    self.pdf.set_draw_color(*self.colors['high_risk'])
                else:
                    self.pdf.set_draw_color(*self.colors['medium_risk'])
                
                self.pdf.set_line_width(0.5)
                self.pdf.rect(10, self.pdf.get_y(), 190, 10, 'DF')
                
                # Reset color
                self.pdf.set_draw_color(0, 0, 0)
                
                # Add finding title
                if finding['risk_level'] == 'High':
                    self.pdf.set_text_color(*self.colors['high_risk'])
                else:
                    self.pdf.set_text_color(*self.colors['medium_risk'])
                
                title = f"{finding['host']} - Port {finding['port']} ({finding['service']})"
                self.pdf.cell(0, 10, title, 0, 1, 'L')
                
                # Reset text color
                self.pdf.set_text_color(0, 0, 0)
                
                # Add recommendations
                self.pdf.set_font('Arial', '', 10)
                
                for rec in recommendations:
                    # Use plain hyphen instead of bullet point to avoid Unicode issues
                    self.pdf.cell(10, 10, '-', 0, 0)
                    self.pdf.multi_cell(180, 10, rec)
                
                self.pdf.ln(5)
                
                # Check if we need a new page
                if self.pdf.get_y() > 250 and i < len(high_medium_findings) - 1:
                    self.pdf.add_page()
        
        # Get the PDF as bytes
        pdf_bytes = self.pdf.output(dest='S')
        return io.BytesIO(pdf_bytes) if isinstance(pdf_bytes, bytes) else io.BytesIO(pdf_bytes.encode('latin1'))
    
    def _generate_os_report(self, results):
        """Generate OS detection specific report"""
        # OS detection specific data processing
        os_stats = {
            'total_hosts': len(results),
            'detected_os': 0,
            'vendors': {},
            'os_types': {},
            'os_accuracy': 0
        }

        total_accuracy = 0
        os_matches = 0

        for host in results:
            if host.get('os') and host['os'].get('matches') and len(host['os']['matches']) > 0:
                os_stats['detected_os'] += 1
                
                for match in host['os']['matches']:
                    os_matches += 1
                    # Handle accuracy as string or int
                    accuracy = match.get('accuracy')
                    if accuracy:
                        try:
                            total_accuracy += int(accuracy)
                        except (ValueError, TypeError):
                            pass
                    
                    os_classes = match.get('osclass', [])
                    if os_classes and not isinstance(os_classes, list):
                        os_classes = [os_classes]
                    
                    for os_class in os_classes:
                        if not isinstance(os_class, dict):
                            continue
                            
                        vendor = os_class.get('vendor', 'Unknown')
                        os_type = os_class.get('type', 'Unknown')
                        
                        os_stats['vendors'][vendor] = os_stats['vendors'].get(vendor, 0) + 1
                        os_stats['os_types'][os_type] = os_stats['os_types'].get(os_type, 0) + 1

        os_stats['os_accuracy'] = total_accuracy / os_matches if os_matches > 0 else 0

        # OS summary table
        self.pdf.add_page()
        self.pdf.set_font('Arial', 'B', 16)
        self.pdf.cell(0, 10, 'OS Detection Summary', 0, 1)
        
        self.pdf.set_font('Arial', '', 12)
        self.pdf.multi_cell(0, 10, f'The OS detection scan identified operating systems on {os_stats["detected_os"]} out of {os_stats["total_hosts"]} hosts with an average detection accuracy of {os_stats["os_accuracy"]:.1f}%.')
        
        # OS distribution tables
        self.pdf.set_font('Arial', 'B', 14)
        self.pdf.cell(0, 15, 'OS Distribution by Type', 0, 1)
        
        # Draw OS type distribution table
        col_width = self.pdf.w / 2.5
        row_height = 10
        
        self.pdf.set_font('Arial', 'B', 12)
        self.pdf.set_fill_color(*self.colors['primary'])
        self.pdf.set_text_color(255, 255, 255)
        self.pdf.cell(col_width, row_height, 'OS Type', 1, 0, 'C', True)
        self.pdf.cell(col_width, row_height, 'Count', 1, 1, 'C', True)
        
        self.pdf.set_text_color(0, 0, 0)
        self.pdf.set_font('Arial', '', 12)
        
        for i, (os_type, count) in enumerate(os_stats['os_types'].items()):
            if i % 2 == 0:
                self.pdf.set_fill_color(245, 245, 245)
            else:
                self.pdf.set_fill_color(255, 255, 255)
                
            self.pdf.cell(col_width, row_height, os_type, 1, 0, 'L', True)
            self.pdf.cell(col_width, row_height, str(count), 1, 1, 'C', True)
        
        # OS Vendor distribution
        self.pdf.ln(10)
        self.pdf.set_font('Arial', 'B', 14)
        self.pdf.cell(0, 15, 'OS Distribution by Vendor', 0, 1)
        
        self.pdf.set_font('Arial', 'B', 12)
        self.pdf.set_fill_color(*self.colors['primary'])
        self.pdf.set_text_color(255, 255, 255)
        self.pdf.cell(col_width, row_height, 'Vendor', 1, 0, 'C', True)
        self.pdf.cell(col_width, row_height, 'Count', 1, 1, 'C', True)
        
        self.pdf.set_text_color(0, 0, 0)
        self.pdf.set_font('Arial', '', 12)
        
        for i, (vendor, count) in enumerate(os_stats['vendors'].items()):
            if i % 2 == 0:
                self.pdf.set_fill_color(245, 245, 245)
            else:
                self.pdf.set_fill_color(255, 255, 255)
                
            self.pdf.cell(col_width, row_height, vendor, 1, 0, 'L', True)
            self.pdf.cell(col_width, row_height, str(count), 1, 1, 'C', True)
        
        # Detailed OS detection results per host
        self.pdf.add_page()
        self.pdf.set_font('Arial', 'B', 16)
        self.pdf.cell(0, 15, 'Detailed OS Detection Results', 0, 1)
        
        for host in results:
            self.pdf.set_font('Arial', 'B', 14)
            self.pdf.cell(0, 10, f"Host: {host['host']}", 0, 1)
            
            if host.get('os') and host['os'].get('matches') and len(host['os']['matches']) > 0:
                for i, match in enumerate(host['os']['matches']):
                    self.pdf.set_font('Arial', 'B', 12)
                    accuracy = match.get('accuracy', 'N/A')
                    name = match.get('name', 'Unknown OS')
                    self.pdf.cell(0, 8, f"OS Match {i+1}: {name} (Accuracy: {accuracy}%)", 0, 1)
                    
                    os_classes = match.get('osclass', [])
                    if os_classes and not isinstance(os_classes, list):
                        os_classes = [os_classes]
                    
                    if os_classes:
                        self.pdf.set_font('Arial', '', 11)
                        for os_class in os_classes:
                            if not isinstance(os_class, dict):
                                continue
                                
                            os_type = os_class.get('type', 'Unknown')
                            vendor = os_class.get('vendor', 'Unknown')
                            os_family = os_class.get('osfamily', 'Unknown')
                            os_gen = os_class.get('osgen', 'Unknown')
                            
                            self.pdf.cell(20, 8, '', 0, 0)  # Indent
                            self.pdf.cell(0, 8, f"Type: {os_type}", 0, 1)
                            
                            self.pdf.cell(20, 8, '', 0, 0)  # Indent
                            self.pdf.cell(0, 8, f"Vendor: {vendor}", 0, 1)
                            
                            self.pdf.cell(20, 8, '', 0, 0)  # Indent
                            self.pdf.cell(0, 8, f"Family: {os_family}", 0, 1)
                            
                            self.pdf.cell(20, 8, '', 0, 0)  # Indent
                            self.pdf.cell(0, 8, f"Generation: {os_gen}", 0, 1)
                    
                    self.pdf.ln(5)
            else:
                self.pdf.set_font('Arial', 'I', 11)
                self.pdf.cell(0, 10, "No OS detection information available for this host", 0, 1)
            
            self.pdf.ln(10)
            
            # Check if we need a new page
            if self.pdf.get_y() > 250:
                self.pdf.add_page()
        
        # OS Security Recommendations
        self.pdf.add_page()
        self.pdf.set_font('Arial', 'B', 16)
        self.pdf.cell(0, 15, 'OS Security Recommendations', 0, 1)
        
        recommendations = [
            'Ensure all identified operating systems are up to date with the latest security patches',
            'Remove or update any end-of-life operating systems that no longer receive security updates',
            'Implement host-based firewalls on all systems',
            'Consider network segmentation based on OS types',
            'Implement regular vulnerability scanning for all detected operating systems',
            'Develop an incident response plan specific to the OS types in your environment',
            'Document all identified systems for IT asset management'
        ]
        
        self.pdf.set_font('Arial', '', 11)
        self.pdf.multi_cell(0, 10, 'Based on the detected operating systems, consider implementing the following security recommendations:')
        self.pdf.ln(5)
        
        for rec in recommendations:
            # Use plain hyphen instead of bullet point to avoid Unicode issues
            self.pdf.cell(10, 8, '-', 0, 0)
            self.pdf.multi_cell(180, 8, rec)
        
        # Get the PDF as bytes
        pdf_bytes = self.pdf.output(dest='S')
        return io.BytesIO(pdf_bytes) if isinstance(pdf_bytes, bytes) else io.BytesIO(pdf_bytes.encode('latin1'))

    def _generate_service_report(self, results):
        """Generate service detection specific report"""
        # First add standard report content
        standard_report = self._generate_standard_report(results)
        
        # Additional service-specific content would be added here
        # For now, we'll return the standard report
        return standard_report

    def _generate_vulnerability_report(self, results):
        """Generate vulnerability scan specific report"""
        # First add standard report content
        standard_report = self._generate_standard_report(results)
        
        # Additional vulnerability-specific content would be added here
        # For now, we'll return the standard report
        return standard_report
    
    def generate_csv(self):
        """Generate CSV report with risk assessments"""
        try:
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Add CSV header with more detailed fields
            writer.writerow([
                'Host', 
                'Protocol', 
                'Port', 
                'State', 
                'Service', 
                'Product',
                'Version', 
                'Risk Level', 
                'Recommendations'
            ])
            
            results = json.loads(self.scan_data) if isinstance(self.scan_data, str) else self.scan_data
            if results:
                for host in results:
                    for proto in host.get('protocols', {}):
                        for port in host['protocols'][proto]:
                            risk_level = self.get_risk_level(port['service'])
                            recommendations = ', '.join(self.get_service_recommendations(port['service'], str(port['port'])))
                            
                            writer.writerow([
                                host['host'],
                                proto,
                                port['port'],
                                port['state'],
                                port['service'],
                                port.get('product', 'N/A'),
                                port.get('version', 'N/A'),
                                risk_level,
                                recommendations
                            ])
            
            return output.getvalue()
        except Exception as e:
            print(f"Error generating CSV: {str(e)}")
            raise Exception("Failed to generate CSV report")

    def generate_html(self):
        """Generate interactive HTML report with enhanced styling"""
        try:
            charts = self.generate_charts()
            
            # Process data for detailed findings
            results = json.loads(self.scan_data) if isinstance(self.scan_data, str) else self.scan_data
            findings = []
            
            for host in results:
                for proto in host.get('protocols', {}):
                    for port in host['protocols'][proto]:
                        if port['state'] == 'open':  # Only include open ports in findings
                            risk_level = self.get_risk_level(port['service'])
                            recommendations = self.get_service_recommendations(port['service'], str(port['port']))
                            
                            # Get additional port information
                            port_str = str(port['port'])
                            port_info = self.port_info.get(port_str, {})
                            
                            findings.append({
                                'host': host['host'],
                                'port': port['port'],
                                'protocol': proto,
                                'service': port['service'],
                                'product': port.get('product', 'Unknown'),
                                'version': port.get('version', 'Unknown'),
                                'risk_level': risk_level,
                                'description': port_info.get('description', f"Port {port['port']} - {port['service']}"),
                                'risks': port_info.get('risks', ['Unknown risks']),
                                'recommendations': recommendations
                            })
            
            # Sort findings by risk level (High to Low)
            findings.sort(key=lambda x: {'High': 0, 'Medium': 1, 'Low': 2}[x['risk_level']])
            
            # Calculate statistics
            stats = {
                'total_hosts': len(results),
                'open_ports': sum(1 for f in findings),
                'high_risk': sum(1 for f in findings if f['risk_level'] == 'High'),
                'medium_risk': sum(1 for f in findings if f['risk_level'] == 'Medium'),
                'low_risk': sum(1 for f in findings if f['risk_level'] == 'Low')
            }
            
            # Generate different HTML based on scan type
            if self.scan_type == 'os':
                return self._generate_os_html(results, charts, stats)
            else:
                return self._generate_standard_html(findings, charts, stats)
                
        except Exception as e:
            print(f"Error generating HTML: {str(e)}")
            raise Exception("Failed to generate HTML report")
            
    def _generate_standard_html(self, findings, charts, stats):
        """Generate standard HTML report"""
        # Basic HTML structure
        html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>NScan Enhanced Security Report - {self.scan_type}</title>
            <style>
                /* ... keep existing code (styling CSS) */
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>NScan Enhanced Security Report</h1>
                    <p>Scan Type: {self.scan_type.upper()}</p>
                    <p>Generated on: {self.timestamp}</p>
                    {"<p>Scan ID: " + self.scan_id + "</p>" if self.scan_id else ""}
                </div>
                
                <div class="card">
                    <div class="card-header">Executive Summary</div>
                    <div class="card-body">
                        <div class="summary-grid">
                            <div class="summary-box">
                                <h3>Hosts Scanned</h3>
                                <p>{stats['total_hosts']}</p>
                            </div>
                            <div class="summary-box">
                                <h3>Open Ports</h3>
                                <p>{stats['open_ports']}</p>
                            </div>
                            <div class="summary-box">
                                <h3>High Risk Findings</h3>
                                <p style="color: var(--high-risk);">{stats['high_risk']}</p>
                            </div>
                            <div class="summary-box">
                                <h3>Medium Risk Findings</h3>
                                <p style="color: var(--medium-risk);">{stats['medium_risk']}</p>
                            </div>
                            <div class="summary-box">
                                <h3>Low Risk Findings</h3>
                                <p style="color: var(--low-risk);">{stats['low_risk']}</p>
                            </div>
                        </div>
                        
                        <p>This report presents a comprehensive security analysis of the network scan performed. 
                        The scan identified a total of {stats['open_ports']} open ports across {stats['total_hosts']} host(s), 
                        with {stats['high_risk']} high risk, {stats['medium_risk']} medium risk, and {stats['low_risk']} low risk findings.</p>
                    </div>
                </div>
        """
        
        # Add charts if available
        if charts:
            html += self._generate_charts_html(charts)
        
        # Add findings table
        html += self._generate_findings_table_html(findings)
        
        # Add security recommendations for high and medium risk findings
        high_medium_findings = [f for f in findings if f['risk_level'] in ['High', 'Medium']]
        if high_medium_findings:
            html += self._generate_recommendations_html(high_medium_findings)
        
        # Close the HTML document
        html += """
                <div class="text-center" style="margin-top: 30px; padding: 20px; color: #666; font-size: 0.9rem;">
                    <p>This report was generated by NScan Security Scanner.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def _generate_os_html(self, results, charts, stats):
        """Generate OS-specific HTML report"""
        # Process OS data
        os_stats = self._process_os_data(results)
        
        # Generate base HTML
        html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>NScan OS Detection Report</title>
            <style>
                /* ... keep existing code (styling CSS) */
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>NScan OS Detection Report</h1>
                    <p>Generated on: {self.timestamp}</p>
                    {"<p>Scan ID: " + self.scan_id + "</p>" if self.scan_id else ""}
                </div>
                
                <div class="card">
                    <div class="card-header">OS Detection Summary</div>
                    <div class="card-body">
                        <div class="summary-grid">
                            <div class="summary-box">
                                <h3>Hosts Scanned</h3>
                                <p>{os_stats['total_hosts']}</p>
                            </div>
                            <div class="summary-box">
                                <h3>OS Detected</h3>
                                <p>{os_stats['detected_os']}</p>
                            </div>
                            <div class="summary-box">
                                <h3>Average Accuracy</h3>
                                <p>{os_stats['os_accuracy']:.1f}%</p>
                            </div>
                        </div>
                        
                        <p>This report presents the results of an OS detection scan. The scan successfully detected operating systems 
                        on {os_stats['detected_os']} out of {os_stats['total_hosts']} hosts with an average detection accuracy of {os_stats['os_accuracy']:.1f}%.</p>
                    </div>
                </div>
        """
        
        # Add OS distribution tables
        html += self._generate_os_distribution_html(os_stats)
        
        # Add detailed OS results per host
        html += self._generate_os_details_html(results)
        
        # Add OS security recommendations
        html += """
                <div class="card">
                    <div class="card-header">OS Security Recommendations</div>
                    <div class="card-body">
                        <p>Based on the detected operating systems, consider implementing the following security recommendations:</p>
                        <ul>
                            <li>Ensure all identified operating systems are up to date with the latest security patches</li>
                            <li>Remove or update any end-of-life operating systems that no longer receive security updates</li>
                            <li>Implement host-based firewalls on all systems</li>
                            <li>Consider network segmentation based on OS types</li>
                            <li>Implement regular vulnerability scanning for all detected operating systems</li>
                            <li>Develop an incident response plan specific to the OS types in your environment</li>
                            <li>Document all identified systems for IT asset management</li>
                        </ul>
                    </div>
                </div>
        """
        
        # Close the HTML document
        html += """
                <div class="text-center" style="margin-top: 30px; padding: 20px; color: #666; font-size: 0.9rem;">
                    <p>This report was generated by NScan Security Scanner.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def _process_os_data(self, results):
        """Process OS detection data for reporting"""
        os_stats = {
            'total_hosts': len(results),
            'detected_os': 0,
            'vendors': {},
            'os_types': {},
            'os_accuracy': 0
        }

        total_accuracy = 0
        os_matches = 0

        for host in results:
            if host.get('os') and host['os'].get('matches') and len(host['os']['matches']) > 0:
                os_stats['detected_os'] += 1
                
                for match in host['os']['matches']:
                    os_matches += 1
                    try:
                        total_accuracy += int(match.get('accuracy', 0))
                    except (ValueError, TypeError):
                        pass
                    
                    os_classes = match.get('osclass', [])
                    if os_classes and not isinstance(os_classes, list):
                        os_classes = [os_classes]
                    
                    for os_class in os_classes:
                        if not isinstance(os_class, dict):
                            continue
                            
                        vendor = os_class.get('vendor', 'Unknown')
                        os_type = os_class.get('type', 'Unknown')
                        
                        os_stats['vendors'][vendor] = os_stats['vendors'].get(vendor, 0) + 1
                        os_stats['os_types'][os_type] = os_stats['os_types'].get(os_type, 0) + 1

        os_stats['os_accuracy'] = total_accuracy / os_matches if os_matches > 0 else 0
        return os_stats
        
    def _generate_charts_html(self, charts):
        """Generate HTML for charts section"""
        html = """
            <div class="card">
                <div class="card-header">Visual Analysis</div>
                <div class="card-body">
                    <div class="charts-grid">
        """
        
        if 'risk_levels' in charts:
            html += f"""
                        <div class="chart-container">
                            <h3>Risk Level Distribution</h3>
                            <img src="data:image/png;base64,{charts['risk_levels']}" alt="Risk levels chart" style="max-width: 100%;">
                        </div>
            """
        
        if 'port_states' in charts:
            html += f"""
                        <div class="chart-container">
                            <h3>Port States Distribution</h3>
                            <img src="data:image/png;base64,{charts['port_states']}" alt="Port states chart" style="max-width: 100%;">
                        </div>
            """
        
        if 'services' in charts:
            html += f"""
                        <div class="chart-container">
                            <h3>Top Services</h3>
                            <img src="data:image/png;base64,{charts['services']}" alt="Services chart" style="max-width: 100%;">
                        </div>
            """
        
        html += """
                    </div>
                </div>
            </div>
        """
        
        return html
    
    def _generate_findings_table_html(self, findings):
        """Generate HTML for findings table"""
        html = """
            <div class="card">
                <div class="card-header">Detailed Findings</div>
                <div class="card-body">
                    <table class="findings-table">
                        <thead>
                            <tr>
                                <th>Host</th>
                                <th>Port/Protocol</th>
                                <th>Service</th>
                                <th>Product & Version</th>
                                <th>Risk Level</th>
                            </tr>
                        </thead>
                        <tbody>
        """
        
        for finding in findings:
            risk_class = f"risk-{finding['risk_level'].lower()}"
            
            version_info = finding['product']
            if finding['version'] != 'Unknown':
                version_info += f" {finding['version']}"
            
            html += f"""
                            <tr>
                                <td>{finding['host']}</td>
                                <td>{finding['port']}/{finding['protocol']}</td>
                                <td>{finding['service']}</td>
                                <td>{version_info if version_info != 'Unknown' else '-'}</td>
                                <td><span class="risk-badge {risk_class}">{finding['risk_level']}</span></td>
                            </tr>
            """
        
        html += """
                        </tbody>
                    </table>
                </div>
            </div>
        """
        
        return html
    
    def _generate_recommendations_html(self, findings):
        """Generate HTML for security recommendations"""
        html = """
            <div class="card">
                <div class="card-header">Security Recommendations</div>
                <div class="card-body">
                    <p>The following recommendations address the high and medium risk findings identified in this scan. Implementing these recommendations will help improve your security posture.</p>
        """
        
        for finding in findings:
            risk_class = f"{finding['risk_level'].lower()}-risk"
            
            html += f"""
                    <div class="finding-detail {risk_class}">
                        <div class="finding-header">
                            <div class="finding-title">{finding['host']} - Port {finding['port']} ({finding['service']})</div>
                            <span class="risk-badge {risk_class.replace('-risk', '')}">{finding['risk_level']}</span>
                        </div>
                        <p><span class="bold">Description:</span> {finding['description']}</p>
                        
                        <div>
                            <span class="bold">Known Risks:</span>
                            <ul>
            """
            
            for risk in finding['risks']:
                html += f"""
                                <li>{risk}</li>
                """
            
            html += """
                            </ul>
                        </div>
                        
                        <div class="recommendations">
                            <h4>Recommendations</h4>
                            <ul>
            """
            
            for rec in finding['recommendations']:
                html += f"""
                                <li>{rec}</li>
                """
            
            html += """
                            </ul>
                        </div>
                    </div>
            """
        
        html += """
                </div>
            </div>
        """
        
        return html
    
    def _generate_os_distribution_html(self, os_stats):
        """Generate HTML for OS distribution tables"""
        html = """
            <div class="card">
                <div class="card-header">OS Distribution</div>
                <div class="card-body">
                    <h3>OS Types</h3>
                    <table class="findings-table">
                        <thead>
                            <tr>
                                <th>OS Type</th>
                                <th>Count</th>
                            </tr>
                        </thead>
                        <tbody>
        """
        
        for os_type, count in os_stats['os_types'].items():
            html += f"""
                            <tr>
                                <td>{os_type}</td>
                                <td>{count}</td>
                            </tr>
            """
        
        html += """
                        </tbody>
                    </table>
                    
                    <h3 style="margin-top: 20px;">OS Vendors</h3>
                    <table class="findings-table">
                        <thead>
                            <tr>
                                <th>Vendor</th>
                                <th>Count</th>
                            </tr>
                        </thead>
                        <tbody>
        """
        
        for vendor, count in os_stats['vendors'].items():
            html += f"""
                            <tr>
                                <td>{vendor}</td>
                                <td>{count}</td>
                            </tr>
            """
        
        html += """
                        </tbody>
                    </table>
                </div>
            </div>
        """
        
        return html
    
    def _generate_os_details_html(self, results):
        """Generate HTML for detailed OS results"""
        html = """
            <div class="card">
                <div class="card-header">Detailed OS Detection Results</div>
                <div class="card-body">
        """
        
        for host in results:
            html += f"""
                    <div class="finding-detail">
                        <div class="finding-header">
                            <div class="finding-title">Host: {host['host']}</div>
                        </div>
            """
            
            if host.get('os') and host['os'].get('matches') and len(host['os']['matches']) > 0:
                for i, match in enumerate(host['os']['matches']):
                    accuracy = match.get('accuracy', 'N/A')
                    name = match.get('name', 'Unknown OS')
                    
                    html += f"""
                        <div style="margin-left: 20px; margin-bottom: 10px;">
                            <p><strong>OS Match {i+1}:</strong> {name} (Accuracy: {accuracy}%)</p>
                    """
                    
                    os_classes = match.get('osclass', [])
                    if os_classes and not isinstance(os_classes, list):
                        os_classes = [os_classes]
                    
                    if os_classes:
                        html += """
                            <div style="margin-left: 20px;">
                        """
                        
                        for os_class in os_classes:
                            if not isinstance(os_class, dict):
                                continue
                                
                            os_type = os_class.get('type', 'Unknown')
                            vendor = os_class.get('vendor', 'Unknown')
                            os_family = os_class.get('osfamily', 'Unknown')
                            os_gen = os_class.get('osgen', 'Unknown')
                            
                            html += f"""
                                <p>Type: {os_type}</p>
                                <p>Vendor: {vendor}</p>
                                <p>Family: {os_family}</p>
                                <p>Generation: {os_gen}</p>
                            """
                        
                        html += """
                            </div>
                        """
                    
                    html += """
                        </div>
                    """
            else:
                html += """
                        <p><em>No OS detection information available for this host</em></p>
                """
            
            html += """
                    </div>
            """
        
        html += """
                </div>
            </div>
        """
        
        return html