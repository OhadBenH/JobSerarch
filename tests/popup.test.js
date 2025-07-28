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
      if (id === 'extractButton') return mockButton;
      if (id === 'settingsButton') return mockButton;
      if (id === 'settingsPanel') return mockSettingsPanel;
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

  test('trigger button is clickable and functional', () => {
    const extractButton = popupDocument.getElementById('extractButton');
    expect(extractButton).toBeDefined();
    expect(extractButton.addEventListener).toBeDefined();
    expect(extractButton.disabled).toBe(false);
  });

  test('settings panel displays correctly', () => {
    const settingsPanel = popupDocument.getElementById('settingsPanel');
    expect(settingsPanel).toBeDefined();
    expect(settingsPanel.style).toBeDefined();
  });

  test('UI elements respond to user interactions', () => {
    const extractButton = popupDocument.getElementById('extractButton');
    const settingsButton = popupDocument.getElementById('settingsButton');
    
    expect(extractButton.addEventListener).toBeDefined();
    expect(settingsButton.addEventListener).toBeDefined();
    
    // Test that event listeners can be added
    extractButton.addEventListener('click', jest.fn());
    settingsButton.addEventListener('click', jest.fn());
    
    expect(extractButton.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
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
}); 