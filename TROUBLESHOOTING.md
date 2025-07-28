# 🔧 Troubleshooting Guide - Job Search Extension

## 🚨 Common Issues and Solutions

### Issue: "File Save Location" field not visible in settings

**Symptoms**: You click "⚙️ Settings" but don't see the "File Save Location" field.

**Possible Causes & Solutions**:

1. **Extension needs reloading**:
   - Go to `chrome://extensions/`
   - Find the Job Search Extension
   - Click the refresh/reload icon
   - Try opening the settings again

2. **Settings panel not fully expanded**:
   - Click "⚙️ Settings" button
   - Look for a scrollable area in the settings panel
   - The file location field should be at the bottom of the settings

3. **Browser cache issue**:
   - Close the extension popup
   - Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac) to hard refresh
   - Reopen the extension

4. **Extension not properly loaded**:
   - Remove the extension completely
   - Reload the `src` folder in Chrome extensions
   - Check for any error messages in the extension card

**Expected Settings Panel Layout**:
```
⚙️ Settings
├── AI Provider: [Dropdown]
├── OpenAI API Key: [Password field]
├── Claude API Key: [Password field]
├── File Save Location: [Text field] ← This should be here
└── [Save Settings] button
```

### Issue: Extension not working on job sites

**Symptoms**: Click "Extract Job Information" but nothing happens or you get an error.

**Solutions**:
1. **Check if you're on a supported site**:
   - LinkedIn Jobs: `linkedin.com/jobs/...`
   - Indeed: `indeed.com/viewjob`
   - Glassdoor: `glassdoor.com/Job`
   - Monster: `monster.com/job`
   - CareerBuilder: `careerbuilder.com/job`

2. **Wait for page to load completely**:
   - Let the job posting page fully load
   - Ensure the job description is visible
   - Try refreshing the page

3. **Check browser console for errors**:
   - Press `F12` to open developer tools
   - Go to "Console" tab
   - Look for any red error messages
   - Report any errors you see

### Issue: AI summarization not working

**Symptoms**: You get "AI summary failed" message.

**Solutions**:
1. **Check API keys**:
   - Verify keys are correctly entered (no extra spaces)
   - Ensure keys are valid and have credits
   - Test keys on the respective platforms

2. **Check network connection**:
   - Ensure stable internet connection
   - Try again in a few minutes
   - API services may be temporarily down

3. **Check API usage limits**:
   - Log into your OpenAI/Claude account
   - Check remaining credits/usage
   - Some APIs have rate limits

### Issue: Extension icon not visible

**Symptoms**: Can't find the extension icon in Chrome toolbar.

**Solutions**:
1. **Pin the extension**:
   - Click the puzzle piece icon in Chrome toolbar
   - Find "Job Search Manager" in the list
   - Click the pin icon to keep it visible

2. **Check if extension is enabled**:
   - Go to `chrome://extensions/`
   - Ensure the extension toggle is ON
   - Look for any error messages

### Issue: Settings not saving

**Symptoms**: Settings disappear after closing/reopening the extension.

**Solutions**:
1. **Check Chrome storage permissions**:
   - Go to `chrome://extensions/`
   - Find the extension
   - Click "Details"
   - Ensure "Storage" permission is granted

2. **Try saving again**:
   - Enter your settings
   - Click "Save Settings"
   - Wait for the success message
   - Close and reopen to verify

## 🔍 Debug Steps

### Step 1: Check Extension Status
1. Go to `chrome://extensions/`
2. Look for the Job Search Extension
3. Check if it shows any errors
4. Verify it's enabled

### Step 2: Test Basic Functionality
1. Open a job posting page (LinkedIn, Indeed)
2. Click the extension icon
3. Check if the popup opens
4. Try clicking "⚙️ Settings"

### Step 3: Check Console for Errors
1. Press `F12` to open developer tools
2. Go to "Console" tab
3. Look for any error messages
4. Note down any errors you see

### Step 4: Verify File Structure
Ensure your `src` folder contains:
```
src/
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── background.js
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## 📞 Getting Help

### What to Include in Bug Reports
1. **Browser version**: Chrome version you're using
2. **Extension version**: Check manifest.json for version
3. **Steps to reproduce**: Exact steps that cause the issue
4. **Error messages**: Any error messages from console
5. **Job site URL**: Which job site you were on (if applicable)
6. **Screenshots**: If possible, include screenshots of the issue

### Common Error Messages
- **"Extension not found"**: Reload the extension
- **"Page not supported"**: Try a different job site
- **"API key invalid"**: Check and re-enter your API key
- **"File save failed"**: Check file location and permissions
- **"No active tab found"**: Ensure you're on a job posting page

### Testing the Extension
Run the test suite to verify functionality:
```bash
npm test
```

This will run all tests and show if there are any issues with the extension code.

---

*If you're still having issues after trying these solutions, please report the problem with the details requested above.* 