const { BaseExtractor, LinkedInExtractor, IndeedExtractor, GenericExtractor } = require('../src/extractors');

// Mock DOM elements for testing
const createMockElement = (text, attributes = {}) => ({
  textContent: text,
  innerText: text,
  innerHTML: text,
  getAttribute: jest.fn((attr) => attributes[attr] || null),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn()
});

describe('BaseExtractor', () => {
  let extractor;
  let mockDocument;

  beforeEach(() => {
    mockDocument = {
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(),
      title: 'Test Job Page'
    };
    extractor = new BaseExtractor(mockDocument);
  });

  describe('extractJobData', () => {
    test('should extract basic job information', () => {
      const mockJobTitle = createMockElement('Software Engineer');
      const mockCompany = createMockElement('Tech Corp');
      const mockDescription = createMockElement(`
        COMPANY
        Tech Corp is a leading technology company...
        
        POSITION SUMMARY
        We are looking for a talented engineer...
      `);

      // Mock querySelector to return appropriate values based on the selector
      mockDocument.querySelector.mockImplementation((selector) => {
        if (selector === 'h1') return mockJobTitle;
        if (selector === '.job-title') return null;
        if (selector === '[class*="title"]') return null;
        if (selector === '.company-name') return mockCompany;
        if (selector === '[class*="company"]') return null;
        if (selector === '.job-description') return mockDescription;
        if (selector === '[class*="description"]') return null;
        return null;
      });

      const result = extractor.extractJobData();

      expect(result).toEqual({
        companyName: 'Tech Corp',
        jobRole: 'Software Engineer',
        jobFamily: 'Other',
        jobDescription: 'COMPANY Tech Corp is a leading technology company... POSITION SUMMARY We are looking for a talented engineer...',
        recruiterName: null,
        companySection: 'Tech Corp is a leading technology company...',
        positionSummary: 'We are looking for a talented engineer...',
        websiteType: 'other',
        fullWebsite: 'Test Job Page',
        extractedAt: expect.any(String),
        jobFreshness: null,
        url: expect.any(String)
      });
    });

    test('should handle missing job title gracefully', () => {
      const mockCompany = createMockElement('Tech Corp');
      const mockDescription = createMockElement('Job description here');

      mockDocument.querySelector
        .mockReturnValueOnce(null) // h1
        .mockReturnValueOnce(null) // .job-title
        .mockReturnValueOnce(null) // [class*="title"]
        .mockReturnValueOnce(mockCompany)  // .company-name
        .mockReturnValueOnce(mockDescription); // .job-description

      const result = extractor.extractJobData();

      expect(result.jobRole).toBeNull();
      expect(result.companyName).toBe('Tech Corp');
      expect(result.jobDescription).toBe('Job description here');
    });

    test('should handle missing company name gracefully', () => {
      const mockJobTitle = createMockElement('Software Engineer');
      const mockDescription = createMockElement('Job description here');

      mockDocument.querySelector
        .mockReturnValueOnce(mockJobTitle) // h1
        .mockReturnValueOnce(null) // .company-name
        .mockReturnValueOnce(null) // [class*="company"]
        .mockReturnValueOnce(mockDescription); // .job-description

      const result = extractor.extractJobData();

      expect(result.companyName).toBeNull();
      expect(result.jobRole).toBe('Software Engineer');
      expect(result.jobDescription).toBe('Job description here');
    });

    test('should handle missing job description gracefully', () => {
      const mockJobTitle = createMockElement('Software Engineer');
      const mockCompany = createMockElement('Tech Corp');

      mockDocument.querySelector
        .mockReturnValueOnce(mockJobTitle) // h1
        .mockReturnValueOnce(mockCompany)  // .company-name
        .mockReturnValueOnce(null) // .job-description
        .mockReturnValueOnce(null); // [class*="description"]

      const result = extractor.extractJobData();

      expect(result.jobDescription).toBeNull();
      expect(result.jobRole).toBe('Software Engineer');
      expect(result.companyName).toBe('Tech Corp');
    });
  });

  describe('determineJobFamily', () => {
    test('should identify Mechanical Engineer', () => {
      const title = 'Senior Mechanical Engineer';
      const description = 'Design mechanical systems...';
      
      const family = extractor.determineJobFamily(title, description);
      expect(family).toBe('Mechanical Engineer');
    });

    test('should identify System Engineer', () => {
      const title = 'Systems Engineer';
      const description = 'System integration and requirements...';
      
      const family = extractor.determineJobFamily(title, description);
      expect(family).toBe('System(s) Engineer');
    });

    test('should identify Project Manager', () => {
      const title = 'Technical Project Manager';
      const description = 'Lead project teams and manage timelines...';
      
      const family = extractor.determineJobFamily(title, description);
      expect(family).toBe('Project Manager');
    });

    test('should default to Other for unrecognized roles', () => {
      const title = 'Marketing Specialist';
      const description = 'Marketing and communications...';
      
      const family = extractor.determineJobFamily(title, description);
      expect(family).toBe('Other');
    });
  });

  describe('extractJobFreshness', () => {
    test('should extract weeks ago', () => {
      const description = 'Toronto, ON • 2 weeks ago • Over 100 applicants';
      const freshness = extractor.extractJobFreshness(description);
      expect(freshness).toBe(14);
    });

    test('should extract days ago', () => {
      const description = 'New York, NY • 5 days ago • Actively reviewing';
      const freshness = extractor.extractJobFreshness(description);
      expect(freshness).toBe(5);
    });

    test('should extract months ago', () => {
      const description = 'San Francisco, CA • 1 month ago • Remote';
      const freshness = extractor.extractJobFreshness(description);
      expect(freshness).toBe(30);
    });

    test('should extract hours ago', () => {
      const description = 'Austin, TX • 12 hours ago • Full-time';
      const freshness = extractor.extractJobFreshness(description);
      expect(freshness).toBe(1); // Less than a day, return 1
    });

    test('should extract minutes ago', () => {
      const description = 'Seattle, WA • 30 minutes ago • Contract';
      const freshness = extractor.extractJobFreshness(description);
      expect(freshness).toBe(1); // Less than a day, return 1
    });

    test('should return null when no freshness found', () => {
      const description = 'Job description without freshness information';
      const freshness = extractor.extractJobFreshness(description);
      expect(freshness).toBeNull();
    });

    test('should return null for empty description', () => {
      const freshness = extractor.extractJobFreshness('');
      expect(freshness).toBeNull();
    });

    test('should return null for null description', () => {
      const freshness = extractor.extractJobFreshness(null);
      expect(freshness).toBeNull();
    });
  });

  describe('formatExtractedAt', () => {
    test('should format date in US/Eastern timezone without milliseconds', () => {
      const formatted = extractor.formatExtractedAt();
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      expect(formatted).not.toMatch(/\.\d{3}Z$/); // No milliseconds
    });
  });

  describe('validateData', () => {
    test('should validate complete data', () => {
      const data = {
        companyName: 'Tech Corp',
        jobRole: 'Software Engineer',
        jobDescription: 'Job description here',
        websiteType: 'linkedin',
        fullWebsite: 'LinkedIn'
      };

      const result = extractor.validateData(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should flag missing required fields', () => {
      const data = {
        companyName: null,
        jobRole: null,
        jobDescription: 'Job description here',
        websiteType: 'linkedin',
        fullWebsite: 'LinkedIn'
      };

      const result = extractor.validateData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Company name is required');
      expect(result.errors).toContain('Job role is required');
    });

    test('should flag missing job description', () => {
      const data = {
        companyName: 'Tech Corp',
        jobRole: 'Software Engineer',
        jobDescription: null,
        websiteType: 'linkedin',
        fullWebsite: 'LinkedIn'
      };

      const result = extractor.validateData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Job description is required');
    });
  });

  describe('cleanJobDescription', () => {
    it('should remove newlines and tabs from job description', () => {
      const mockDocument = {
        querySelector: jest.fn().mockReturnValue(null)
      };
      
      const extractor = new BaseExtractor(mockDocument);
      
      const dirtyDescription = `About the job\n            \n\n            \n                \n                  AGRI-NEO – JOB DESCRIPTIONProduct Development EngineerMember of: Engineering TeamLocation: Toronto, ON   COMPANYAgri-Neo's mission is to help safely feed the world. Our vision to accomplish this is to set new food safety standards with our treatments for many foods. Our first product line is Neo-Pure, which leverages our proprietary technology of liquid formulas and systems that apply our solutions onto spices, seeds, herbs, and nuts in food processing facilities. These solutions control pathogens such as Salmonella and other quality indicator microorganisms (TPC, coliforms, etc.) to ensure the food is safe to eat and to prevent recalls. We have several customers throughout the globe (North America, Latin America, China, and Egypt), including large mainstream food processors that treat food continuously at high throughputs. We are scaling up our products at more mainstream customer sites to ensure that we set new food safety and food quality standards to help safely feed the world.POSITION SUMMARYThe Product Development Engineer will be at the forefront of bringing new food safety technologies to life—from concept to commercialization. The focus will be on developing these new technologies for food groups that Agri-Neo would like to enter like fruits, vegetables, and powders. This position will lead the development and scale-up of these novel systems, starting with benchtop experiments and advancing to pilot and full-scale industrial prototypes. The individual will work closely with the Sciences team to conduct comprehensive testing and validations of new systems via the lab and pilot plant, ensuring adherence to quality standards and regulatory requirements throughout the development process. The individual will also utilize and work with the other members of the Design Engineering team, including pilot plant technicians, test engineers, designers and commercialization engineers. This position is ideal for a hands-on, solutions-focused engineer who thrives on experimentation, iteration, and interdisciplinary collaboration.Key Responsibilities      Design and build lab-scale experimental systems to test new food safety concepts and validate performance metrics.Plan, execute, and document laboratory trials, or coordinate execution with test engineers; ensure experimental rigor and reproducibility.Analyze test data to extract insights, validate hypotheses, and inform design iterations using statistical or process analysis methods.Research and evaluate enabling technologies (e.g., fluid handling, heating, instrumentation) to enhance lab and pilot-scale systems.Develop, scale, and optimize pilot plant systems that replicate lab conditions at intermediate throughput, with a focus on reliability and scalability.Support the transition from pilot to production scale by refining processes, selecting industrial components, and addressing scale-up challenges.Collaborate cross-functionally with microbiologists, designers, and commercialization engineers to align on requirements.Develop design documentation, process flow diagrams, P&IDs, and specifications required for system validation and eventual commercialization.Communicate design criteria, and specifications to the design and commercialization teams.Contribute to innovation roadmap discussions by identifying opportunities for technology differentiation and IP generation.Occasional travel for technology research and system testing, which could include travel within North America and Internationally (India, China, etc.).\nQualifications:      Degree in Mechanical, Chemical, or Process Engineering (or related discipline)4–7 years of experience in product or process development, ideally in food, biotech, or clean-tech industriesProficiency with Microsoft Office Suite and accounting systems and software. Proficiency with Solidworks and AutoCAD or other similar design softwareValid Driver's license & insurance. Must have a valid passport to travel internationally (i.e., China, India, Egypt, etc.)Must be able to travel up to 20% of the time.\nSkills:      Hands-on experience with prototyping, lab equipment, and pilot plant designStrong analytical skills and comfort working with large, complex data sets.Familiarity with liquid application systems, temperature control, automation, vaporization systems and instrumentationExcellent communication skills and ability to work across technical and non-technical teams.Experience in regulated industries (e.g., food safety, pharma) is an asset.Demonstrates ownership of tasks and projectsTechnical proficiency in engineering principles and methodologies\nAs part of our commitment to inclusivity, diversity, equity and accessibility, our goal is a workforce built on respect that reflects the communities we serve. We thank all applicants for their interest in Agri-Neo but only those selected for an interview will be contacted.We are proud to be in compliance with the Accessibility for Ontarians with Disabilities Act (AODA) 2005, and the Integrated Accessibility Standards Regulation. We are happy to honor accommodations at any part of the recruitment process and invite you to let us know how we can help.`;
      
      const cleanedDescription = extractor.cleanJobDescription(dirtyDescription);
      
      // Should not contain newlines or tabs
      expect(cleanedDescription).not.toContain('\n');
      expect(cleanedDescription).not.toContain('\t');
      
      // Should not have multiple consecutive spaces
      expect(cleanedDescription).not.toMatch(/\s{2,}/);
      
      // Should start with the expected content
      expect(cleanedDescription).toMatch(/^About the job AGRI-NEO – JOB DESCRIPTION/);
      
      // Should end with the expected content
      expect(cleanedDescription).toMatch(/how we can help\.$/);
    });

    it('should handle null or empty descriptions', () => {
      const mockDocument = {
        querySelector: jest.fn().mockReturnValue(null)
      };
      
      const extractor = new BaseExtractor(mockDocument);
      
      expect(extractor.cleanJobDescription(null)).toBeNull();
      expect(extractor.cleanJobDescription('')).toBeNull();
      expect(extractor.cleanJobDescription('   ')).toBe('');
    });

    it('should handle descriptions with tabs and multiple spaces', () => {
      const mockDocument = {
        querySelector: jest.fn().mockReturnValue(null)
      };
      
      const extractor = new BaseExtractor(mockDocument);
      
      const descriptionWithTabs = 'Job Title\t\t\tCompany Name\t\tLocation\t\t\tDescription';
      const cleaned = extractor.cleanJobDescription(descriptionWithTabs);
      
      expect(cleaned).toBe('Job Title Company Name Location Description');
    });
  });
});

describe('LinkedInExtractor', () => {
  let extractor;
  let mockDocument;

  beforeEach(() => {
    mockDocument = {
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(),
      title: 'Software Engineer at Tech Corp | LinkedIn'
    };
    extractor = new LinkedInExtractor(mockDocument);
  });

  describe('extractJobData', () => {
    test('should extract data from LinkedIn job page', () => {
      const mockJobTitle = createMockElement('Senior Software Engineer');
      const mockCompany = createMockElement('Tech Corp');
      const mockDescription = createMockElement('We are looking for a senior software engineer to join our team. This role involves developing high-quality software solutions, collaborating with cross-functional teams, and contributing to the overall success of our products. The ideal candidate will have strong programming skills and experience with modern technologies.');

      mockDocument.querySelector
        .mockReturnValueOnce(mockJobTitle) // .job-details-jobs-unified-top-card__job-title
        .mockReturnValueOnce(mockCompany)  // .job-details-jobs-unified-top-card__company-name
        .mockReturnValueOnce(mockDescription); // .job-description

      const result = extractor.extractJobData();

      expect(result.websiteType).toBe('linkedin');
      expect(result.fullWebsite).toBe('LinkedIn');
      expect(result.jobRole).toBe('Senior Software Engineer');
      expect(result.companyName).toBe('Tech Corp');
      expect(result.jobDescription).toBe('We are looking for a senior software engineer to join our team. This role involves developing high-quality software solutions, collaborating with cross-functional teams, and contributing to the overall success of our products. The ideal candidate will have strong programming skills and experience with modern technologies.');
      expect(result.recruiterName).toBeNull();
      expect(result.extractedAt).toBeDefined();
      expect(result.jobFreshness).toBeNull();
    });

    test('should handle LinkedIn specific selectors', () => {
      mockDocument.querySelector.mockReturnValue(null);

      const result = extractor.extractJobData();

      expect(mockDocument.querySelector).toHaveBeenCalledWith('.job-details-jobs-unified-top-card__job-title');
      expect(mockDocument.querySelector).toHaveBeenCalledWith('.job-details-jobs-unified-top-card__company-name');
      expect(mockDocument.querySelector).toHaveBeenCalledWith('.job-description');
    });

    test('should extract recruiter name from hiring team section', () => {
      const mockRecruiter = createMockElement('John Smith');

      mockDocument.querySelector
        .mockReturnValueOnce(null) // job title
        .mockReturnValueOnce(null) // company name
        .mockReturnValueOnce(null) // job description
        .mockReturnValueOnce(mockRecruiter); // recruiter name

      const result = extractor.extractRecruiterName();

      expect(result).toBe('John Smith');
      expect(mockDocument.querySelector).toHaveBeenCalledWith('[data-testid="job-details-jobs-unified-top-card__hiring-team"] .jobs-poster__name');
    });

    test('should handle missing recruiter information gracefully', () => {
      mockDocument.querySelector.mockReturnValue(null);

      const result = extractor.extractRecruiterName();

      expect(result).toBeNull();
    });

    test('should filter out generic hiring team text', () => {
      const mockGenericText = createMockElement('Meet the hiring team');

      mockDocument.querySelector
        .mockReturnValueOnce(mockGenericText);

      const result = extractor.extractRecruiterName();

      expect(result).toBeNull();
    });

    test('should extract company section from job description', () => {
      const mockDescription = createMockElement(`
        COMPANY
        Tech Corp is a leading technology company...
        
        POSITION SUMMARY
        We are looking for a talented engineer...
      `);

      mockDocument.querySelector
        .mockReturnValueOnce(null) // job title
        .mockReturnValueOnce(null) // company name
        .mockReturnValueOnce(mockDescription); // job description

      const result = extractor.extractCompanySection();

      expect(result).toBe('Tech Corp is a leading technology company...');
    });

    test('should extract position summary section from job description', () => {
      const mockDescription = createMockElement(`
        COMPANY
        Tech Corp is a leading technology company...
        
        POSITION SUMMARY
        We are looking for a talented engineer to join our team...
      `);

      mockDocument.querySelector
        .mockReturnValueOnce(null) // job title
        .mockReturnValueOnce(null) // company name
        .mockReturnValueOnce(mockDescription); // job description

      const result = extractor.extractPositionSummary();

      expect(result).toBe('We are looking for a talented engineer to join our team...');
    });

    test('should handle missing company section gracefully', () => {
      const mockDescription = createMockElement(`
        POSITION SUMMARY
        We are looking for a talented engineer...
      `);

      mockDocument.querySelector
        .mockReturnValueOnce(null) // job title
        .mockReturnValueOnce(null) // company name
        .mockReturnValueOnce(mockDescription); // job description

      const result = extractor.extractCompanySection();

      expect(result).toBeNull();
    });

    test('should handle missing position summary section gracefully', () => {
      const mockDescription = createMockElement(`
        COMPANY
        Tech Corp is a leading technology company...
      `);

      mockDocument.querySelector
        .mockReturnValueOnce(null) // job title
        .mockReturnValueOnce(null) // company name
        .mockReturnValueOnce(mockDescription); // job description

      const result = extractor.extractPositionSummary();

      expect(result).toBeNull();
    });

    test('should clean company section content', () => {
      const mockDescription = createMockElement(`
        COMPANY
        Tech Corp is a leading technology company.
        
        We focus on innovation and excellence.
        
        POSITION SUMMARY
        We are looking for a talented engineer...
      `);

      mockDocument.querySelector
        .mockReturnValueOnce(null) // job title
        .mockReturnValueOnce(null) // company name
        .mockReturnValueOnce(mockDescription); // job description

      const result = extractor.extractCompanySection();

      expect(result).toBe('Tech Corp is a leading technology company. We focus on innovation and excellence.');
    });

    test('should clean position summary content', () => {
      const mockDescription = createMockElement(`
        COMPANY
        Tech Corp is a leading technology company...
        
        POSITION SUMMARY
        We are looking for a talented engineer.
        
        This role involves developing high-quality software.
      `);

      mockDocument.querySelector
        .mockReturnValueOnce(null) // job title
        .mockReturnValueOnce(null) // company name
        .mockReturnValueOnce(mockDescription); // job description

      const result = extractor.extractPositionSummary();

      expect(result).toBe('We are looking for a talented engineer. This role involves developing high-quality software.');
    });


  });
});

describe('IndeedExtractor', () => {
  let extractor;
  let mockDocument;

  beforeEach(() => {
    mockDocument = {
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(),
      title: 'Software Engineer Job at Tech Corp | Indeed.com'
    };
    extractor = new IndeedExtractor(mockDocument);
  });

  describe('extractJobData', () => {
    test('should extract data from Indeed job page', () => {
      const mockJobTitle = createMockElement('Software Engineer');
      const mockCompany = createMockElement('Tech Corp');
      const mockDescription = createMockElement('We are seeking a talented software engineer to join our development team. This position requires strong programming skills, experience with modern frameworks, and the ability to work collaboratively in an agile environment. The role involves designing, developing, and maintaining software applications.');

      mockDocument.querySelector
        .mockReturnValueOnce(mockJobTitle) // [data-testid="jobsearch-JobInfoHeader-title"]
        .mockReturnValueOnce(mockCompany)  // [data-testid="jobsearch-JobInfoHeader-companyName"]
        .mockReturnValueOnce(mockDescription); // #jobDescriptionText

      const result = extractor.extractJobData();

      expect(result.websiteType).toBe('indeed');
      expect(result.fullWebsite).toBe('Indeed');
      expect(result.jobRole).toBe('Software Engineer');
      expect(result.companyName).toBe('Tech Corp');
      expect(result.jobDescription).toBe('We are seeking a talented software engineer to join our development team. This position requires strong programming skills, experience with modern frameworks, and the ability to work collaboratively in an agile environment. The role involves designing, developing, and maintaining software applications.');
      expect(result.extractedAt).toBeDefined();
      expect(result.jobFreshness).toBeNull();
    });

    test('should handle Indeed specific selectors', () => {
      mockDocument.querySelector.mockReturnValue(null);

      const result = extractor.extractJobData();

      expect(mockDocument.querySelector).toHaveBeenCalledWith('[data-testid="jobsearch-JobInfoHeader-title"]');
      expect(mockDocument.querySelector).toHaveBeenCalledWith('[data-testid="jobsearch-JobInfoHeader-companyName"]');
      expect(mockDocument.querySelector).toHaveBeenCalledWith('#jobDescriptionText');
    });
  });
});

describe('GenericExtractor', () => {
  let extractor;
  let mockDocument;

  beforeEach(() => {
    mockDocument = {
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(),
      title: 'Careers - Software Engineer - Tech Corp'
    };
    extractor = new GenericExtractor(mockDocument);
  });

  describe('extractJobData', () => {
    test('should extract data using generic selectors', () => {
      const mockJobTitle = createMockElement('Software Engineer');
      const mockCompany = createMockElement('Tech Corp');
      const mockDescription = createMockElement('Join our team as a software engineer where you will be responsible for developing innovative solutions, collaborating with product teams, and contributing to the technical architecture of our applications. We are looking for someone with strong problem-solving skills and a passion for technology.');

      mockDocument.querySelector
        .mockReturnValueOnce(mockJobTitle) // h1, .job-title, [class*="title"]
        .mockReturnValueOnce(mockCompany)  // .company-name, [class*="company"]
        .mockReturnValueOnce(mockDescription); // .job-description, [class*="description"]

      const result = extractor.extractJobData();

      expect(result.websiteType).toBe('company');
      expect(result.fullWebsite).toBe('Tech Corp');
      expect(result.jobRole).toBe('Software Engineer');
      expect(result.companyName).toBe('Tech Corp');
      expect(result.jobDescription).toBe('Join our team as a software engineer where you will be responsible for developing innovative solutions, collaborating with product teams, and contributing to the technical architecture of our applications. We are looking for someone with strong problem-solving skills and a passion for technology.');
      expect(result.extractedAt).toBeDefined();
      expect(result.jobFreshness).toBeNull();
    });

    test('should try multiple generic selectors', () => {
      mockDocument.querySelector
        .mockReturnValueOnce(null) // h1
        .mockReturnValueOnce(null) // .job-title
        .mockReturnValueOnce(createMockElement('Software Engineer')) // [class*="title"]
        .mockReturnValueOnce(null) // .company-name
        .mockReturnValueOnce(createMockElement('Tech Corp')) // [class*="company"]
        .mockReturnValueOnce(null) // .job-description
        .mockReturnValueOnce(createMockElement('We are looking for a software engineer to join our development team. This role involves working on exciting projects, collaborating with talented engineers, and contributing to the growth of our company. The ideal candidate will have experience with modern programming languages and frameworks.')); // [class*="description"]

      const result = extractor.extractJobData();

      expect(result.jobRole).toBe('Software Engineer');
      expect(result.companyName).toBe('Tech Corp');
      expect(result.jobDescription).toBe('We are looking for a software engineer to join our development team. This role involves working on exciting projects, collaborating with talented engineers, and contributing to the growth of our company. The ideal candidate will have experience with modern programming languages and frameworks.');
    });
  });
});

describe('Extractor Factory', () => {
  test('should create LinkedIn extractor for LinkedIn URLs', () => {
    const mockDocument = { title: 'LinkedIn Job' };
    const extractor = BaseExtractor.createExtractor(mockDocument, 'https://www.linkedin.com/jobs/view/123');
    
    expect(extractor).toBeInstanceOf(LinkedInExtractor);
  });

  test('should create Indeed extractor for Indeed URLs', () => {
    const mockDocument = { title: 'Indeed Job' };
    const extractor = BaseExtractor.createExtractor(mockDocument, 'https://www.indeed.com/viewjob?jk=123');
    
    expect(extractor).toBeInstanceOf(IndeedExtractor);
  });

  test('should create generic extractor for other URLs', () => {
    const mockDocument = { title: 'Company Job' };
    const extractor = BaseExtractor.createExtractor(mockDocument, 'https://company.com/careers/job');
    
    expect(extractor).toBeInstanceOf(GenericExtractor);
  });
}); 