// Simple Network Scanner
class NetworkScanner {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.form = document.getElementById('scannerForm');
        this.targetInput = document.getElementById('targetInput');
        this.scanButton = document.getElementById('scanButton');
        this.scanStatus = document.getElementById('scanStatus');
        this.scanProgress = document.getElementById('scanProgress');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsContent = document.getElementById('resultsContent');
        this.clearButton = document.getElementById('clearButton');
        this.exportButton = document.getElementById('exportButton');
        this.toastContainer = document.getElementById('toastContainer');
        this.quickButtons = document.querySelectorAll('.quick-btn');
    }

    attachEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleScan(e));
        this.clearButton.addEventListener('click', () => this.clearResults());
        this.exportButton.addEventListener('click', () => this.exportResults());
        this.targetInput.addEventListener('input', () => this.validateInput());
        
        // Quick target buttons
        this.quickButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.getAttribute('data-target');
                this.targetInput.value = target;
                this.targetInput.focus();
                this.showToast(`Target set: ${target}`, 'info');
            });
        });
    }

    validateInput() {
        const target = this.targetInput.value.trim();
        const isValid = this.isValidTarget(target);
        
        if (target && !isValid) {
            this.targetInput.style.borderColor = '#ef4444';
            this.targetInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
        } else if (target && isValid) {
            this.targetInput.style.borderColor = '#10b981';
            this.targetInput.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
        } else {
            this.targetInput.style.borderColor = '#e5e7eb';
            this.targetInput.style.boxShadow = 'none';
        }
    }

    isValidTarget(target) {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
        
        return ipRegex.test(target) || hostnameRegex.test(target);
    }

    async handleScan(e) {
        e.preventDefault();
        
        const target = this.targetInput.value.trim();
        
        if (!target) {
            this.showError('Please enter a target IP address or hostname');
            return;
        }

        if (!this.isValidTarget(target)) {
            this.showError('Please enter a valid IP address or hostname');
            return;
        }

        this.startScan(target);
    }

    async startScan(target) {
        this.setLoadingState(true);
        this.hideResults();
        this.showScanStatus();
        this.updateScanProgress('Initializing scan...');

        try {
            setTimeout(() => this.updateScanProgress('Pinging target...'), 1000);
            setTimeout(() => this.updateScanProgress('Analyzing network...'), 2000);
            setTimeout(() => this.updateScanProgress('Running port scan...'), 3000);

            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ target })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.updateScanProgress('Scan completed successfully!');
                setTimeout(() => {
                    this.showSuccessResults(data);
                    this.showToast('Scan completed successfully!', 'success');
                }, 1000);
            } else {
                this.updateScanProgress('Target unreachable');
                setTimeout(() => {
                    this.showErrorResults(data);
                    this.showToast('Target is unreachable', 'warning');
                }, 1000);
            }
        } catch (error) {
            console.error('Scan error:', error);
            this.updateScanProgress('Scan failed');
            setTimeout(() => {
                this.showError('Network error: Unable to connect to the server');
                this.showToast('Scan failed - Check your connection', 'error');
            }, 1000);
        } finally {
            this.setLoadingState(false);
            setTimeout(() => this.hideScanStatus(), 2000);
        }
    }

    setLoadingState(loading) {
        this.scanButton.disabled = loading;
        this.targetInput.disabled = loading;
        
        if (loading) {
            this.scanButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Scanning...</span>';
            this.scanButton.classList.add('loading');
        } else {
            this.scanButton.innerHTML = '<i class="fas fa-play"></i><span>Scan</span>';
            this.scanButton.classList.remove('loading');
        }
    }

    showScanStatus() {
        this.scanStatus.style.display = 'block';
    }

    hideScanStatus() {
        this.scanStatus.style.display = 'none';
    }

    updateScanProgress(message) {
        if (this.scanProgress) {
            this.scanProgress.textContent = message;
        }
    }

    showSuccessResults(data) {
        const timestamp = new Date().toLocaleString();
        
        this.resultsContent.innerHTML = `
            <div class="result-item success">
                <h4><i class="fas fa-check-circle"></i> Target Analysis Complete</h4>
                <p><strong>Target:</strong> ${data.target}</p>
                <p><strong>Status:</strong> <span class="success-message">Online and responsive</span></p>
                <p><strong>Scan Time:</strong> ${timestamp}</p>
                ${data.nmap.fallback ? '<p style="color: #f59e0b; font-weight: 600; margin-top: 10px;"><i class="fas fa-info-circle"></i> Using fallback mode - Nmap not installed</p>' : ''}
            </div>
            
            <div class="result-item">
                <h4><i class="fas fa-signal"></i> Connectivity Test</h4>
                <pre>${this.formatOutput(data.ping.output || 'No ping output available')}</pre>
            </div>
            
            <div class="result-item">
                <h4><i class="fas fa-search"></i> Port Scan Results ${data.nmap.fallback ? '<span style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; margin-left: 8px;">FALLBACK</span>' : ''}</h4>
                <pre>${this.formatOutput(data.nmap.output || 'No nmap output available')}</pre>
                ${data.nmap.fallback ? '<p style="color: #6b7280; font-size: 0.9rem; margin-top: 10px; padding: 10px; background: #f9fafb; border-radius: 4px; border-left: 3px solid #f59e0b;"><i class="fas fa-info-circle"></i> Install Nmap for detailed scanning: <a href="https://nmap.org/download.html" style="color: #3b82f6;">Download Nmap</a></p>' : ''}
            </div>
            
            ${data.nmap.error ? `
            <div class="result-item">
                <h4><i class="fas fa-exclamation-triangle"></i> Additional Information</h4>
                <pre>${this.formatOutput(data.nmap.error)}</pre>
            </div>
            ` : ''}
        `;
        
        this.resultsSection.style.display = 'block';
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showErrorResults(data) {
        const timestamp = new Date().toLocaleString();
        
        this.resultsContent.innerHTML = `
            <div class="result-item error">
                <h4><i class="fas fa-times-circle"></i> Target Unreachable</h4>
                <p><strong>Target:</strong> ${data.target}</p>
                <p><strong>Status:</strong> <span class="error-message">Offline or unreachable</span></p>
                <p><strong>Scan Time:</strong> ${timestamp}</p>
            </div>
            
            <div class="result-item">
                <h4><i class="fas fa-exclamation-triangle"></i> Connectivity Test</h4>
                <pre>${this.formatOutput(data.ping.output || 'No ping output available')}</pre>
            </div>
            
            ${data.ping.error ? `
            <div class="result-item">
                <h4><i class="fas fa-bug"></i> Error Details</h4>
                <pre>${this.formatOutput(data.ping.error)}</pre>
            </div>
            ` : ''}
        `;
        
        this.resultsSection.style.display = 'block';
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showError(message) {
        const timestamp = new Date().toLocaleString();
        
        this.resultsContent.innerHTML = `
            <div class="result-item error">
                <h4><i class="fas fa-exclamation-circle"></i> Scan Error</h4>
                <p class="error-message">${message}</p>
                <p><strong>Time:</strong> ${timestamp}</p>
            </div>
        `;
        
        this.resultsSection.style.display = 'block';
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    formatOutput(output) {
        if (!output) return 'No data available';
        
        return output
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim();
    }

    hideResults() {
        this.resultsSection.style.display = 'none';
    }

    clearResults() {
        this.resultsContent.innerHTML = '';
        this.resultsSection.style.display = 'none';
        this.targetInput.value = '';
        this.targetInput.style.borderColor = '#e5e7eb';
        this.targetInput.style.boxShadow = 'none';
        this.showToast('Results cleared', 'info');
    }

    exportResults() {
        const results = this.resultsContent.innerHTML;
        if (!results) {
            this.showToast('No results to export', 'warning');
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `network-scan-results-${timestamp}.html`;
        
        const exportContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Network Scanner - Scan Results</title>
    <style>
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            margin: 20px; 
            background: #f9fafb;
            color: #1f2937;
        }
        .result-item { 
            background: #ffffff; 
            margin: 20px 0; 
            padding: 20px; 
            border-radius: 8px; 
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border-left: 4px solid #3b82f6;
        }
        .result-item.success { border-left-color: #10b981; }
        .result-item.error { border-left-color: #ef4444; }
        pre { 
            background: #1f2937; 
            color: #ffffff; 
            padding: 15px; 
            border-radius: 8px; 
            overflow-x: auto; 
            font-family: 'Monaco', 'Menlo', monospace;
        }
        h4 { color: #1f2937; margin-bottom: 10px; }
        h1 { text-align: center; color: #1f2937; }
    </style>
</head>
<body>
    <h1>Network Scanner - Scan Results</h1>
    <p style="text-align: center; color: #6b7280;">Generated on: ${new Date().toLocaleString()}</p>
    ${results}
</body>
</html>`;

        const blob = new Blob([exportContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Results exported successfully', 'success');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        }[type] || 'fas fa-info-circle';
        
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
        `;
        
        this.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NetworkScanner();
    
    // Add CSS for toast slide out animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes toastSlideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    console.log('Network Scanner initialized successfully!');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.id === 'targetInput') {
        e.preventDefault();
        document.querySelector('.scan-btn').click();
    }
    
    if (e.key === 'Escape') {
        document.getElementById('clearButton').click();
    }
});