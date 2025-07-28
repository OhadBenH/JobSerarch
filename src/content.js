// Content script for job data extraction
// Note: extractors and AI integration will be loaded via manifest

// Content script for job data extraction
class JobDataExtractor {
  constructor() {
    this.extractor = null;
    // Initialize AI service only if AIService is available (for testing compatibility)
    this.aiService = typeof AIService !== 'undefined' ? new AIService() : null;
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

  // Initialize AI providers based on settings
  initializeAIProviders(aiSettings) {
    if (!this.aiService) {
      console.error('AI service not available - extension not properly loaded');
      return;
    }
    
    if (aiSettings.provider === 'openai' && aiSettings.openaiKey) {
      const openAIProvider = new OpenAIProvider(aiSettings.openaiKey);
      this.aiService.registerProvider('openai', openAIProvider);
      this.aiService.setActiveProvider('openai');
    } else if (aiSettings.provider === 'claude' && aiSettings.claudeKey) {
      const claudeProvider = new ClaudeProvider(aiSettings.claudeKey);
      this.aiService.registerProvider('claude', claudeProvider);
      this.aiService.setActiveProvider('claude');
    }
  }

  // Extract job data with retry logic for dynamic content
  async extractJobData(aiSettings = null) {
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
        return this.extractJobData(aiSettings);
      }

      // Reset retry count on successful extraction
      if (validation.isValid) {
        this.retryCount = 0;
      }

      // Initialize AI providers if settings provided
      let aiSummary = null;
      if (aiSettings && aiSettings.provider && jobData.jobDescription && this.aiService) {
        this.initializeAIProviders(aiSettings);
        try {
          aiSummary = await this.aiService.summarizeJob(jobData.jobDescription);
        } catch (aiError) {
          console.error('AI summarization error:', aiError);
          aiSummary = {
            success: false,
            data: null,
            provider: aiSettings.provider,
            errors: [aiError.message]
          };
        }
      } else if (aiSettings && aiSettings.provider && !this.aiService) {
        aiSummary = {
          success: false,
          data: null,
          provider: aiSettings.provider,
          errors: ['AI service not available']
        };
      }

      return {
        success: validation.isValid,
        data: jobData,
        aiSummary: aiSummary,
        errors: validation.errors,
        extractionAttempts: this.retryCount + 1
      };
    } catch (error) {
      console.error('Error during job data extraction:', error);
      return {
        success: false,
        data: null,
        aiSummary: null,
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
  async extractJobDataWithRetry(aiSettings = null) {
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

    return this.extractJobData(aiSettings);
  }
}

// Initialize the extractor
const jobExtractor = new JobDataExtractor();

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractJobData') {
    console.log('Received extraction request from popup');
    
    // Extract job data asynchronously with AI settings
    jobExtractor.extractJobDataWithRetry(message.aiSettings)
      .then(result => {
        console.log('Extraction result:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('Extraction error:', error);
        sendResponse({
          success: false,
          data: null,
          aiSummary: null,
          errors: [error.message],
          extractionAttempts: 0
        });
      });
    
    // Return true to indicate async response
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