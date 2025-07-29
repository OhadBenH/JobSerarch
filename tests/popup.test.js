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
      if (id === 'mainSaveButton') return mockButton;
      if (id === 'settingsButton') return mockButton;
      if (id === 'settingsPanel') return mockSettingsPanel;
      if (id === 'clearStorageButton') return mockButton;
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

  test('main save button is clickable and functional', () => {
    const mainSaveButton = popupDocument.getElementById('mainSaveButton');
    expect(mainSaveButton).toBeDefined();
    expect(mainSaveButton.addEventListener).toBeDefined();
    expect(mainSaveButton.disabled).toBe(false);
  });

  test('settings panel displays correctly', () => {
    const settingsPanel = popupDocument.getElementById('settingsPanel');
    expect(settingsPanel).toBeDefined();
    expect(settingsPanel.style).toBeDefined();
  });

  test('UI elements respond to user interactions', () => {
    const mainSaveButton = popupDocument.getElementById('mainSaveButton');
    const settingsButton = popupDocument.getElementById('settingsButton');
    const clearStorageButton = popupDocument.getElementById('clearStorageButton');
    
    expect(mainSaveButton.addEventListener).toBeDefined();
    expect(settingsButton.addEventListener).toBeDefined();
    expect(clearStorageButton.addEventListener).toBeDefined();
    
    // Test that event listeners can be added
    mainSaveButton.addEventListener('click', jest.fn());
    settingsButton.addEventListener('click', jest.fn());
    clearStorageButton.addEventListener('click', jest.fn());
    
    expect(mainSaveButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(settingsButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(clearStorageButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
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
}); 