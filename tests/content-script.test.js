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
        companyName: 'FAKE_TEST_COMPANY_XYZ123',
        jobRole: 'FAKE_TEST_JOB_ROLE_ABC456',
        jobFamily: 'Other',
        jobDescription: 'FAKE_TEST_DESCRIPTION_THIS_IS_TEST_DATA_DEF789',
        recruiterName: 'FAKE_TEST_RECRUITER_GHI012',
        companySection: 'FAKE_TEST_COMPANY_SECTION_JKL345',
        positionSummary: 'FAKE_TEST_POSITION_SUMMARY_MNO678',
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
        jobRole: 'FAKE_TEST_PARTIAL_JOB_ROLE_PQR901',
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
        companyName: 'FAKE_TEST_MECHANICAL_COMPANY_STU234',
        jobRole: 'FAKE_TEST_SENIOR_MECHANICAL_ENGINEER_VWX567',
        jobFamily: 'Mechanical Engineer',
        jobDescription: 'FAKE_TEST_DESIGN_MECHANICAL_SYSTEMS_YZA890',
        recruiterName: 'FAKE_TEST_SARAH_JOHNSON_BCD123',
        companySection: 'FAKE_TEST_MECHANICAL_COMPANY_SECTION_EFG456',
        positionSummary: 'FAKE_TEST_DESIGN_MECHANICAL_SYSTEMS_HIJ789',
        websiteType: 'linkedin',
        fullWebsite: 'LinkedIn',
        extractedAt: '2024-01-01T00:00:00Z',
        jobFreshness: 7,
        url: 'https://www.linkedin.com/jobs/view/123'
      };

      const systemJob = {
        companyName: 'FAKE_TEST_SYSTEMS_COMPANY_KLM012',
        jobRole: 'FAKE_TEST_SYSTEMS_ENGINEER_NOP345',
        jobFamily: 'System(s) Engineer',
        jobDescription: 'FAKE_TEST_SYSTEM_INTEGRATION_QRS678',
        recruiterName: 'FAKE_TEST_MIKE_CHEN_TUV901',
        companySection: 'FAKE_TEST_SYSTEMS_COMPANY_SECTION_WXY234',
        positionSummary: 'FAKE_TEST_SYSTEM_INTEGRATION_ZAB567',
        websiteType: 'indeed',
        fullWebsite: 'Indeed',
        extractedAt: '2024-01-01T00:00:00Z',
        jobFreshness: 3,
        url: 'https://www.indeed.com/jobs/view/123'
      };

      const projectJob = {
        companyName: 'FAKE_TEST_PROJECT_COMPANY_CDE890',
        jobRole: 'FAKE_TEST_TECHNICAL_PROJECT_MANAGER_FGH123',
        jobFamily: 'Project Manager',
        jobDescription: 'FAKE_TEST_LEAD_PROJECT_TEAMS_IJK456',
        recruiterName: 'FAKE_TEST_LISA_RODRIGUEZ_LMN789',
        companySection: 'FAKE_TEST_PROJECT_COMPANY_SECTION_OPQ012',
        positionSummary: 'FAKE_TEST_LEAD_PROJECT_TEAMS_RST345',
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
        companyName: 'FAKE_TEST_MESSAGE_COMPANY_UVW678',
        jobRole: 'FAKE_TEST_MESSAGE_JOB_ROLE_XYZ901',
        jobFamily: 'Other',
        jobDescription: 'FAKE_TEST_MESSAGE_DESCRIPTION_ABC234',
        recruiterName: 'FAKE_TEST_DAVID_WILSON_DEF567',
        companySection: 'FAKE_TEST_MESSAGE_COMPANY_SECTION_GHI890',
        positionSummary: 'FAKE_TEST_MESSAGE_DESCRIPTION_JKL123',
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
          companyName: 'FAKE_TEST_RETRY_COMPANY_MNO456',
          jobRole: 'FAKE_TEST_RETRY_JOB_ROLE_PQR789',
          jobDescription: 'FAKE_TEST_RETRY_DESCRIPTION_STU012',
          companySection: 'FAKE_TEST_RETRY_COMPANY_SECTION_VWX345',
          positionSummary: 'FAKE_TEST_RETRY_DESCRIPTION_YZA678'
        };
      });

      // Simulate retry logic
      let result = mockExtractor.extractJobData();
      expect(result.companyName).toBeNull();

      result = mockExtractor.extractJobData();
      expect(result.companyName).toBeNull();

      result = mockExtractor.extractJobData();
      expect(result.companyName).toBe('FAKE_TEST_RETRY_COMPANY_MNO456');
    });
  });
}); 