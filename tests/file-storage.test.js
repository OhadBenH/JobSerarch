const { FileStorageService } = require('../src/file-storage');

// Mock Chrome APIs for file operations
global.chrome = {
  ...global.chrome,
  downloads: {
    download: jest.fn().mockResolvedValue({ id: 1 })
  },
  storage: {
    ...global.chrome.storage,
    local: {
      ...global.chrome.storage.local,
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    },
    sync: {
      ...global.chrome.storage.sync,
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    }
  }
};

// Mock Blob and URL.createObjectURL for browser APIs
global.Blob = jest.fn().mockImplementation((content, options) => ({
  content,
  options,
  size: content[0].length
}));

global.URL = {
  createObjectURL: jest.fn().mockReturnValue('blob:mock-url'),
  revokeObjectURL: jest.fn()
};

describe('File Storage Service', () => {
  let fileStorage;
  let mockJobData;

  beforeEach(() => {
    jest.clearAllMocks();
    fileStorage = new FileStorageService();
    
    mockJobData = {
      companyName: 'Test Company',
      jobRole: 'Software Engineer',
      jobFamily: 'System(s) Engineer',
      jobDescription: 'Test job description',
      recruiterName: 'John Smith',
      companySection: 'Test Company is a leading technology company focused on innovation.',
      positionSummary: 'We are looking for a talented engineer to join our team.',
      websiteType: 'LinkedIn',
      fullWebsite: 'https://linkedin.com/jobs/test',
      aiSummary: {
        requirements: ['JavaScript', 'React'],
        responsibilities: ['Develop web apps'],
        keySkills: ['Problem solving']
      },
      extractedAt: new Date().toISOString(),
      jobFreshness: 14,
      url: 'https://linkedin.com/jobs/test'
    };

    // Mock Chrome storage
    chrome.storage.sync.get.mockResolvedValue({
      fileLocation: 'C:\\JobSearch\\'
    });
    chrome.storage.local.get.mockResolvedValue({
      storedJobData: []
    });
    chrome.storage.local.set.mockResolvedValue();
    chrome.storage.sync.set.mockResolvedValue();
    chrome.downloads.download.mockResolvedValue({ id: 1 });
  });

  describe('FileStorageService', () => {
    test('initializes with default settings', () => {
      expect(fileStorage).toBeDefined();
      expect(fileStorage.defaultLocation).toBe('JobSearch');
      expect(fileStorage.storedData).toEqual([]);
    });

        test('loads file location from storage', async () => {
      await fileStorage.loadSettings();
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(['fileLocation']);
      expect(chrome.storage.local.get).toHaveBeenCalledWith(['storedJobData']);
      expect(fileStorage.fileLocation).toBe('C:\\JobSearch\\');
    });

    test('saves file location to storage', async () => {
      const testLocation = 'C:\\TestLocation\\';
      await fileStorage.saveFileLocation(testLocation);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        fileLocation: testLocation
      });
      expect(fileStorage.fileLocation).toBe(testLocation);
    });
  });

  describe('JSON File Operations', () => {
    test('creates new JSON file when none exists', async () => {
      chrome.storage.local.get.mockResolvedValue({
        fileLocation: 'C:\\JobSearch\\',
        storedJobData: []
      });
      
      const result = await fileStorage.saveToJSON(mockJobData);
      
      expect(result.success).toBe(true);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        storedJobData: [expect.objectContaining({ companyName: 'Test Company' })]
      });
      expect(chrome.downloads.download).toHaveBeenCalledWith({
        url: 'blob:mock-url',
        filename: 'C:\\JobSearch\\/job_data.json',
        saveAs: false
      });
    });

    test('appends to existing JSON file', async () => {
      const existingData = [{ companyName: 'Existing Company' }];
      chrome.storage.local.get.mockResolvedValue({
        fileLocation: 'C:\\JobSearch\\',
        storedJobData: existingData
      });
      
      const result = await fileStorage.saveToJSON(mockJobData);
      
      expect(result.success).toBe(true);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        storedJobData: [
          { companyName: 'Existing Company' },
          expect.objectContaining({ companyName: 'Test Company' })
        ]
      });
    });

    test('handles JSON file creation errors', async () => {
      chrome.storage.local.set.mockRejectedValue(new Error('Storage error'));
      
      const result = await fileStorage.saveToJSON(mockJobData);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Storage error');
    });
  });

  describe('Excel File Operations', () => {
    test('creates new Excel file with headers', async () => {
      const result = await fileStorage.saveToExcel(mockJobData);
      
      expect(result.success).toBe(true);
      expect(chrome.downloads.download).toHaveBeenCalledWith({
        url: 'blob:mock-url',
        filename: 'C:\\JobSearch\\/job_data.csv',
        saveAs: false
      });
    });

    test('handles Excel file creation errors', async () => {
      chrome.downloads.download.mockRejectedValue(new Error('Download error'));

      const fileStorage = new FileStorageService();
      const result = await fileStorage.saveToExcel(mockJobData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Download failed: Download error. Please try again or use a different save location.');
    });

    test('formats CSV content correctly', async () => {
      await fileStorage.saveToExcel(mockJobData);
      
      expect(Blob).toHaveBeenCalledWith(
        [expect.stringContaining('Company Name,Job Role,Job Family')],
        { type: 'text/csv' }
      );
    });
  });

  describe('Combined File Operations', () => {
    test('saves data to both JSON and Excel formats', async () => {
      const result = await fileStorage.saveJobData(mockJobData);
      
      expect(result.success).toBe(true);
      expect(result.jsonSaved).toBe(true);
      expect(result.excelSaved).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('continues if one format fails', async () => {
      chrome.storage.local.set.mockResolvedValue();
      chrome.downloads.download
        .mockResolvedValueOnce({ id: 1 }) // JSON succeeds
        .mockRejectedValueOnce(new Error('Download error')); // Excel fails

      const fileStorage = new FileStorageService();
      const result = await fileStorage.saveJobData(mockJobData);

      expect(result.success).toBe(true); // Success because JSON was saved
      expect(result.jsonSaved).toBe(true);
      expect(result.excelSaved).toBe(false);
      expect(result.errors).toContain('Download failed: Download error. Please try again or use a different save location.');
    });

    test('handles complete failure gracefully', async () => {
      chrome.storage.local.set.mockRejectedValue(new Error('Storage error'));
      chrome.downloads.download.mockRejectedValue(new Error('Download error'));

      const fileStorage = new FileStorageService();
      const result = await fileStorage.saveJobData(mockJobData);

      expect(result.success).toBe(false);
      expect(result.jsonSaved).toBe(false);
      expect(result.excelSaved).toBe(false);
      expect(result.errors).toContain('Storage error');
      expect(result.errors).toContain('Download failed: Download error. Please try again or use a different save location.');
    });
  });

  describe('File Location Management', () => {
    test('uses default location when none specified', async () => {
      chrome.storage.sync.get.mockResolvedValue({});
      chrome.storage.local.get.mockResolvedValue({});
      
      await fileStorage.loadSettings();
      const location = fileStorage.getFileLocation();
      
      expect(location).toBe(fileStorage.defaultLocation);
    });

    test('uses custom location when specified', async () => {
      const customLocation = 'C:\\CustomPath\\';
      chrome.storage.sync.get.mockResolvedValue({
        fileLocation: customLocation
      });
      
      await fileStorage.loadSettings();
      const location = fileStorage.getFileLocation();
      
      expect(location).toBe(customLocation);
    });

    test('validates file location path', () => {
      const validPath = 'C:\\ValidPath\\';
      const invalidPath = 'invalid/path';
      
      expect(fileStorage.validatePath(validPath)).toBe(true);
      expect(fileStorage.validatePath(invalidPath)).toBe(false);
    });
  });

  describe('Data Formatting', () => {
    test('formats job data for JSON correctly', () => {
      const formatted = fileStorage.formatJobDataForJSON(mockJobData);
      
      expect(formatted).toHaveProperty('companyName', 'Test Company');
      expect(formatted).toHaveProperty('jobRole', 'Software Engineer');
      expect(formatted).toHaveProperty('aiSummary');
      expect(formatted).toHaveProperty('extractedAt');
    });

    test('formats job data for Excel correctly', () => {
      const formatted = fileStorage.formatJobDataForExcel(mockJobData);
      
      expect(typeof formatted).toBe('object');
      expect(formatted.companyname).toBe('Test Company');
      expect(formatted.jobrole).toBe('Software Engineer');
      expect(formatted.jobfamily).toBe('System(s) Engineer');
      expect(formatted.recruitername).toBe('John Smith');
    });

    test('handles missing AI summary gracefully', () => {
      const jobDataWithoutAI = { ...mockJobData };
      delete jobDataWithoutAI.aiSummary;
      
      const jsonFormatted = fileStorage.formatJobDataForJSON(jobDataWithoutAI);
      const excelFormatted = fileStorage.formatJobDataForExcel(jobDataWithoutAI);
      
      expect(jsonFormatted.aiSummary).toBeNull();
      expect(excelFormatted.aisummary).toBe('N/A');
    });

    test('handles missing recruiter name gracefully', () => {
      const jobDataWithoutRecruiter = { ...mockJobData };
      delete jobDataWithoutRecruiter.recruiterName;
      
      const excelFormatted = fileStorage.formatJobDataForExcel(jobDataWithoutRecruiter);
      
      expect(excelFormatted.recruitername).toBe('N/A');
    });

    test('includes company section in Excel formatting', () => {
      const jobDataWithSections = { 
        ...mockJobData, 
        companySection: 'Tech Corp is a leading technology company focused on innovation and excellence.'
      };
      
      const excelFormatted = fileStorage.formatJobDataForExcel(jobDataWithSections);
      
      expect(excelFormatted.companysection).toBe('Tech Corp is a leading technology company focused on innovation and excellence.');
    });

    test('includes position summary in Excel formatting', () => {
      const jobDataWithSections = { 
        ...mockJobData, 
        positionSummary: 'We are looking for a talented engineer to join our team and develop high-quality software solutions.'
      };
      
      const excelFormatted = fileStorage.formatJobDataForExcel(jobDataWithSections);
      
      expect(excelFormatted.positionsummary).toBe('We are looking for a talented engineer to join our team and develop high-quality software solutions.');
    });

    test('handles missing company section gracefully', () => {
      const jobDataWithoutCompanySection = { ...mockJobData };
      delete jobDataWithoutCompanySection.companySection;
      
      const excelFormatted = fileStorage.formatJobDataForExcel(jobDataWithoutCompanySection);
      
      expect(excelFormatted.companysection).toBe('N/A');
    });

    test('handles missing position summary gracefully', () => {
      const jobDataWithoutPositionSummary = { ...mockJobData };
      delete jobDataWithoutPositionSummary.positionSummary;
      
      const excelFormatted = fileStorage.formatJobDataForExcel(jobDataWithoutPositionSummary);
      
      expect(excelFormatted.positionsummary).toBe('N/A');
    });
  });

  describe('Data Management', () => {
    test('gets all stored job data', async () => {
      const storedData = [{ companyName: 'Test Company' }];
      chrome.storage.local.get.mockResolvedValue({
        storedJobData: storedData
      });
      
      const result = await fileStorage.getAllJobData();
      
      expect(result).toEqual(storedData);
    });

    test('clears stored data', async () => {
      fileStorage.storedData = [{ companyName: 'Test Company' }];
      
      const result = await fileStorage.clearStoredData();
      
      expect(result.success).toBe(true);
      expect(fileStorage.storedData).toEqual([]);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        storedJobData: []
      });
    });

    test('prevents duplicate entries based on URL', async () => {
      const existingData = [{ 
        companyName: 'Existing Company',
        url: 'https://linkedin.com/jobs/test'
      }];
      chrome.storage.sync.get.mockResolvedValue({
        fileLocation: 'C:\\JobSearch\\'
      });
      chrome.storage.local.get.mockResolvedValue({
        storedJobData: existingData
      });
      
      const result = await fileStorage.saveJobData(mockJobData);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('This job has already been saved. URL already exists in storage.');
      expect(result.jsonSaved).toBe(false);
      expect(result.excelSaved).toBe(false);
    });

    test('allows new entries with different URLs', async () => {
      const existingData = [{ 
        companyName: 'Existing Company',
        url: 'https://linkedin.com/jobs/different'
      }];
      chrome.storage.sync.get.mockResolvedValue({
        fileLocation: 'C:\\JobSearch\\'
      });
      chrome.storage.local.get.mockResolvedValue({
        storedJobData: existingData
      });
      
      const result = await fileStorage.saveJobData(mockJobData);
      
      expect(result.success).toBe(true);
      expect(result.jsonSaved).toBe(true);
      expect(result.excelSaved).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('handles storage errors gracefully', async () => {
      chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      
      const result = await fileStorage.loadSettings();
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Storage error');
    });

    test('provides meaningful error messages', async () => {
      // Mock both storage and download to fail so that success becomes false
      chrome.storage.local.set.mockRejectedValue(new Error('Permission denied'));
      chrome.downloads.download.mockRejectedValue(new Error('Download permission denied'));

      const fileStorage = new FileStorageService();
      const result = await fileStorage.saveJobData(mockJobData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Storage permission denied. Please check Chrome extension permissions and try again.');
    });
  });

  describe('clearStorage', () => {
      beforeEach(() => {
          // Mock chrome.storage.local.clear
          global.chrome.storage.local.clear = jest.fn((callback) => {
              callback();
          });
          
          // Mock chrome.storage.sync.clear
          global.chrome.storage.sync.clear = jest.fn((callback) => {
              callback();
          });
      });

      it('should clear all stored job data and settings', async () => {
          const fileStorage = new FileStorageService();
          
          // Set up some mock data
          fileStorage.storedData = [
              { url: 'test1.com', companyName: 'Test Company 1' },
              { url: 'test2.com', companyName: 'Test Company 2' }
          ];
          
          const result = await fileStorage.clearStorage();
          
          expect(result.success).toBe(true);
          expect(result.message).toBe('All stored data and settings have been cleared successfully.');
          expect(fileStorage.storedData).toEqual([]);
          expect(global.chrome.storage.local.clear).toHaveBeenCalled();
          expect(global.chrome.storage.sync.clear).toHaveBeenCalled();
      });

      it('should handle errors during clearing', async () => {
          const fileStorage = new FileStorageService();
          
          // Mock chrome.storage.local.clear to throw an error
          global.chrome.storage.local.clear = jest.fn((callback) => {
              callback();
          });
          
          global.chrome.storage.sync.clear = jest.fn((callback) => {
              throw new Error('Storage clear failed');
          });
          
          const result = await fileStorage.clearStorage();
          
          expect(result.success).toBe(false);
          expect(result.errors).toContain('Failed to clear storage: Storage clear failed');
      });

      it('should return confirmation message', async () => {
          const fileStorage = new FileStorageService();
          
          const result = await fileStorage.clearStorage();
          
          expect(result.message).toBe('All stored data and settings have been cleared successfully.');
      });
  });
}); 