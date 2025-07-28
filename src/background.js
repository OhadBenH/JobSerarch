// Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
    console.log('Job Search Manager extension installed');
    
    // Set default settings
    chrome.storage.sync.set({
        openaiKey: '',
        claudeKey: '',
        fileLocation: ''
    });
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'saveJobData') {
        handleSaveJobData(message.data)
            .then(result => sendResponse({ success: true, result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep message channel open for async response
    }
});

async function handleSaveJobData(jobData) {
    try {
        // Get settings
        const settings = await chrome.storage.sync.get([
            'openaiKey',
            'claudeKey',
            'fileLocation'
        ]);

        // Generate AI summary if API keys are available
        if (settings.openaiKey || settings.claudeKey) {
            jobData.aiSummary = await generateAISummary(jobData.jobDescription, settings);
        }

        // Save to files
        await saveToFiles(jobData, settings.fileLocation);

        return { message: 'Job data saved successfully' };
    } catch (error) {
        console.error('Error saving job data:', error);
        throw error;
    }
}

async function generateAISummary(jobDescription, settings) {
    try {
        // Try OpenAI first, then Claude as fallback
        if (settings.openaiKey) {
            return await generateOpenAISummary(jobDescription, settings.openaiKey);
        } else if (settings.claudeKey) {
            return await generateClaudeSummary(jobDescription, settings.claudeKey);
        }
    } catch (error) {
        console.error('AI summary generation failed:', error);
        return null;
    }
}

async function generateOpenAISummary(jobDescription, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that summarizes job requirements and responsibilities. Provide a concise summary in 2-3 bullet points.'
                },
                {
                    role: 'user',
                    content: `Please summarize the key requirements and responsibilities from this job description: ${jobDescription}`
                }
            ],
            max_tokens: 200,
            temperature: 0.3
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

async function generateClaudeSummary(jobDescription, apiKey) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 200,
            messages: [
                {
                    role: 'user',
                    content: `Please summarize the key requirements and responsibilities from this job description in 2-3 bullet points: ${jobDescription}`
                }
            ]
        })
    });

    if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
}

async function saveToFiles(jobData, fileLocation) {
    // For now, we'll use Chrome's download API as a workaround
    // In a real implementation, you'd use the File System Access API
    
    const jsonData = JSON.stringify(jobData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `job-data-${timestamp}.json`;
    
    await chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: false
    });

    // Clean up the blob URL
    URL.revokeObjectURL(url);
} 