# Job Search Manager Chrome Extension

A powerful Chrome extension to streamline your job search process by automatically extracting job information from various job sites and saving it to organized files.

## 🚀 Features

- **Automatic Job Data Extraction**: Extracts job information from LinkedIn, Indeed, and other job sites
- **AI-Powered Summarization**: Uses OpenAI and Claude APIs to summarize job requirements and responsibilities
- **Flexible Data Storage**: Saves data in both JSON and Excel (CSV) formats
- **Duplicate Detection**: Prevents duplicate entries with user-friendly overwrite options
- **Custom File Locations**: Specify where to save your job data files
- **Progress Tracking**: Real-time progress updates during extraction
- **Modular Design**: Easy to extend and maintain

## 📋 Extracted Information

- Company name
- Job role/title
- Job family role (Mechanical Engineer, System(s) Engineer, Project Manager, Other)
- Job description
- Website type (LinkedIn/Indeed/Company/Other)
- Full website name
- Job freshness (in days)
- Recruiter name (LinkedIn)
- Company section and position summary
- Extraction timestamp (US/Eastern timezone)

## 🛠️ Installation

### Prerequisites
- Google Chrome browser
- Node.js (for development and testing)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd JobSerarch
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run tests** (optional but recommended)
   ```bash
   npm test
   ```

4. **Load the extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `src` folder from this project

## 🎯 Usage

### Basic Usage
1. Navigate to a job posting on LinkedIn, Indeed, or other supported sites
2. Click the Job Search Manager extension icon in your Chrome toolbar
3. Click "Extract & Save Job Information"
4. The extension will automatically extract and save the job data

### Configuration
1. Click the extension icon to open the popup
2. Click the settings gear icon
3. Configure:
   - **File Save Location**: Specify where to save your job data files
   - **AI API Keys**: Add your OpenAI and/or Claude API keys for job summarization
   - **AI Provider**: Choose between ChatGPT, Claude, or both

### AI Integration
- **OpenAI API**: Add your OpenAI API key for ChatGPT-powered summarization
- **Claude API**: Add your Claude API key for Claude-powered summarization
- **Free Alternative**: The extension works without API keys (no summarization)

## 📁 File Structure

```
JobSerarch/
├── src/                    # Extension source code
│   ├── manifest.json      # Chrome extension manifest
│   ├── popup.html         # Extension popup interface
│   ├── popup.js           # Popup functionality
│   ├── content.js         # Content script for data extraction
│   ├── extractors.js      # Job site-specific extractors
│   ├── ai-integration.js  # AI service integration
│   ├── file-storage.js    # File storage and export
│   ├── background.js      # Background service worker
│   └── icons/             # Extension icons
├── tests/                 # Test files
├── .cursor/               # Project planning and documentation
├── tmp/                   # Temporary files
├── package.json           # Node.js dependencies
└── README.md             # This file
```

## 🧪 Testing

The project follows Test-Driven Development (TDD) principles with comprehensive test coverage:

```bash
# Run all tests
npm test

# Run specific test files
npm test tests/extractors.test.js
npm test tests/file-storage.test.js
npm test tests/content-script.test.js
npm test tests/ai-integration.test.js
```

## 🔧 Development

### Adding New Job Sites
1. Create a new extractor class in `src/extractors.js`
2. Extend the `BaseExtractor` class
3. Implement site-specific selectors
4. Add tests in `tests/extractors.test.js`

### Adding New AI Providers
1. Create a new provider class in `src/ai-integration.js`
2. Implement the required methods
3. Add configuration options in the popup

### Architecture
- **Modular Design**: Each component is independent and can fail gracefully
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Storage Strategy**: Uses Chrome storage for persistence and file export for accessibility
- **Permission Management**: Proactive permission checking and user guidance

## 📊 Data Storage

### Internal Storage
- **Chrome Storage Local**: Stores all extracted job data
- **Chrome Storage Sync**: Stores user preferences and settings

### File Export
- **JSON Format**: Complete job data in structured format
- **Excel/CSV Format**: Tabular data for easy analysis
- **Location**: Downloads folder with optional path prefix

## 🔒 Privacy & Security

- **Local Processing**: Job data is processed locally in your browser
- **API Keys**: Stored securely in Chrome's encrypted storage
- **No Data Collection**: The extension doesn't collect or transmit personal data
- **Open Source**: Transparent code for security review

## 🐛 Troubleshooting

### Common Issues

1. **"Could not establish connection"**
   - Reload the extension in `chrome://extensions/`
   - Refresh the job page and try again

2. **Files not saving to desired location**
   - Check that the file save location is correctly set
   - Ensure the path is accessible

3. **Empty Excel files**
   - Verify that job data was successfully extracted
   - Check browser console for errors

4. **AI summarization not working**
   - Verify API keys are correctly entered
   - Check API key permissions and quotas

### Getting Help
- Check the browser console for error messages
- Review the extension's status messages
- Run the test suite to verify functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow TDD principles (write tests first)
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🎉 Acknowledgments

- Built with Chrome Extension Manifest V3
- Tested with Jest testing framework
- Icons generated with HTML5 Canvas
- Follows modern JavaScript ES6+ standards

---

**Happy Job Hunting! 🎯💼** 