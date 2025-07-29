# 🚀 Quick Start Guide - Job Search Extension

## ⚡ 5-Minute Setup

### 1. Install Extension
```
Chrome → chrome://extensions/ → Developer Mode → Load unpacked → Select 'src' folder
```

### 2. Basic Setup (Optional)
- Click extension icon → ⚙️ Settings
- Enter file save location (e.g., `C:\JobSearch\`)
- Click "Save Settings"

### 3. Extract Your First Job
- Go to any job posting (LinkedIn, Indeed, etc.)
- Click extension icon → "Extract Job Information"
- Check success message!

---

## 🤖 AI Setup (Optional)

### Get API Keys
- **OpenAI**: [platform.openai.com](https://platform.openai.com/) → API Keys
- **Claude**: [console.anthropic.com](https://console.anthropic.com/) → API Keys

### Configure AI
- Extension icon → ⚙️ Settings
- Select AI provider (OpenAI/Claude)
- Paste API key
- Save settings

---

## 📋 What Gets Saved

| Field | Description |
|-------|-------------|
| Company Name | Saved from job posting |
| Job Role | Job title/position |
| Job Family | Auto-classified: Mechanical Engineer, System(s) Engineer, Project Manager, Other |
| Job Description | Full job description text |
| Website Type | LinkedIn, Indeed, Company, Other |
| Full Website | Complete URL |
| AI Summary | Requirements, responsibilities, skills (if enabled) |

---

## 🎯 Supported Sites

✅ **LinkedIn Jobs** - Best support  
✅ **Indeed** - Full support  
✅ **Glassdoor** - Good support  
✅ **Monster** - Basic support  
✅ **CareerBuilder** - Basic support  
✅ **Company Career Pages** - Generic extraction  

---

## 🛠️ Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| Extension not working | Reload at `chrome://extensions/` |
| No data saved | Wait for page to load, try different job posting |
| AI not working | Check API key, verify internet connection |
| Files not saving | Check file location permissions, ensure downloads folder is accessible |

---

## 📞 Need Help?

- **Full Guide**: See `USER_GUIDE.md`
- **Technical Issues**: Check browser console (F12)
- **Test Extension**: Run `npm test` to verify functionality

---

*Ready to start! The extension is designed to work immediately with basic job sites.* 