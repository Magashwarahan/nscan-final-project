from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import nmap
import datetime
import uuid
from report_generator import ReportGenerator
import io
import traceback
from flask import Response
import json

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"]
    }
})

def parse_nmap_output(nm, scan_type):
    """Parse nmap output based on scan type"""
    results = []
    
    try:
        for host in nm.all_hosts():
            host_info = {
                'host': host,
                'hostname': nm[host].hostname() if 'hostname' in nm[host] else '',
                'state': nm[host].state(),
                'protocols': {}
            }
            
            # Add protocol specific information
            for proto in nm[host].all_protocols():
                ports = nm[host][proto].keys()
                proto_info = []
                
                for port in ports:
                    service = nm[host][proto][port]
                    port_info = {
                        'port': port,
                        'state': service['state'],
                        'service': service['name'],
                        'version': service.get('version', ''),
                        'product': service.get('product', ''),
                        'extrainfo': service.get('extrainfo', ''),
                        'cpe': service.get('cpe', []),
                    }
                    proto_info.append(port_info)
                
                host_info['protocols'][proto] = proto_info

            # Add OS detection results if available
            if 'osmatch' in nm[host]:
                host_info['os'] = {
                    'matches': nm[host]['osmatch'],
                    'accuracy': nm[host].get('osclass', {}).get('accuracy', 'N/A')
                }
            
            # Add script results if available
            if 'script' in nm[host]:
                host_info['scripts'] = nm[host]['script']
                
                # For script scans, collect script results in a more structured format
                if scan_type == 'script':
                    script_results = []
                    for script_name, output in nm[host]['script'].items():
                        script_results.append({
                            'name': script_name,
                            'output': output
                        })
                    host_info['scriptResults'] = script_results
                
            results.append(host_info)
    except Exception as e:
        print(f"Error parsing nmap output: {str(e)}")
        print(traceback.format_exc())
        raise
    
    return results

@app.route('/api/scan', methods=['POST', 'OPTIONS'])
def scan():
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    
    try:
        data = request.json
        if not data:
            return jsonify({
                'status': 'error',
                'output': 'No data provided',
                'timestamp': datetime.datetime.now().isoformat()
            }), 400
            
        target = data.get('target')
        scan_type = data.get('scanType')
        custom_attributes = data.get('customAttributes')
        
        if not target or not scan_type:
            return jsonify({
                'status': 'error',
                'output': 'Target and scan type are required',
                'timestamp': datetime.datetime.now().isoformat()
            }), 400
        
        nm = nmap.PortScanner()
        
        # Define scan configurations for different scan types
        scan_configs = {
            'quick': '-sV -F -T4 --version-intensity 5',
            'full': '-sS -sV -O -p- -T4 --version-intensity 7',
            'stealth': '-sS -Pn -T2 --version-intensity 0',
            'vuln': '-sV -sC --script vuln -T4',
            'service': '-sV -A --version-all',
            'os': '-O -sV --osscan-guess --fuzzy',
            'udp': '-sU -sV --version-intensity 5',
            'script': '-sC -sV --script default,safe',  # Default script scan configuration
            'custom': custom_attributes if custom_attributes else '-A -T4 -v'
        }
        
        # Handle specialized NSE script scans
        if scan_type == 'script' and custom_attributes:
            # For script scans with specific script selections
            if custom_attributes == '--script default,safe':
                arguments = '-sC -sV ' + custom_attributes  # Default script behavior
            else:
                # Handle specific script definitions
                arguments = '-sV ' + custom_attributes  # Base arguments + script name
        else:
            # Use predefined configurations for other scan types
            arguments = scan_configs.get(scan_type, '-sV')
        
        print(f"Starting {scan_type} scan on target: {target} with arguments: {arguments}")
        scan_result = nm.scan(hosts=target, arguments=arguments)
        
        # Parse the results based on scan type
        parsed_results = parse_nmap_output(nm, scan_type)
        
        print(f"Scan completed successfully for {target}")
        
        response = {
            'status': 'success',
            'output': parsed_results,
            'raw': nm.csv(),
            'timestamp': datetime.datetime.now().isoformat()
        }
        
        return _corsify_actual_response(jsonify(response))
    
    except Exception as e:
        error_message = str(e)
        print(f"Scan error for {target if 'target' in locals() else 'unknown target'}: {error_message}")
        print(traceback.format_exc())
        return _corsify_actual_response(jsonify({
            'status': 'error',
            'output': error_message,
            'timestamp': datetime.datetime.now().isoformat()
        })), 500

@app.route('/api/generate-report', methods=['POST', 'OPTIONS'])
def generate_report():
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
        
    try:
        data = request.json
        if not data:
            return _corsify_actual_response(jsonify({
                'status': 'error',
                'message': 'No data provided'
            })), 400
            
        scan_result = data.get('scanResult')
        scan_type = data.get('scanType')
        format_type = data.get('formatType')
        timestamp = data.get('timestamp', datetime.datetime.now().isoformat())
        scan_id = data.get('scanId', str(uuid.uuid4()))  # Use provided scan_id or generate one
        
        if not all([scan_result, scan_type, format_type]):
            missing = []
            if not scan_result: missing.append('scanResult')
            if not scan_type: missing.append('scanType')
            if not format_type: missing.append('formatType')
            
            return _corsify_actual_response(jsonify({
                'status': 'error',
                'message': f'Missing required parameters: {", ".join(missing)}'
            })), 400
        
        print(f"Generating {format_type} report for {scan_type} scan with ID: {scan_id}")
        
        # Convert string to dict if needed
        if isinstance(scan_result, str):
            try:
                scan_result = json.loads(scan_result)
            except json.JSONDecodeError:
                print("Warning: Could not decode scan_result JSON string, using as is")
        
        generator = ReportGenerator(scan_result, scan_type, timestamp, scan_id)
        
        try:
            if format_type == 'pdf':
                pdf_bytes = generator.generate_pdf()
                
                # Ensure we have a BytesIO object
                if isinstance(pdf_bytes, bytes):
                    pdf_bytes = io.BytesIO(pdf_bytes)
                
                # Reset the file position to the beginning
                pdf_bytes.seek(0)
                
                response = send_file(
                    pdf_bytes,
                    mimetype='application/pdf',
                    as_attachment=True,
                    download_name=f'nscan_report_{scan_type}_{scan_id[:8]}.pdf'
                )
                return _corsify_actual_response(response)
            
            elif format_type == 'csv':
                csv_data = generator.generate_csv()
                
                # Ensure proper encoding for text data
                if isinstance(csv_data, str):
                    csv_data = csv_data.encode('utf-8')
                
                # Create a BytesIO object if needed
                if isinstance(csv_data, bytes):
                    csv_io = io.BytesIO(csv_data)
                    csv_io.seek(0)
                else:
                    csv_io = csv_data
                    csv_io.seek(0)
                
                response = send_file(
                    csv_io,
                    mimetype='text/csv',
                    as_attachment=True,
                    download_name=f'nscan_report_{scan_type}_{scan_id[:8]}.csv'
                )
                return _corsify_actual_response(response)
            
            elif format_type == 'html':
                html_data = generator.generate_html()
                
                # Ensure proper encoding for text data
                if isinstance(html_data, str):
                    html_data = html_data.encode('utf-8')
                
                # Create a BytesIO object if needed
                if isinstance(html_data, bytes):
                    html_io = io.BytesIO(html_data)
                    html_io.seek(0)
                else:
                    html_io = html_data
                    html_io.seek(0)
                
                response = send_file(
                    html_io,
                    mimetype='text/html',
                    as_attachment=True,
                    download_name=f'nscan_report_{scan_type}_{scan_id[:8]}.html'
                )
                return _corsify_actual_response(response)
            
            else:
                return _corsify_actual_response(jsonify({
                    'status': 'error',
                    'message': f'Unsupported format type: {format_type}'
                })), 400
                
        except Exception as e:
            print(f"Error generating report: {str(e)}")
            print(traceback.format_exc())
            return _corsify_actual_response(jsonify({
                'status': 'error',
                'message': f'Failed to generate {format_type} report: {str(e)}'
            })), 500
    
    except Exception as e:
        print(f"Unexpected error in generate_report: {str(e)}")
        print(traceback.format_exc())
        return _corsify_actual_response(jsonify({
            'status': 'error',
            'message': f'Unexpected error: {str(e)}'
        })), 500

def _build_cors_preflight_response():
    response = jsonify({})
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With,Accept,Origin")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS")
    return response

def _corsify_actual_response(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
