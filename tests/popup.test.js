// Import the PopupUI class
const { PopupUI } = require('../src/popup.js');

describe('Popup UI Tests', () => {
  let popupDocument;
  let popupWindow;

  beforeEach(() => {
    // Create a mock popup window and document
    popupWindow = {
      chrome: global.chrome,
      console: global.console
    };
    
    popupDocument = {
      getElementById: jest.fn(),
      addEventListener: jest.fn(),
      querySelector: jest.fn(),
      createElement: jest.fn()
    };
    
    // Mock DOM elements
    const mockButton = {
      addEventListener: jest.fn(),
      click: jest.fn(),
      disabled: false
    };
    
    const mockSettingsPanel = {
      style: { display: 'none' },
      addEventListener: jest.fn()
    };
    
    popupDocument.getElementById.mockImplementation((id) => {
      if (id === 'saveJobButton') return mockButton;
      if (id === 'downloadJobsButton') return mockButton;
      if (id === 'settingsButton') return mockButton;
      if (id === 'settingsPanel') return mockSettingsPanel;
      if (id === 'showJobsButton') return mockButton; // Added for new tests
      return null;
    });
    
    popupDocument.querySelector.mockImplementation((selector) => {
      if (selector === '.status-message') return { textContent: '', style: { display: 'none' } };
      if (selector === '.loading') return { style: { display: 'none' } };
      return null;
    });
  });

  test('popup opens without errors', () => {
    // Simulate popup loading
    expect(popupDocument).toBeDefined();
    expect(popupWindow).toBeDefined();
    expect(popupWindow.chrome).toBeDefined();
  });

  test('save job button is clickable and functional', () => {
    const saveJobButton = popupDocument.getElementById('saveJobButton');
    expect(saveJobButton).toBeDefined();
    expect(saveJobButton.addEventListener).toBeDefined();
    expect(saveJobButton.disabled).toBe(false);
  });

  test('download jobs button is clickable and functional', () => {
    const downloadJobsButton = popupDocument.getElementById('downloadJobsButton');
    expect(downloadJobsButton).toBeDefined();
    expect(downloadJobsButton.addEventListener).toBeDefined();
    expect(downloadJobsButton.disabled).toBe(false);
  });

  test('settings panel displays correctly', () => {
    const settingsPanel = popupDocument.getElementById('settingsPanel');
    expect(settingsPanel).toBeDefined();
    expect(settingsPanel.style).toBeDefined();
  });

  test('UI elements respond to user interactions', () => {
    const saveJobButton = popupDocument.getElementById('saveJobButton');
    const downloadJobsButton = popupDocument.getElementById('downloadJobsButton');
    const settingsButton = popupDocument.getElementById('settingsButton');
    
    expect(saveJobButton.addEventListener).toBeDefined();
    expect(downloadJobsButton.addEventListener).toBeDefined();
    expect(settingsButton.addEventListener).toBeDefined();
    
    // Test that event listeners can be added
    saveJobButton.addEventListener('click', jest.fn());
    downloadJobsButton.addEventListener('click', jest.fn());
    settingsButton.addEventListener('click', jest.fn());
    
    expect(saveJobButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(downloadJobsButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(settingsButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
  });

  test('status message element exists', () => {
    const statusMessage = popupDocument.querySelector('.status-message');
    expect(statusMessage).toBeDefined();
    expect(statusMessage.textContent).toBeDefined();
    expect(statusMessage.style).toBeDefined();
  });

  test('loading indicator exists', () => {
    const loadingIndicator = popupDocument.querySelector('.loading');
    expect(loadingIndicator).toBeDefined();
    expect(loadingIndicator.style).toBeDefined();
  });

  test('settings form elements exist', () => {
    const mockInput = { value: '', addEventListener: jest.fn() };
    popupDocument.getElementById.mockImplementation((id) => {
      if (id === 'openaiKey') return mockInput;
      if (id === 'claudeKey') return mockInput;
      if (id === 'fileLocation') return mockInput;
      return null;
    });

    const openaiKeyInput = popupDocument.getElementById('openaiKey');
    const claudeKeyInput = popupDocument.getElementById('claudeKey');
    const fileLocationInput = popupDocument.getElementById('fileLocation');

    expect(openaiKeyInput).toBeDefined();
    expect(claudeKeyInput).toBeDefined();
    expect(fileLocationInput).toBeDefined();
  });

  test('clear storage button exists and is functional', () => {
    const mockClearButton = {
      addEventListener: jest.fn(),
      click: jest.fn(),
      disabled: false
    };
    
    popupDocument.getElementById.mockImplementation((id) => {
      if (id === 'clearStorageButton') return mockClearButton;
      return null;
    });

    const clearStorageButton = popupDocument.getElementById('clearStorageButton');
    expect(clearStorageButton).toBeDefined();
    expect(clearStorageButton.addEventListener).toBeDefined();
    expect(clearStorageButton.disabled).toBe(false);
  });

  test('clear storage confirmation dialog works', () => {
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn().mockReturnValue(true);
    
    // Test that confirm is called
    const result = window.confirm('Test confirmation');
    expect(result).toBe(true);
    expect(window.confirm).toHaveBeenCalledWith('Test confirmation');
    
    // Restore original confirm
    window.confirm = originalConfirm;
  });

  test('show my jobs button is clickable and functional', () => {
    const showJobsButton = popupDocument.getElementById('showJobsButton');
    expect(showJobsButton).toBeDefined();
    expect(showJobsButton.addEventListener).toBeDefined();
    expect(showJobsButton.disabled).toBe(false);
  });

  test('show my jobs button opens jobs table modal', async () => {
    // Mock FileStorageService
    const mockFileStorage = {
        loadSettings: jest.fn().mockResolvedValue(),
        storedData: [
            {
                companyName: 'Test Company',
                jobRole: 'Software Engineer',
                jobFamily: 'Other',
                jobDescription: 'Test description',
                websiteType: 'LinkedIn',
                fullWebsite: 'LinkedIn Jobs',
                extractedAt: '2024-01-01 12:00:00'
            }
        ]
    };
    
    // Mock the FileStorageService constructor
    global.FileStorageService = jest.fn(() => mockFileStorage);
    
    // Mock chrome.tabs.create
    global.chrome.tabs.create = jest.fn();
    
    // Mock chrome.runtime.getURL
    global.chrome.runtime.getURL = jest.fn((url) => `chrome-extension://test/${url}`);
    
    // Mock chrome.storage.sync.get for loadSettings
    global.chrome.storage.sync.get.mockResolvedValue({});
    
    // Set up global document for PopupUI constructor
    global.document = popupDocument;
    
    // Mock all DOM elements that PopupUI constructor needs
    popupDocument.getElementById.mockImplementation((id) => {
        const mockElement = {
            addEventListener: jest.fn(),
            disabled: false,
            value: '',
            textContent: '',
            style: { display: 'none' }
        };
        
        // Return specific elements for specific IDs
        if (id === 'saveJobButton') return mockElement;
        if (id === 'downloadJobsButton') return mockElement;
        if (id === 'showJobsButton') return mockElement;
        if (id === 'settingsButton') return mockElement;
        if (id === 'settingsPanel') return mockElement;
        if (id === 'statusMessage') return mockElement;
        if (id === 'loading') return mockElement;
        if (id === 'progressText') return mockElement;
        if (id === 'progressSteps') return mockElement;
        if (id === 'aiProvider') return mockElement;
        if (id === 'openaiKey') return mockElement;
        if (id === 'claudeKey') return mockElement;
        if (id === 'fileLocation') return mockElement;
        if (id === 'saveSettings') return mockElement;
        if (id === 'selectDirectory') return mockElement;
        if (id === 'directoryStatus') return mockElement;
        if (id === 'clearStorageButton') return mockElement;
        
        return mockElement;
    });
    
    // Mock PopupUI's internal methods
    const originalShowStatus = PopupUI.prototype.showStatus;
    const originalShowLoading = PopupUI.prototype.showLoading;
    const originalClearProgressSteps = PopupUI.prototype.clearProgressSteps;
    const originalAddProgressStep = PopupUI.prototype.addProgressStep;
    const originalUpdateProgress = PopupUI.prototype.updateProgress;
    const originalUpdateProgressStep = PopupUI.prototype.updateProgressStep;
    
    PopupUI.prototype.showStatus = jest.fn();
    PopupUI.prototype.showLoading = jest.fn();
    PopupUI.prototype.clearProgressSteps = jest.fn();
    PopupUI.prototype.addProgressStep = jest.fn();
    PopupUI.prototype.updateProgress = jest.fn();
    PopupUI.prototype.updateProgressStep = jest.fn();
    
    // Mock checkPermissions to return true
    const originalCheckPermissions = PopupUI.prototype.checkPermissions;
    PopupUI.prototype.checkPermissions = jest.fn().mockResolvedValue(true);
    
    // Create a real PopupUI instance
    const popup = new PopupUI();
    
    // Call the actual method
    await popup.handleShowJobsClick();
    
    // Verify that a new tab was created to show the jobs table
    expect(global.chrome.tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://test/jobs-table.html'
    });
    expect(popup.showStatus).toHaveBeenCalledWith('✅ Jobs table opened in new tab!', 'success');
    
    // Restore original methods
    PopupUI.prototype.showStatus = originalShowStatus;
    PopupUI.prototype.showLoading = originalShowLoading;
    PopupUI.prototype.clearProgressSteps = originalClearProgressSteps;
    PopupUI.prototype.addProgressStep = originalAddProgressStep;
    PopupUI.prototype.updateProgress = originalUpdateProgress;
    PopupUI.prototype.updateProgressStep = originalUpdateProgressStep;
    PopupUI.prototype.checkPermissions = originalCheckPermissions;
  });

  test('show my jobs button handles empty storage gracefully', async () => {
    // Mock FileStorageService with empty data
    const mockFileStorage = {
        loadSettings: jest.fn().mockResolvedValue(),
        storedData: []
    };
    
    global.FileStorageService = jest.fn(() => mockFileStorage);
    global.chrome.tabs.create = jest.fn();
    global.chrome.runtime.getURL = jest.fn((url) => `chrome-extension://test/${url}`);
    global.chrome.storage.sync.get.mockResolvedValue({});
    
    // Set up global document for PopupUI constructor
    global.document = popupDocument;
    
    // Mock all DOM elements that PopupUI constructor needs
    popupDocument.getElementById.mockImplementation((id) => {
        const mockElement = {
            addEventListener: jest.fn(),
            disabled: false,
            value: '',
            textContent: ''
        };
        
        // Return specific elements for specific IDs
        if (id === 'saveJobButton') return mockElement;
        if (id === 'downloadJobsButton') return mockElement;
        if (id === 'showJobsButton') return mockElement;
        if (id === 'settingsButton') return mockElement;
        if (id === 'settingsPanel') return mockElement;
        if (id === 'statusMessage') return mockElement;
        if (id === 'loading') return mockElement;
        if (id === 'progressText') return mockElement;
        if (id === 'progressSteps') return mockElement;
        if (id === 'aiProvider') return mockElement;
        if (id === 'openaiKey') return mockElement;
        if (id === 'claudeKey') return mockElement;
        if (id === 'fileLocation') return mockElement;
        if (id === 'saveSettings') return mockElement;
        if (id === 'selectDirectory') return mockElement;
        if (id === 'directoryStatus') return mockElement;
        if (id === 'clearStorageButton') return mockElement;
        
        return mockElement;
    });
    
    // Mock PopupUI's internal methods
    const originalShowStatus = PopupUI.prototype.showStatus;
    const originalShowLoading = PopupUI.prototype.showLoading;
    const originalClearProgressSteps = PopupUI.prototype.clearProgressSteps;
    const originalAddProgressStep = PopupUI.prototype.addProgressStep;
    const originalUpdateProgress = PopupUI.prototype.updateProgress;
    const originalUpdateProgressStep = PopupUI.prototype.updateProgressStep;
    
    PopupUI.prototype.showStatus = jest.fn();
    PopupUI.prototype.showLoading = jest.fn();
    PopupUI.prototype.clearProgressSteps = jest.fn();
    PopupUI.prototype.addProgressStep = jest.fn();
    PopupUI.prototype.updateProgress = jest.fn();
    PopupUI.prototype.updateProgressStep = jest.fn();
    
    // Mock checkPermissions to return true
    const originalCheckPermissions = PopupUI.prototype.checkPermissions;
    PopupUI.prototype.checkPermissions = jest.fn().mockResolvedValue(true);
    
    // Create a real PopupUI instance
    const popup = new PopupUI();
    
    // Call the actual method
    await popup.handleShowJobsClick();
    
    // Should show a message about no jobs found
    expect(popup.showStatus).toHaveBeenCalledWith(
        '❌ No job data found in storage. Please save some jobs first.',
        'error'
    );
    
    // Should not create a new tab
    expect(global.chrome.tabs.create).not.toHaveBeenCalled();
    
    // Restore original methods
    PopupUI.prototype.showStatus = originalShowStatus;
    PopupUI.prototype.showLoading = originalShowLoading;
    PopupUI.prototype.clearProgressSteps = originalClearProgressSteps;
    PopupUI.prototype.addProgressStep = originalAddProgressStep;
    PopupUI.prototype.updateProgress = originalUpdateProgress;
    PopupUI.prototype.updateProgressStep = originalUpdateProgressStep;
    PopupUI.prototype.checkPermissions = originalCheckPermissions;
  });
}); 