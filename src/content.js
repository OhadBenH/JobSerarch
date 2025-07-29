// Content script for job data extraction
// Note: extractors will be loaded via manifest

// Content script for job data extraction
class JobDataExtractor {
  constructor() {
    this.extractor = null;
    this.retryCount = 0;
    this.maxRetries = 2; // Reduced from 3
    this.retryDelay = 500; // Reduced from 1000ms to 500ms
  }

  // Initialize the appropriate extractor based on the current page
  initializeExtractor() {
    const url = window.location.href;
    if (typeof BaseExtractor !== 'undefined') {
      this.extractor = BaseExtractor.createExtractor(document, url);
    } else {
      console.error('BaseExtractor not available - extension not properly loaded');
      this.extractor = null;
    }
  }

  // Extract job data with retry logic for dynamic content
  async extractJobData() {
    if (!this.extractor) {
      this.initializeExtractor();
    }

    try {
      const jobData = this.extractor.extractJobData();
      const validation = this.extractor.validateData(jobData);

      // If data is incomplete and we haven't exceeded retry limit, retry
      if (!validation.isValid && this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Extraction attempt ${this.retryCount} failed, retrying in ${this.retryDelay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.extractJobData();
      }

      // Reset retry count on successful extraction
      if (validation.isValid) {
        this.retryCount = 0;
      }

      return {
        success: validation.isValid,
        data: jobData,
        errors: validation.errors,
        extractionAttempts: this.retryCount + 1
      };
    } catch (error) {
      console.error('Error during job data extraction:', error);
      return {
        success: false,
        data: null,
        errors: [error.message],
        extractionAttempts: this.retryCount + 1
      };
    }
  }

  // Wait for dynamic content to load (optimized)
  async waitForContent(selectors, timeout = 2000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          return true; // Found content, no need to wait longer
        }
      }
      await new Promise(resolve => setTimeout(resolve, 50)); // Faster polling
    }
    
    return false; // Timeout reached
  }

  // Enhanced extraction with dynamic content support (optimized)
  async extractJobDataWithRetry() {
    // Wait for essential job page elements to load (reduced timeout and selectors)
    const essentialSelectors = [
      'h1',
      '.job-title',
      '[class*="title"]',
      '.job-description',
      '[class*="description"]'
    ];

    // Quick check - if page seems ready, proceed immediately
    const hasContent = essentialSelectors.some(selector => {
      const element = document.querySelector(selector);
      return element && element.textContent.trim();
    });

    if (!hasContent) {
      // Only wait if no content is found
      await this.waitForContent(essentialSelectors, 2000);
    }

    return this.extractJobData();
  }
}

// Initialize the extractor
const jobExtractor = new JobDataExtractor();

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractJobData') {
    console.log('Received extraction request from popup');
    
    // Extract job data asynchronously
    jobExtractor.extractJobDataWithRetry()
      .then(result => {
        console.log('Extraction result:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('Extraction error:', error);
        sendResponse({
          success: false,
          data: null,
          errors: [error.message],
          extractionAttempts: 0
        });
      });
    
    // Return true to indicate async response
    return true;
  }
  
  if (message.action === 'checkJobIndicators') {
    console.log('Received job indicators check request');
    
    try {
      const indicators = message.indicators || [];
      let hasJobContent = false;
      
      // Check for common job-related elements
      const jobSelectors = [
        // LinkedIn selectors
        '[data-testid="job-details-jobs-unified-top-card__job-title"]',
        '.job-details-jobs-unified-top-card__job-title',
        '[data-testid="job-details-jobs-unified-top-card__hiring-team"]',
        '.job-details-jobs-unified-top-card__hiring-team',
        '[data-testid="job-details-jobs-unified-top-card__job-description"]',
        '.job-details-jobs-unified-top-card__job-description',
        // Indeed selectors
        '[data-testid="jobsearch-JobInfoHeader-title"]',
        '.jobsearch-JobInfoHeader-title',
        '[data-testid="jobsearch-JobInfoHeader-companyName"]',
        '.jobsearch-JobInfoHeader-companyName',
        // Generic selectors
        'h1',
        '[class*="job-title"]',
        '[class*="job-description"]',
        '[class*="company-name"]',
        '[class*="hiring-team"]'
      ];
      
      // Check if any job-related elements exist
      for (const selector of jobSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          hasJobContent = true;
          break;
        }
      }
      
      // Also check for login/signin indicators
      const loginIndicators = [
        'input[type="email"]',
        'input[type="password"]',
        '[class*="login"]',
        '[class*="signin"]',
        '[class*="sign-in"]',
        'button[type="submit"]'
      ];
      
      let hasLoginContent = false;
      for (const selector of loginIndicators) {
        const element = document.querySelector(selector);
        if (element) {
          hasLoginContent = true;
          break;
        }
      }
      
      // If we have login content but no job content, it's likely a login page
      if (hasLoginContent && !hasJobContent) {
        hasJobContent = false;
      }
      
      console.log('Job content check result:', { hasJobContent, hasLoginContent });
      
      sendResponse({
        hasJobContent: hasJobContent,
        hasLoginContent: hasLoginContent
      });
    } catch (error) {
      console.error('Error checking job indicators:', error);
      sendResponse({
        hasJobContent: false,
        hasLoginContent: false,
        error: error.message
      });
    }
    
    return true;
  }
});

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('Job Search Extension: Content script loaded');
  jobExtractor.initializeExtractor();
});

// Handle dynamic content loading (SPA navigation)
let currentUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    console.log('URL changed, reinitializing extractor');
    jobExtractor.initializeExtractor();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    JobDataExtractor,
    jobExtractor
  };
} 