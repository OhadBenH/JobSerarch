// Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
    console.log('Job Search Manager extension installed');
    
    // Set default settings
    chrome.storage.sync.set({
        fileLocation: ''
    });
});

// Handle extension icon click - create persistent window
chrome.action.onClicked.addListener(async (tab) => {
    try {
        // Check if a persistent window is already open
        const windows = await chrome.windows.getAll({ windowTypes: ['popup'] });
        const existingWindow = windows.find(w => w.url && w.url.includes('persistent-window.html'));
        
        if (existingWindow) {
            // Focus the existing window
            await chrome.windows.update(existingWindow.id, { focused: true });
        } else {
            // Create a new persistent window
            const window = await chrome.windows.create({
                url: chrome.runtime.getURL('persistent-window.html'),
                type: 'popup',
                width: 450,
                height: 650,
                left: 100,
                top: 100,
                focused: true
            });
            
            // Store the window ID for focus management
            if (window && window.id) {
                chrome.storage.local.set({ 'persistentWindowId': window.id });
            }
            
            // Set up automatic focus management for this window
            setupAutoFocus(window.id);
        }
    } catch (error) {
        console.error('Error opening persistent window:', error);
    }
});

// Set up automatic focus management for persistent windows
let alwaysOnTopWindows = new Set();
let focusListeners = new Map();

function setupAutoFocus(windowId) {
    // Add to always-on-top set by default
    alwaysOnTopWindows.add(windowId);
    
    // Create focus listener for this window
    const focusListener = (focusedWindowId) => {
        // If the persistent window loses focus and it's in always-on-top mode, bring it back to front
        if (alwaysOnTopWindows.has(windowId) && 
            focusedWindowId !== windowId && 
            focusedWindowId !== chrome.windows.WINDOW_ID_NONE) {
            // Small delay to avoid interfering with user interactions
            setTimeout(async () => {
                try {
                    // Double-check that the window is still in always-on-top mode
                    if (alwaysOnTopWindows.has(windowId)) {
                        await chrome.windows.update(windowId, { focused: true });
                    }
                } catch (error) {
                    console.error('Error bringing window to front:', error);
                }
            }, 100);
        }
    };
    
    // Store the listener for potential removal
    focusListeners.set(windowId, focusListener);
    
    // Add the listener
    chrome.windows.onFocusChanged.addListener(focusListener);
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'saveJobData') {
        handleSaveJobData(message.data)
            .then(result => sendResponse({ success: true, result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
    }
    
    if (message.action === 'enableAlwaysOnTop') {
        alwaysOnTopWindows.add(message.windowId);
        console.log('Always-on-top enabled for window:', message.windowId);
        console.log('Current always-on-top windows:', Array.from(alwaysOnTopWindows));
        sendResponse({ success: true });
        return true;
    }
    
    if (message.action === 'disableAlwaysOnTop') {
        alwaysOnTopWindows.delete(message.windowId);
        console.log('Always-on-top disabled for window:', message.windowId);
        console.log('Current always-on-top windows:', Array.from(alwaysOnTopWindows));
        sendResponse({ success: true });
        return true;
    }
    
    if (message.action === 'isAlwaysOnTop') {
        const isAlwaysOnTop = alwaysOnTopWindows.has(message.windowId);
        console.log('Checking always-on-top status for window:', message.windowId, 'Result:', isAlwaysOnTop);
        sendResponse({ isAlwaysOnTop: isAlwaysOnTop });
        return true;
    }
});

async function handleSaveJobData(jobData) {
    try {
        // Save to Chrome storage
        const result = await chrome.storage.local.get(['savedJobs']);
        const savedJobs = result.savedJobs || [];
        
        // Check for duplicates
        const existingIndex = savedJobs.findIndex(job => job.url === jobData.url);
        if (existingIndex !== -1) {
            // Update existing entry
            savedJobs[existingIndex] = { ...savedJobs[existingIndex], ...jobData };
        } else {
            // Add new entry
            savedJobs.push(jobData);
        }
        
        await chrome.storage.local.set({ savedJobs });
        
        // Save to file if location is specified
        const settings = await chrome.storage.sync.get(['fileLocation']);
        if (settings.fileLocation) {
            await saveToFiles(savedJobs, settings.fileLocation);
        }
        
        return { success: true, message: 'Job saved successfully' };
    } catch (error) {
        console.error('Error saving job data:', error);
        throw error;
    }
}

async function saveToFiles(jobs, fileLocation) {
    // For now, we'll use Chrome's download API as a workaround
    // In a real implementation, you'd use the File System Access API
    
    const jsonData = JSON.stringify(jobs, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `job-data-${timestamp}.json`;
    
    await chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: false
    });

    // Clean up the blob URL
    URL.revokeObjectURL(url);
} 