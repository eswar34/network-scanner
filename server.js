<<<<<<< HEAD
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Fallback scan function when nmap is not available
function generateFallbackScan(target, pingOutput) {
    const timestamp = new Date().toISOString();
    const commonPorts = [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 3389, 5900];
    
    return `# Basic Network Scan Results (Fallback Mode)
# Target: ${target}
# Scan Time: ${timestamp}
# Note: Nmap not installed - using basic port detection

## Ping Test Results
${pingOutput}

## Basic Port Scan Simulation
# Common ports that might be open:
${commonPorts.map(port => `Port ${port}/tcp - Status: Unknown (requires nmap for accurate detection)`).join('\n')}

## Recommendations
1. Install Nmap for detailed port scanning
2. Use Windows built-in tools for basic network testing
3. Consider using online port scanners for detailed analysis

## Installation Guide for Nmap
1. Download from: https://nmap.org/download.html
2. Or use Windows Package Manager: winget install nmap
3. Or use Chocolatey: choco install nmap

## Alternative Tools
- Windows: netstat -an
- PowerShell: Test-NetConnection -ComputerName ${target} -Port 80
- Online: https://www.yougetsignal.com/tools/open-ports/

# End of Fallback Scan Report`;
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('dist'));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// API endpoint for network scanning
app.post('/api/scan', (req, res) => {
    const { target } = req.body;
    
    if (!target) {
        return res.status(400).json({ error: 'Target is required' });
    }

    // Validate target format (basic validation)
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!ipRegex.test(target) && !hostnameRegex.test(target)) {
        return res.status(400).json({ error: 'Invalid target format' });
    }

    console.log(`Starting scan for target: ${target}`);
    
    // First ping the target (Windows compatible)
    const isWindows = process.platform === 'win32';
    const pingArgs = isWindows ? ['-n', '1', target] : ['-c', '1', '-W', '5', target];
    const pingProcess = spawn('ping', pingArgs);
    
    let pingOutput = '';
    let pingError = '';
    
    pingProcess.stdout.on('data', (data) => {
        pingOutput += data.toString();
    });
    
    pingProcess.stderr.on('data', (data) => {
        pingError += data.toString();
    });
    
    pingProcess.on('close', (code) => {
        if (code === 0) {
            // Target is reachable, try to run nmap
            console.log('Target is reachable, attempting nmap scan...');
            
            // Check if nmap is available
            const nmapProcess = spawn('nmap', ['-sV', '-sC', target], { stdio: 'pipe' });
            
            let nmapOutput = '';
            let nmapError = '';
            let responseSent = false;
            
            nmapProcess.stdout.on('data', (data) => {
                nmapOutput += data.toString();
            });
            
            nmapProcess.stderr.on('data', (data) => {
                nmapError += data.toString();
            });
            
            nmapProcess.on('error', (error) => {
                console.log('Nmap not found, using fallback scan...');
                // Nmap not available, use fallback
                if (!responseSent && !res.headersSent) {
                    responseSent = true;
                    const fallbackOutput = generateFallbackScan(target, pingOutput);
                    res.json({
                        success: true,
                        target: target,
                        ping: {
                            reachable: true,
                            output: pingOutput
                        },
                        nmap: {
                            output: fallbackOutput,
                            error: 'Nmap not installed - using basic port scan fallback',
                            exitCode: 0,
                            fallback: true
                        }
                    });
                }
            });
            
            nmapProcess.on('close', (nmapCode) => {
                if (!responseSent && !res.headersSent) {
                    responseSent = true;
                    if (nmapCode === 0) {
                        res.json({
                            success: true,
                            target: target,
                            ping: {
                                reachable: true,
                                output: pingOutput
                            },
                            nmap: {
                                output: nmapOutput,
                                error: nmapError,
                                exitCode: nmapCode,
                                fallback: false
                            }
                        });
                    } else {
                        // Nmap failed, use fallback
                        const fallbackOutput = generateFallbackScan(target, pingOutput);
                        res.json({
                            success: true,
                            target: target,
                            ping: {
                                reachable: true,
                                output: pingOutput
                            },
                            nmap: {
                                output: fallbackOutput,
                                error: 'Nmap scan failed - using basic port scan fallback',
                                exitCode: nmapCode,
                                fallback: true
                            }
                        });
                    }
                }
            });
        } else {
            // Target is not reachable
            console.log('Target is not reachable');
            if (!res.headersSent) {
                res.json({
                    success: false,
                    target: target,
                    ping: {
                        reachable: false,
                        output: pingOutput,
                        error: pingError
                    },
                    error: 'Target is unreachable or dead'
                });
            }
        }
    });
    
    // Set timeout for the entire operation
    setTimeout(() => {
        pingProcess.kill();
        if (!res.headersSent) {
            res.status(408).json({ error: 'Scan timeout' });
        }
    }, 30000); // 30 second timeout
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Network Scanner Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to use the application`);
});
=======
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Fallback scan function when nmap is not available
function generateFallbackScan(target, pingOutput) {
    const timestamp = new Date().toISOString();
    const commonPorts = [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 3389, 5900];
    
    return `# Basic Network Scan Results (Fallback Mode)
# Target: ${target}
# Scan Time: ${timestamp}
# Note: Nmap not installed - using basic port detection

## Ping Test Results
${pingOutput}

## Basic Port Scan Simulation
# Common ports that might be open:
${commonPorts.map(port => `Port ${port}/tcp - Status: Unknown (requires nmap for accurate detection)`).join('\n')}

## Recommendations
1. Install Nmap for detailed port scanning
2. Use Windows built-in tools for basic network testing
3. Consider using online port scanners for detailed analysis

## Installation Guide for Nmap
1. Download from: https://nmap.org/download.html
2. Or use Windows Package Manager: winget install nmap
3. Or use Chocolatey: choco install nmap

## Alternative Tools
- Windows: netstat -an
- PowerShell: Test-NetConnection -ComputerName ${target} -Port 80
- Online: https://www.yougetsignal.com/tools/open-ports/

# End of Fallback Scan Report`;
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('dist'));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// API endpoint for network scanning
app.post('/api/scan', (req, res) => {
    const { target } = req.body;
    
    if (!target) {
        return res.status(400).json({ error: 'Target is required' });
    }

    // Validate target format (basic validation)
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!ipRegex.test(target) && !hostnameRegex.test(target)) {
        return res.status(400).json({ error: 'Invalid target format' });
    }

    console.log(`Starting scan for target: ${target}`);
    
    // First ping the target (Windows compatible)
    const isWindows = process.platform === 'win32';
    const pingArgs = isWindows ? ['-n', '1', target] : ['-c', '1', '-W', '5', target];
    const pingProcess = spawn('ping', pingArgs);
    
    let pingOutput = '';
    let pingError = '';
    
    pingProcess.stdout.on('data', (data) => {
        pingOutput += data.toString();
    });
    
    pingProcess.stderr.on('data', (data) => {
        pingError += data.toString();
    });
    
    pingProcess.on('close', (code) => {
        if (code === 0) {
            // Target is reachable, try to run nmap
            console.log('Target is reachable, attempting nmap scan...');
            
            // Check if nmap is available
            const nmapProcess = spawn('nmap', ['-sV', '-sC', target], { stdio: 'pipe' });
            
            let nmapOutput = '';
            let nmapError = '';
            let responseSent = false;
            
            nmapProcess.stdout.on('data', (data) => {
                nmapOutput += data.toString();
            });
            
            nmapProcess.stderr.on('data', (data) => {
                nmapError += data.toString();
            });
            
            nmapProcess.on('error', (error) => {
                console.log('Nmap not found, using fallback scan...');
                // Nmap not available, use fallback
                if (!responseSent && !res.headersSent) {
                    responseSent = true;
                    const fallbackOutput = generateFallbackScan(target, pingOutput);
                    res.json({
                        success: true,
                        target: target,
                        ping: {
                            reachable: true,
                            output: pingOutput
                        },
                        nmap: {
                            output: fallbackOutput,
                            error: 'Nmap not installed - using basic port scan fallback',
                            exitCode: 0,
                            fallback: true
                        }
                    });
                }
            });
            
            nmapProcess.on('close', (nmapCode) => {
                if (!responseSent && !res.headersSent) {
                    responseSent = true;
                    if (nmapCode === 0) {
                        res.json({
                            success: true,
                            target: target,
                            ping: {
                                reachable: true,
                                output: pingOutput
                            },
                            nmap: {
                                output: nmapOutput,
                                error: nmapError,
                                exitCode: nmapCode,
                                fallback: false
                            }
                        });
                    } else {
                        // Nmap failed, use fallback
                        const fallbackOutput = generateFallbackScan(target, pingOutput);
                        res.json({
                            success: true,
                            target: target,
                            ping: {
                                reachable: true,
                                output: pingOutput
                            },
                            nmap: {
                                output: fallbackOutput,
                                error: 'Nmap scan failed - using basic port scan fallback',
                                exitCode: nmapCode,
                                fallback: true
                            }
                        });
                    }
                }
            });
        } else {
            // Target is not reachable
            console.log('Target is not reachable');
            if (!res.headersSent) {
                res.json({
                    success: false,
                    target: target,
                    ping: {
                        reachable: false,
                        output: pingOutput,
                        error: pingError
                    },
                    error: 'Target is unreachable or dead'
                });
            }
        }
    });
    
    // Set timeout for the entire operation
    setTimeout(() => {
        pingProcess.kill();
        if (!res.headersSent) {
            res.status(408).json({ error: 'Scan timeout' });
        }
    }, 30000); // 30 second timeout
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Network Scanner Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to use the application`);
});
>>>>>>> ac28e9e08c815b23d300642bd4806434f413590a
