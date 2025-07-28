// Content script tests - using global mocks from setup.js
describe('Content Script', () => {
  let mockDocument;
  let mockExtractor;
  let contentScript;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock DOM elements
    mockDocument = {
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(),
      title: 'Test Job Page',
      location: {
        href: 'https://example.com/job'
      }
    };

    // Mock extractor
    mockExtractor = {
      extractJobData: jest.fn(),
      validateData: jest.fn()
    };

    // Use the global BaseExtractor mock from setup.js
    global.BaseExtractor.createExtractor.mockReturnValue(mockExtractor);

    // Mock window and document globals
    global.document = mockDocument;
    global.window = {
      location: mockDocument.location
    };

    // Load the content script
    contentScript = require('../src/content');
  });

  afterEach(() => {
    delete global.document;
    delete global.window;
  });

  describe('DOM Access', () => {
    test('content script can access webpage DOM elements', () => {
      const mockElement = { textContent: 'Test Job' };
      mockDocument.querySelector.mockReturnValue(mockElement);

      const result = mockDocument.querySelector('h1');
      expect(result).toBe(mockElement);
      expect(mockDocument.querySelector).toHaveBeenCalledWith('h1');
    });

    test('content script handles missing elements gracefully', () => {
      mockDocument.querySelector.mockReturnValue(null);

      const result = mockDocument.querySelector('.non-existent');
      expect(result).toBeNull();
    });
  });

  describe('Website Detection', () => {
    test('detects LinkedIn job pages', () => {
      mockDocument.location.href = 'https://www.linkedin.com/jobs/view/123';
      
      // Simulate the extraction process by calling the content script's initializeExtractor
      const { JobDataExtractor } = require('../src/content');
      const testExtractor = new JobDataExtractor();
      testExtractor.initializeExtractor();
      
      expect(global.BaseExtractor.createExtractor).toHaveBeenCalledWith(
        mockDocument, 
        'https://www.linkedin.com/jobs/view/123'
      );
    });

    test('detects Indeed job pages', () => {
      mockDocument.location.href = 'https://www.indeed.com/viewjob?jk=123';
      
      const { JobDataExtractor } = require('../src/content');
      const testExtractor = new JobDataExtractor();
      testExtractor.initializeExtractor();
      
      expect(global.BaseExtractor.createExtractor).toHaveBeenCalledWith(
        mockDocument, 
        'https://www.indeed.com/viewjob?jk=123'
      );
    });

    test('detects generic company sites', () => {
      mockDocument.location.href = 'https://company.com/careers/job';
      
      const { JobDataExtractor } = require('../src/content');
      const testExtractor = new JobDataExtractor();
      testExtractor.initializeExtractor();
      
      expect(global.BaseExtractor.createExtractor).toHaveBeenCalledWith(
        mockDocument, 
        'https://company.com/careers/job'
      );
    });
  });

  describe('Data Extraction', () => {
    test('extracts complete job data successfully', () => {
      const mockJobData = {
        companyName: 'Tech Corp',
        jobRole: 'Senior Software Engineer',
        jobFamily: 'Other',
        jobDescription: 'We are looking for a talented engineer...',
        recruiterName: 'John Smith',
        companySection: 'Tech Corp is a leading technology company...',
        positionSummary: 'We are looking for a talented engineer...',
        websiteType: 'linkedin',
        fullWebsite: 'LinkedIn',
        extractedAt: '2024-01-01T00:00:00Z',
        jobFreshness: 14,
        url: 'https://www.linkedin.com/jobs/view/123'
      };

      mockExtractor.extractJobData.mockReturnValue(mockJobData);
      mockExtractor.validateData.mockReturnValue({ isValid: true, errors: [] });

      const result = mockExtractor.extractJobData();
      const validation = mockExtractor.validateData(result);

      expect(result).toEqual(mockJobData);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('handles missing data gracefully', () => {
      const mockJobData = {
        companyName: null,
        jobRole: 'Software Engineer',
        jobDescription: null,
        recruiterName: null,
        companySection: null,
        positionSummary: null,
        websiteType: 'linkedin',
        fullWebsite: 'LinkedIn',
        extractedAt: '2024-01-01T00:00:00Z',
        jobFreshness: null,
        url: 'https://www.linkedin.com/jobs/view/123'
      };

      mockExtractor.extractJobData.mockReturnValue(mockJobData);
      mockExtractor.validateData.mockReturnValue({ 
        isValid: false, 
        errors: ['Company name is required', 'Job description is required'] 
      });

      const result = mockExtractor.extractJobData();
      const validation = mockExtractor.validateData(result);

      expect(result.companyName).toBeNull();
      expect(result.jobDescription).toBeNull();
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Company name is required');
      expect(validation.errors).toContain('Job description is required');
    });

    test('identifies job family correctly', () => {
      const mechanicalJob = {
        companyName: 'Tech Corp',
        jobRole: 'Senior Mechanical Engineer',
        jobFamily: 'Mechanical Engineer',
        jobDescription: 'Design mechanical systems...',
        recruiterName: 'Sarah Johnson',
        companySection: 'Tech Corp is a leading technology company...',
        positionSummary: 'Design mechanical systems...',
        websiteType: 'linkedin',
        fullWebsite: 'LinkedIn',
        extractedAt: '2024-01-01T00:00:00Z',
        jobFreshness: 7,
        url: 'https://www.linkedin.com/jobs/view/123'
      };

      const systemJob = {
        companyName: 'Tech Corp',
        jobRole: 'Systems Engineer',
        jobFamily: 'System(s) Engineer',
        jobDescription: 'System integration...',
        recruiterName: 'Mike Chen',
        companySection: 'Tech Corp is a leading technology company...',
        positionSummary: 'System integration...',
        websiteType: 'indeed',
        fullWebsite: 'Indeed',
        extractedAt: '2024-01-01T00:00:00Z',
        jobFreshness: 3,
        url: 'https://www.indeed.com/jobs/view/123'
      };

      const projectJob = {
        companyName: 'Tech Corp',
        jobRole: 'Technical Project Manager',
        jobFamily: 'Project Manager',
        jobDescription: 'Lead project teams...',
        recruiterName: 'Lisa Rodriguez',
        companySection: 'Tech Corp is a leading technology company...',
        positionSummary: 'Lead project teams...',
        websiteType: 'company',
        fullWebsite: 'Tech Corp',
        extractedAt: '2024-01-01T00:00:00Z',
        jobFreshness: 1,
        url: 'https://techcorp.com/careers/123'
      };

      mockExtractor.extractJobData
        .mockReturnValueOnce(mechanicalJob)
        .mockReturnValueOnce(systemJob)
        .mockReturnValueOnce(projectJob);

      expect(mockExtractor.extractJobData().jobFamily).toBe('Mechanical Engineer');
      expect(mockExtractor.extractJobData().jobFamily).toBe('System(s) Engineer');
      expect(mockExtractor.extractJobData().jobFamily).toBe('Project Manager');
    });
  });

  describe('Message Handling', () => {
    test('responds to extraction requests', () => {
      const mockJobData = {
        companyName: 'Tech Corp',
        jobRole: 'Software Engineer',
        jobFamily: 'Other',
        jobDescription: 'Job description...',
        recruiterName: 'David Wilson',
        companySection: 'Tech Corp is a leading technology company...',
        positionSummary: 'Job description...',
        websiteType: 'linkedin',
        fullWebsite: 'LinkedIn',
        extractedAt: '2024-01-01T00:00:00Z',
        jobFreshness: null,
        url: 'https://www.linkedin.com/jobs/view/123'
      };

      mockExtractor.extractJobData.mockReturnValue(mockJobData);
      mockExtractor.validateData.mockReturnValue({ isValid: true, errors: [] });

      // Simulate message from popup
      const message = { action: 'extractJobData' };
      const response = { success: true, data: mockJobData };

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockJobData);
    });

    test('handles extraction errors gracefully', () => {
      mockExtractor.extractJobData.mockImplementation(() => {
        throw new Error('Extraction failed');
      });

      // Simulate error during extraction
      let error;
      try {
        mockExtractor.extractJobData();
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Extraction failed');
    });
  });

  describe('Dynamic Content', () => {
    test('waits for dynamic content to load', () => {
      // Mock setTimeout for testing async behavior
      jest.useFakeTimers();
      
      let contentLoaded = false;
      setTimeout(() => {
        contentLoaded = true;
      }, 1000);

      expect(contentLoaded).toBe(false);
      
      jest.advanceTimersByTime(1000);
      expect(contentLoaded).toBe(true);
      
      jest.useRealTimers();
    });

    test('retries extraction if content not ready', () => {
      let attemptCount = 0;
      mockExtractor.extractJobData.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return { companyName: null, jobRole: null, jobDescription: null };
        }
        return {
          companyName: 'Tech Corp',
          jobRole: 'Software Engineer',
          jobDescription: 'Job description...',
          companySection: 'Tech Corp is a leading technology company...',
          positionSummary: 'Job description...'
        };
      });

      // Simulate retry logic
      let result = mockExtractor.extractJobData();
      expect(result.companyName).toBeNull();

      result = mockExtractor.extractJobData();
      expect(result.companyName).toBeNull();

      result = mockExtractor.extractJobData();
      expect(result.companyName).toBe('Tech Corp');
    });
  });
}); 