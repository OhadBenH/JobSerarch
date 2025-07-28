const { AIService, OpenAIProvider, ClaudeProvider } = require('../src/ai-integration');

// Mock fetch for API testing
global.fetch = jest.fn();

describe('AI Integration', () => {
  let aiService;
  let mockJobDescription;

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService();
    mockJobDescription = `
      We are looking for a Senior Software Engineer to join our team.
      
      Requirements:
      - 5+ years of experience in JavaScript and React
      - Experience with Node.js and MongoDB
      - Strong problem-solving skills
      - Excellent communication abilities
      
      Responsibilities:
      - Develop and maintain web applications
      - Collaborate with cross-functional teams
      - Mentor junior developers
      - Participate in code reviews
    `;
  });

  describe('AIService', () => {
    test('should initialize with default settings', () => {
      expect(aiService.providers).toEqual({});
      expect(aiService.activeProvider).toBeNull();
      expect(aiService.maxRetries).toBe(3);
      expect(aiService.retryDelay).toBe(1000);
    });

    test('should register OpenAI provider', () => {
      const openAIProvider = new OpenAIProvider('test-api-key');
      aiService.registerProvider('openai', openAIProvider);
      
      expect(aiService.providers.openai).toBe(openAIProvider);
    });

    test('should register Claude provider', () => {
      const claudeProvider = new ClaudeProvider('test-api-key');
      aiService.registerProvider('claude', claudeProvider);
      
      expect(aiService.providers.claude).toBe(claudeProvider);
    });

    test('should set active provider', () => {
      const openAIProvider = new OpenAIProvider('test-api-key');
      aiService.registerProvider('openai', openAIProvider);
      aiService.setActiveProvider('openai');
      
      expect(aiService.activeProvider).toBe('openai');
    });

    test('should throw error when setting non-existent provider as active', () => {
      expect(() => {
        aiService.setActiveProvider('nonexistent');
      }).toThrow('Provider "nonexistent" not found');
    });

    test('should summarize job description with active provider', async () => {
      const openAIProvider = new OpenAIProvider('test-api-key');
      aiService.registerProvider('openai', openAIProvider);
      aiService.setActiveProvider('openai');

      const mockSummary = {
        requirements: ['5+ years JavaScript/React', 'Node.js and MongoDB experience'],
        responsibilities: ['Develop web applications', 'Collaborate with teams', 'Mentor developers'],
        keySkills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Problem-solving']
      };

      jest.spyOn(openAIProvider, 'summarizeJob').mockResolvedValue(mockSummary);

      const result = await aiService.summarizeJob(mockJobDescription);

      expect(result).toEqual({
        success: true,
        data: mockSummary,
        provider: 'openai',
        errors: []
      });
    });

    test('should handle summarization without active provider', async () => {
      const result = await aiService.summarizeJob(mockJobDescription);

      expect(result).toEqual({
        success: false,
        data: null,
        provider: null,
        errors: ['No active AI provider configured']
      });
    });

    test('should retry on provider failure', async () => {
      const openAIProvider = new OpenAIProvider('test-api-key');
      aiService.registerProvider('openai', openAIProvider);
      aiService.setActiveProvider('openai');

      const mockSummary = {
        requirements: ['5+ years experience'],
        responsibilities: ['Develop applications'],
        keySkills: ['JavaScript', 'React']
      };

      // Mock provider to fail twice, then succeed
      let callCount = 0;
      jest.spyOn(openAIProvider, 'summarizeJob').mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('API rate limit exceeded');
        }
        return Promise.resolve(mockSummary);
      });

      const result = await aiService.summarizeJob(mockJobDescription);

      expect(result).toEqual({
        success: true,
        data: mockSummary,
        provider: 'openai',
        errors: []
      });
      expect(openAIProvider.summarizeJob).toHaveBeenCalledTimes(3);
    });

    test('should fail after max retries', async () => {
      const openAIProvider = new OpenAIProvider('test-api-key');
      aiService.registerProvider('openai', openAIProvider);
      aiService.setActiveProvider('openai');

      jest.spyOn(openAIProvider, 'summarizeJob').mockRejectedValue(new Error('API error'));

      const result = await aiService.summarizeJob(mockJobDescription);

      expect(result).toEqual({
        success: false,
        data: null,
        provider: 'openai',
        errors: ['API error']
      });
      expect(openAIProvider.summarizeJob).toHaveBeenCalledTimes(3);
    });
  });

  describe('OpenAIProvider', () => {
    let openAIProvider;

    beforeEach(() => {
      openAIProvider = new OpenAIProvider('test-api-key');
    });

    test('should initialize with API key', () => {
      expect(openAIProvider.apiKey).toBe('test-api-key');
      expect(openAIProvider.baseUrl).toBe('https://api.openai.com/v1');
      expect(openAIProvider.model).toBe('gpt-3.5-turbo');
    });

    test('should summarize job description successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              requirements: ['5+ years JavaScript/React', 'Node.js experience'],
              responsibilities: ['Develop applications', 'Collaborate with teams'],
              keySkills: ['JavaScript', 'React', 'Node.js']
            })
          }
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await openAIProvider.summarizeJob(mockJobDescription);

      expect(result).toEqual({
        requirements: ['5+ years JavaScript/React', 'Node.js experience'],
        responsibilities: ['Develop applications', 'Collaborate with teams'],
        keySkills: ['JavaScript', 'React', 'Node.js']
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('gpt-3.5-turbo')
        })
      );
    });

    test('should handle API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      await expect(openAIProvider.summarizeJob(mockJobDescription))
        .rejects.toThrow('OpenAI API error: 401 Unauthorized');
    });

    test('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(openAIProvider.summarizeJob(mockJobDescription))
        .rejects.toThrow('Network error');
    });

    test('should handle invalid JSON response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await expect(openAIProvider.summarizeJob(mockJobDescription))
        .rejects.toThrow('Invalid JSON response from OpenAI');
    });

    test('should validate API key', () => {
      expect(() => new OpenAIProvider('')).toThrow('OpenAI API key is required');
      expect(() => new OpenAIProvider(null)).toThrow('OpenAI API key is required');
    });
  });

  describe('ClaudeProvider', () => {
    let claudeProvider;

    beforeEach(() => {
      claudeProvider = new ClaudeProvider('test-api-key');
    });

    test('should initialize with API key', () => {
      expect(claudeProvider.apiKey).toBe('test-api-key');
      expect(claudeProvider.baseUrl).toBe('https://api.anthropic.com/v1');
      expect(claudeProvider.model).toBe('claude-3-sonnet-20240229');
    });

    test('should summarize job description successfully', async () => {
      const mockResponse = {
        content: [{
          text: JSON.stringify({
            requirements: ['5+ years JavaScript/React', 'Node.js experience'],
            responsibilities: ['Develop applications', 'Collaborate with teams'],
            keySkills: ['JavaScript', 'React', 'Node.js']
          })
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await claudeProvider.summarizeJob(mockJobDescription);

      expect(result).toEqual({
        requirements: ['5+ years JavaScript/React', 'Node.js experience'],
        responsibilities: ['Develop applications', 'Collaborate with teams'],
        keySkills: ['JavaScript', 'React', 'Node.js']
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'x-api-key': 'test-api-key',
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: expect.stringContaining('claude-3-sonnet-20240229')
        })
      );
    });

    test('should handle API errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      await expect(claudeProvider.summarizeJob(mockJobDescription))
        .rejects.toThrow('Claude API error: 401 Unauthorized');
    });

    test('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(claudeProvider.summarizeJob(mockJobDescription))
        .rejects.toThrow('Network error');
    });

    test('should handle invalid JSON response', async () => {
      const mockResponse = {
        content: [{
          text: 'Invalid JSON response'
        }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await expect(claudeProvider.summarizeJob(mockJobDescription))
        .rejects.toThrow('Invalid JSON response from Claude');
    });

    test('should validate API key', () => {
      expect(() => new ClaudeProvider('')).toThrow('Claude API key is required');
      expect(() => new ClaudeProvider(null)).toThrow('Claude API key is required');
    });
  });

  describe('Job Summarization Prompts', () => {
    test('should generate appropriate prompt for job summarization', () => {
      const prompt = AIService.generateJobSummarizationPrompt(mockJobDescription);
      
      expect(prompt).toContain('Please analyze the following job description');
      expect(prompt).toContain('extract key requirements');
      expect(prompt).toContain('identify main responsibilities');
      expect(prompt).toContain('list essential skills');
      expect(prompt).toContain('Senior Software Engineer');
      expect(prompt).toContain('JavaScript and React');
    });

    test('should handle empty job description', () => {
      const prompt = AIService.generateJobSummarizationPrompt('');
      
      expect(prompt).toContain('Please analyze the following job description');
      expect(prompt).toContain('No job description provided');
    });
  });

  describe('Response Validation', () => {
    test('should validate correct AI response format', () => {
      const validResponse = {
        requirements: ['5+ years experience'],
        responsibilities: ['Develop applications'],
        keySkills: ['JavaScript', 'React']
      };

      const result = AIService.validateAIResponse(validResponse);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should flag missing required fields', () => {
      const invalidResponse = {
        requirements: ['5+ years experience']
        // Missing responsibilities and keySkills
      };

      const result = AIService.validateAIResponse(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: responsibilities');
      expect(result.errors).toContain('Missing required field: keySkills');
    });

    test('should flag non-array fields', () => {
      const invalidResponse = {
        requirements: '5+ years experience', // Should be array
        responsibilities: ['Develop applications'],
        keySkills: ['JavaScript', 'React']
      };

      const result = AIService.validateAIResponse(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Field "requirements" must be an array');
    });

    test('should flag empty arrays', () => {
      const invalidResponse = {
        requirements: [],
        responsibilities: ['Develop applications'],
        keySkills: ['JavaScript', 'React']
      };

      const result = AIService.validateAIResponse(invalidResponse);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Field "requirements" cannot be empty');
    });
  });
}); 