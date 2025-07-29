// Popup UI Management
class PopupUI {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.checkPermissions(); // Check permissions on startup
    }

    initializeElements() {
        this.saveJobButton = document.getElementById('saveJobButton');
        this.downloadJobsButton = document.getElementById('downloadJobsButton');
        this.showJobsButton = document.getElementById('showJobsButton');
        this.clearStorageButton = document.getElementById('clearStorageButton');
        this.openPersistentWindowButton = document.getElementById('openPersistentWindowButton');
        this.settingsButton = document.getElementById('settingsButton');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.statusMessage = document.getElementById('statusMessage');
        this.loading = document.getElementById('loading');
        this.progressText = document.getElementById('progressText');
        this.progressSteps = document.getElementById('progressSteps');
        this.aiProviderSelect = document.getElementById('aiProvider');
        this.openaiKeyInput = document.getElementById('openaiKey');
        this.claudeKeyInput = document.getElementById('claudeKey');
        this.fileLocationInput = document.getElementById('fileLocation');
        this.saveSettingsButton = document.getElementById('saveSettings');
        this.selectDirectoryButton = document.getElementById('selectDirectory');
        this.directoryStatus = document.getElementById('directoryStatus');
    }

    bindEvents() {
        if (this.saveJobButton) this.saveJobButton.addEventListener('click', () => this.handleSaveJobClick());
        if (this.downloadJobsButton) this.downloadJobsButton.addEventListener('click', () => this.handleDownloadJobsClick());
        if (this.showJobsButton) this.showJobsButton.addEventListener('click', () => this.handleShowJobsClick());
        if (this.settingsButton) this.settingsButton.addEventListener('click', () => this.toggleSettings());
        if (this.saveSettingsButton) this.saveSettingsButton.addEventListener('click', () => this.saveSettings());
        if (this.selectDirectoryButton) this.selectDirectoryButton.addEventListener('click', () => this.handleSelectDirectory());
        if (this.clearStorageButton) this.clearStorageButton.addEventListener('click', () => this.handleClearStorage());
        if (this.openPersistentWindowButton) this.openPersistentWindowButton.addEventListener('click', () => this.openPersistentWindow());
    }

    async handleSaveJobClick() {
        try {
            // Check permissions first
            const hasPermissions = await this.checkPermissions();
            if (!hasPermissions) {
                this.showStatus('⚠️ Some permissions are missing. The extension may not work properly. Please check Chrome extension settings.', 'warning');
                // Continue anyway but warn the user
            }

            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                this.showStatus('❌ Could not access current tab. Please refresh the page and try again.', 'error');
                return;
            }

            // Check if current page is a supported job site
            if (!this.isJobSite(tab.url)) {
                this.showStatus('❌ Please navigate to a supported job site (LinkedIn, Indeed, etc.) and click on a specific job posting.', 'error');
                return;
            }

            // Show loading state
            this.showLoading(true);
            this.clearProgressSteps();
            
            // Initialize progress tracking
            const totalSteps = 4;
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
                    files: ['extractors.js', 'ai-integration.js', 'content.js']
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
                this.showStatus('❌ ' + errorMsg, 'error');
                this.showLoading(false);
                return;
            }

            this.updateProgressStep(currentStep, 'completed');

            // Step 3: Processing AI summary
            currentStep++;
            this.addProgressStep(currentStep, 'Processing AI summary');
            this.updateProgress(currentStep, totalSteps, 'Processing AI summary');
            this.updateProgressStep(currentStep, 'current');

            const jobData = response.data;
            
            // Get AI settings
            const aiProvider = this.aiProviderSelect.value;
            const openaiKey = this.openaiKeyInput.value.trim();
            const claudeKey = this.claudeKeyInput.value.trim();

            if (aiProvider && ((aiProvider === 'openai' && openaiKey) || (aiProvider === 'claude' && claudeKey))) {
                try {
                    const aiResponse = await chrome.tabs.sendMessage(tab.id, { 
                        action: 'summarizeJob', 
                        jobDescription: jobData.jobDescription,
                        aiProvider: aiProvider,
                        openaiKey: openaiKey,
                        claudeKey: claudeKey
                    });
                    
                    if (aiResponse && aiResponse.success) {
                        jobData.aiSummary = aiResponse.summary;
                    } else {
                        jobData.aiSummary = 'AI summarization failed: ' + (aiResponse?.error || 'Unknown error');
                    }
                } catch (aiError) {
                    console.error('AI summarization error:', aiError);
                    jobData.aiSummary = 'AI summarization failed: ' + aiError.message;
                }
            } else {
                jobData.aiSummary = 'No AI provider configured';
            }

            this.updateProgressStep(currentStep, 'completed');

            // Step 4: Saving to storage
            currentStep++;
            this.addProgressStep(currentStep, 'Saving to storage');
            this.updateProgress(currentStep, totalSteps, 'Saving to storage');
            this.updateProgressStep(currentStep, 'current');

            const fileStorage = new FileStorageService();
            
            // Save the file location to storage before saving job data
            await fileStorage.saveFileLocation(this.fileLocationInput.value.trim());
            
            const saveResult = await fileStorage.saveJobData(jobData);
            
            if (!saveResult.success) {
                if (saveResult.isDuplicate) {
                    // Show duplicate warning dialog
                    this.updateProgressStep(currentStep, 'current');
                    this.showStatus('⚠️ Duplicate job found. Please review the warning dialog.', 'warning');
                    
                    const shouldOverwrite = await this.showDuplicateWarning(jobData, saveResult.existingEntry);
                    
                    if (shouldOverwrite) {
                        // User chose to overwrite
                        this.updateProgressStep(currentStep, 'current');
                        this.showStatus('🔄 Overwriting existing entry...', 'info');
                        
                        const overwriteResult = await fileStorage.overwriteJobData(jobData);
                        
                        if (!overwriteResult.success) {
                            this.updateProgressStep(currentStep, 'error');
                            this.showStatus('❌ Failed to overwrite job data: ' + overwriteResult.errors.join(', '), 'error');
                            this.showLoading(false);
                            return;
                        }
                        
                        this.updateProgressStep(currentStep, 'completed');
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
            }

            this.updateProgressStep(currentStep, 'completed');

            // Step 4: Completing save
            currentStep++;
            this.addProgressStep(currentStep, 'Completing save');
            this.updateProgress(currentStep, totalSteps, 'Completing save');
            this.updateProgressStep(currentStep, 'current');

            this.updateProgressStep(currentStep, 'completed');
            this.showStatus('✅ Job data saved to storage successfully!', 'success');

        } catch (error) {
            console.error('Error in handleSaveJobClick:', error);
            
            // Enhanced error handling with permission-specific messages
            if (error.message.includes('permission') || error.message.includes('denied')) {
                this.showStatus('❌ Permission denied. Please check Chrome extension permissions and try again.', 'error');
            } else if (error.message.includes('quota') || error.message.includes('space')) {
                this.showStatus('❌ Storage quota exceeded. Please clear some data or use a different save location.', 'error');
            } else if (error.message.includes('invalid') || error.message.includes('path')) {
                this.showStatus('❌ Invalid file path. Please check your save location format (e.g., C:\\JobSearch\\)', 'error');
            } else {
                this.showStatus('❌ An error occurred: ' + error.message, 'error');
            }
        } finally {
            this.showLoading(false);
        }
    }

    async handleDownloadJobsClick() {
        try {
            // Check permissions first
            const hasPermissions = await this.checkPermissions();
            if (!hasPermissions) {
                this.showStatus('⚠️ Some permissions are missing. The extension may not work properly. Please check Chrome extension settings.', 'warning');
                // Continue anyway but warn the user
            }

            // Show loading state
            this.showLoading(true);
            this.clearProgressSteps();
            
            // Initialize progress tracking
            const totalSteps = 3;
            let currentStep = 0;

            // Step 1: Loading stored jobs
            currentStep++;
            this.addProgressStep(currentStep, 'Loading stored jobs');
            this.updateProgress(currentStep, totalSteps, 'Loading stored jobs');
            this.updateProgressStep(currentStep, 'current');

            const fileStorage = new FileStorageService();
            
            // Save the file location to storage before exporting
            await fileStorage.saveFileLocation(this.fileLocationInput.value.trim());
            
            // Load stored data
            await fileStorage.loadSettings();
            
            if (!fileStorage.storedData || fileStorage.storedData.length === 0) {
                this.updateProgressStep(currentStep, 'error');
                this.showStatus('❌ No job data found in storage. Please save some jobs first.', 'error');
                this.showLoading(false);
                return;
            }

            this.updateProgressStep(currentStep, 'completed');

            // Step 2: Exporting to CSV
            currentStep++;
            this.addProgressStep(currentStep, 'Exporting to CSV');
            this.updateProgress(currentStep, totalSteps, 'Exporting to CSV');
            this.updateProgressStep(currentStep, 'current');

            try {
                // Try to save to selected directory first, then fall back to preferred location
                let exportResult;
                if (fileStorage.directoryHandle) {
                    exportResult = await fileStorage.saveToSelectedDirectory();
                } else {
                    exportResult = await fileStorage.exportToPreferredLocation();
                }
                
                if (!exportResult.success) {
                    this.updateProgressStep(currentStep, 'error');
                    this.showStatus('❌ Failed to export files: ' + exportResult.errors.join(', '), 'error');
                    this.showLoading(false);
                    return;
                }
            } catch (exportError) {
                console.error('Export error:', exportError);
                this.updateProgressStep(currentStep, 'error');
                
                // Enhanced error handling for export issues
                if (exportError.message.includes('permission') || exportError.message.includes('denied')) {
                    this.showStatus('❌ Export permission denied. Please check Chrome extension permissions or use a different save location.', 'error');
                } else if (exportError.message.includes('quota') || exportError.message.includes('space')) {
                    this.showStatus('❌ Insufficient storage space. Please free up space or use a different save location.', 'error');
                } else if (exportError.message.includes('invalid') || exportError.message.includes('path')) {
                    this.showStatus('❌ Invalid file path. Please check your save location format (e.g., C:\\JobSearch\\)', 'error');
                } else {
                    this.showStatus('❌ Export failed: ' + exportError.message, 'error');
                }
                this.showLoading(false);
                return;
            }

            this.updateProgressStep(currentStep, 'completed');

            // Step 3: Completing download
            currentStep++;
            this.addProgressStep(currentStep, 'Completing download');
            this.updateProgress(currentStep, totalSteps, 'Completing download');
            this.updateProgressStep(currentStep, 'current');

            // Determine where files were saved
            const fileLocation = this.fileLocationInput.value.trim();
            let saveLocationMessage;
            
            if (fileLocation && fileLocation !== '') {
                saveLocationMessage = `Files saved to Downloads folder with path structure: ${fileLocation}/`;
            } else {
                saveLocationMessage = 'Files saved to Downloads folder';
            }

            this.updateProgressStep(currentStep, 'completed');
            this.showStatus(`✅ All job data exported successfully! ${saveLocationMessage}`, 'success');

        } catch (error) {
            console.error('Error in handleDownloadJobsClick:', error);
            
            // Enhanced error handling with permission-specific messages
            if (error.message.includes('permission') || error.message.includes('denied')) {
                this.showStatus('❌ Permission denied. Please check Chrome extension permissions and try again.', 'error');
            } else if (error.message.includes('quota') || error.message.includes('space')) {
                this.showStatus('❌ Storage quota exceeded. Please clear some data or use a different save location.', 'error');
            } else if (error.message.includes('invalid') || error.message.includes('path')) {
                this.showStatus('❌ Invalid file path. Please check your save location format (e.g., C:\\JobSearch\\)', 'error');
            } else {
                this.showStatus('❌ An error occurred: ' + error.message, 'error');
            }
        } finally {
            this.showLoading(false);
        }
    }

    async handleShowJobsClick() {
        try {
            // Check permissions first
            const hasPermissions = await this.checkPermissions();
            if (!hasPermissions) {
                this.showStatus('⚠️ Some permissions are missing. The extension may not work properly. Please check Chrome extension settings.', 'warning');
                // Continue anyway but warn the user
            }

            // Show loading state
            this.showLoading(true);
            this.clearProgressSteps();
            
            // Initialize progress tracking
            const totalSteps = 2;
            let currentStep = 0;

            // Step 1: Loading stored jobs
            currentStep++;
            this.addProgressStep(currentStep, 'Loading stored jobs');
            this.updateProgress(currentStep, totalSteps, 'Loading stored jobs');
            this.updateProgressStep(currentStep, 'current');

            const fileStorage = new FileStorageService();
            
            // Load stored data
            await fileStorage.loadSettings();
            
            if (!fileStorage.storedData || fileStorage.storedData.length === 0) {
                this.updateProgressStep(currentStep, 'error');
                this.showStatus('❌ No job data found in storage. Please save some jobs first.', 'error');
                this.showLoading(false);
                return;
            }

            this.updateProgressStep(currentStep, 'completed');

            // Step 2: Opening jobs table
            currentStep++;
            this.addProgressStep(currentStep, 'Opening jobs table');
            this.updateProgress(currentStep, totalSteps, 'Opening jobs table');
            this.updateProgressStep(currentStep, 'current');

            try {
                // Create a new tab with the jobs table
                await chrome.tabs.create({
                    url: chrome.runtime.getURL('jobs-table.html')
                });
                
                this.updateProgressStep(currentStep, 'completed');
                this.showStatus('✅ Jobs table opened in new tab!', 'success');
                
            } catch (tabError) {
                console.error('Error opening jobs table:', tabError);
                this.updateProgressStep(currentStep, 'error');
                
                if (tabError.message.includes('permission') || tabError.message.includes('denied')) {
                    this.showStatus('❌ Permission denied. Cannot open new tab. Please check Chrome extension permissions.', 'error');
                } else {
                    this.showStatus('❌ Failed to open jobs table: ' + tabError.message, 'error');
                }
            }

        } catch (error) {
            console.error('Error in handleShowJobsClick:', error);
            
            // Enhanced error handling with permission-specific messages
            if (error.message.includes('permission') || error.message.includes('denied')) {
                this.showStatus('❌ Permission denied. Please check Chrome extension permissions and try again.', 'error');
            } else if (error.message.includes('quota') || error.message.includes('space')) {
                this.showStatus('❌ Storage quota exceeded. Please clear some data or use a different save location.', 'error');
            } else if (error.message.includes('invalid') || error.message.includes('path')) {
                this.showStatus('❌ Invalid file path. Please check your save location format (e.g., C:\\JobSearch\\)', 'error');
            } else {
                this.showStatus('❌ An error occurred: ' + error.message, 'error');
            }
        } finally {
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
            const settings = await chrome.storage.sync.get([
                'aiProvider',
                'openaiKey',
                'claudeKey',
                'fileLocation'
            ]);

            if (this.aiProviderSelect) this.aiProviderSelect.value = settings.aiProvider || '';
            if (this.openaiKeyInput) this.openaiKeyInput.value = settings.openaiKey || '';
            if (this.claudeKeyInput) this.claudeKeyInput.value = settings.claudeKey || '';
            if (this.fileLocationInput) this.fileLocationInput.value = settings.fileLocation || '';
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            const settings = {
                aiProvider: this.aiProviderSelect ? this.aiProviderSelect.value : '',
                openaiKey: this.openaiKeyInput ? this.openaiKeyInput.value.trim() : '',
                claudeKey: this.claudeKeyInput ? this.claudeKeyInput.value.trim() : '',
                fileLocation: this.fileLocationInput ? this.fileLocationInput.value.trim() : ''
            };

            await chrome.storage.sync.set(settings);
            this.showStatus('Settings saved successfully!', 'success');
            
            // Hide settings panel after saving
            setTimeout(() => {
                this.toggleSettings();
            }, 1500);

        } catch (error) {
            console.error('Error saving settings:', error);
            this.showStatus('Failed to save settings', 'error');
        }
    }

    isJobSite(url) {
        const jobSites = [
            'linkedin.com/jobs/view',
            'linkedin.com/jobs/view/',
            'indeed.com/viewjob',
            'glassdoor.com/Job',
            'monster.com/job',
            'careerbuilder.com/job'
        ];
        
        const isJobSite = jobSites.some(site => url.includes(site));
        
        // Special check for LinkedIn - must be a specific job posting, not collections
        if (url.includes('linkedin.com/jobs') && !url.includes('/view/')) {
            // Check if it's a collections page with a specific job ID
            if (url.includes('currentJobId=')) {
                return true; // Allow collections pages with specific job IDs
            }
            return false;
        }
        
        return isJobSite;
    }

    showLoading(show) {
        if (this.loading) {
            this.loading.style.display = show ? 'block' : 'none';
        }
        // Disable/enable buttons during loading
        if (this.saveJobButton) this.saveJobButton.disabled = show;
        if (this.downloadJobsButton) this.downloadJobsButton.disabled = show;
        if (this.showJobsButton) this.showJobsButton.disabled = show;
        if (this.openPersistentWindowButton) this.openPersistentWindowButton.disabled = show;
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
            // Show confirmation dialog
            const confirmed = window.confirm(
                'Are you sure you want to clear all stored job data and settings? This action cannot be undone.'
            );
            
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
                if (this.openaiKeyInput) this.openaiKeyInput.value = '';
                if (this.claudeKeyInput) this.claudeKeyInput.value = '';
                if (this.fileLocationInput) this.fileLocationInput.value = '';
                if (this.aiProviderSelect) this.aiProviderSelect.value = '';
                
                // Reload settings to reflect cleared state
                await this.loadSettings();
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

    async openPersistentWindow() {
        try {
            // Open a new persistent window
            await chrome.windows.create({
                url: chrome.runtime.getURL('persistent-window.html'),
                type: 'popup',
                width: 450,
                height: 650,
                left: 100,
                top: 100
            });
            this.showStatus('Persistent window opened! You can now browse job sites while keeping it open.', 'success');
        } catch (error) {
            console.error('Error opening persistent window:', error);
            this.showStatus('Failed to open persistent window: ' + error.message, 'error');
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