// Mock Chrome extension APIs for testing
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    getURL: jest.fn((path) => `chrome-extension://test-id/${path}`)
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    create: jest.fn()
  },
  permissions: {
    request: jest.fn(),
    contains: jest.fn()
  }
};

// Mock console for testing
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

// Mock fetch for API testing
global.fetch = jest.fn();

// Mock File System Access API
global.showSaveFilePicker = jest.fn();
global.showDirectoryPicker = jest.fn();

// Mock extractor classes for content script testing
// These are minimal mocks just for testing the content script structure
global.BaseExtractor = class BaseExtractor {
  constructor(document) {
    this.document = document;
  }
  
  static createExtractor = jest.fn((document, url) => {
    // This will be replaced by the actual extractor classes in the browser
    return new global.BaseExtractor(document);
  });
  
  extractJobData() {
    // This will be overridden by actual extractors
    return {};
  }
  
  validateData(data) {
    return { isValid: false, errors: ['Mock data not allowed'] };
  }
}; 