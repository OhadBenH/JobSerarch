class PersistentWindow {
    constructor() {
        this.fileStorage = new FileStorageService();
        this.progressSteps = [];
        this.currentStepIndex = 0;
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.initializeAlwaysOnTopStatus();
    }

    initializeElements() {
        // Main buttons
        this.saveJobButton = document.getElementById('saveJob');
        this.downloadJobsButton = document.getElementById('downloadJobs');
        this.showJobsButton = document.getElementById('showJobs');
        this.clearStorageButton = document.getElementById('clearStorage');
        this.bringToFrontButton = document.getElementById('bringToFront');
        
        // Settings elements
        this.settingsToggle = document.getElementById('settingsToggle');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.fileLocationInput = document.getElementById('fileLocation');
        this.selectDirectoryButton = document.getElementById('selectDirectory');
        
        // Status and loading
        this.statusMessage = document.getElementById('statusMessage');
        this.loading = document.getElementById('loading');
        this.progressContainer = document.getElementById('progressContainer');
        
        // File storage service
        this.fileStorage = new FileStorageService();
    }

    bindEvents() {
        if (this.saveJobButton) {
            this.saveJobButton.addEventListener('click', () => this.handleSaveJobClick());
        }
        
        if (this.downloadJobsButton) {
            this.downloadJobsButton.addEventListener('click', () => this.handleDownloadJobsClick());
        }
        
        if (this.showJobsButton) {
            this.showJobsButton.addEventListener('click', () => this.handleShowJobsClick());
        }
        
        if (this.clearStorageButton) {
            this.clearStorageButton.addEventListener('click', () => this.handleClearStorage());
        }
        
        if (this.settingsToggle) {
            this.settingsToggle.addEventListener('click', () => this.toggleSettings());
        }
        
        if (this.selectDirectoryButton) {
            this.selectDirectoryButton.addEventListener('click', () => this.selectFileLocation());
        }
        
        if (this.bringToFrontButton) {
            this.bringToFrontButton.addEventListener('click', () => this.handleBringToFront());
        }
    }

    async loadSettings() {
        try {
            const settings = await new Promise((resolve) => {
                chrome.storage.sync.get(['fileLocation'], resolve);
            });
            
            if (this.fileLocationInput) this.fileLocationInput.value = settings.fileLocation || '';
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    toggleSettings() {
        if (this.settingsPanel && this.settingsToggle) {
            const isVisible = this.settingsPanel.style.display === 'block';
            this.settingsPanel.style.display = isVisible ? 'none' : 'block';
            this.settingsToggle.textContent = isVisible ? '⚙️ Settings' : '✕ Close';
        }
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

    async handleSaveJobClick() {
        try {
            this.showLoading(true);
            this.clearProgressSteps();
            this.addProgressStep('Getting current tab...');
            
            // Get current tab from the main browser window, not the persistent window
            // First, get all windows and find the main browser window
            const windows = await chrome.windows.getAll({ windowTypes: ['normal'] });
            const mainWindow = windows.find(w => w.type === 'normal');
            
            if (!mainWindow) {
                this.showStatus('❌ Could not find main browser window. Please refresh the page and try again.', 'error');
                return;
            }
            
            // Get the active tab from the main window
            let [tab] = await chrome.tabs.query({ active: true, windowId: mainWindow.id });
            
            if (!tab) {
                this.showStatus('❌ Could not access current tab. Please refresh the page and try again.', 'error');
                return;
            }

            console.log('Main window ID:', mainWindow.id);
            console.log('Current tab URL:', tab.url);
            console.log('Current tab window ID:', tab.windowId);
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
                    const [updatedTab] = await chrome.tabs.query({ active: true, windowId: mainWindow.id });
                    if (updatedTab) {
                        tab = updatedTab;
                        console.log('Updated tab URL after redirect:', tab.url);
                    }
                }
            }

            // Check if user is actually on a job posting page (not a login page)
            const isActualJobPosting = await this.isActualJobPosting(tab);
            if (!isActualJobPosting) {
                if (tab.url.includes('linkedin.com')) {
                    this.showStatus('❌ Please sign in to LinkedIn to view this job posting. The extension cannot extract job data from the login page.', 'error');
                } else {
                    this.showStatus('❌ Please navigate to an actual job posting page. This appears to be a login or error page.', 'error');
                }
                return;
            }
            
            this.updateProgressStep(2, 'Injecting content script...');
            
            // Inject content script and extract job data
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['extractors.js', 'ai-integration.js', 'content.js']
            });
            
            this.updateProgressStep(3, 'Extracting job data...');
            
            // Send message to content script to extract data
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractJobData' });
            
            if (!response || !response.success) {
                const errorMsg = response?.error || 'Failed to extract job data';
                
                // Provide more specific error messages
                if (errorMsg.includes('recruiter') || errorMsg.includes('hiring team')) {
                    throw new Error('Could not find recruiter information. This might be because you need to sign in to LinkedIn or the job posting format has changed.');
                } else if (errorMsg.includes('job description') || errorMsg.includes('company name')) {
                    throw new Error('Could not extract job details. Please make sure you are on a complete job posting page and try again.');
                } else {
                    throw new Error(errorMsg);
                }
            }
            
            this.updateProgressStep(4, 'Saving job data...');
            
            // Save the job data
            const jobData = response.data;
            const saveResult = await this.fileStorage.saveJobData(jobData);
            
            if (saveResult.isDuplicate) {
                this.showDuplicateWarning(jobData, saveResult.existingEntry);
                return;
            }
            
            if (!saveResult.success) {
                throw new Error(saveResult.errors.join(', '));
            }
            
            this.updateProgressStep(5, 'Job saved successfully!');
            this.showStatus('✅ Job data saved to storage successfully!', 'success');
            
            // Automatically refresh the jobs table page if it's open
            this.refreshJobsTableIfOpen();
            
        } catch (error) {
            console.error('Error saving job:', error);
            this.showStatus('❌ Failed to save job: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleDownloadJobsClick() {
        try {
            this.showLoading(true);
            this.clearProgressSteps();
            this.addProgressStep('Preparing export...');
            
            const result = await this.fileStorage.exportToPreferredLocation();
            
            if (result.success) {
                this.showStatus('✅ Jobs exported successfully!', 'success');
            } else {
                throw new Error(result.errors.join(', '));
            }
            
        } catch (error) {
            console.error('Error downloading jobs:', error);
            this.showStatus('❌ Failed to download jobs: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleShowJobsClick() {
        try {
            this.showLoading(true);
            this.clearProgressSteps();
            this.addProgressStep('Loading jobs...');
            
            // Open jobs table in a new tab
            await chrome.tabs.create({
                url: chrome.runtime.getURL('jobs-table.html')
            });
            
            this.showStatus('✅ Jobs table opened in new tab', 'success');
            
        } catch (error) {
            console.error('Error showing jobs:', error);
            this.showStatus('❌ Failed to open jobs table: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleClearStorage() {
        // Show custom confirmation dialog
        const confirmed = await this.showClearStorageWarning();
        
        if (!confirmed) {
            return;
        }
        
        try {
            this.showLoading(true);
            this.clearProgressSteps();
            this.addProgressStep('Clearing storage...');
            
            // Disable the button during operation
            if (this.clearStorageButton) {
                this.clearStorageButton.disabled = true;
                this.clearStorageButton.textContent = '🔄 Clearing...';
            }
            
            const result = await this.fileStorage.clearStorage();
            
            if (result.success) {
                this.showStatus('✅ ' + result.message, 'success');
                
                // Reset form fields
                if (this.fileLocationInput) this.fileLocationInput.value = '';
                
                // Reload settings to reflect cleared state
                await this.loadSettings();
                
                // Automatically refresh the jobs table page if it's open
                this.refreshJobsTableIfOpen();
            } else {
                throw new Error(result.errors.join(', '));
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
            this.showLoading(false);
        }
    }

    showDuplicateWarning(jobData, existingEntry) {
        const warningHtml = `
            <div class="warning-content">
                <div class="warning-title">⚠️ Job Already Saved</div>
                <div class="warning-message">
                    This job has already been saved:
                    <br>URL: ${existingEntry.url}
                    <br>Saved on: ${new Date(existingEntry.extractedAt).toLocaleString()}
                    <br><br>Do you want to overwrite the existing entry with the new data?
                </div>
                <div class="warning-actions">
                    <button id="cancelOverwrite" class="btn btn-secondary">Cancel</button>
                    <button id="confirmOverwrite" class="btn btn-primary">Overwrite</button>
                </div>
            </div>
        `;
        
        this.statusMessage.innerHTML = warningHtml;
        this.statusMessage.className = 'status-message warning';
        this.statusMessage.style.display = 'block';
        
        // Add event listeners for the buttons
        document.getElementById('cancelOverwrite').addEventListener('click', () => {
            this.statusMessage.style.display = 'none';
        });
        
        document.getElementById('confirmOverwrite').addEventListener('click', async () => {
            try {
                const result = await this.fileStorage.overwriteJobData(jobData);
                if (result.success) {
                    this.showStatus('✅ Job data updated successfully!', 'success');
                    
                    // Automatically refresh the jobs table page if it's open
                    this.refreshJobsTableIfOpen();
                } else {
                    throw new Error(result.errors.join(', '));
                }
            } catch (error) {
                this.showStatus('❌ Failed to update job: ' + error.message, 'error');
            }
        });
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
        
        // Check for Indeed job postings
        if (url.includes('indeed.com/viewjob') || url.includes('indeed.com/job/')) {
            console.log('Indeed job URL found - returning true');
            return true;
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

    showLoading(show) {
        if (this.progressContainer) {
            this.progressContainer.style.display = show ? 'block' : 'none';
        }
        
        // Disable/enable buttons during loading
        if (this.saveJobButton) this.saveJobButton.disabled = show;
        if (this.downloadJobsButton) this.downloadJobsButton.disabled = show;
        if (this.showJobsButton) this.showJobsButton.disabled = show;
    }

    clearProgressSteps() {
        this.progressSteps = [];
        this.currentStepIndex = 0;
        this.updateProgress(0);
    }

    addProgressStep(step) {
        this.progressSteps.push(step);
        this.updateProgress();
    }

    updateProgressStep(stepIndex, stepText) {
        this.currentStepIndex = stepIndex;
        if (this.currentStep) {
            this.currentStep.textContent = stepText;
        }
        this.updateProgress();
    }

    updateProgress() {
        if (this.progressSteps.length === 0) return;
        
        const progress = (this.currentStepIndex / this.progressSteps.length) * 100;
        if (this.progressFill) {
            this.progressFill.style.width = `${progress}%`;
        }
        
        if (this.progressSteps) {
            this.progressSteps.textContent = `${this.currentStepIndex}/${this.progressSteps.length}`;
        }
    }

    showStatus(message, type = 'success') {
        if (this.statusMessage) {
            this.statusMessage.textContent = message;
            this.statusMessage.className = `status-message ${type}`;
            this.statusMessage.style.display = 'block';
            
            // Auto-hide success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    this.statusMessage.style.display = 'none';
                }, 5000);
            }
        }
    }

    async handleBringToFront() {
        try {
            const windowId = await this.getCurrentWindowId();
            
            // Get the current always-on-top status from the background script
            const isAlwaysOnTop = await new Promise(resolve => {
                chrome.runtime.sendMessage({ action: 'isAlwaysOnTop', windowId: windowId }, (response) => {
                    resolve(response.isAlwaysOnTop);
                });
            });
            
            console.log('Toggle always-on-top:', { isAlwaysOnTop, windowId });
            
            if (isAlwaysOnTop) {
                // Disable always-on-top behavior
                console.log('Disabling always-on-top for window:', windowId);
                await chrome.runtime.sendMessage({ 
                    action: 'disableAlwaysOnTop', 
                    windowId: windowId 
                });
                this.bringToFrontButton.textContent = '📌 Always on top disabled (click to enable)';
                this.showStatus('✅ Always on top disabled. Window will stay in background.', 'success');
            } else {
                // Enable always-on-top behavior
                console.log('Enabling always-on-top for window:', windowId);
                await chrome.runtime.sendMessage({ 
                    action: 'enableAlwaysOnTop', 
                    windowId: windowId 
                });
                this.bringToFrontButton.textContent = '📌 Always on top (click to disable)';
                this.showStatus('✅ Always on top enabled. Window will stay on top.', 'success');
            }
        } catch (error) {
            console.error('Error toggling always on top:', error);
            this.showStatus('❌ Failed to toggle always on top: ' + error.message, 'error');
        }
    }

    async getCurrentWindowId() {
        try {
            const currentWindow = await chrome.windows.getCurrent();
            return currentWindow.id;
        } catch (error) {
            console.error('Error getting current window ID:', error);
            return null;
        }
    }

    async initializeAlwaysOnTopStatus() {
        try {
            const windowId = await this.getCurrentWindowId();
            if (windowId) {
                const isAlwaysOnTop = await new Promise(resolve => {
                    chrome.runtime.sendMessage({ action: 'isAlwaysOnTop', windowId: windowId }, (response) => {
                        resolve(response.isAlwaysOnTop);
                    });
                });

                if (isAlwaysOnTop) {
                    this.bringToFrontButton.textContent = '📌 Always on top (click to disable)';
                } else {
                    this.bringToFrontButton.textContent = '📌 Always on top disabled (click to enable)';
                }
                
                console.log('Initialized always-on-top status:', { windowId, isAlwaysOnTop });
            }
        } catch (error) {
            console.error('Error initializing always on top status:', error);
        }
    }

    async refreshJobsTableIfOpen() {
        try {
            const jobsTableTab = await new Promise(resolve => {
                chrome.tabs.query({ url: chrome.runtime.getURL('jobs-table.html') }, (tabs) => {
                    resolve(tabs.length > 0 ? tabs[0] : null);
                });
            });

            if (jobsTableTab) {
                console.log('Jobs table tab found, refreshing...');
                await chrome.tabs.reload(jobsTableTab.id);
                this.showStatus('✅ Jobs table refreshed successfully!', 'success');
            } else {
                console.log('Jobs table tab not found, no refresh needed.');
            }
        } catch (error) {
            console.error('Error refreshing jobs table:', error);
            this.showStatus('❌ Failed to refresh jobs table: ' + error.message, 'error');
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

    // Check if the current page is actually a job posting (not a login page)
    async isActualJobPosting(tab) {
        try {
            // Check if we're on a LinkedIn login page
            if (tab.url.includes('linkedin.com') && (
                tab.url.includes('/login') || 
                tab.url.includes('/signin') ||
                tab.title.toLowerCase().includes('sign in') ||
                tab.title.toLowerCase().includes('log in')
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
}

// Initialize the persistent window when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PersistentWindow();
});