# Job Search Extension - Complete User Guide

## 📋 Table of Contents
1. [Installation](#installation)
2. [Initial Setup](#initial-setup)
3. [Basic Usage](#basic-usage)
4. [AI Features Setup](#ai-features-setup)
5. [Advanced Features](#advanced-features)
6. [Troubleshooting](#troubleshooting)
7. [Tips and Best Practices](#tips-and-best-practices)

---

## 🚀 Installation

### Step 1: Download the Extension
1. **Clone or download** the extension files to your computer
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** by toggling the switch in the top-right corner
4. **Click "Load unpacked"** button
5. **Select the `src` folder** from the downloaded extension files
6. **Verify installation** - you should see the extension icon in your Chrome toolbar

### Step 2: Verify Installation
- Look for the extension icon in your Chrome toolbar (top-right area)
- The icon should appear as a job search symbol
- If you don't see it, click the puzzle piece icon and pin the extension

---

## ⚙️ Initial Setup

### Step 1: Access Extension Settings
1. **Click the extension icon** in your Chrome toolbar
2. **Click the "⚙️ Settings" button** to open the settings panel

### Step 2: Configure File Save Location
1. **In the "File Save Location" field**, enter your preferred directory path
   - Example: `C:\JobSearch\` (Windows) or `/Users/YourName/JobSearch/` (Mac)
   - **Note**: Leave empty to use default downloads folder
2. **Click "Save Settings"** to store your preferences

### Step 3: Test Basic Functionality
1. **Navigate to any job posting page** (LinkedIn, Indeed, etc.)
2. **Click the extension icon**
3. **Click "Extract Job Information"**
4. **Check for success message** - you should see "Job information saved successfully!"

---

## 🎯 Basic Usage

### Step 1: Find a Job Posting
1. **Go to any supported job site**:
   - LinkedIn Jobs
   - Indeed
   - Glassdoor
   - Monster
   - CareerBuilder
   - Company career pages

### Step 2: Extract Job Data
1. **Ensure the job posting page is fully loaded**
2. **Click the extension icon** in your Chrome toolbar
3. **Click "Extract Job Information"** button
4. **Wait for processing** - the extension will:
   - Extract company name, job role, and description
   - Determine job family (Mechanical Engineer, System(s) Engineer, Project Manager, Other)
   - Identify website type and full website name
   - Save data to your specified location

### Step 3: Verify Data Extraction
1. **Check the status message** in the popup
2. **Look for success indicators**:
   - ✅ "Job information saved successfully!"
   - ✅ File saved confirmation
   - ✅ AI summary generated (if enabled)

### Step 4: Access Your Data
1. **Navigate to your specified save location**
2. **Find the saved files**:
   - `job_data.json` - Contains all saved job information
   - `job_data.xlsx` - Excel spreadsheet with job data in rows

---

## 🤖 AI Features Setup

### Step 1: Get API Keys
1. **For OpenAI (ChatGPT)**:
   - Visit [OpenAI Platform](https://platform.openai.com/)
   - Sign up or log in
   - Go to "API Keys" section
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)

2. **For Claude**:
   - Visit [Anthropic Console](https://console.anthropic.com/)
   - Sign up or log in
   - Go to "API Keys" section
   - Click "Create Key"
   - Copy the key (starts with `sk-ant-`)

### Step 2: Configure AI Settings
1. **Click the extension icon** and open "⚙️ Settings"
2. **Select your preferred AI provider** from the dropdown:
   - "No AI Summarization" - Skip AI features
   - "OpenAI (ChatGPT)" - Use OpenAI for summaries
   - "Claude" - Use Claude for summaries
3. **Enter your API keys**:
   - Paste your OpenAI key in the "OpenAI API Key" field
   - Paste your Claude key in the "Claude API Key" field
4. **Click "Save Settings"**

### Step 3: Use AI Summarization
1. **Extract job data** as usual
2. **Check for AI summary** in the status message:
   - ✅ "AI summary generated" - Success
   - ⚠️ "AI summary failed" - Check API key or network
3. **AI summary includes**:
   - Key requirements from job description
   - Main responsibilities
   - Essential skills needed

---

## 🔧 Advanced Features

### Custom Job Family Classification
The extension automatically classifies jobs into these families:
- **Mechanical Engineer** - Contains "mechanical", "mechatronics", "HVAC", etc.
- **System(s) Engineer** - Contains "system", "systems", "software", "IT", etc.
- **Project Manager** - Contains "project", "program", "management", "PM", etc.
- **Other** - All other job types

### Persistent Window Feature
- **Stay Open**: Open a persistent window that stays open while you browse different job sites
- **Easy Access**: Click "Open Persistent Window" in the popup to launch it
- **Full Functionality**: All features work in the persistent window - save jobs, download data, view jobs, and manage settings
- **Convenient Workflow**: Navigate to job sites, click "Save to my jobs" in the persistent window, and continue browsing
- **No Reopening**: Unlike the popup, the persistent window doesn't close when you navigate between pages

### Comments Feature
- **Add Personal Notes**: Each job has a comments field where you can add your own notes
- **Auto-Save**: Comments are automatically saved after 1 second of inactivity
- **Persistent Storage**: Comments are stored with your job data and included in exports
- **Easy Access**: Comments are visible in the jobs table and can be edited anytime

### Data Validation
The extension validates extracted data and will:
- ✅ Continue if optional fields are missing
- ⚠️ Show warnings for missing required fields
- ❌ Alert you if critical data cannot be saved

### Error Handling
The extension is designed to be modular:
- If AI summarization fails, basic extraction still works
- If one website type fails, others continue to work
- All errors are reported with clear messages

---

## 🛠️ Troubleshooting

### Extension Not Working
1. **Check if extension is loaded**:
   - Go to `chrome://extensions/`
   - Ensure the extension is enabled
   - Look for any error messages

2. **Reload the extension**:
   - Click the refresh icon on the extension card
   - Or remove and re-add the extension

### Data Saving Fails
1. **Ensure you're on a supported site**:
   - LinkedIn, Indeed, Glassdoor, etc.
   - Company career pages

2. **Check page loading**:
   - Wait for the page to fully load
   - Refresh the page if needed
   - Ensure the job posting is visible

3. **Try different job postings**:
   - Some pages may have different layouts
   - The extension works best with standard job posting formats

### AI Summarization Issues
1. **Check API keys**:
   - Verify keys are correctly entered
   - Ensure keys are valid and have credits
   - Check for typos or extra spaces

2. **Network issues**:
   - Check your internet connection
   - Try again in a few minutes
   - API services may be temporarily unavailable

3. **API limits**:
   - Check your API usage/credits
   - Some APIs have rate limits

### File Saving Issues
1. **Check file location**:
   - Ensure the path exists and is writable
   - Try using a simple path like `C:\JobSearch\`
   - Check file permissions

2. **File conflicts**:
   - Ensure no other programs have the files open
   - Try closing Excel if the file is open there

---

## 💡 Tips and Best Practices

### For Best Results
1. **Use supported job sites** - LinkedIn and Indeed work best
2. **Wait for page loading** - Let the page fully load before extracting
3. **Check job posting visibility** - Ensure the full job description is visible
4. **Use consistent file locations** - Keep all job data in one folder

### Data Organization
1. **Create a dedicated folder** for job search data
2. **Use descriptive file names** if you customize them
3. **Backup your data** regularly
4. **Review extracted data** for accuracy

### AI Usage Tips
1. **Start with one AI provider** to test functionality
2. **Monitor API usage** to avoid unexpected charges
3. **Use AI summaries** to quickly assess job requirements
4. **Compare summaries** between different AI providers

### Performance Optimization
1. **Close unnecessary tabs** when extracting data
2. **Avoid extracting from multiple pages simultaneously**
3. **Use a stable internet connection** for AI features
4. **Restart Chrome** if the extension becomes slow

---

## 📞 Support

### Getting Help
1. **Check this guide** for common solutions
2. **Review error messages** carefully - they often contain solutions
3. **Test with different job sites** to isolate issues
4. **Check browser console** for technical details (F12 → Console)

### Common Error Messages
- **"Extension not found"** - Reload the extension
- **"Page not supported"** - Try a different job site
- **"API key invalid"** - Check and re-enter your API key
- **"File save failed"** - Check file location and permissions

### Feature Requests
- The extension is designed to be modular and expandable
- New job sites can be added easily
- AI providers can be extended
- File formats can be customized

---

## 🔄 Updates and Maintenance

### Keeping Updated
1. **Check for updates** regularly
2. **Backup your data** before updating
3. **Test functionality** after updates
4. **Report issues** if you encounter problems

### Data Backup
1. **Regularly export your data** to backup locations
2. **Keep multiple copies** of important job data
3. **Use cloud storage** for additional safety
4. **Test backup restoration** periodically

---

*This guide covers all current features of the Job Search Extension. For the latest updates and additional features, check the project documentation.* 