// File Storage Service for Job Search Extension

class FileStorageService {
    constructor() {
        this.defaultLocation = 'JobSearch';
        this.fileLocation = this.defaultLocation;
        this.jsonFileName = 'job_data.json';
        this.excelFileName = 'job_data.xlsx';
        this.storedData = [];
    }

    async loadSettings() {
        try {
            // Load file location from sync storage (where popup saves it)
            const syncResult = await chrome.storage.sync.get(['fileLocation']);
            if (syncResult.fileLocation) {
                this.fileLocation = syncResult.fileLocation;
            }
            
            // Load stored job data from local storage
            const localResult = await chrome.storage.local.get(['storedJobData']);
            if (localResult.storedJobData) {
                this.storedData = localResult.storedJobData;
            }
            return { success: true };
        } catch (error) {
            console.error('Error loading file storage settings:', error);
            return { success: false, errors: [error.message] };
        }
    }

    async saveFileLocation(location) {
        try {
            this.fileLocation = location;
            // Save to sync storage to match where popup saves it
            await chrome.storage.sync.set({ fileLocation: location });
            return { success: true };
        } catch (error) {
            console.error('Error saving file location:', error);
            return { success: false, errors: [error.message] };
        }
    }

    // Select a directory for automatic file saving (File System Access API)
    async selectDirectory() {
        try {
            if (!('showDirectoryPicker' in window)) {
                return { 
                    success: false, 
                    errors: ['File System Access API not supported in this browser. Please use the text field above to specify your save path.'] 
                };
            }

            // Check if we're in a Chrome extension context
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
                // In Chrome extension, File System Access API might have limitations
                // Try to use it but provide better error handling
                try {
                    const dirHandle = await window.showDirectoryPicker({
                        mode: 'readwrite'
                    });

                    // Store the directory handle for future use
                    this.directoryHandle = dirHandle;
                    await chrome.storage.local.set({ 
                        hasDirectoryPermission: true,
                        directoryName: dirHandle.name 
                    });

                    return { success: true, directoryName: dirHandle.name };
                } catch (pickerError) {
                    console.error('Directory picker error:', pickerError);
                    
                    // Enhanced error handling for different types of permission issues
                    if (pickerError.name === 'AbortError' || pickerError.message.includes('aborted')) {
                        return { 
                            success: false, 
                            errors: ['Directory selection was cancelled. Please try again or use the "File Save Location" text field above.']
                        };
                    } else if (pickerError.name === 'NotAllowedError' || pickerError.message.includes('permission')) {
                        return { 
                            success: false, 
                            errors: ['Permission denied. Chrome extensions have limited access to File System Access API. Please use the "File Save Location" text field above to specify your save path (e.g., C:\\JobSearch\\).']
                        };
                    } else if (pickerError.name === 'SecurityError' || pickerError.message.includes('security')) {
                        return { 
                            success: false, 
                            errors: ['Security restriction. Chrome extensions cannot access local directories directly. Please use the "File Save Location" text field above.']
                        };
                    } else if (pickerError.name === 'NotSupportedError') {
                        return { 
                            success: false, 
                            errors: ['Directory picker not supported in this context. Please use the "File Save Location" text field above.']
                        };
                    }
                    
                    return { 
                        success: false, 
                        errors: [`Directory picker failed: ${pickerError.message}. Please use the "File Save Location" text field above.`] 
                    };
                }
            } else {
                // Regular web page context
                const dirHandle = await window.showDirectoryPicker({
                    mode: 'readwrite'
                });

                // Store the directory handle for future use
                this.directoryHandle = dirHandle;
                await chrome.storage.local.set({ 
                    hasDirectoryPermission: true,
                    directoryName: dirHandle.name 
                });

                return { success: true, directoryName: dirHandle.name };
            }
        } catch (error) {
            console.error('Error selecting directory:', error);
            
            // Enhanced error handling with specific error types
            if (error.name === 'AbortError' || error.message.includes('aborted')) {
                return { 
                    success: false, 
                    errors: ['Directory selection was cancelled. Please try again or use the text field above.']
                };
            } else if (error.name === 'NotAllowedError' || error.message.includes('permission')) {
                return { 
                    success: false, 
                    errors: ['Permission denied. Please allow access to the directory or use the text field above.']
                };
            } else if (error.name === 'SecurityError' || error.message.includes('security')) {
                return { 
                    success: false, 
                    errors: ['Security restriction. Cannot access local directories. Please use the text field above.']
                };
            } else if (error.name === 'NotSupportedError') {
                return { 
                    success: false, 
                    errors: ['Directory picker not supported. Please use the text field above.']
                };
            }
            
            return { success: false, errors: [error.message] };
        }
    }

    // Save files directly to the selected directory
    async saveToSelectedDirectory() {
        try {
            if (!this.directoryHandle) {
                return { success: false, errors: ['No directory selected. Please select a directory first.'] };
            }

            const timestamp = new Date().toISOString().split('T')[0];
            
            // Save JSON file
            const jsonContent = JSON.stringify(this.storedData, null, 2);
            const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
            const jsonFileHandle = await this.directoryHandle.getFileHandle(`job_data_${timestamp}.json`, { create: true });
            const jsonWritable = await jsonFileHandle.createWritable();
            await jsonWritable.write(jsonBlob);
            await jsonWritable.close();

            // Save CSV file
            const headers = [
                'Company Name',
                'Job Role',
                'Job Family',
                'Job Description',
                'Website Type',
                'Full Website',
                'AI Summary',
                'Saved At'
            ];
            
            let csvContent = headers.join(',') + '\n';
            for (const jobData of this.storedData) {
                const formattedData = this.formatJobDataForExcel(jobData);
                const row = headers.map(header => {
                    const value = formattedData[header.toLowerCase().replace(/\s+/g, '')] || '';
                    return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
                });
                csvContent += row.join(',') + '\n';
            }
            
            const csvBlob = new Blob([csvContent], { type: 'text/csv' });
            const csvFileHandle = await this.directoryHandle.getFileHandle(`job_data_${timestamp}.csv`, { create: true });
            const csvWritable = await csvFileHandle.createWritable();
            await csvWritable.write(csvBlob);
            await csvWritable.close();

            return { success: true };
        } catch (error) {
            console.error('Error saving to selected directory:', error);
            return { success: false, errors: [error.message] };
        }
    }

    getFileLocation() {
        return this.fileLocation;
    }

    validatePath(filePath) {
        // Basic path validation for Windows and Unix-like systems
        const validPatterns = [
            /^[A-Za-z]:\\[^<>:"|?*]+\\?$/, // Windows path
            /^\/[^<>:"|?*]+\/?$/, // Unix-like path
            /^[A-Za-z]:\/[^<>:"|?*]+\/?$/ // Windows with forward slashes
        ];
        
        return validPatterns.some(pattern => pattern.test(filePath));
    }

    async saveToJSON(jobData) {
        try {
            // Load current settings and data
            await this.loadSettings();
            
            // Get all stored data to create complete JSON
            const allData = [...this.storedData, this.formatJobDataForJSON(jobData)];
            
            // Save to Chrome storage
            await chrome.storage.local.set({ storedJobData: allData });
            
            // Only create download file if user has specified a custom location
            if (this.fileLocation && this.fileLocation !== this.defaultLocation) {
                const jsonContent = JSON.stringify(allData, null, 2);
                const blob = new Blob([jsonContent], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                // Use the specified path structure in filename
                const filename = `${this.fileLocation}/job_data.json`;
                
                try {
                    await chrome.downloads.download({
                        url: url,
                        filename: filename,
                        saveAs: false
                    });
                } catch (downloadError) {
                    console.error('Download error:', downloadError);
                    URL.revokeObjectURL(url);
                    
                    // Enhanced error handling for download permissions
                    if (downloadError.message.includes('permission') || downloadError.message.includes('denied')) {
                        throw new Error('Download permission denied. Please check Chrome extension permissions or use a different save location.');
                    } else if (downloadError.message.includes('quota') || downloadError.message.includes('space')) {
                        throw new Error('Insufficient storage space. Please free up space or use a different save location.');
                    } else if (downloadError.message.includes('invalid') || downloadError.message.includes('path')) {
                        throw new Error('Invalid file path. Please check your save location format (e.g., C:\\JobSearch\\)');
                    } else {
                        throw new Error(`Download failed: ${downloadError.message}. Please try again or use a different save location.`);
                    }
                }
                
                URL.revokeObjectURL(url);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error saving to JSON:', error);
            
            // Enhanced error handling for storage operations
            if (error.message.includes('permission') || error.message.includes('denied')) {
                return { 
                    success: false, 
                    errors: ['Storage permission denied. Please check Chrome extension permissions and try again.'] 
                };
            } else if (error.message.includes('quota') || error.message.includes('space')) {
                return { 
                    success: false, 
                    errors: ['Storage quota exceeded. Please clear some data or use a different save location.'] 
                };
            } else if (error.message.includes('invalid') || error.message.includes('path')) {
                return { 
                    success: false, 
                    errors: ['Invalid file path. Please check your save location format (e.g., C:\\JobSearch\\)'] 
                };
            }
            
            return { success: false, errors: [error.message] };
        }
    }

    async saveToExcel(jobData) {
        try {
            // Load current settings and data
            await this.loadSettings();
            
            // Get all stored data to create complete CSV
            const allData = [...this.storedData, this.formatJobDataForExcel(jobData)];
            
            // Create CSV content (Excel-compatible) with all data
            const headers = [
                'Company Name',
                'Job Role',
                'Job Family',
                'Job Description',
                'Comments',
                'Recruiter Name',
                'Company Section',
                'Position Summary',
                'Website Type',
                'Full Website',
                'AI Summary',
                'Saved At',
                'Days Since Published',
                'URL'
            ];
            
            let csvContent = headers.join(',') + '\n';
            
            // Add all rows
            for (const rowData of allData) {
                const row = headers.map(header => {
                    const value = rowData[header.toLowerCase().replace(/\s+/g, '')] || '';
                    return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
                });
                csvContent += row.join(',') + '\n';
            }
            
            // Only create download file if user has specified a custom location
            if (this.fileLocation && this.fileLocation !== this.defaultLocation) {
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                
                // Use the specified path structure in filename
                const filename = `${this.fileLocation}/job_data.csv`;
                
                try {
                    await chrome.downloads.download({
                        url: url,
                        filename: filename,
                        saveAs: false
                    });
                } catch (downloadError) {
                    console.error('Download error:', downloadError);
                    URL.revokeObjectURL(url);
                    
                    // Enhanced error handling for download permissions
                    if (downloadError.message.includes('permission') || downloadError.message.includes('denied')) {
                        throw new Error('Download permission denied. Please check Chrome extension permissions or use a different save location.');
                    } else if (downloadError.message.includes('quota') || downloadError.message.includes('space')) {
                        throw new Error('Insufficient storage space. Please free up space or use a different save location.');
                    } else if (downloadError.message.includes('invalid') || downloadError.message.includes('path')) {
                        throw new Error('Invalid file path. Please check your save location format (e.g., C:\\JobSearch\\)');
                    } else {
                        throw new Error(`Download failed: ${downloadError.message}. Please try again or use a different save location.`);
                    }
                }
                
                URL.revokeObjectURL(url);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error saving to Excel:', error);
            
            // Enhanced error handling for storage operations
            if (error.message.includes('permission') || error.message.includes('denied')) {
                return { 
                    success: false, 
                    errors: ['Storage permission denied. Please check Chrome extension permissions and try again.'] 
                };
            } else if (error.message.includes('quota') || error.message.includes('space')) {
                return { 
                    success: false, 
                    errors: ['Storage quota exceeded. Please clear some data or use a different save location.'] 
                };
            } else if (error.message.includes('invalid') || error.message.includes('path')) {
                return { 
                    success: false, 
                    errors: ['Invalid file path. Please check your save location format (e.g., C:\\JobSearch\\)'] 
                };
            }
            
            return { success: false, errors: [error.message] };
        }
    }

    async saveJobData(jobData) {
        const results = {
            success: true,
            jsonSaved: false,
            excelSaved: false,
            errors: []
        };

        // Check for duplicate entry based on URL
        await this.loadSettings();
        const existingEntry = this.storedData.find(entry => entry.url === jobData.url);
        if (existingEntry) {
            return {
                success: false,
                isDuplicate: true,
                jsonSaved: false,
                excelSaved: false,
                existingEntry: existingEntry,
                errors: ['This job has already been saved. URL already exists in storage.']
            };
        }

        // Save to JSON
        const jsonResult = await this.saveToJSON(jobData);
        if (jsonResult.success) {
            results.jsonSaved = true;
        } else {
            results.errors.push(...jsonResult.errors);
        }

        // Save to Excel (CSV)
        const excelResult = await this.saveToExcel(jobData);
        if (excelResult.success) {
            results.excelSaved = true;
        } else {
            results.errors.push(...excelResult.errors);
        }

        // Overall success if at least one format was saved
        results.success = results.jsonSaved || results.excelSaved;

        return results;
    }

    async overwriteJobData(jobData) {
        const results = {
            success: true,
            jsonSaved: false,
            excelSaved: false,
            errors: []
        };

        // Remove the existing entry
        await this.loadSettings();
        this.storedData = this.storedData.filter(entry => entry.url !== jobData.url);
        
        // Save the new entry
        const saveResult = await this.saveJobData(jobData);
        return saveResult;
    }

    formatJobDataForJSON(jobData) {
        return {
            companyName: jobData.companyName || '',
            jobRole: jobData.jobRole || '',
            jobFamily: jobData.jobFamily || '',
            jobDescription: jobData.jobDescription || '',
            websiteType: jobData.websiteType || '',
            fullWebsite: jobData.fullWebsite || '',
            aiSummary: jobData.aiSummary || null,
            extractedAt: jobData.extractedAt || new Date().toISOString(),
            jobFreshness: jobData.jobFreshness || null,
            url: jobData.url || ''
        };
    }

    formatJobDataForExcel(jobData) {
        const aiSummary = jobData.aiSummary ? 
            `Requirements: ${jobData.aiSummary.requirements?.join(', ') || 'N/A'}; ` +
            `Responsibilities: ${jobData.aiSummary.responsibilities?.join(', ') || 'N/A'}; ` +
            `Skills: ${jobData.aiSummary.keySkills?.join(', ') || 'N/A'}` : 
            'N/A';

        const formatted = {
            companyname: jobData.companyName || '',
            jobrole: jobData.jobRole || '',
            jobfamily: jobData.jobFamily || '',
            websitetype: jobData.websiteType || '',
            fullwebsite: jobData.fullWebsite || '',
            jobdescription: jobData.jobDescription || '',
            comments: jobData.comments || '',
            recruitername: jobData.recruiterName || '',
            dayssincepublished: jobData.jobFreshness || '',
            companysection: jobData.companySection || '',
            positionsummary: jobData.positionSummary || '',
            savedat: jobData.extractedAt || '',
            url: jobData.url || ''
        };

        return formatted;
    }

    // Method to get all stored job data
    async getAllJobData() {
        await this.loadSettings();
        return this.storedData;
    }

    // Method to clear stored data
    async clearStoredData() {
        this.storedData = [];
        await chrome.storage.local.set({ storedJobData: [] });
        return { success: true };
    }

    // Clear all storage including job data and settings
    async clearStorage() {
        try {
            // Clear job data from local storage
            await new Promise((resolve, reject) => {
                chrome.storage.local.clear(() => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve();
                    }
                });
            });
            
            // Clear settings from sync storage
            await new Promise((resolve, reject) => {
                chrome.storage.sync.clear(() => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve();
                    }
                });
            });
            
            // Reset local variables
            this.storedData = [];
            this.fileLocation = this.defaultLocation;
            
            return { 
                success: true, 
                message: 'All stored data and settings have been cleared successfully.'
            };
        } catch (error) {
            console.error('Error clearing storage:', error);
            return { 
                success: false, 
                errors: [`Failed to clear storage: ${error.message}`]
            };
        }
    }

    // Export all data to user's preferred location
    async exportToPreferredLocation() {
        try {
            await this.loadSettings();
            
            if (!this.storedData || this.storedData.length === 0) {
                return { success: false, errors: ['No data to export'] };
            }

            // Check if user has specified a custom file location
            if (this.fileLocation && this.fileLocation !== this.defaultLocation) {
                // Try to use File System Access API for direct saving to specified location
                if ('showSaveFilePicker' in window) {
                    return await this.exportWithFileSystemAPI();
                } else {
                    // Fallback: Save to downloads with the specified path in filename
                    return await this.exportWithChromeDownloads();
                }
            } else {
                // No custom location specified, use default downloads folder
                return await this.exportWithChromeDownloads();
            }
        } catch (error) {
            console.error('Error exporting to preferred location:', error);
            return { success: false, errors: [error.message] };
        }
    }

    // Export using File System Access API (modern browsers)
    async exportWithFileSystemAPI() {
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            
            // Export JSON file
            const jsonContent = JSON.stringify(this.storedData, null, 2);
            const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
            
            const jsonHandle = await window.showSaveFilePicker({
                suggestedName: `job_data_${timestamp}.json`,
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            
            const jsonWritable = await jsonHandle.createWritable();
            await jsonWritable.write(jsonBlob);
            await jsonWritable.close();

            // Export CSV file
            const headers = [
                'Company Name',
                'Job Role',
                'Job Family',
                'Job Description',
                'Recruiter Name',
                'Company Section',
                'Position Summary',
                'Website Type',
                'Full Website',
                'AI Summary',
                'Saved At',
                'Days Since Published',
                'URL'
            ];
            
            let csvContent = headers.join(',') + '\n';
            for (const jobData of this.storedData) {
                const formattedData = this.formatJobDataForExcel(jobData);
                const row = headers.map(header => {
                    const value = formattedData[header.toLowerCase().replace(/\s+/g, '')] || '';
                    return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
                });
                csvContent += row.join(',') + '\n';
            }
            
            const csvBlob = new Blob([csvContent], { type: 'text/csv' });
            
            const csvHandle = await window.showSaveFilePicker({
                suggestedName: `job_data_${timestamp}.csv`,
                types: [{
                    description: 'CSV Files',
                    accept: { 'text/csv': ['.csv'] }
                }]
            });
            
            const csvWritable = await csvHandle.createWritable();
            await csvWritable.write(csvBlob);
            await csvWritable.close();
            
            return { success: true };
        } catch (error) {
            console.error('Error with File System Access API:', error);
            // Fallback to Chrome downloads if user cancels or API fails
            return await this.exportWithChromeDownloads();
        }
    }

    // Export using Chrome downloads API (fallback)
    async exportWithChromeDownloads() {
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            
            // Create JSON export
            const jsonContent = JSON.stringify(this.storedData, null, 2);
            const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
            const jsonUrl = URL.createObjectURL(jsonBlob);
            
            // Use the file location if specified, otherwise just filename
            const jsonFilename = this.fileLocation && this.fileLocation !== this.defaultLocation 
                ? `${this.fileLocation}/job_data.json`
                : `job_data.json`;
            
            await chrome.downloads.download({
                url: jsonUrl,
                filename: jsonFilename,
                saveAs: false // Save directly to downloads folder without dialog
            });

            // Create CSV export
            const headers = [
                'Company Name',
                'Job Role',
                'Job Family',
                'Job Description',
                'Comments',
                'Recruiter Name',
                'Company Section',
                'Position Summary',
                'Website Type',
                'Full Website',
                'AI Summary',
                'Saved At',
                'Days Since Published',
                'URL'
            ];
            
            let csvContent = headers.join(',') + '\n';
            for (const jobData of this.storedData) {
                const formattedData = this.formatJobDataForExcel(jobData);
                const row = headers.map(header => {
                    const value = formattedData[header.toLowerCase().replace(/\s+/g, '')] || '';
                    return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
                });
                csvContent += row.join(',') + '\n';
            }
            
            const csvBlob = new Blob([csvContent], { type: 'text/csv' });
            const csvUrl = URL.createObjectURL(csvBlob);
            
            // Use the file location if specified, otherwise just filename
            const csvFilename = this.fileLocation && this.fileLocation !== this.defaultLocation 
                ? `${this.fileLocation}/job_data.csv`
                : `job_data.csv`;
            
            await chrome.downloads.download({
                url: csvUrl,
                filename: csvFilename,
                saveAs: false // Save directly to downloads folder without dialog
            });

            // Clean up URLs
            URL.revokeObjectURL(jsonUrl);
            URL.revokeObjectURL(csvUrl);
            
            return { success: true };
        } catch (error) {
            console.error('Error with Chrome downloads API:', error);
            return { success: false, errors: [error.message] };
        }
    }
}

// Export for Node.js environment (testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FileStorageService
    };
} 