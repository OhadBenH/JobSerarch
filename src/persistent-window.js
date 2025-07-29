class PersistentWindow {
    constructor() {
        this.fileStorage = new FileStorageService();
        this.progressSteps = [];
        this.currentStepIndex = 0;
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
    }

    initializeElements() {
        // Main buttons
        this.saveJobButton = document.getElementById('saveJobButton');
        this.downloadJobsButton = document.getElementById('downloadJobsButton');
        this.showJobsButton = document.getElementById('showJobsButton');
        this.clearStorageButton = document.getElementById('clearStorageButton');
        this.settingsButton = document.getElementById('settingsButton');
        
        // Settings elements
        this.settingsPanel = document.getElementById('settingsPanel');
        this.aiProviderSelect = document.getElementById('aiProviderSelect');
        this.openaiKeyInput = document.getElementById('openaiKeyInput');
        this.claudeKeyInput = document.getElementById('claudeKeyInput');
        this.fileLocationInput = document.getElementById('fileLocationInput');
        this.saveSettingsButton = document.getElementById('saveSettingsButton');
        
        // Status and progress elements
        this.statusMessage = document.getElementById('statusMessage');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.progressSteps = document.getElementById('progressSteps');
        this.currentStep = document.getElementById('currentStep');
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
        
        if (this.settingsButton) {
            this.settingsButton.addEventListener('click', () => this.toggleSettings());
        }
        
        if (this.saveSettingsButton) {
            this.saveSettingsButton.addEventListener('click', () => this.saveSettings());
        }
    }

    async loadSettings() {
        try {
            const settings = await new Promise((resolve) => {
                chrome.storage.sync.get(['aiProvider', 'openaiKey', 'claudeKey', 'fileLocation'], resolve);
            });
            
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
            
            await new Promise((resolve, reject) => {
                chrome.storage.sync.set(settings, () => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve();
                    }
                });
            });
            
            // Save file location to FileStorageService
            if (settings.fileLocation) {
                await this.fileStorage.saveFileLocation(settings.fileLocation);
            }
            
            this.showStatus('✅ Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showStatus('❌ Failed to save settings: ' + error.message, 'error');
        }
    }

    toggleSettings() {
        if (this.settingsPanel && this.settingsButton) {
            const isVisible = this.settingsPanel.style.display === 'block';
            this.settingsPanel.style.display = isVisible ? 'none' : 'block';
            this.settingsButton.textContent = isVisible ? '⚙️ Settings' : '✕ Close';
        }
    }

    async handleSaveJobClick() {
        try {
            this.showLoading(true);
            this.clearProgressSteps();
            this.addProgressStep('Getting current tab...');
            
            // Get the current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                throw new Error('No active tab found');
            }
            
            this.updateProgressStep(1, 'Checking if this is a job site...');
            
            // Check if this is a job site
            if (!this.isJobSite(tab.url)) {
                throw new Error('Please navigate to a job posting page (LinkedIn, Indeed, or company career page)');
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
                throw new Error(response?.error || 'Failed to extract job data');
            }
            
            this.updateProgressStep(4, 'Saving job data...');
            
            // Save the job data
            const saveResult = await this.fileStorage.saveJobData(response.data);
            
            if (saveResult.isDuplicate) {
                this.showDuplicateWarning(response.data, saveResult.existingEntry);
                return;
            }
            
            if (!saveResult.success) {
                throw new Error(saveResult.errors.join(', '));
            }
            
            this.updateProgressStep(5, 'Job saved successfully!');
            this.showStatus('✅ Job data saved to storage successfully!', 'success');
            
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
        const confirmed = window.confirm(
            'Are you sure you want to clear all saved jobs and settings? This action cannot be undone.'
        );
        
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
                this.showStatus('✅ All data and settings cleared successfully!', 'success');
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
        
        // Check for LinkedIn job postings
        if (url.includes('linkedin.com/jobs/view/') || url.includes('currentJobId=')) {
            return true;
        }
        
        // Check for Indeed job postings
        if (url.includes('indeed.com/viewjob') || url.includes('indeed.com/job/')) {
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
        
        return jobSites.some(site => url.includes(site));
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
}

// Initialize the persistent window when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PersistentWindow();
});