// Popup UI Management
class PopupUI {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.checkPermissions(); // Check permissions on startup
    }

    initializeElements() {
        // Main save button (consolidated)
        this.mainSaveButton = document.getElementById('mainSaveButton');
        this.clearStorageButton = document.getElementById('clearStorageButton');
        
        // Settings elements
        this.settingsButton = document.getElementById('settingsButton');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.fileLocationInput = document.getElementById('fileLocation');
        this.selectDirectoryButton = document.getElementById('selectDirectory');
        
        // Status and loading
        this.statusMessage = document.getElementById('statusMessage');
        this.loading = document.getElementById('loading');
        this.progressText = document.getElementById('progressText');
        this.progressSteps = document.getElementById('progressSteps');
    }

    bindEvents() {
        if (this.mainSaveButton) this.mainSaveButton.addEventListener('click', () => this.handleMainSaveClick());
        if (this.settingsButton) this.settingsButton.addEventListener('click', () => this.toggleSettings());
        if (this.selectDirectoryButton) this.selectDirectoryButton.addEventListener('click', () => this.handleSelectDirectory());
        if (this.clearStorageButton) this.clearStorageButton.addEventListener('click', () => this.handleClearStorage());
    }

    async handleMainSaveClick() {
        try {
            // Check permissions first
            const hasPermissions = await this.checkPermissions();
            if (!hasPermissions) {
                this.showStatus('⚠️ Some permissions are missing. The extension may not work properly. Please check Chrome extension settings.', 'warning');
                // Continue anyway but warn the user
            }

            // Get current tab
            let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                this.showStatus('❌ Could not access current tab. Please refresh the page and try again.', 'error');
                return;
            }

            console.log('Current tab URL:', tab.url);
            console.log('Is job site check:', this.isJobSite(tab.url));

            // Check if current page is a supported job site
            if (!this.isJobSite(tab.url)) {
                this.showStatus('❌ Please navigate to a job posting page (LinkedIn, Indeed, or company career page)', 'error');
                return;
            }

            // Handle LinkedIn collections URLs by redirecting to the actual job posting
            if (tab.url.includes('linkedin.com/jobs/collections/') && tab.url.includes('currentJobId=')) {
                this.showStatus('🔄 Redirecting to job posting...', 'info');
                const redirected = await this.handleLinkedInCollectionsURL(tab);
                if (redirected) {
                    // Get the updated tab after redirect
                    const [updatedTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (updatedTab) {
                        tab = updatedTab;
                        console.log('Updated tab URL after redirect:', tab.url);
                    }
                }
            }

            // Check if user is actually on a job posting page (not a login page)
            const isActualJobPosting = await this.isActualJobPosting();
            if (!isActualJobPosting) {
                if (tab.url.includes('linkedin.com')) {
                    this.showStatus('❌ Please sign in to LinkedIn to view this job posting. The extension cannot extract job data from the login page.', 'error');
                } else {
                    this.showStatus('❌ Please navigate to an actual job posting page. This appears to be a login or error page.', 'error');
                }
                return;
            }

            // Show loading state
            this.showLoading(true);
            this.clearProgressSteps();
            
            // Initialize progress tracking for comprehensive save operation
            const totalSteps = 6;
            let currentStep = 0;

            // Step 1: Validating current page
            currentStep++;
            this.addProgressStep(currentStep, 'Validating current page');
            this.updateProgress(currentStep, totalSteps, 'Validating current page');
            this.updateProgressStep(currentStep, 'current');
            
            // Step 2: Extracting job data
            currentStep++;
            this.addProgressStep(currentStep, 'Extracting job data');
            this.updateProgress(currentStep, totalSteps, 'Extracting job data');
            this.updateProgressStep(currentStep, 'current');

            // Inject content scripts before sending message
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['extractors.js', 'content.js']
                });
            } catch (scriptError) {
                console.error('Error injecting scripts:', scriptError);
                this.updateProgressStep(currentStep, 'error');
                this.showStatus('❌ Failed to inject content scripts. Please refresh the page and try again.', 'error');
                this.showLoading(false);
                return;
            }

            // Send message to content script
            let response;
            try {
                response = await chrome.tabs.sendMessage(tab.id, { action: 'extractJobData' });
            } catch (messageError) {
                console.error('Error sending message:', messageError);
                this.updateProgressStep(currentStep, 'error');
                
                if (messageError.message.includes('Receiving end does not exist')) {
                    this.showStatus('❌ Could not establish connection. Please refresh the page and try again.', 'error');
                } else {
                    this.showStatus('❌ Communication error: ' + messageError.message, 'error');
                }
                this.showLoading(false);
                return;
            }

            if (!response || !response.success) {
                this.updateProgressStep(currentStep, 'error');
                const errorMsg = response?.error || 'Failed to extract job data';
                
                // Provide more specific error messages
                if (errorMsg.includes('recruiter') || errorMsg.includes('hiring team')) {
                    this.showStatus('❌ Could not find recruiter information. This might be because you need to sign in to LinkedIn or the job posting format has changed.', 'error');
                } else if (errorMsg.includes('company') || errorMsg.includes('job title')) {
                    this.showStatus('❌ Could not extract job details. Please make sure you are on a complete job posting page and try again.', 'error');
                } else {
                    this.showStatus('❌ ' + errorMsg, 'error');
                }
                this.showLoading(false);
                return;
            }

            this.updateProgressStep(currentStep, 'completed');

            // Step 3: Saving to storage
            currentStep++;
            this.addProgressStep(currentStep, 'Saving to storage');
            this.updateProgress(currentStep, totalSteps, 'Saving to storage');
            this.updateProgressStep(currentStep, 'current');

            const jobData = response.data;
            
            const fileStorage = new FileStorageService();
            
            // Save the file location to storage before saving job data
            await fileStorage.saveFileLocation(this.fileLocationInput.value.trim());
            
            const saveResult = await fileStorage.saveJobData(jobData);

            if (!saveResult.success) {
                if (saveResult.isDuplicate) {
                    // Show duplicate warning and ask user if they want to overwrite
                    const shouldOverwrite = await this.showDuplicateWarning(jobData, saveResult.existingEntry);
                    
                    if (shouldOverwrite) {
                        const overwriteResult = await fileStorage.overwriteJobData(jobData);
                        
                        if (!overwriteResult.success) {
                            this.updateProgressStep(currentStep, 'error');
                            this.showStatus('❌ Failed to overwrite job data: ' + overwriteResult.errors.join(', '), 'error');
                            this.showLoading(false);
                            return;
                        }
                        
                        this.updateProgressStep(currentStep, 'completed');
                        this.showStatus('✅ Job data updated successfully!', 'success');
                        
                        // Automatically refresh the jobs table page if it's open
                        this.refreshJobsTableIfOpen();
                    } else {
                        // User cancelled
                        this.updateProgressStep(currentStep, 'error');
                        this.showStatus('❌ Operation cancelled by user.', 'error');
                        this.showLoading(false);
                        return;
                    }
                } else {
                    // Other error
                    this.updateProgressStep(currentStep, 'error');
                    this.showStatus('❌ Failed to save job data: ' + saveResult.errors.join(', '), 'error');
                    this.showLoading(false);
                    return;
                }
            } else {
                this.updateProgressStep(currentStep, 'completed');
                this.showStatus('✅ Job data saved successfully!', 'success');
            }

            // Step 4: Downloading CSV file
            currentStep++;
            this.addProgressStep(currentStep, 'Downloading CSV file');
            this.updateProgress(currentStep, totalSteps, 'Downloading CSV file');
            this.updateProgressStep(currentStep, 'current');

            try {
                const downloadResult = await fileStorage.exportToPreferredLocation();
                if (downloadResult.success) {
                    this.updateProgressStep(currentStep, 'completed');
                } else {
                    this.updateProgressStep(currentStep, 'error');
                    console.warn('CSV download failed:', downloadResult.errors);
                }
            } catch (downloadError) {
                this.updateProgressStep(currentStep, 'error');
                console.error('Error downloading CSV:', downloadError);
            }

            // Step 5: Opening jobs table
            currentStep++;
            this.addProgressStep(currentStep, 'Opening jobs table');
            this.updateProgress(currentStep, totalSteps, 'Opening jobs table');
            this.updateProgressStep(currentStep, 'current');

            try {
                await chrome.tabs.create({
                    url: chrome.runtime.getURL('jobs-table.html')
                });
                this.updateProgressStep(currentStep, 'completed');
            } catch (tableError) {
                this.updateProgressStep(currentStep, 'error');
                console.error('Error opening jobs table:', tableError);
            }

            // Step 6: Finalizing
            currentStep++;
            this.addProgressStep(currentStep, 'Finalizing');
            this.updateProgress(currentStep, totalSteps, 'Finalizing');
            this.updateProgressStep(currentStep, 'completed');

            // Show final success message
            this.showStatus('✅ Everything saved successfully! Job data saved, CSV downloaded, and jobs table opened.', 'success');
            
            // Hide loading after a short delay
            setTimeout(() => {
                this.showLoading(false);
            }, 2000);

        } catch (error) {
            console.error('Error in main save operation:', error);
            this.showStatus('❌ An unexpected error occurred: ' + error.message, 'error');
            this.showLoading(false);
        }
    }

    toggleSettings() {
        if (this.settingsPanel && this.settingsButton) {
            const isVisible = this.settingsPanel.style.display === 'block';
            this.settingsPanel.style.display = isVisible ? 'none' : 'block';
            this.settingsButton.textContent = isVisible ? '⚙️ Settings' : '✕ Close';
        }
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['fileLocation']);
            if (result.fileLocation) {
                this.fileLocationInput.value = result.fileLocation;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    isJobSite(url) {
        if (!url) return false;
        
        console.log('Checking if URL is job site:', url);
        
        // Check for LinkedIn job postings - multiple patterns
        if (url.includes('linkedin.com/jobs')) {
            console.log('URL contains linkedin.com/jobs');
            
            // Allow any LinkedIn jobs URL that has a specific job ID
            if (url.includes('currentJobId=') || url.includes('/jobs/view/')) {
                console.log('URL contains currentJobId= or /jobs/view/ - returning true');
                return true;
            }
            // Also allow collections pages that might have job details
            if (url.includes('/jobs/collections/')) {
                console.log('URL contains /jobs/collections/ - returning true');
                return true;
            }
            
            console.log('LinkedIn URL but no matching patterns found');
        }
        
        // Check for Indeed job postings - expanded patterns
        if (url.includes('indeed.com')) {
            console.log('Indeed URL found');
            
            // Check for various Indeed job posting patterns
            if (url.includes('indeed.com/viewjob') || 
                url.includes('indeed.com/job/') ||
                url.includes('indeed.com/?vjk=') ||  // vjk parameter indicates job ID
                url.includes('indeed.com/viewjob?') ||
                url.includes('indeed.com/jobs/') ||
                (url.includes('indeed.com') && (url.includes('vjk=') || url.includes('jk=')))) {
                console.log('Indeed job URL pattern found - returning true');
                return true;
            }
            
            console.log('Indeed URL but no job posting patterns found');
        }
        
        // Check for other job sites
        const jobSites = [
            'glassdoor.com',
            'monster.com',
            'careerbuilder.com',
            'ziprecruiter.com',
            'simplyhired.com',
            'dice.com'
        ];
        
        const otherJobSite = jobSites.some(site => url.includes(site));
        if (otherJobSite) {
            console.log('Other job site found - returning true');
            return true;
        }
        
        console.log('No job site patterns matched - returning false');
        return false;
    }

    // Handle LinkedIn collections URLs by redirecting to the actual job posting
    async handleLinkedInCollectionsURL(tab) {
        if (tab.url.includes('linkedin.com/jobs/collections/') && tab.url.includes('currentJobId=')) {
            console.log('Detected LinkedIn collections URL with job ID, attempting to redirect...');
            
            try {
                // Extract the job ID from the URL
                const urlParams = new URLSearchParams(tab.url.split('?')[1]);
                const jobId = urlParams.get('currentJobId');
                
                if (jobId) {
                    console.log('Extracted job ID:', jobId);
                    
                    // Construct the direct job posting URL
                    const directJobUrl = `https://www.linkedin.com/jobs/view/${jobId}`;
                    console.log('Redirecting to:', directJobUrl);
                    
                    // Update the tab to the direct job URL
                    await chrome.tabs.update(tab.id, { url: directJobUrl });
                    
                    // Wait a moment for the page to load
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    return true;
                }
            } catch (error) {
                console.error('Error handling LinkedIn collections URL:', error);
            }
        }
        
        return false;
    }

    // Check if the current page is actually a job posting (not a login page)
    async isActualJobPosting() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) return false;

            // Check if we're on a LinkedIn login page
            if (tab.url.includes('linkedin.com') && (
                tab.url.includes('/login') || 
                tab.url.includes('/signin') ||
                document.title.toLowerCase().includes('sign in') ||
                document.title.toLowerCase().includes('log in')
            )) {
                return false;
            }

            // Check if we're on a job posting page by looking for job-related content
            const jobIndicators = [
                'job-title',
                'job-description',
                'hiring-team',
                'job-details',
                'company-name',
                'job-role'
            ];

            // Send message to content script to check for job indicators
            try {
                const response = await chrome.tabs.sendMessage(tab.id, { 
                    action: 'checkJobIndicators',
                    indicators: jobIndicators 
                });
                return response && response.hasJobContent;
            } catch (error) {
                console.log('Could not check job indicators via content script:', error);
                // Fallback: assume it's a job posting if URL matches job site patterns
                return this.isJobSite(tab.url);
            }
        } catch (error) {
            console.error('Error checking if page is actual job posting:', error);
            return false;
        }
    }

    showLoading(show) {
        if (this.loading) {
            this.loading.style.display = show ? 'block' : 'none';
        }
        // Disable/enable buttons during loading
        if (this.mainSaveButton) this.mainSaveButton.disabled = show;
        // The download and show jobs buttons are removed, so no need to disable them here.
    }

    showStatus(message, type = 'info') {
        if (this.statusMessage) {
            this.statusMessage.textContent = message;
            this.statusMessage.className = `status-message ${type}`;
            this.statusMessage.style.display = 'block';
            
            // Auto-hide success messages after 3 seconds
            if (type === 'success') {
                setTimeout(() => {
                    if (this.statusMessage) {
                        this.statusMessage.style.display = 'none';
                    }
                }, 3000);
            }
        }
    }

    showDuplicateWarning(jobData, existingEntry) {
        return new Promise((resolve) => {
            // Create warning dialog
            const dialog = document.createElement('div');
            dialog.className = 'duplicate-warning-dialog';
            dialog.innerHTML = `
                <div class="warning-content">
                    <div class="warning-header">
                        <span class="warning-icon">⚠️</span>
                        <span class="warning-title">Duplicate Job Found</span>
                    </div>
                    <div class="warning-message">
                        This job has already been saved:
                        <br>URL: ${existingEntry.url}
                        <br>Saved on: ${new Date(existingEntry.extractedAt).toLocaleString()}
                        <br><br>Do you want to overwrite the existing entry with the new data?
                    </div>
                    <div class="warning-buttons">
                        <button class="warning-btn warning-btn-cancel">Cancel</button>
                        <button class="warning-btn warning-btn-overwrite">Overwrite</button>
                    </div>
                </div>
            `;

            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .duplicate-warning-dialog {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .warning-content {
                    background: white;
                    border: 2px solid #ffc107;
                    border-radius: 8px;
                    padding: 20px;
                    max-width: 400px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }
                .warning-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 15px;
                    color: #856404;
                    font-weight: bold;
                }
                .warning-icon {
                    font-size: 20px;
                    margin-right: 10px;
                }
                .warning-title {
                    font-size: 16px;
                }
                .warning-message {
                    margin-bottom: 20px;
                    line-height: 1.4;
                    color: #333;
                }
                .warning-buttons {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }
                .warning-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }
                .warning-btn-cancel {
                    background: #6c757d;
                    color: white;
                }
                .warning-btn-overwrite {
                    background: #ffc107;
                    color: #212529;
                }
                .warning-btn:hover {
                    opacity: 0.8;
                }
            `;
            document.head.appendChild(style);

            // Add event listeners
            dialog.querySelector('.warning-btn-cancel').addEventListener('click', () => {
                document.body.removeChild(dialog);
                document.head.removeChild(style);
                resolve(false);
            });

            dialog.querySelector('.warning-btn-overwrite').addEventListener('click', () => {
                document.body.removeChild(dialog);
                document.head.removeChild(style);
                resolve(true);
            });

            // Add to DOM
            document.body.appendChild(dialog);
        });
    }

    // Progress tracking methods
    updateProgress(currentStep, totalSteps, stepDescription) {
        this.progressText.textContent = `${stepDescription} (${currentStep}/${totalSteps})`;
    }

    addProgressStep(stepNumber, description, status = 'pending') {
        const stepElement = document.createElement('div');
        stepElement.className = `progress-step ${status}`;
        stepElement.id = `step-${stepNumber}`;
        
        let icon = '⏳';
        if (status === 'completed') icon = '✅';
        else if (status === 'current') icon = '🔄';
        else if (status === 'error') icon = '❌';
        
        stepElement.innerHTML = `
            <span class="step-icon">${icon}</span>
            <span>${stepNumber}. ${description}</span>
        `;
        
        this.progressSteps.appendChild(stepElement);
    }

    updateProgressStep(stepNumber, status) {
        const stepElement = document.getElementById(`step-${stepNumber}`);
        if (stepElement) {
            stepElement.className = `progress-step ${status}`;
            
            let icon = '⏳';
            if (status === 'completed') icon = '✅';
            else if (status === 'current') icon = '🔄';
            else if (status === 'error') icon = '❌';
            
            stepElement.querySelector('.step-icon').textContent = icon;
        }
    }

    clearProgressSteps() {
        this.progressSteps.innerHTML = '';
    }

    async handleSelectDirectory() {
        try {
            this.directoryStatus.textContent = '🔄 Selecting directory...';
            this.directoryStatus.style.color = '#007bff';
            
            const fileStorage = new FileStorageService();
            const result = await fileStorage.selectDirectory();
            
            if (result.success) {
                this.directoryStatus.textContent = `✅ Directory selected: ${result.directoryName}`;
                this.directoryStatus.style.color = '#28a745';
                this.showStatus('Directory selected successfully! Files will be saved directly to this location.', 'success');
            } else {
                this.directoryStatus.textContent = `❌ ${result.errors.join(', ')}`;
                this.directoryStatus.style.color = '#dc3545';
                
                // Enhanced error messaging with specific guidance
                const errorMessage = result.errors.join(', ');
                this.showStatus('Failed to select directory: ' + errorMessage, 'error');
                
                // Provide specific guidance based on error type
                if (errorMessage.includes('Chrome extensions have limited access')) {
                    this.showStatus('💡 Tip: Chrome extensions cannot directly access local directories. Use the "File Save Location" text field above to specify your save path (e.g., C:\\JobSearch\\)', 'info');
                } else if (errorMessage.includes('Permission denied')) {
                    this.showStatus('💡 Tip: Permission denied. Please check Chrome extension permissions or use the text field above.', 'info');
                } else if (errorMessage.includes('Security restriction')) {
                    this.showStatus('💡 Tip: Security restriction prevents direct directory access. Use the text field above to specify your save path.', 'info');
                } else if (errorMessage.includes('text field')) {
                    this.showStatus('💡 Tip: Please use the "File Save Location" text field above to specify your save path (e.g., C:\\JobSearch\\)', 'info');
                }
            }
        } catch (error) {
            console.error('Error selecting directory:', error);
            this.directoryStatus.textContent = '❌ Error selecting directory';
            this.directoryStatus.style.color = '#dc3545';
            
            // Enhanced error handling with specific guidance
            if (error.message.includes('permission') || error.message.includes('denied')) {
                this.showStatus('❌ Permission denied. Chrome extensions have limited file system access. Please use the text field above.', 'error');
            } else if (error.message.includes('security') || error.message.includes('restriction')) {
                this.showStatus('❌ Security restriction. Cannot access local directories directly. Please use the text field above.', 'error');
            } else {
                this.showStatus('❌ Error selecting directory: ' + error.message + '. Please use the text field above instead.', 'error');
            }
        }
    }

    // Handle clear storage button click
    async handleClearStorage() {
        try {
            // Show custom confirmation dialog
            const confirmed = await this.showClearStorageWarning();
            
            if (!confirmed) {
                return;
            }
            
            // Disable the button during operation
            if (this.clearStorageButton) {
                this.clearStorageButton.disabled = true;
                this.clearStorageButton.textContent = '🔄 Clearing...';
            }
            
            // Clear storage using FileStorageService
            const fileStorage = new FileStorageService();
            const result = await fileStorage.clearStorage();
            
            if (result.success) {
                this.showStatus('✅ ' + result.message, 'success');
                
                // Reset form fields
                if (this.fileLocationInput) this.fileLocationInput.value = '';
                
                // Reload settings to reflect cleared state
                await this.loadSettings();
                
                // Automatically refresh the jobs table page if it's open
                this.refreshJobsTableIfOpen();
            } else {
                this.showStatus('❌ ' + result.errors.join(', '), 'error');
            }
        } catch (error) {
            console.error('Error clearing storage:', error);
            this.showStatus('❌ Failed to clear storage: ' + error.message, 'error');
        } finally {
            // Re-enable the button
            if (this.clearStorageButton) {
                this.clearStorageButton.disabled = false;
                this.clearStorageButton.textContent = '🗑️ Clear All Data & Settings';
            }
        }
    }

    showClearStorageWarning() {
        return new Promise((resolve) => {
            // Create warning dialog
            const dialog = document.createElement('div');
            dialog.className = 'clear-storage-warning-dialog';
            dialog.innerHTML = `
                <div class="warning-content">
                    <div class="warning-header">
                        <span class="warning-icon">⚠️</span>
                        <span class="warning-title">Clear All Data & Settings</span>
                    </div>
                    <div class="warning-message">
                        Are you sure you want to clear all stored job data and settings?<br><br>
                        <strong>This action will:</strong>
                        <ul>
                            <li>Delete all saved job information</li>
                            <li>Clear all settings (API keys, file locations)</li>
                            <li>Reset the extension to initial state</li>
                        </ul>
                        <strong>This action cannot be undone.</strong>
                    </div>
                    <div class="warning-buttons">
                        <button class="warning-btn warning-btn-cancel">Cancel</button>
                        <button class="warning-btn warning-btn-clear">Clear All Data</button>
                    </div>
                </div>
            `;

            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .clear-storage-warning-dialog {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .warning-content {
                    background: white;
                    border: 2px solid #dc3545;
                    border-radius: 8px;
                    padding: 20px;
                    max-width: 400px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }
                .warning-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 15px;
                    color: #dc3545;
                }
                .warning-icon {
                    font-size: 24px;
                    margin-right: 10px;
                }
                .warning-title {
                    font-size: 18px;
                    font-weight: 600;
                }
                .warning-message {
                    margin-bottom: 20px;
                    line-height: 1.5;
                    color: #333;
                }
                .warning-message ul {
                    margin: 10px 0;
                    padding-left: 20px;
                }
                .warning-message li {
                    margin: 5px 0;
                }
                .warning-buttons {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }
                .warning-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .warning-btn-cancel {
                    background: #6c757d;
                    color: white;
                }
                .warning-btn-cancel:hover {
                    background: #545b62;
                }
                .warning-btn-clear {
                    background: #dc3545;
                    color: white;
                }
                .warning-btn-clear:hover {
                    background: #c82333;
                }
            `;

            // Add to page
            document.head.appendChild(style);
            document.body.appendChild(dialog);

            // Handle button clicks
            const cancelBtn = dialog.querySelector('.warning-btn-cancel');
            const clearBtn = dialog.querySelector('.warning-btn-clear');

            const cleanup = () => {
                document.head.removeChild(style);
                document.body.removeChild(dialog);
            };

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            clearBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            // Handle escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    document.removeEventListener('keydown', handleEscape);
                    resolve(false);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    }

    // Check Chrome extension permissions and alert user if there are issues
    async checkPermissions() {
        try {
            // Check if we have the required permissions
            const permissions = await chrome.permissions.getAll();
            
            const requiredPermissions = [
                'storage',
                'activeTab',
                'scripting',
                'downloads'
            ];
            
            const missingPermissions = requiredPermissions.filter(permission => 
                !permissions.permissions.includes(permission)
            );
            
            if (missingPermissions.length > 0) {
                this.showStatus(`⚠️ Missing permissions: ${missingPermissions.join(', ')}. Some features may not work properly.`, 'warning');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error checking permissions:', error);
            this.showStatus('⚠️ Unable to check extension permissions. Some features may not work properly.', 'warning');
            return false;
        }
    }

    async refreshJobsTableIfOpen() {
        try {
            const [tab] = await chrome.tabs.query({ url: chrome.runtime.getURL('jobs-table.html') });
            if (tab) {
                await chrome.tabs.reload(tab.id);
                this.showStatus('✅ Jobs table refreshed successfully!', 'success');
            }
        } catch (error) {
            console.error('Error refreshing jobs table:', error);
            this.showStatus('❌ Failed to refresh jobs table: ' + error.message, 'error');
        }
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupUI();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PopupUI };
} 