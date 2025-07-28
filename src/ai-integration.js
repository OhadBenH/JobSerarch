// AI Integration Service for Job Summarization
class AIService {
  constructor() {
    this.providers = {};
    this.activeProvider = null;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  registerProvider(name, provider) {
    this.providers[name] = provider;
  }

  setActiveProvider(name) {
    if (!this.providers[name]) {
      throw new Error(`Provider "${name}" not found`);
    }
    this.activeProvider = name;
  }

  async summarizeJob(jobDescription) {
    if (!this.activeProvider) {
      return {
        success: false,
        data: null,
        provider: null,
        errors: ['No active AI provider configured']
      };
    }

    const provider = this.providers[this.activeProvider];
    let lastError = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const summary = await provider.summarizeJob(jobDescription);
        return {
          success: true,
          data: summary,
          provider: this.activeProvider,
          errors: []
        };
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    return {
      success: false,
      data: null,
      provider: this.activeProvider,
      errors: [lastError.message]
    };
  }

  static generateJobSummarizationPrompt(jobDescription) {
    const description = jobDescription.trim() || 'No job description provided';
    
    return `Please analyze the following job description and extract key requirements, identify main responsibilities, and list essential skills in JSON format:

Job Description:
${description}

Please provide a JSON response with the following structure:
{
  "requirements": ["list", "of", "key", "requirements"],
  "responsibilities": ["list", "of", "main", "responsibilities"],
  "keySkills": ["list", "of", "essential", "skills"]
}

Focus on extracting the most important requirements, responsibilities, and skills mentioned in the job description. Be concise but comprehensive.`;
  }

  static validateAIResponse(response) {
    const errors = [];
    const requiredFields = ['requirements', 'responsibilities', 'keySkills'];

    for (const field of requiredFields) {
      if (!(field in response)) {
        errors.push(`Missing required field: ${field}`);
      } else if (!Array.isArray(response[field])) {
        errors.push(`Field "${field}" must be an array`);
      } else if (response[field].length === 0) {
        errors.push(`Field "${field}" cannot be empty`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

class OpenAIProvider {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openai.com/v1';
    this.model = 'gpt-3.5-turbo';
  }

  async summarizeJob(jobDescription) {
    const prompt = AIService.generateJobSummarizationPrompt(jobDescription);
    
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that analyzes job descriptions and extracts key information in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      const summary = JSON.parse(content);
      const validation = AIService.validateAIResponse(summary);
      
      if (!validation.isValid) {
        throw new Error(`Invalid response format: ${validation.errors.join(', ')}`);
      }

      return summary;
    } catch (parseError) {
      throw new Error('Invalid JSON response from OpenAI');
    }
  }
}

class ClaudeProvider {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Claude API key is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.anthropic.com/v1';
    this.model = 'claude-3-sonnet-20240229';
  }

  async summarizeJob(jobDescription) {
    const prompt = AIService.generateJobSummarizationPrompt(jobDescription);
    
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    try {
      const summary = JSON.parse(content);
      const validation = AIService.validateAIResponse(summary);
      
      if (!validation.isValid) {
        throw new Error(`Invalid response format: ${validation.errors.join(', ')}`);
      }

      return summary;
    } catch (parseError) {
      throw new Error('Invalid JSON response from Claude');
    }
  }
}

// Export for Node.js environment (testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AIService,
    OpenAIProvider,
    ClaudeProvider
  };
} 