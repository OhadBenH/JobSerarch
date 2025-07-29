class BaseExtractor {
  constructor(document) {
    this.document = document;
  }

  // Helper method to format date in US/Eastern timezone without milliseconds
  formatExtractedAt() {
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    return easternTime.toISOString().split('.')[0] + 'Z';
  }

  // Helper method to extract job freshness from description
  extractJobFreshness(jobDescription) {
    if (!jobDescription) return null;
    
    // More flexible patterns that can handle various separators and formats
    const freshnessPatterns = [
      // Standard patterns
      /(\d+)\s*(?:week|weeks)\s*ago/i,
      /(\d+)\s*(?:day|days)\s*ago/i,
      /(\d+)\s*(?:month|months)\s*ago/i,
      /(\d+)\s*(?:hour|hours)\s*ago/i,
      /(\d+)\s*(?:minute|minutes)\s*ago/i,
      // Patterns with different separators
      /(\d+)\s*(?:week|weeks)\s*back/i,
      /(\d+)\s*(?:day|days)\s*back/i,
      /(\d+)\s*(?:month|months)\s*back/i,
      // Patterns with "since" or "from"
      /(\d+)\s*(?:week|weeks)\s*since/i,
      /(\d+)\s*(?:day|days)\s*since/i,
      /(\d+)\s*(?:month|months)\s*since/i,
      // Patterns with "posted" or "published"
      /posted\s*(\d+)\s*(?:week|weeks)\s*ago/i,
      /posted\s*(\d+)\s*(?:day|days)\s*ago/i,
      /posted\s*(\d+)\s*(?:month|months)\s*ago/i,
      /published\s*(\d+)\s*(?:week|weeks)\s*ago/i,
      /published\s*(\d+)\s*(?:day|days)\s*ago/i,
      /published\s*(\d+)\s*(?:month|months)\s*ago/i,
      // Patterns with bullet points or special characters
      /[•·]\s*(\d+)\s*(?:week|weeks)\s*ago/i,
      /[•·]\s*(\d+)\s*(?:day|days)\s*ago/i,
      /[•·]\s*(\d+)\s*(?:month|months)\s*ago/i,
      // Patterns with parentheses
      /\((\d+)\s*(?:week|weeks)\s*ago\)/i,
      /\((\d+)\s*(?:day|days)\s*ago\)/i,
      /\((\d+)\s*(?:month|months)\s*ago\)/i,
      // Patterns with "over" or "more than"
      /over\s*(\d+)\s*(?:week|weeks)\s*ago/i,
      /over\s*(\d+)\s*(?:day|days)\s*ago/i,
      /over\s*(\d+)\s*(?:month|months)\s*ago/i,
      /more\s*than\s*(\d+)\s*(?:week|weeks)\s*ago/i,
      /more\s*than\s*(\d+)\s*(?:day|days)\s*ago/i,
      /more\s*than\s*(\d+)\s*(?:month|months)\s*ago/i,
      // Patterns with "less than" or "under"
      /less\s*than\s*(\d+)\s*(?:week|weeks)\s*ago/i,
      /less\s*than\s*(\d+)\s*(?:day|days)\s*ago/i,
      /less\s*than\s*(\d+)\s*(?:month|months)\s*ago/i,
      /under\s*(\d+)\s*(?:week|weeks)\s*ago/i,
      /under\s*(\d+)\s*(?:day|days)\s*ago/i,
      /under\s*(\d+)\s*(?:month|months)\s*ago/i,
      // Patterns with "about" or "approximately"
      /about\s*(\d+)\s*(?:week|weeks)\s*ago/i,
      /about\s*(\d+)\s*(?:day|days)\s*ago/i,
      /about\s*(\d+)\s*(?:month|months)\s*ago/i,
      /approximately\s*(\d+)\s*(?:week|weeks)\s*ago/i,
      /approximately\s*(\d+)\s*(?:day|days)\s*ago/i,
      /approximately\s*(\d+)\s*(?:month|months)\s*ago/i,
      // Patterns with "nearly" or "almost"
      /nearly\s*(\d+)\s*(?:week|weeks)\s*ago/i,
      /nearly\s*(\d+)\s*(?:day|days)\s*ago/i,
      /nearly\s*(\d+)\s*(?:month|months)\s*ago/i,
      /almost\s*(\d+)\s*(?:week|weeks)\s*ago/i,
      /almost\s*(\d+)\s*(?:day|days)\s*ago/i,
      /almost\s*(\d+)\s*(?:month|months)\s*ago/i
    ];

    for (let i = 0; i < freshnessPatterns.length; i++) {
      const pattern = freshnessPatterns[i];
      const match = jobDescription.match(pattern);
      if (match) {
        const number = parseInt(match[1]);
        if (isNaN(number)) continue;
        
        const fullMatch = match[0].toLowerCase();
        
        if (fullMatch.includes('week')) return number * 7;
        if (fullMatch.includes('day')) return number;
        if (fullMatch.includes('month')) return number * 30;
        if (fullMatch.includes('hour')) return Math.ceil(number / 24);
        if (fullMatch.includes('minute')) return 1; // Less than a day, return 1
      }
    }
    
    // Try to find patterns with "yesterday", "today", etc.
    const todayPatterns = [
      /today/i,
      /just\s*posted/i,
      /new\s*posting/i,
      /recently\s*posted/i
    ];
    
    for (const pattern of todayPatterns) {
      if (pattern.test(jobDescription)) {
        return 0; // Posted today
      }
    }
    
    // Try to find patterns with "yesterday"
    if (/yesterday/i.test(jobDescription)) {
      return 1;
    }
    
    return null;
  }

  // Helper method to clean up job description formatting
  cleanJobDescription(description) {
    if (!description) return null;
    
    return description
      // Remove newlines and replace with spaces
      .replace(/\n/g, ' ')
      // Remove tabs and replace with spaces
      .replace(/\t/g, ' ')
      // Remove multiple consecutive spaces
      .replace(/\s+/g, ' ')
      // Remove common unwanted phrases (only exact matches at beginning)
      .replace(/^(About the job|About this job|About the role|About this role|About the position|About this position)\s*/gi, '')
      // Only remove exact "Job Description", "Role Description", "Position Description" at the very beginning
      .replace(/^(Job Description|Role Description|Position Description)\s*/g, '')
      // Remove multiple consecutive spaces again after phrase removal
      .replace(/\s+/g, ' ')
      // Trim leading and trailing whitespace
      .trim();
  }

  extractJobData() {
    const jobTitle = this.extractJobTitle();
    const companyName = this.extractCompanyName();
    const jobDescription = this.extractJobDescription();
    const recruiterName = this.extractRecruiterName();
    const jobFamily = this.determineJobFamily(jobTitle, jobDescription);
    const jobFreshness = this.extractJobFreshness(jobDescription);

    return {
      companyName,
      jobRole: jobTitle,
      jobFamily,
      jobDescription,
      recruiterName,
      websiteType: 'other',
      fullWebsite: this.document.title || 'Unknown',
      extractedAt: this.formatExtractedAt(),
      jobFreshness: jobFreshness,
      url: window.location.href || '',
      companySection: this.extractCompanySection(),
      positionSummary: this.extractPositionSummary(),
      comments: '' // User comments field
    };
  }

  extractJobTitle() {
    const element = this.document.querySelector('h1') || 
                   this.document.querySelector('.job-title') ||
                   this.document.querySelector('[class*="title"]');
    return element ? element.textContent.trim() : null;
  }

  extractCompanyName() {
    const element = this.document.querySelector('.company-name') ||
                   this.document.querySelector('[class*="company"]');
    return element ? element.textContent.trim() : null;
  }

  extractJobDescription() {
    const element = this.document.querySelector('.job-description') ||
                   this.document.querySelector('[class*="description"]');
    const rawDescription = element ? element.textContent.trim() : null;
    return rawDescription ? this.cleanJobDescription(rawDescription) : null;
  }

  extractRecruiterName() {
    // Base extractor doesn't have specific recruiter extraction logic
    // This will be overridden by specific extractors like LinkedInExtractor
    return null;
  }

  // Helper method to extract company section from job description
  extractCompanySection() {
    const jobDescription = this.extractJobDescription();
    if (!jobDescription) return null;
    
    // Since jobDescription is already cleaned (newlines removed), we need to work with the cleaned format
    // Look for "COMPANY" section in the cleaned job description
    const companyMatch = jobDescription.match(/COMPANY\s*(.*?)(?=POSITION SUMMARY|RESPONSIBILITIES|REQUIREMENTS|QUALIFICATIONS|ABOUT|$)/is);
    
    if (companyMatch && companyMatch[1]) {
      return this.cleanJobDescription(companyMatch[1].trim());
    }
    
    return null;
  }

  // Helper method to extract position summary section from job description
  extractPositionSummary() {
    const jobDescription = this.extractJobDescription();
    if (!jobDescription) return null;
    
    // Since jobDescription is already cleaned (newlines removed), we need to work with the cleaned format
    // Look for "POSITION SUMMARY" section in the cleaned job description
    const summaryMatch = jobDescription.match(/POSITION SUMMARY\s*(.*?)(?=RESPONSIBILITIES|REQUIREMENTS|QUALIFICATIONS|ABOUT|COMPANY|$)/is);
    
    if (summaryMatch && summaryMatch[1]) {
      return this.cleanJobDescription(summaryMatch[1].trim());
    }
    
    return null;
  }

  determineJobFamily(jobTitle, jobDescription) {
    if (!jobTitle && !jobDescription) return 'Other';
    
    const title = (jobTitle || '').toLowerCase();
    const description = (jobDescription || '').toLowerCase();
    const combined = `${title} ${description}`;

    if (combined.includes('mechanical') || combined.includes('mechanical engineer')) {
      return 'Mechanical Engineer';
    }
    
    if (combined.includes('system') || combined.includes('systems engineer')) {
      return 'System(s) Engineer';
    }
    
    if (combined.includes('project manager') || combined.includes('program manager')) {
      return 'Project Manager';
    }
    
    return 'Other';
  }

  validateData(data) {
    const errors = [];
    
    if (!data.companyName) {
      errors.push('Company name is required');
    }
    
    if (!data.jobRole) {
      errors.push('Job role is required');
    }
    
    if (!data.jobDescription) {
      errors.push('Job description is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static createExtractor(document, url) {
    if (url && url.includes('linkedin.com')) {
      return new LinkedInExtractor(document);
    } else if (url && url.includes('indeed.com')) {
      return new IndeedExtractor(document);
    } else {
      return new GenericExtractor(document);
    }
  }
}

class LinkedInExtractor extends BaseExtractor {
  // Debug method to help identify freshness extraction issues
  debugFreshnessExtraction() {
    console.log('=== Freshness Extraction Debug ===');
    
    // Check LinkedIn selectors
    const linkedinSelectors = [
      '.job-details-jobs-unified-top-card__job-insight',
      '[data-testid="job-details-jobs-unified-top-card__job-insight"]',
      '.job-details-jobs-unified-top-card__metadata',
      '[data-testid="job-details-jobs-unified-top-card__metadata"]',
      '.job-details-jobs-unified-top-card__subtitle',
      '[data-testid="job-details-jobs-unified-top-card__subtitle"]',
      '.jobs-unified-top-card__job-insight',
      '.jobs-unified-top-card__metadata',
      '.jobs-unified-top-card__subtitle'
    ];
    
    console.log('Checking LinkedIn selectors:');
    linkedinSelectors.forEach(selector => {
      const elements = this.document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        console.log(`Found ${elements.length} elements for selector: ${selector}`);
        elements.forEach((element, index) => {
          console.log(`  Element ${index + 1}: "${element.textContent.trim()}"`);
        });
      }
    });
    
    // Check Indeed selectors
    const indeedSelectors = [
      '[data-testid="jobsearch-JobInfoHeader-datePosted"]',
      '.jobsearch-JobInfoHeader-datePosted',
      '.jobsearch-JobInfoHeader-subtitle',
      '.jobsearch-JobInfoHeader'
    ];
    
    console.log('Checking Indeed selectors:');
    indeedSelectors.forEach(selector => {
      const elements = this.document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        console.log(`Found ${elements.length} elements for selector: ${selector}`);
        elements.forEach((element, index) => {
          console.log(`  Element ${index + 1}: "${element.textContent.trim()}"`);
        });
      }
    });
    
    // Check generic selectors
    const genericSelectors = [
      '[class*="date"]',
      '[class*="posted"]',
      '[class*="metadata"]',
      '[class*="subtitle"]'
    ];
    
    console.log('Checking generic selectors:');
    genericSelectors.forEach(selector => {
      const elements = this.document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        console.log(`Found ${elements.length} elements for selector: ${selector}`);
        elements.forEach((element, index) => {
          const text = element.textContent.trim();
          if (text.length < 100) { // Only log short text to avoid spam
            console.log(`  Element ${index + 1}: "${text}"`);
          }
        });
      }
    });
    
    console.log('=== End Freshness Extraction Debug ===');
  }

  extractJobData() {
    const jobTitle = this.extractJobTitle();
    const companyName = this.extractCompanyName();
    const jobDescription = this.extractJobDescription();
    const recruiterName = this.extractRecruiterName();
    const jobFamily = this.determineJobFamily(jobTitle, jobDescription);
    const jobFreshness = this.extractJobFreshnessFromMetadata();

    return {
      companyName,
      jobRole: jobTitle,
      jobFamily,
      jobDescription,
      recruiterName,
      websiteType: 'linkedin',
      fullWebsite: 'LinkedIn',
      extractedAt: this.formatExtractedAt(),
      jobFreshness: jobFreshness,
      url: window.location.href || '',
      companySection: this.extractCompanySection(),
      positionSummary: this.extractPositionSummary()
    };
  }

  // Extract job freshness from LinkedIn metadata section
  extractJobFreshnessFromMetadata() {
    // Try multiple LinkedIn selectors for metadata that contains freshness info
    const selectors = [
      // Primary LinkedIn selectors
      '.job-details-jobs-unified-top-card__job-insight',
      '[data-testid="job-details-jobs-unified-top-card__job-insight"]',
      '.job-details-jobs-unified-top-card__metadata',
      '[data-testid="job-details-jobs-unified-top-card__metadata"]',
      '.job-details-jobs-unified-top-card__subtitle',
      '[data-testid="job-details-jobs-unified-top-card__subtitle"]',
      '.job-details-jobs-unified-top-card__job-insight span',
      '.job-details-jobs-unified-top-card__metadata span',
      // Additional LinkedIn selectors
      '.jobs-unified-top-card__job-insight',
      '.jobs-unified-top-card__metadata',
      '.jobs-unified-top-card__subtitle',
      '.jobs-unified-top-card__job-insight span',
      '.jobs-unified-top-card__metadata span',
      // Broader selectors for metadata
      '[class*="job-insight"]',
      '[class*="metadata"]',
      '[class*="subtitle"]',
      '[class*="posted"]',
      '[class*="date"]',
      // More specific LinkedIn patterns
      '.job-details-jobs-unified-top-card__job-insight .jobs-unified-top-card__job-insight',
      '.job-details-jobs-unified-top-card__metadata .jobs-unified-top-card__metadata',
      // Fallback selectors
      '.job-details-jobs-unified-top-card__content',
      '.jobs-unified-top-card__content',
      '[data-testid*="job-insight"]',
      '[data-testid*="metadata"]',
      '[data-testid*="subtitle"]'
    ];
    
    for (const selector of selectors) {
      const elements = this.document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        for (const element of elements) {
          if (element && element.textContent.trim()) {
            const content = element.textContent.trim();
            const freshness = this.extractJobFreshness(content);
            if (freshness !== null) {
              return freshness;
            }
          }
        }
      }
    }
    
    // Try searching in the header area specifically
    const headerSelectors = [
      '.job-details-jobs-unified-top-card',
      '.jobs-unified-top-card',
      '.job-details-jobs-unified-top-card__header',
      '.jobs-unified-top-card__header'
    ];
    
    for (const selector of headerSelectors) {
      const header = this.document.querySelector(selector);
      if (header && header.textContent.trim()) {
        const content = header.textContent.trim();
        const freshness = this.extractJobFreshness(content);
        if (freshness !== null) {
          return freshness;
        }
      }
    }
    
    // If no specific metadata found, try searching the entire page for freshness patterns
    const pageText = this.document.body ? this.document.body.textContent : '';
    if (pageText) {
      return this.extractJobFreshness(pageText);
    }
    
    return null;
  }

  extractJobTitle() {
    // Try multiple LinkedIn selectors for job title
    const selectors = [
      '.job-details-jobs-unified-top-card__job-title',
      'h1[class*="job-title"]',
      '[data-testid="job-details-jobs-unified-top-card__job-title"]',
      'h1',
      '.job-title'
    ];
    
    for (const selector of selectors) {
      const element = this.document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    return null;
  }

  extractCompanyName() {
    // Try multiple LinkedIn selectors for company name
    const selectors = [
      '.job-details-jobs-unified-top-card__company-name',
      '[data-testid="job-details-jobs-unified-top-card__company-name"]',
      '.company-name',
      '[class*="company"]',
      '.job-details-jobs-unified-top-card__company-name a'
    ];
    
    for (const selector of selectors) {
      const element = this.document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    return null;
  }

  extractJobDescription() {
    // Try multiple LinkedIn selectors for job description
    // Use more specific selectors to avoid picking up metadata
    const selectors = [
      '.job-details-jobs-unified-top-card__job-description',
      '[data-testid="job-details-jobs-unified-top-card__job-description"]',
      '.job-details-jobs-unified-top-card__job-description div',
      '.job-description__content',
      '.job-description__text',
      '.job-details-jobs-unified-top-card__job-description .jobs-description__content',
      '.jobs-description__content',
      '.jobs-description__text',
      // More specific selectors to avoid metadata
      '.job-details-jobs-unified-top-card__job-description .jobs-box__html-content',
      '.jobs-box__html-content',
      // Fallback to broader selectors but with content validation
      '.job-description',
      '.description'
    ];
    
    for (const selector of selectors) {
      const element = this.document.querySelector(selector);
      if (element && element.textContent.trim()) {
        const content = element.textContent.trim();
        
        // Skip content that looks like metadata (location, freshness, applicant count)
        if (this.isMetadataContent(content)) {
          continue;
        }
        
        // Skip very short content that's likely not a job description
        if (content.length < 50) {
          continue;
        }
        
        // Clean up the description formatting
        return this.cleanJobDescription(content);
      }
    }
    return null;
  }

  extractRecruiterName() {
    // Try multiple LinkedIn selectors for recruiter name from "Meet the hiring team" section
    const selectors = [
      '[data-testid="job-details-jobs-unified-top-card__hiring-team"] .jobs-poster__name',
      '.job-details-jobs-unified-top-card__hiring-team .jobs-poster__name',
      '[data-testid="hiring-team"] .jobs-poster__name',
      '.hiring-team .jobs-poster__name',
      // Alternative selectors for different LinkedIn layouts
      '[data-testid="job-details-jobs-unified-top-card__hiring-team"] a[href*="/in/"]',
      '.job-details-jobs-unified-top-card__hiring-team a[href*="/in/"]',
      // More specific selectors for the hiring team section
      '[data-testid="job-details-jobs-unified-top-card__hiring-team"] .jobs-poster__name-link',
      '.job-details-jobs-unified-top-card__hiring-team .jobs-poster__name-link',
      // Fallback selectors
      '[data-testid="hiring-team"] a[href*="/in/"]',
      '.hiring-team a[href*="/in/"]',
      // Generic selectors for any hiring team related content
      '[class*="hiring-team"] [class*="poster"]',
      '[class*="hiring-team"] [class*="name"]'
    ];
    
    for (const selector of selectors) {
      const element = this.document.querySelector(selector);
      if (element && element.textContent.trim()) {
        const recruiterName = element.textContent.trim();
        
        // Skip if it's just a generic text or doesn't look like a name
        if (recruiterName.length < 2 || 
            recruiterName.toLowerCase().includes('meet') ||
            recruiterName.toLowerCase().includes('hiring') ||
            recruiterName.toLowerCase().includes('team')) {
          continue;
        }
        
        return recruiterName;
      }
    }
    
    return null;
  }

  // Helper method to identify metadata content vs actual job description
  isMetadataContent(content) {
    if (!content) return true;
    
    const metadataPatterns = [
      /^[A-Za-z\s,]+·\s*\d+\s*(?:week|weeks|day|days|month|months|hour|hours|minute|minutes)\s*ago/,
      /·\s*Over\s*\d+\s*applicants/,
      /·\s*Actively\s*reviewing/,
      /·\s*Remote/,
      /·\s*Full-time/,
      /·\s*Part-time/,
      /·\s*Contract/,
      /·\s*Internship/,
      /^[A-Za-z\s,]+,\s*[A-Z]{2}\s*·/,
      /^\d+\s*(?:week|weeks|day|days|month|months|hour|hours|minute|minutes)\s*ago/
    ];
    
    return metadataPatterns.some(pattern => pattern.test(content));
  }
}

class IndeedExtractor extends BaseExtractor {
  extractJobData() {
    const jobTitle = this.extractJobTitle();
    const companyName = this.extractCompanyName();
    const jobDescription = this.extractJobDescription();
    const jobFamily = this.determineJobFamily(jobTitle, jobDescription);
    const jobFreshness = this.extractJobFreshnessFromMetadata();

    return {
      companyName,
      jobRole: jobTitle,
      jobFamily,
      jobDescription,
      websiteType: 'indeed',
      fullWebsite: 'Indeed',
      extractedAt: this.formatExtractedAt(),
      jobFreshness: jobFreshness,
      url: window.location.href || '',
      companySection: this.extractCompanySection(),
      positionSummary: this.extractPositionSummary()
    };
  }

  // Extract job freshness from Indeed metadata section
  extractJobFreshnessFromMetadata() {
    // Try multiple Indeed selectors for metadata that contains freshness info
    const selectors = [
      // Primary Indeed selectors
      '[data-testid="jobsearch-JobInfoHeader-datePosted"]',
      '.jobsearch-JobInfoHeader-datePosted',
      '[class*="jobsearch-JobInfoHeader-datePosted"]',
      '.jobsearch-JobInfoHeader-date',
      '[class*="datePosted"]',
      '[class*="date-posted"]',
      // Additional Indeed selectors
      '.jobsearch-JobInfoHeader-subtitle',
      '[class*="jobsearch-JobInfoHeader-subtitle"]',
      '.jobsearch-JobInfoHeader-companyName',
      '[class*="jobsearch-JobInfoHeader-companyName"]',
      // Broader selectors for metadata
      '[class*="metadata"]',
      '[class*="subtitle"]',
      '[class*="posted"]',
      '[class*="date"]',
      '[class*="time"]',
      // More specific Indeed patterns
      '.jobsearch-JobInfoHeader',
      '[data-testid="jobsearch-JobInfoHeader"]',
      '.jobsearch-JobInfoHeader *',
      // Fallback selectors
      '.jobsearch-JobInfoHeader-datePosted span',
      '.jobsearch-JobInfoHeader-subtitle span',
      '[data-testid*="datePosted"]',
      '[data-testid*="subtitle"]',
      '[data-testid*="metadata"]'
    ];
    
    for (const selector of selectors) {
      const elements = this.document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        for (const element of elements) {
          if (element && element.textContent.trim()) {
            const content = element.textContent.trim();
            const freshness = this.extractJobFreshness(content);
            if (freshness !== null) {
              return freshness;
            }
          }
        }
      }
    }
    
    // Try searching in the header area specifically
    const headerSelectors = [
      '.jobsearch-JobInfoHeader',
      '[data-testid="jobsearch-JobInfoHeader"]',
      '.jobsearch-JobInfoHeader-container',
      '.jobsearch-JobInfoHeader-content'
    ];
    
    for (const selector of headerSelectors) {
      const header = this.document.querySelector(selector);
      if (header && header.textContent.trim()) {
        const content = header.textContent.trim();
        const freshness = this.extractJobFreshness(content);
        if (freshness !== null) {
          return freshness;
        }
      }
    }
    
    // If no specific metadata found, try searching the entire page for freshness patterns
    const pageText = this.document.body ? this.document.body.textContent : '';
    if (pageText) {
      return this.extractJobFreshness(pageText);
    }
    
    return null;
  }

  extractJobTitle() {
    // Try multiple Indeed selectors for job title
    const selectors = [
      '[data-testid="jobsearch-JobInfoHeader-title"]',
      'h1[class*="jobsearch-JobInfoHeader-title"]',
      'h1',
      '.job-title',
      '[class*="title"]'
    ];
    
    for (const selector of selectors) {
      const element = this.document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    return null;
  }

  extractCompanyName() {
    // Try multiple Indeed selectors for company name
    const selectors = [
      '[data-testid="jobsearch-JobInfoHeader-companyName"]',
      '[class*="jobsearch-JobInfoHeader-companyName"]',
      '.company-name',
      '[class*="company"]',
      '.jobsearch-CompanyInfoContainer'
    ];
    
    for (const selector of selectors) {
      const element = this.document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    return null;
  }

  extractJobDescription() {
    // Try multiple Indeed selectors for job description
    const selectors = [
      '#jobDescriptionText',
      '[data-testid="jobsearch-JobComponent-description"]',
      '.jobsearch-JobComponent-description',
      '.job-description',
      '[class*="description"]'
    ];
    
    for (const selector of selectors) {
      const element = this.document.querySelector(selector);
      if (element && element.textContent.trim()) {
        const content = element.textContent.trim();
        
        // Skip content that looks like metadata
        if (this.isMetadataContent(content)) {
          continue;
        }
        
        // Skip very short content that's likely not a job description
        if (content.length < 50) {
          continue;
        }
        
        // Clean up the description formatting
        return this.cleanJobDescription(content);
      }
    }
    return null;
  }

  // Helper method to identify metadata content vs actual job description
  isMetadataContent(content) {
    if (!content) return true;
    
    const metadataPatterns = [
      /^[A-Za-z\s,]+·\s*\d+\s*(?:week|weeks|day|days|month|months|hour|hours|minute|minutes)\s*ago/,
      /·\s*Over\s*\d+\s*applicants/,
      /·\s*Actively\s*reviewing/,
      /·\s*Remote/,
      /·\s*Full-time/,
      /·\s*Part-time/,
      /·\s*Contract/,
      /·\s*Internship/,
      /^[A-Za-z\s,]+,\s*[A-Z]{2}\s*·/,
      /^\d+\s*(?:week|weeks|day|days|month|months|hour|hours|minute|minutes)\s*ago/
    ];
    
    return metadataPatterns.some(pattern => pattern.test(content));
  }
}

class GenericExtractor extends BaseExtractor {
  extractJobData() {
    const jobTitle = this.extractJobTitle();
    const companyName = this.extractCompanyName();
    const jobDescription = this.extractJobDescription();
    const jobFamily = this.determineJobFamily(jobTitle, jobDescription);
    const jobFreshness = this.extractJobFreshnessFromMetadata();

    return {
      companyName,
      jobRole: jobTitle,
      jobFamily,
      jobDescription,
      websiteType: 'company',
      fullWebsite: companyName || 'Company Site',
      extractedAt: this.formatExtractedAt(),
      jobFreshness: jobFreshness,
      url: window.location.href || '',
      companySection: this.extractCompanySection(),
      positionSummary: this.extractPositionSummary()
    };
  }

  // Extract job freshness from generic page metadata
  extractJobFreshnessFromMetadata() {
    // Try common selectors for metadata that might contain freshness info
    const selectors = [
      // Common job site patterns
      '[class*="date"]',
      '[class*="posted"]',
      '[class*="time"]',
      '[class*="metadata"]',
      '[class*="subtitle"]',
      '[class*="info"]',
      // Specific job-related selectors
      '.job-date',
      '.posted-date',
      '.job-meta',
      '.job-info',
      '.job-metadata',
      '.job-subtitle',
      '.job-header',
      '.job-title-meta',
      // Data attributes
      '[data-date]',
      '[data-posted]',
      '[data-time]',
      '[data-meta]',
      // Broader patterns
      '[class*="header"]',
      '[class*="title"]',
      '[class*="meta"]',
      '[class*="info"]',
      // Fallback selectors
      '.job-header *',
      '.job-title *',
      '.job-meta *',
      '.job-info *'
    ];
    
    for (const selector of selectors) {
      const elements = this.document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        for (const element of elements) {
          if (element && element.textContent.trim()) {
            const content = element.textContent.trim();
            const freshness = this.extractJobFreshness(content);
            if (freshness !== null) {
              return freshness;
            }
          }
        }
      }
    }
    
    // Try searching in common header areas
    const headerSelectors = [
      'header',
      '.header',
      '.job-header',
      '.page-header',
      '.content-header',
      '.main-header',
      '.job-title-container',
      '.job-info-container'
    ];
    
    for (const selector of headerSelectors) {
      const header = this.document.querySelector(selector);
      if (header && header.textContent.trim()) {
        const content = header.textContent.trim();
        const freshness = this.extractJobFreshness(content);
        if (freshness !== null) {
          return freshness;
        }
      }
    }
    
    // If no specific metadata found, try searching the entire page for freshness patterns
    const pageText = this.document.body ? this.document.body.textContent : '';
    if (pageText) {
      return this.extractJobFreshness(pageText);
    }
    
    return null;
  }

  extractJobTitle() {
    // Try multiple generic selectors
    const selectors = ['h1', '.job-title', '[class*="title"]'];
    for (const selector of selectors) {
      const element = this.document.querySelector(selector);
      if (element) {
        return element.textContent.trim();
      }
    }
    return null;
  }

  extractCompanyName() {
    // Try multiple generic selectors
    const selectors = ['.company-name', '[class*="company"]'];
    for (const selector of selectors) {
      const element = this.document.querySelector(selector);
      if (element) {
        return element.textContent.trim();
      }
    }
    return null;
  }

  extractJobDescription() {
    // Try multiple generic selectors
    const selectors = ['.job-description', '[class*="description"]'];
    for (const selector of selectors) {
      const element = this.document.querySelector(selector);
      if (element && element.textContent.trim()) {
        const content = element.textContent.trim();
        
        // Skip content that looks like metadata
        if (this.isMetadataContent(content)) {
          continue;
        }
        
        // Skip very short content that's likely not a job description
        if (content.length < 50) {
          continue;
        }
        
        // Clean up the description formatting
        return this.cleanJobDescription(content);
      }
    }
    return null;
  }

  // Helper method to identify metadata content vs actual job description
  isMetadataContent(content) {
    if (!content) return true;
    
    const metadataPatterns = [
      /^[A-Za-z\s,]+·\s*\d+\s*(?:week|weeks|day|days|month|months|hour|hours|minute|minutes)\s*ago/,
      /·\s*Over\s*\d+\s*applicants/,
      /·\s*Actively\s*reviewing/,
      /·\s*Remote/,
      /·\s*Full-time/,
      /·\s*Part-time/,
      /·\s*Contract/,
      /·\s*Internship/,
      /^[A-Za-z\s,]+,\s*[A-Z]{2}\s*·/,
      /^\d+\s*(?:week|weeks|day|days|month|months|hour|hours|minute|minutes)\s*ago/
    ];
    
    return metadataPatterns.some(pattern => pattern.test(content));
  }
}

// Export for Node.js environment (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BaseExtractor,
    LinkedInExtractor,
    IndeedExtractor,
    GenericExtractor
  };
} 